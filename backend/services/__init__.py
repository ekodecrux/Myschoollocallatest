"""
Services Package
"""
from .email_service import (
    send_email,
    get_welcome_email_template,
    get_password_reset_email_template
)
from .storage_service import (
    get_s3_client,
    list_objects,
    get_object_url,
    upload_object,
    delete_object,
    get_cached_listing,
    set_cached_listing,
    clear_cache,
    get_pdf_thumbnail_path,
    R2_PUBLIC_URL,
    R2_BUCKET
)

__all__ = [
    'send_email',
    'get_welcome_email_template',
    'get_password_reset_email_template',
    'get_s3_client',
    'list_objects',
    'get_object_url',
    'upload_object',
    'delete_object',
    'get_cached_listing',
    'set_cached_listing',
    'clear_cache',
    'get_pdf_thumbnail_path',
    'R2_PUBLIC_URL',
    'R2_BUCKET'
]
