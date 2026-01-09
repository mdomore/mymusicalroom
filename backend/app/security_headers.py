"""
Security headers middleware for FastAPI.
Adds security headers to all responses to prevent common web vulnerabilities.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from typing import Callable


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers to all HTTP responses.
    
    Headers added:
    - X-Content-Type-Options: Prevents MIME type sniffing
    - X-Frame-Options: Prevents clickjacking attacks
    - X-XSS-Protection: Enables XSS filter (legacy, but still useful)
    - Content-Security-Policy: Restricts resource loading to prevent XSS
    - Strict-Transport-Security: Forces HTTPS (only in production)
    - Referrer-Policy: Controls referrer information
    - Permissions-Policy: Restricts browser features
    """
    
    def __init__(self, app, environment: str = "development"):
        super().__init__(app)
        self.environment = environment
        self.is_production = environment == "production"
        
        # Build security headers
        self.security_headers = self._build_security_headers()
    
    def _build_security_headers(self) -> dict:
        """Build security headers based on environment"""
        headers = {}
        
        # Prevent MIME type sniffing
        headers["X-Content-Type-Options"] = "nosniff"
        
        # Prevent clickjacking (SAMEORIGIN allows embedding in same origin)
        headers["X-Frame-Options"] = "SAMEORIGIN"
        
        # Enable XSS filter (legacy browsers)
        headers["X-XSS-Protection"] = "1; mode=block"
        
        # Content Security Policy
        # Allow same origin, data URIs, and blob URIs for images
        # Allow inline scripts and styles for Next.js
        # Note: For stricter security, consider removing 'unsafe-inline' and using nonces
        csp_parts = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  # Needed for Next.js
            "style-src 'self' 'unsafe-inline'",  # Needed for Next.js
            "img-src 'self' data: blob: https:",  # Allow images from same origin, data URIs, blob URIs, and HTTPS
            "font-src 'self' data:",
            "connect-src 'self' https:",  # Allow API calls to same origin and HTTPS
            "frame-src 'self' https:",  # Allow iframes from same origin and HTTPS (for YouTube embeds)
            "frame-ancestors 'self'",  # Allow embedding in same origin
            "base-uri 'self'",
            "form-action 'self'",
            "media-src 'self' https:",  # Allow media from same origin and HTTPS (for video/audio resources)
        ]
        headers["Content-Security-Policy"] = "; ".join(csp_parts)
        
        # Strict Transport Security (HSTS) - only in production
        if self.is_production:
            # 1 year, includeSubDomains
            headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Referrer Policy
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions Policy (formerly Feature-Policy)
        # Restrict potentially dangerous features
        permissions_parts = [
            "geolocation=()",
            "microphone=()",
            "camera=()",
            "payment=()",
            "usb=()",
            "magnetometer=()",
            "gyroscope=()",
            "accelerometer=()",
        ]
        headers["Permissions-Policy"] = ", ".join(permissions_parts)
        
        return headers
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Add security headers to response"""
        response = await call_next(request)
        
        # Add all security headers
        for header_name, header_value in self.security_headers.items():
            response.headers[header_name] = header_value
        
        return response
