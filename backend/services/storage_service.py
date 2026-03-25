"""
Storage Service
Handles Cloudflare R2/S3 operations
"""
import os
import boto3
from botocore.config import Config
import hashlib
import logging
from pathlib import Path
from functools import lru_cache

logger = logging.getLogger(__name__)

# R2 Configuration
R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID', '')
R2_ACCESS_KEY = os.environ.get('R2_ACCESS_KEY_ID', '')
R2_SECRET_KEY = os.environ.get('R2_SECRET_ACCESS_KEY', '')
R2_BUCKET = os.environ.get('R2_BUCKET_NAME', '')
R2_ENDPOINT = os.environ.get('R2_ENDPOINT', '')
R2_PUBLIC_URL = os.environ.get('R2_PUBLIC_URL', '')
R2_BASE_URL = os.environ.get('R2_BASE_URL', R2_PUBLIC_URL)

# Cache TTL
R2_CACHE_TTL = 300  # 5 minutes

# In-memory cache for R2 listings
_r2_cache = {}
_r2_cache_timestamps = {}


def get_s3_client():
    """Create and return an S3 client configured for R2"""
    if not R2_ACCESS_KEY or not R2_SECRET_KEY:
        logger.warning("R2 credentials not configured")
        return None
    
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        region_name='auto',
        config=Config(signature_version='s3v4')
    )


def get_cache_key(prefix: str, operation: str = 'list') -> str:
    """Generate cache key for R2 operations"""
    return hashlib.md5(f"{prefix}:{operation}".encode()).hexdigest()


def get_cached_listing(prefix: str):
    """Get cached R2 listing if available and not expired"""
    import time
    cache_key = get_cache_key(prefix)
    
    if cache_key in _r2_cache:
        timestamp = _r2_cache_timestamps.get(cache_key, 0)
        if time.time() - timestamp < R2_CACHE_TTL:
            return _r2_cache[cache_key]
    
    return None


def set_cached_listing(prefix: str, data: dict):
    """Cache R2 listing result"""
    import time
    cache_key = get_cache_key(prefix)
    _r2_cache[cache_key] = data
    _r2_cache_timestamps[cache_key] = time.time()


def clear_cache(prefix: str = None):
    """Clear R2 cache, optionally for a specific prefix"""
    global _r2_cache, _r2_cache_timestamps
    
    if prefix:
        cache_key = get_cache_key(prefix)
        _r2_cache.pop(cache_key, None)
        _r2_cache_timestamps.pop(cache_key, None)
    else:
        _r2_cache = {}
        _r2_cache_timestamps = {}


async def list_objects(prefix: str, max_keys: int = 1000):
    """List objects in R2 bucket with given prefix"""
    s3_client = get_s3_client()
    if not s3_client:
        return []
    
    try:
        response = s3_client.list_objects_v2(
            Bucket=R2_BUCKET,
            Prefix=prefix,
            MaxKeys=max_keys
        )
        return response.get('Contents', [])
    except Exception as e:
        logger.error(f"Error listing R2 objects: {e}")
        return []


async def get_object_url(key: str) -> str:
    """Get public URL for R2 object"""
    if not key:
        return ''
    
    # Return public URL
    return f"{R2_PUBLIC_URL}/{key}"


async def upload_object(key: str, data: bytes, content_type: str = 'application/octet-stream'):
    """Upload object to R2"""
    s3_client = get_s3_client()
    if not s3_client:
        raise Exception("R2 not configured")
    
    try:
        s3_client.put_object(
            Bucket=R2_BUCKET,
            Key=key,
            Body=data,
            ContentType=content_type
        )
        return await get_object_url(key)
    except Exception as e:
        logger.error(f"Error uploading to R2: {e}")
        raise


async def delete_object(key: str):
    """Delete object from R2"""
    s3_client = get_s3_client()
    if not s3_client:
        raise Exception("R2 not configured")
    
    try:
        s3_client.delete_object(
            Bucket=R2_BUCKET,
            Key=key
        )
        return True
    except Exception as e:
        logger.error(f"Error deleting from R2: {e}")
        return False


# PDF Thumbnail cache directory
PDF_THUMBNAIL_CACHE = Path("/app/uploads/pdf_cache")
PDF_THUMBNAIL_CACHE.mkdir(parents=True, exist_ok=True)


def get_pdf_thumbnail_path(url: str, width: int = 200, height: int = 200) -> Path:
    """Get path for cached PDF thumbnail"""
    cache_key = hashlib.md5(f"{url}_{width}_{height}".encode()).hexdigest()
    return PDF_THUMBNAIL_CACHE / f"{cache_key}.jpg"
