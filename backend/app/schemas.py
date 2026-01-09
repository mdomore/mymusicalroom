from pydantic import BaseModel, HttpUrl, field_validator
from typing import Optional
from datetime import datetime
from app.models import PageType, ResourceType
from pydantic import EmailStr
from app.validators import (
    validate_page_name, validate_resource_title,
    validate_description, validate_url, sanitize_filename,
    validate_password
)


class PageBase(BaseModel):
    name: str
    type: PageType
    is_favorite: bool = False
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        return validate_page_name(v)


class PageCreate(PageBase):
    pass


class PageUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[PageType] = None
    is_favorite: Optional[bool] = None
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return validate_page_name(v)


class PageResponse(PageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ResourceBase(BaseModel):
    title: str
    description: Optional[str] = None
    resource_type: ResourceType
    file_path: Optional[str] = None
    external_url: Optional[str] = None
    is_expanded: bool = True
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v: str) -> str:
        return validate_resource_title(v)
    
    @field_validator('description')
    @classmethod
    def validate_description_field(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return validate_description(v)
    
    @field_validator('external_url')
    @classmethod
    def validate_external_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return validate_url(v)
    
    @field_validator('file_path')
    @classmethod
    def validate_file_path(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return sanitize_filename(v)


class ResourceCreate(ResourceBase):
    page_id: int


class ResourceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    resource_type: Optional[ResourceType] = None
    file_path: Optional[str] = None
    external_url: Optional[str] = None
    order: Optional[int] = None
    is_expanded: Optional[bool] = None
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return validate_resource_title(v)
    
    @field_validator('description')
    @classmethod
    def validate_description_field(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return validate_description(v)
    
    @field_validator('external_url')
    @classmethod
    def validate_external_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return validate_url(v)
    
    @field_validator('file_path')
    @classmethod
    def validate_file_path(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return sanitize_filename(v)


class ResourceResponse(ResourceBase):
    id: int
    page_id: int
    order: int
    created_at: datetime

    class Config:
        from_attributes = True


class PageWithResources(PageResponse):
    resources: list[ResourceResponse] = []


# Auth / Users (using Supabase Auth)
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password_field(cls, v: str) -> str:
        return validate_password(v)


class UserLogin(BaseModel):
    username: str  # Can be username or email
    password: str


class UserResponse(BaseModel):
    id: str  # UUID string from Supabase
    email: EmailStr
    created_at: Optional[str] = None  # ISO format string from Supabase

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    email: str | None = None  # Return email for frontend convenience
    csrf_token: str | None = None  # CSRF token for state-changing operations


class ResourceReorderRequest(BaseModel):
    """Request body for reordering resources. Expects {resource_id: new_order}"""
    pass  # We'll use dict validation in the endpoint

