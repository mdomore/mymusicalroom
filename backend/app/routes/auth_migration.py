"""
Migration endpoint to sync easymeal users to Supabase Auth
This allows users to set their Supabase password using their easymeal credentials
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.auth import supabase
import bcrypt
import os

router = APIRouter(prefix="/api/auth/migrate", tags=["auth-migration"])

# Connect to easymeal database
EASYMEAL_DB_URL = os.getenv("EASYMEAL_DATABASE_URL", "postgresql://postgres:abbb4e639a90843bb672cd9a34a829e7@supabase-db:5432/easymeal")
easymeal_engine = create_engine(EASYMEAL_DB_URL)
EasymealSession = sessionmaker(bind=easymeal_engine)


class MigrateRequest(BaseModel):
    username: str  # Easymeal username
    password: str  # Current easymeal password


@router.post("/sync-password")
async def sync_password(request: MigrateRequest):
    """
    Sync password from easymeal to Supabase Auth.
    Verifies easymeal credentials and sets the same password in Supabase.
    """
    try:
        # Verify credentials against easymeal database
        db = EasymealSession()
        try:
            from sqlalchemy import text
            result = db.execute(text("""
                SELECT id, username, email, password_hash 
                FROM users 
                WHERE username = :username AND is_temporary = false
            """), {"username": request.username})
            user_row = result.fetchone()
            
            if not user_row:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid username or password"
                )
            
            user_id, username, email, password_hash = user_row
            
            # Verify password
            if not password_hash or not bcrypt.checkpw(
                request.password.encode('utf-8'),
                password_hash.encode('utf-8')
            ):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid username or password"
                )
            
            # Find user in Supabase Auth by email
            if not email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Easymeal user has no email address"
                )
            
            users_response = supabase.auth.admin.list_users()
            supabase_user = None
            for u in users_response.users:
                if u.email == email:
                    supabase_user = u
                    break
            
            if not supabase_user:
                # Create user in Supabase if doesn't exist
                create_response = supabase.auth.admin.create_user({
                    "email": email,
                    "password": request.password,
                    "email_confirm": True,
                    "user_metadata": {"username": username}
                })
                supabase_user = create_response.user
            else:
                # Update password in Supabase
                supabase.auth.admin.update_user_by_id(
                    supabase_user.id,
                    {"password": request.password}
                )
            
            return {
                "message": "Password synced successfully",
                "email": email,
                "username": username
            }
        finally:
            db.close()
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to sync password: {str(e)}"
        )
