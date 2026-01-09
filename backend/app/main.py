from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.database import engine, Base, get_db
from app.routes import pages, resources, auth, auth_migration
from app.config import ENVIRONMENT, RESOURCES_DIR
from app.security_headers import SecurityHeadersMiddleware
from app.csrf import CSRFProtectionMiddleware
from app.cookie_security import SecureCookieMiddleware
from app.auth import get_current_user
from app import models
from sqlalchemy.orm import Session
from pathlib import Path

# Create tables
Base.metadata.create_all(bind=engine)

# Ensure resources directory exists
Path(RESOURCES_DIR).mkdir(parents=True, exist_ok=True)

app = FastAPI(title="My Musical Room API")

# Security headers middleware (must be added first to apply to all responses)
app.add_middleware(
    SecurityHeadersMiddleware,
    environment=ENVIRONMENT
)

# CSRF protection middleware (after security headers, before CORS)
app.add_middleware(CSRFProtectionMiddleware)

# Secure cookie settings middleware (after CSRF, before CORS)
app.add_middleware(SecureCookieMiddleware, environment=ENVIRONMENT)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://micmoe.ddns.net",
        "http://micmoe.ddns.net",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pages.router)
app.include_router(resources.router)
app.include_router(auth.router)
app.include_router(auth_migration.router)


@app.get("/api/resources/file/{file_path:path}")
async def serve_file(
    file_path: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Serve uploaded files.
    Requires authentication and verifies that the file belongs to a valid resource.
    """
    from urllib.parse import unquote
    import os
    
    # Decode URL-encoded path
    decoded_path = unquote(file_path)
    full_path = os.path.join(RESOURCES_DIR, decoded_path)
    
    # Security: prevent path traversal
    full_path = os.path.normpath(full_path)
    resources_dir_norm = os.path.normpath(RESOURCES_DIR)
    if not full_path.startswith(resources_dir_norm):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Security: Verify that the file belongs to a valid resource in the database
    # This ensures users can only access files that are registered as resources
    # Note: Without user_id field on pages/resources, we can't verify ownership,
    # but we can at least verify the file is associated with a valid resource
    resource = db.query(models.Resource).filter(
        models.Resource.file_path == decoded_path
    ).first()
    
    if not resource:
        # File exists but is not associated with any resource - deny access
        raise HTTPException(status_code=403, detail="Access denied: File not associated with any resource")
    
    # File is associated with a valid resource - allow access
    # TODO: Add user_id field to Page model to enable proper ownership verification
    # For now, any authenticated user can access any file that's a registered resource
    
    return FileResponse(full_path)


@app.get("/")
def root():
    return {"message": "My Musical Room API"}

