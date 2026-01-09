from fastapi import APIRouter, Depends, HTTPException, status, Request
from app import schemas
from app.auth import get_current_user, supabase
from app.config import EASYMEAL_DATABASE_URL
from app.rate_limit import rate_limit_dependency
from app.error_handler import create_safe_http_exception
from app.security_logging import (
    log_failed_login, log_successful_login,
    log_failed_registration, log_successful_registration,
    log_rate_limit_exceeded
)
from supabase import Client
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Connect to easymeal database for username lookup (optional)
# Only initialize if EASYMEAL_DATABASE_URL is provided
easymeal_engine = None
EasymealSession = None

if EASYMEAL_DATABASE_URL:
    easymeal_engine = create_engine(EASYMEAL_DATABASE_URL)
    EasymealSession = sessionmaker(bind=easymeal_engine)


@router.post("/register", response_model=schemas.UserResponse)
def register(
    payload: schemas.UserCreate,
    request: Request,
    _: bool = Depends(rate_limit_dependency("register"))
):
    """Register a new user with Supabase Auth"""
    try:
        response = supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password,
        })
        
        if response.user is None:
            log_failed_registration(request, payload.email, "User creation failed")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed"
            )
        
        log_successful_registration(request, payload.email)
        return {
            "id": response.user.id,
            "email": response.user.email,
            "created_at": response.user.created_at,
        }
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e).lower()
        if "already registered" in error_msg or "already exists" in error_msg:
            log_failed_registration(request, payload.email, "Email already registered")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        # Use safe error handler to prevent information leakage
        log_failed_registration(request, payload.email, "Registration error")
        raise create_safe_http_exception(
            status_code=status.HTTP_400_BAD_REQUEST,
            generic_message="Registration failed",
            error=e
        )


@router.post("/login", response_model=schemas.TokenResponse)
def login(
    payload: schemas.UserLogin,
    request: Request,
    _: bool = Depends(rate_limit_dependency("login"))
):
    """Login with Supabase Auth - supports both username and email"""
    try:
        # First, try to find user by username in easymeal database to get email
        email = payload.username  # Default to username (might be email)
        
        # Check if it looks like an email
        if "@" not in payload.username:
            # It's a username, look it up in easymeal database (if available)
            if EasymealSession:
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
                    # Log error but don't expose details to client
                    import logging
                    logging.getLogger(__name__).warning(f"Error looking up username: {e}")
                finally:
                    db.close()
            # If EASYMEAL_DATABASE_URL is not configured, username lookup is not available
            # In this case, we'll try the username as email (may fail, but that's expected)
        
        # Login with Supabase Auth using email
        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": payload.password,
        })
        
        if not response.session or not response.session.access_token:
            log_failed_login(request, payload.username, "Invalid credentials")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        log_successful_login(request, email)
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "token_type": "bearer",
            "email": email,  # Return email for frontend to use
        }
    except HTTPException:
        raise
    except Exception as e:
        # Use safe error handler to prevent information leakage
        log_failed_login(request, payload.username, "Login error")
        raise create_safe_http_exception(
            status_code=status.HTTP_401_UNAUTHORIZED,
            generic_message="Invalid credentials",
            error=e
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

