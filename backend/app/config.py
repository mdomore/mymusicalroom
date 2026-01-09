"""
Configuration management with environment variable validation.
Ensures all required secrets are provided and no insecure defaults are used.
"""
import os
from typing import Optional


def get_required_env(key: str, description: str = None) -> str:
    """
    Get a required environment variable. Raises ValueError if not set.
    
    Args:
        key: Environment variable name
        description: Optional description for error message
    
    Returns:
        Environment variable value
    
    Raises:
        ValueError: If environment variable is not set or is empty
    """
    value = os.getenv(key)
    if not value or value.strip() == "":
        desc = description or key
        raise ValueError(
            f"Required environment variable '{key}' is not set. "
            f"{desc} must be provided via environment variable."
        )
    return value


def get_optional_env(key: str, default: str = None, description: str = None) -> Optional[str]:
    """
    Get an optional environment variable with a default value.
    Only use for non-sensitive configuration values.
    
    Args:
        key: Environment variable name
        default: Default value if not set (only for non-sensitive config)
        description: Optional description
    
    Returns:
        Environment variable value or default
    """
    value = os.getenv(key, default)
    return value if value else None


# Environment configuration
ENVIRONMENT = get_optional_env(
    "ENVIRONMENT",
    default="development",
    description="Application environment (development, production)"
)

# Database configuration
DATABASE_URL = get_required_env(
    "DATABASE_URL",
    description="PostgreSQL database URL for mymusicalroom"
)

# EASYMEAL_DATABASE_URL is optional (only needed for username lookup during login)
# If not provided, login will only work with email addresses
EASYMEAL_DATABASE_URL = get_optional_env(
    "EASYMEAL_DATABASE_URL",
    description="Database URL for easymeal database (optional, only needed for username lookup)"
)

# Supabase configuration
SUPABASE_URL = get_required_env(
    "SUPABASE_URL",
    description="Supabase project URL"
)

SUPABASE_SERVICE_ROLE_KEY = get_required_env(
    "SUPABASE_SERVICE_ROLE_KEY",
    description="Supabase service role key (for admin operations)"
)

SUPABASE_ANON_KEY = get_optional_env(
    "SUPABASE_ANON_KEY",
    description="Supabase anonymous key (optional)"
)

# JWT secret - typically the same as service role key or a separate JWT_SECRET env var
SUPABASE_JWT_SECRET = get_optional_env(
    "SUPABASE_JWT_SECRET",
    default=None,
    description="JWT secret for token validation (defaults to SUPABASE_SERVICE_ROLE_KEY if not set)"
) or SUPABASE_SERVICE_ROLE_KEY

# Resources directory configuration
RESOURCES_DIR = get_optional_env(
    "RESOURCES_DIR",
    default="/app/resources",
    description="Directory for storing uploaded resource files"
)
