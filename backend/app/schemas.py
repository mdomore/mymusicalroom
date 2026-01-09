from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime
from app.models import PageType, ResourceType
from pydantic import EmailStr


class PageBase(BaseModel):
    name: str
    type: PageType
    is_favorite: bool = False


class PageCreate(PageBase):
    pass


class PageUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[PageType] = None
    is_favorite: Optional[bool] = None


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


class ResourceReorderRequest(BaseModel):
    """Request body for reordering resources. Expects {resource_id: new_order}"""
    pass  # We'll use dict validation in the endpoint

