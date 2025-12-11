from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/pages", tags=["pages"])


@router.get("/", response_model=List[schemas.PageWithResources])
def get_pages(db: Session = Depends(get_db)):
    pages = (
        db.query(models.Page)
        .order_by(models.Page.is_favorite.desc(), models.Page.name.asc())
        .all()
    )
    return pages


@router.get("/{page_id}", response_model=schemas.PageWithResources)
def get_page(page_id: int, db: Session = Depends(get_db)):
    page = db.query(models.Page).filter(models.Page.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@router.post("/", response_model=schemas.PageResponse)
def create_page(page: schemas.PageCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    db_page = models.Page(**page.dict())
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page


@router.put("/{page_id}", response_model=schemas.PageResponse)
def update_page(page_id: int, page: schemas.PageUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    db_page = db.query(models.Page).filter(models.Page.id == page_id).first()
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    update_data = page.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_page, field, value)
    
    db.commit()
    db.refresh(db_page)
    return db_page


@router.delete("/{page_id}")
def delete_page(page_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    db_page = db.query(models.Page).filter(models.Page.id == page_id).first()
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    db.delete(db_page)
    db.commit()
    return {"message": "Page deleted successfully"}

