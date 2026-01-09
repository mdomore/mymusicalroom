"""
File validation utilities for secure file uploads.
Validates file magic bytes (file signatures) to prevent file type spoofing.
Enforces file size limits and validates multiple file types.
"""
from typing import Tuple, Optional
from pathlib import Path


# File size limits (in bytes)
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB
MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500 MB
MAX_PHOTO_SIZE = 50 * 1024 * 1024   # 50 MB
MAX_DOCUMENT_SIZE = 50 * 1024 * 1024  # 50 MB

# Magic bytes (file signatures) for different file types
# Format: (signature_bytes, offset, mime_type, extension, file_type)
FILE_SIGNATURES = [
    # Images
    (b'\xff\xd8\xff', 0, 'image/jpeg', '.jpg', 'photo'),
    (b'\x89\x50\x4e\x47\x0d\x0a\x1a\x0a', 0, 'image/png', '.png', 'photo'),
    (b'\x47\x49\x46\x38\x37\x61', 0, 'image/gif', '.gif', 'photo'),  # GIF87a
    (b'\x47\x49\x46\x38\x39\x61', 0, 'image/gif', '.gif', 'photo'),  # GIF89a
    (b'RIFF', 0, 'image/webp', '.webp', 'photo'),
    (b'BM', 0, 'image/bmp', '.bmp', 'photo'),
    (b'\x49\x49\x2a\x00', 0, 'image/tiff', '.tiff', 'photo'),  # Little-endian
    (b'\x4d\x4d\x00\x2a', 0, 'image/tiff', '.tiff', 'photo'),  # Big-endian
    
    # Videos
    (b'\x00\x00\x00\x20\x66\x74\x79\x70', 4, 'video/mp4', '.mp4', 'video'),  # MP4
    (b'\x00\x00\x00\x18\x66\x74\x79\x70', 4, 'video/mp4', '.mp4', 'video'),  # MP4 variant
    (b'RIFF', 0, 'video/avi', '.avi', 'video'),  # AVI (needs additional check)
    (b'RIFF', 0, 'video/webm', '.webm', 'video'),  # WebM (needs additional check)
    (b'\x00\x00\x00\x20\x66\x74\x79\x70\x71\x74\x20\x20', 4, 'video/quicktime', '.mov', 'video'),  # QuickTime
    
    # Documents
    (b'%PDF', 0, 'application/pdf', '.pdf', 'document'),
    (b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1', 0, 'application/msword', '.doc', 'document'),  # MS Office (old)
    (b'PK\x03\x04', 0, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx', 'document'),  # Office Open XML
]

# Allowed MIME types by file type
ALLOWED_MIME_TYPES = {
    'photo': {
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/tiff',
        'image/tif'
    },
    'video': {
        'video/mp4',
        'video/avi',
        'video/x-msvideo',
        'video/quicktime',
        'video/webm'
    },
    'document': {
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-word.document.macroEnabled.12'
    }
}

# Allowed file extensions by file type
ALLOWED_EXTENSIONS = {
    'photo': {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif'},
    'video': {'.mp4', '.avi', '.mov', '.webm'},
    'document': {'.pdf', '.doc', '.docx'}
}


def validate_file_magic_bytes(file_content: bytes, expected_type: Optional[str] = None) -> Tuple[bool, Optional[str], Optional[str], Optional[str]]:
    """
    Validate file by checking magic bytes (file signature).
    
    Args:
        file_content: File content as bytes
        expected_type: Expected file type ('photo', 'video', 'document')
    
    Returns:
        Tuple of (is_valid, mime_type, extension, detected_type)
        Returns (False, None, None, None) if file is not valid
    """
    if not file_content or len(file_content) < 12:
        return False, None, None, None
    
    # Check against known file signatures
    for signature, offset, mime_type, extension, file_type in FILE_SIGNATURES:
        # If expected_type is specified, only check that type
        if expected_type and file_type != expected_type:
            continue
            
        if len(file_content) > offset + len(signature):
            if file_content[offset:offset + len(signature)] == signature:
                # Special handling for RIFF files (AVI, WebM, WebP)
                if signature == b'RIFF':
                    # Check for AVI
                    if b'AVI ' in file_content[8:12]:
                        return True, 'video/avi', '.avi', 'video'
                    # Check for WebM
                    elif b'WEBM' in file_content[8:12]:
                        return True, 'video/webm', '.webm', 'video'
                    # Check for WebP
                    elif b'WEBP' in file_content[8:12]:
                        return True, 'image/webp', '.webp', 'photo'
                # Special handling for Office Open XML (ZIP-based)
                elif signature == b'PK\x03\x04':
                    # Check if it's a DOCX by looking for word/ directory
                    # This is a simplified check - full validation would require ZIP parsing
                    if b'word/' in file_content[:1024] or b'[Content_Types].xml' in file_content[:1024]:
                        return True, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx', 'document'
                else:
                    return True, mime_type, extension, file_type
    
    return False, None, None, None


def validate_file_size(file_content: bytes, file_type: str) -> None:
    """
    Validate file size based on file type.
    
    Args:
        file_content: File content as bytes
        file_type: File type ('photo', 'video', 'document')
    
    Raises:
        ValueError: If file exceeds size limit
    """
    file_size = len(file_content)
    
    if file_type == 'video':
        max_size = MAX_VIDEO_SIZE
        max_size_mb = MAX_VIDEO_SIZE / (1024 * 1024)
    elif file_type == 'photo':
        max_size = MAX_PHOTO_SIZE
        max_size_mb = MAX_PHOTO_SIZE / (1024 * 1024)
    elif file_type == 'document':
        max_size = MAX_DOCUMENT_SIZE
        max_size_mb = MAX_DOCUMENT_SIZE / (1024 * 1024)
    else:
        max_size = MAX_FILE_SIZE
        max_size_mb = MAX_FILE_SIZE / (1024 * 1024)
    
    if file_size > max_size:
        raise ValueError(f"File size ({file_size / (1024 * 1024):.2f} MB) exceeds maximum allowed size ({max_size_mb} MB) for {file_type} files.")
    
    if file_size == 0:
        raise ValueError("File is empty.")


def validate_file(
    file_content: bytes,
    content_type: Optional[str] = None,
    filename: Optional[str] = None,
    expected_type: Optional[str] = None
) -> Tuple[str, str, str]:
    """
    Comprehensive file validation.
    Validates magic bytes, MIME type, extension, and file size.
    
    Args:
        file_content: File content as bytes
        content_type: Reported MIME type from upload
        filename: Original filename
        expected_type: Expected file type ('photo', 'video', 'document')
    
    Returns:
        Tuple of (mime_type, extension, file_type)
    
    Raises:
        ValueError: If file is not valid
    """
    # Validate magic bytes first (most important - can't be spoofed)
    is_valid, detected_mime, detected_ext, detected_type = validate_file_magic_bytes(file_content, expected_type)
    
    if not is_valid:
        raise ValueError("File is not a valid file. Magic bytes do not match any known file format.")
    
    # Validate file size
    validate_file_size(file_content, detected_type)
    
    # Validate content type if provided
    if content_type:
        # Normalize content type
        content_type = content_type.lower().split(';')[0].strip()
        allowed_types = ALLOWED_MIME_TYPES.get(detected_type, set())
        
        if content_type not in allowed_types:
            raise ValueError(f"Content type '{content_type}' is not allowed for {detected_type} files.")
        
        # Check if content type matches detected type (with some flexibility)
        if detected_mime and content_type != detected_mime:
            # Allow some flexibility (e.g., image/jpg vs image/jpeg, video/x-msvideo vs video/avi)
            flexible_matches = [
                (['image/jpg', 'image/jpeg'], ['image/jpeg', 'image/jpg']),
                (['video/x-msvideo', 'video/avi'], ['video/avi', 'video/x-msvideo']),
            ]
            is_flexible_match = False
            for group1, group2 in flexible_matches:
                if content_type in group1 and detected_mime in group2:
                    is_flexible_match = True
                    break
            
            if not is_flexible_match:
                raise ValueError(
                    f"Content type mismatch. Reported: {content_type}, "
                    f"detected: {detected_mime}. File may be spoofed."
                )
    
    # Validate extension if provided
    if filename:
        file_ext = Path(filename).suffix.lower()
        allowed_exts = ALLOWED_EXTENSIONS.get(detected_type, set())
        
        if file_ext and file_ext not in allowed_exts:
            raise ValueError(f"File extension '{file_ext}' is not allowed for {detected_type} files.")
        
        # Check if extension matches detected type
        if detected_ext and file_ext != detected_ext:
            # Allow some flexibility (e.g., .jpg vs .jpeg, .tif vs .tiff)
            jpeg_exts = {'.jpg', '.jpeg'}
            tiff_exts = {'.tiff', '.tif'}
            if not ((file_ext in jpeg_exts and detected_ext in jpeg_exts) or
                   (file_ext in tiff_exts and detected_ext in tiff_exts)):
                raise ValueError(
                    f"File extension mismatch. Reported: {file_ext}, "
                    f"detected: {detected_ext}. File may be spoofed."
                )
    
    return detected_mime, detected_ext, detected_type


def get_safe_file_extension(file_content: bytes, expected_type: Optional[str] = None, fallback: str = '.bin') -> str:
    """
    Get safe file extension based on actual file content (magic bytes).
    
    Args:
        file_content: File content as bytes
        expected_type: Expected file type ('photo', 'video', 'document')
        fallback: Fallback extension if detection fails
    
    Returns:
        Safe file extension
    """
    _, _, extension, _ = validate_file_magic_bytes(file_content, expected_type)
    if extension:
        return extension
    return fallback
