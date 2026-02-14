"""
Application Configuration
Centralizes all environment variables and configuration settings
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Database Configuration
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'myschool_db')

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = int(os.environ.get('JWT_EXPIRY_HOURS', 24))
REFRESH_TOKEN_EXPIRY_DAYS = int(os.environ.get('REFRESH_TOKEN_EXPIRY_DAYS', 7))

# Email Configuration
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
EMAIL_FROM = os.environ.get('EMAIL_FROM', '')

# Stripe Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')

# Storage Configuration
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Cloudflare R2 Configuration
R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID', '')
R2_ACCESS_KEY = os.environ.get('R2_ACCESS_KEY_ID', '')
R2_SECRET_KEY = os.environ.get('R2_SECRET_ACCESS_KEY', '')
R2_BUCKET = os.environ.get('R2_BUCKET_NAME', '')
R2_ENDPOINT = os.environ.get('R2_ENDPOINT', '')
R2_PUBLIC_URL = os.environ.get('R2_PUBLIC_URL', '')
R2_BASE_URL = os.environ.get('R2_BASE_URL', R2_PUBLIC_URL)

# Cache Configuration
R2_CACHE_TTL = 300  # 5 minutes

# PDF Thumbnail Configuration
PDF_THUMBNAIL_CACHE = Path("/app/uploads/pdf_cache")
PDF_THUMBNAIL_CACHE.mkdir(parents=True, exist_ok=True)
