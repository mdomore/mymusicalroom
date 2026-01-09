from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import os
import shutil
from pathlib import Path
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.error_handler import create_safe_http_exception
from app.file_validation import validate_file, get_safe_file_extension

router = APIRouter(prefix="/api/resources", tags=["resources"])

RESOURCES_DIR = os.getenv("RESOURCES_DIR", "/app/resources")


@router.get("/", response_model=List[schemas.ResourceResponse])
def get_resources(page_id: int = None, db: Session = Depends(get_db), user=Depends(get_current_user)):
    query = db.query(models.Resource)
    if page_id:
        query = query.filter(models.Resource.page_id == page_id)
    return query.order_by(models.Resource.order).all()


@router.get("/{resource_id}", response_model=schemas.ResourceResponse)
def get_resource(resource_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    resource = db.query(models.Resource).filter(models.Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource


@router.post("/", response_model=schemas.ResourceResponse)
def create_resource(resource: schemas.ResourceCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Verify page exists
    page = db.query(models.Page).filter(models.Page.id == resource.page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Get max order for this page
    max_order = db.query(models.Resource).filter(
        models.Resource.page_id == resource.page_id
    ).count()
    
    db_resource = models.Resource(
        **resource.dict(),
        order=max_order
    )
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource


@router.post("/upload/{page_id}")
async def upload_file(
    page_id: int,
    file: UploadFile = File(...),
    title: str = None,
    description: str = None,
    resource_type: str = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    try:
        # Verify page exists
        page = db.query(models.Page).filter(models.Page.id == page_id).first()
        if not page:
            raise HTTPException(status_code=404, detail="Page not found")
        
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Read file content for validation
        file_content = await file.read()
        await file.seek(0)  # Reset file pointer for saving
        
        # Validate file using magic bytes, size, and type
        try:
            detected_mime, detected_ext, detected_type = validate_file(
                file_content=file_content,
                content_type=file.content_type,
                filename=file.filename,
                expected_type=resource_type
            )
        except ValueError as validation_error:
            raise HTTPException(status_code=400, detail=str(validation_error))
        
        # Use detected type if resource_type was not provided
        if not resource_type:
            resource_type = detected_type
        
        # Ensure resource_type matches detected type
        if resource_type != detected_type:
            raise HTTPException(
                status_code=400,
                detail=f"File type mismatch. Expected {resource_type}, but file is {detected_type}."
            )
        
        # Create directory structure: resources/{page_type}/{page_name}/
        page_dir = Path(RESOURCES_DIR) / page.type.value / page.name.lower().replace(" ", "_")
        page_dir.mkdir(parents=True, exist_ok=True)
        
        # Sanitize filename and use safe extension from magic bytes
        original_filename = Path(file.filename).stem  # Get filename without extension
        safe_ext = detected_ext or get_safe_file_extension(file_content, resource_type)
        safe_filename = f"{original_filename}{safe_ext}"
        
        # Additional sanitization: remove any dangerous characters
        safe_filename = "".join(c for c in safe_filename if c.isalnum() or c in "._-")
        if not safe_filename:
            safe_filename = f"file{safe_ext}"
        
        file_path = page_dir / safe_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        # Get relative path for database
        relative_path = f"{page.type.value}/{page.name.lower().replace(' ', '_')}/{safe_filename}"
        
        # Get max order
        max_order = db.query(models.Resource).filter(
            models.Resource.page_id == page_id
        ).count()
        
        # Create resource in database
        db_resource = models.Resource(
            page_id=page_id,
            title=title or safe_filename,
            description=description,
            resource_type=resource_type,
            file_path=relative_path,
            order=max_order
        )
        db.add(db_resource)
        db.commit()
        db.refresh(db_resource)
        
        return db_resource
    except HTTPException:
        raise
    except Exception as e:
        # Use safe error handler to prevent information leakage
        # Full error details are logged server-side
        raise create_safe_http_exception(
            status_code=500,
            generic_message="Failed to upload file",
            error=e
        )


@router.put("/{resource_id}", response_model=schemas.ResourceResponse)
def update_resource(resource_id: int, resource: schemas.ResourceUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    db_resource = db.query(models.Resource).filter(models.Resource.id == resource_id).first()
    if not db_resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    update_data = resource.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_resource, field, value)
    
    db.commit()
    db.refresh(db_resource)
    return db_resource


@router.put("/reorder", response_model=List[schemas.ResourceResponse])
def reorder_resources(request: Any = Body(...), db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Update order of multiple resources. Expects {resource_id: new_order}"""
    if not isinstance(request, dict):
        raise HTTPException(status_code=422, detail="Expected a dictionary with resource_id as keys and order as values")
    
    resources = []
    for resource_id_str, new_order in request.items():
        try:
            resource_id = int(resource_id_str)
            order_value = int(new_order)
            db_resource = db.query(models.Resource).filter(models.Resource.id == resource_id).first()
            if db_resource:
                db_resource.order = order_value
                resources.append(db_resource)
        except (ValueError, TypeError) as e:
            raise HTTPException(status_code=400, detail=f"Invalid resource_id or order: {resource_id_str} = {new_order}")
    
    if not resources:
        raise HTTPException(status_code=400, detail="No valid resources to reorder")
    
    db.commit()
    for resource in resources:
        db.refresh(resource)
    
    return resources


@router.delete("/{resource_id}")
def delete_resource(resource_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    db_resource = db.query(models.Resource).filter(models.Resource.id == resource_id).first()
    if not db_resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Delete file if it exists
    if db_resource.file_path:
        file_path = Path(RESOURCES_DIR) / db_resource.file_path
        if file_path.exists():
            file_path.unlink()
    
    db.delete(db_resource)
    db.commit()
    return {"message": "Resource deleted successfully"}

