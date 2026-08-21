import os
import re
import io
from fastapi import UploadFile, HTTPException, status
from pypdf import PdfReader
import docx
from PIL import Image
from app.core.config import settings

def sanitize_filename(filename: str) -> str:
    clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
    return clean_name

def detect_file_format(content: bytes, filename: str) -> str:
    """Detect format from magic bytes or extension."""
    if len(content) >= 4:
        # PDF magic bytes
        if content.startswith(b'%PDF'):
            return "pdf"
        # JPEG magic bytes
        if content.startswith(b'\xff\xd8\xff'):
            return "image"
        # PNG magic bytes
        if content.startswith(b'\x89PNG\r\n\x1a\n'):
            return "image"
        # WEBP magic bytes
        if content.startswith(b'RIFF') and b'WEBP' in content[:16]:
            return "image"
        # DOCX / ZIP magic bytes
        if content.startswith(b'PK\x03\x04'):
            return "docx"

    ext = os.path.splitext(filename)[1].lower()
    if ext in [".png", ".jpg", ".jpeg", ".webp"]:
        return "image"
    if ext == ".pdf":
        return "pdf"
    if ext == ".docx":
        return "docx"
    return "unknown"

def validate_uploaded_file(file: UploadFile, content: bytes) -> str:
    """
    Validate uploaded file size, extension, emptiness, and corruption.
    Returns the resolved file type: 'pdf', 'docx', or 'image'.
    """
    if not content or len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty."
        )

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum limit of {settings.MAX_FILE_SIZE_MB}MB."
        )

    file_format = detect_file_format(content, file.filename or "")

    if file_format == "image":
        try:
            img = Image.open(io.BytesIO(content))
            img.verify()
            return "image"
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded image file is corrupted or unreadable."
            )

    elif file_format == "pdf":
        try:
            reader = PdfReader(io.BytesIO(content))
            if len(reader.pages) == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The PDF file contains no pages."
                )
            return "pdf"
        except Exception as e:
            if isinstance(e, HTTPException): raise e
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded PDF file is corrupted or cannot be read."
            )

    elif file_format == "docx":
        try:
            _ = docx.Document(io.BytesIO(content))
            return "docx"
        except Exception:
            # Maybe it was an image with .docx extension
            try:
                img = Image.open(io.BytesIO(content))
                img.verify()
                return "image"
            except Exception:
                pass
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded document is corrupted or not a valid Word (.docx) file."
            )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Unsupported file format. Please upload a PDF, DOCX, PNG, or JPG resume."
    )
