"""
Input validation and sanitization utilities.
Prevents XSS, injection attacks, and ensures data integrity.
"""
import re
from typing import Optional
from urllib.parse import urlparse
import html


# Validation constants
PAGE_NAME_MIN_LENGTH = 1
PAGE_NAME_MAX_LENGTH = 200
RESOURCE_TITLE_MIN_LENGTH = 1
RESOURCE_TITLE_MAX_LENGTH = 200
DESCRIPTION_MAX_LENGTH = 10000
URL_MAX_LENGTH = 2048

# Allowed URL schemes
ALLOWED_URL_SCHEMES = {'http', 'https'}

# Allowed HTML tags for rich text descriptions (if using rich text editor)
ALLOWED_HTML_TAGS = {'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                     'ul', 'ol', 'li', 'a', 'blockquote', 'pre', 'code'}
ALLOWED_HTML_ATTRIBUTES = {'href', 'target', 'rel'}


def sanitize_html(text: str) -> str:
    """Escape HTML characters to prevent XSS attacks (for plain text fields)"""
    if not text:
        return text
    return html.escape(text)


def sanitize_rich_html(html_content: str) -> str:
    """
    Sanitize rich HTML content to allow safe tags while removing dangerous ones.
    Used for descriptions that might contain HTML.
    """
    if not html_content:
        return html_content
    
    # Remove script tags and their content
    html_content = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove event handlers (onclick, onerror, etc.)
    html_content = re.sub(r'\s*on\w+\s*=\s*["\'][^"\']*["\']', '', html_content, flags=re.IGNORECASE)
    
    # Remove javascript: and data: URLs
    html_content = re.sub(r'javascript:', '', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'data:text/html', '', html_content, flags=re.IGNORECASE)
    
    # Remove style tags and inline styles
    html_content = re.sub(r'<style[^>]*>.*?</style>', '', html_content, flags=re.IGNORECASE | re.DOTALL)
    html_content = re.sub(r'\s*style\s*=\s*["\'][^"\']*["\']', '', html_content, flags=re.IGNORECASE)
    
    # Remove dangerous tags but keep allowed ones
    allowed_tags_pattern = '|'.join(ALLOWED_HTML_TAGS)
    html_content = re.sub(
        r'</?(?!' + allowed_tags_pattern + r'\b)[^>]+>',
        '',
        html_content,
        flags=re.IGNORECASE
    )
    
    # Clean up attributes on allowed tags - only keep href, target, rel
    for tag in ALLOWED_HTML_TAGS:
        pattern = rf'<{tag}\s+([^>]*)>'
        def clean_attrs(match):
            attrs = match.group(1)
            allowed_attrs = []
            for attr in ALLOWED_HTML_ATTRIBUTES:
                attr_pattern = rf'\b{attr}\s*=\s*["\']([^"\']*)["\']'
                attr_match = re.search(attr_pattern, attrs, re.IGNORECASE)
                if attr_match:
                    allowed_attrs.append(f'{attr}="{html.escape(attr_match.group(1))}"')
            if allowed_attrs:
                return f'<{tag} {" ".join(allowed_attrs)}>'
            return f'<{tag}>'
        
        html_content = re.sub(pattern, clean_attrs, html_content, flags=re.IGNORECASE)
    
    return html_content


def validate_page_name(name: str) -> str:
    """Validate and sanitize page name"""
    if not name:
        raise ValueError("Page name is required")
    
    name = name.strip()
    
    if len(name) < PAGE_NAME_MIN_LENGTH:
        raise ValueError(f"Page name must be at least {PAGE_NAME_MIN_LENGTH} character long")
    
    if len(name) > PAGE_NAME_MAX_LENGTH:
        raise ValueError(f"Page name must be no more than {PAGE_NAME_MAX_LENGTH} characters long")
    
    # Sanitize HTML to prevent XSS
    name = sanitize_html(name)
    
    return name


def validate_resource_title(title: str) -> str:
    """Validate and sanitize resource title"""
    if not title:
        raise ValueError("Resource title is required")
    
    title = title.strip()
    
    if len(title) < RESOURCE_TITLE_MIN_LENGTH:
        raise ValueError(f"Resource title must be at least {RESOURCE_TITLE_MIN_LENGTH} character long")
    
    if len(title) > RESOURCE_TITLE_MAX_LENGTH:
        raise ValueError(f"Resource title must be no more than {RESOURCE_TITLE_MAX_LENGTH} characters long")
    
    # Sanitize HTML to prevent XSS
    title = sanitize_html(title)
    
    return title


def validate_description(description: Optional[str]) -> Optional[str]:
    """Validate and sanitize description (allows safe HTML)"""
    if not description:
        return None
    
    description = description.strip()
    
    if len(description) > DESCRIPTION_MAX_LENGTH:
        raise ValueError(f"Description must be no more than {DESCRIPTION_MAX_LENGTH} characters long")
    
    # Sanitize HTML to allow safe tags but remove dangerous ones
    description = sanitize_rich_html(description)
    
    return description


def validate_url(url: Optional[str]) -> Optional[str]:
    """Validate URL format and scheme"""
    if not url:
        return None
    
    url = url.strip()
    
    if len(url) > URL_MAX_LENGTH:
        raise ValueError(f"URL must be no more than {URL_MAX_LENGTH} characters long")
    
    # Parse URL to validate format
    try:
        parsed = urlparse(url)
        
        # Check if URL has a scheme
        if not parsed.scheme:
            # If no scheme, assume http and prepend it
            url = f"http://{url}"
            parsed = urlparse(url)
        
        # Validate scheme is allowed
        if parsed.scheme not in ALLOWED_URL_SCHEMES:
            raise ValueError(f"URL scheme must be one of: {', '.join(ALLOWED_URL_SCHEMES)}")
        
        # Validate URL has a netloc (domain)
        if not parsed.netloc:
            raise ValueError("Invalid URL format")
        
        return url
    except Exception as e:
        raise ValueError(f"Invalid URL format: {str(e)}")


def sanitize_filename(filename: Optional[str]) -> Optional[str]:
    """Sanitize filename to prevent path traversal and other attacks"""
    if not filename:
        return None
    
    # Remove any path components
    filename = filename.split('/')[-1].split('\\')[-1]
    
    # Remove any potentially dangerous characters
    filename = re.sub(r'[^a-zA-Z0-9._-]', '', filename)
    
    # Limit length
    if len(filename) > 255:
        filename = filename[:255]
    
    return filename
