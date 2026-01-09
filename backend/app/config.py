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
# EASYMEAL_DATABASE_URL is optional (only needed for username lookup during login)
# If not provided, login will only work with email addresses
EASYMEAL_DATABASE_URL = get_optional_env(
    "EASYMEAL_DATABASE_URL",
    description="Database URL for easymeal database (optional, only needed for username lookup)"
)
