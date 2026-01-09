from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from app.security_logging import log_authentication_failure
from app.config import (
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY,
    SUPABASE_JWT_SECRET
)
import jwt

# Create Supabase client with service role key for admin operations
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

security = HTTPBearer(auto_error=False)


def _get_token_from_request(request: Request) -> Optional[str]:
    # Prefer Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1]
    # Fallback to cookie (Supabase uses sb-<project-ref>-auth-token)
    cookie_token = request.cookies.get("sb-access-token")
    if cookie_token:
        return cookie_token
    return None


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    """
    Verify Supabase JWT token and return user information.
    Returns a dict with user_id (UUID string) and email.
    """
    token = _get_token_from_request(request)
    
    if not token:
        log_authentication_failure(request, "No token provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Verify JWT token using Supabase JWT secret
        # Supabase tokens use HS256 algorithm
        decoded = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_signature": True}
        )
        
        user_id = decoded.get("sub")
        email = decoded.get("email")
        
        if not user_id:
            log_authentication_failure(request, "Token missing user ID")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return {
            "id": user_id,  # UUID string
            "email": email or "",
        }
    except jwt.ExpiredSignatureError:
        log_authentication_failure(request, "Token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        log_authentication_failure(request, f"Invalid token: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        log_authentication_failure(request, f"Authentication error: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
