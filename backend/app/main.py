from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.database import engine, Base
from app.routes import pages, resources, auth
import os
from pathlib import Path

# Create tables
Base.metadata.create_all(bind=engine)

# Ensure resources directory exists
resources_dir = os.getenv("RESOURCES_DIR", "/app/resources")
Path(resources_dir).mkdir(parents=True, exist_ok=True)

app = FastAPI(title="My Musical Room API")

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


@app.get("/api/resources/file/{file_path:path}")
async def serve_file(file_path: str):
    """Serve uploaded files"""
    resources_dir = os.getenv("RESOURCES_DIR", "/app/resources")
    full_path = os.path.join(resources_dir, file_path)
    
    if not os.path.exists(full_path):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(full_path)


@app.get("/")
def root():
    return {"message": "My Musical Room API"}

