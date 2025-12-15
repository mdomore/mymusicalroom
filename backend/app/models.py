from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class PageType(str, enum.Enum):
    SONG = "song"
    TECHNICAL = "technical"


class ResourceType(str, enum.Enum):
    VIDEO = "video"
    PHOTO = "photo"
    DOCUMENT = "document"
    MUSIC_SHEET = "music_sheet"
    AUDIO = "audio"


class Page(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    type = Column(Enum(PageType), nullable=False)
    is_favorite = Column(Boolean, nullable=False, default=False, server_default="false")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    resources = relationship("Resource", back_populates="page", order_by="Resource.order", cascade="all, delete-orphan")


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    page_id = Column(Integer, ForeignKey("pages.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    resource_type = Column(Enum(ResourceType), nullable=False)
    file_path = Column(String, nullable=True)  # For local files
    external_url = Column(String, nullable=True)  # For web links (YouTube, etc.)
    order = Column(Integer, nullable=False, default=0)
    is_expanded = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    page = relationship("Page", back_populates="resources")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

