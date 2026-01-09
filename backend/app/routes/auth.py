from fastapi import APIRouter, Depends, HTTPException, status
from app import schemas
from app.auth import get_current_user, supabase
from supabase import Client
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Connect to easymeal database for username lookup
EASYMEAL_DB_URL = os.getenv("EASYMEAL_DATABASE_URL", "postgresql://postgres:abbb4e639a90843bb672cd9a34a829e7@supabase-db:5432/easymeal")
easymeal_engine = create_engine(EASYMEAL_DB_URL)
EasymealSession = sessionmaker(bind=easymeal_engine)


@router.post("/register", response_model=schemas.UserResponse)
def register(payload: schemas.UserCreate):
    """Register a new user with Supabase Auth"""
    try:
        response = supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password,
        })
        
        if response.user is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed"
            )
        
        return {
            "id": response.user.id,
            "email": response.user.email,
            "created_at": response.user.created_at,
        }
    except Exception as e:
        error_msg = str(e)
        if "already registered" in error_msg.lower() or "already exists" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {error_msg}"
        )


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.UserLogin):
    """Login with Supabase Auth - supports both username and email"""
    try:
        # First, try to find user by username in easymeal database to get email
        email = payload.username  # Default to username (might be email)
        
        # Check if it looks like an email
        if "@" not in payload.username:
            # It's a username, look it up in easymeal database
            db = EasymealSession()
            try:
                result = db.execute(text("""
                    SELECT email
                    FROM users
                    WHERE username = :username AND is_temporary = false
                """), {"username": payload.username})
                user_row = result.fetchone()
                
                if user_row and user_row[0]:
                    email = user_row[0]
            except Exception as e:
                print(f"Error looking up username: {e}")
            finally:
                db.close()
        
        # Login with Supabase Auth using email
        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": payload.password,
        })
        
        if not response.session or not response.session.access_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "token_type": "bearer",
            "email": email,  # Return email for frontend to use
        }
    except Exception as e:
        error_msg = str(e)
        print(f"Login error: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )


@router.post("/logout")
def logout():
    """Logout from Supabase Auth"""
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out"}
    except Exception:
        return {"message": "Logged out"}


@router.get("/me", response_model=schemas.UserResponse)
def me(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return current_user

