from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query, UploadFile, File, Form, BackgroundTasks, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator, model_validator
from typing import List, Optional, Any, Dict
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import random
import string
import secrets
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import aiofiles
import re
import stripe
import razorpay
import httpx
import io
from PIL import Image
from functools import lru_cache
import hashlib
import time

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# In-memory cache for R2 listings (TTL: 5 minutes)
_r2_cache = {}
_r2_cache_ttl = 300  # 5 minutes

def get_cache_key(folder_path: str, images_per_page: int) -> str:
    return hashlib.md5(f"{folder_path}_{images_per_page}".encode()).hexdigest()

def get_cached_r2_listing(cache_key: str) -> Optional[dict]:
    if cache_key in _r2_cache:
        data, timestamp = _r2_cache[cache_key]
        if time.time() - timestamp < _r2_cache_ttl:
            return data
        del _r2_cache[cache_key]
    return None

def set_cached_r2_listing(cache_key: str, data: dict):
    _r2_cache[cache_key] = (data, time.time())
    # Clean old entries if cache grows too large
    if len(_r2_cache) > 100:
        oldest_key = min(_r2_cache.keys(), key=lambda k: _r2_cache[k][1])
        del _r2_cache[oldest_key]

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'myschool_db')]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', '')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES', 60))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.environ.get('REFRESH_TOKEN_EXPIRE_DAYS', 7))

# Email Configuration
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
EMAIL_FROM = os.environ.get('EMAIL_FROM', '')

# Stripe Configuration
stripe.api_key = os.environ.get('STRIPE_API_KEY', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')

# Razorpay Configuration
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')
razorpay_client = None
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

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
R2_BASE_URL = os.environ.get('R2_BASE_URL', R2_PUBLIC_URL)  # Alias for compatibility

# Password hashing - using bcrypt directly to avoid passlib compatibility issues
import bcrypt as _bcrypt

def hash_password_bcrypt(password: str) -> str:
    """Hash password using bcrypt directly"""
    return _bcrypt.hashpw(password.encode('utf-8'), _bcrypt.gensalt()).decode('utf-8')

def verify_password_bcrypt(plain_password: str, hashed_password: str) -> bool:
    """Verify password using bcrypt directly"""
    try:
        return _bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

# Fallback to passlib with error handling
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    USE_PASSLIB = True
except Exception:
    USE_PASSLIB = False
    logger = logging.getLogger(__name__)
    logger.warning("Passlib bcrypt backend unavailable, using direct bcrypt")

security = HTTPBearer(auto_error=False)

# Create the main app
app = FastAPI(title="MySchool API", version="2.0.0")

# Root-level health endpoint for Kubernetes (before any prefix)
@app.get("/health")
async def root_health_check():
    """Root health check for Kubernetes probes"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Add GZip compression for responses > 500 bytes
app.add_middleware(GZipMiddleware, minimum_size=500)

# Create routers
api_router = APIRouter(prefix="/api")
rest_router = APIRouter(prefix="/rest")
admin_router = APIRouter(prefix="/admin", tags=["Admin Panel"])

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== ENUMS ==============
class UserRole:
    SUPER_ADMIN = "SUPER_ADMIN"
    SCHOOL_ADMIN = "SCHOOL_ADMIN"  # School Admin (created by Super Admin)
    TEACHER = "TEACHER"  # Created by School Admin
    STUDENT = "STUDENT"  # Created by School Admin or Teacher
    PARENT = "PARENT"    # Created by School Admin
    INDIVIDUAL = "INDIVIDUAL"
    PUBLICATION = "PUBLICATION"

# ============== HELPER FUNCTIONS ==============
def generate_password(length: int = 12) -> str:
    """Generate a secure random password"""
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    # Ensure at least one of each type
    password = (
        secrets.choice(string.ascii_uppercase) +
        secrets.choice(string.ascii_lowercase) +
        secrets.choice(string.digits) +
        secrets.choice("!@#$%") +
        password[4:]
    )
    return password

def generate_code(prefix: str = "", length: int = 6) -> str:
    """Generate a unique code with optional prefix"""
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    return f"{prefix}{code}" if prefix else code

def generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))

def hash_password(password: str) -> str:
    """Hash password - uses passlib if available, otherwise direct bcrypt"""
    if USE_PASSLIB:
        try:
            return pwd_context.hash(password)
        except Exception:
            pass
    return hash_password_bcrypt(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password - uses passlib if available, otherwise direct bcrypt"""
    if USE_PASSLIB:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            pass
    return verify_password_bcrypt(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "cognito:groups": [data.get("role", UserRole.INDIVIDUAL)]
    })
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh"
    })
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = credentials.credentials
    payload = decode_token(token)
    
    user = await db.users.find_one({"id": payload.get("userId")})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

async def require_super_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return current_user

async def require_admin_or_above(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def require_teacher_or_above(current_user: dict = Depends(get_current_user)) -> dict:
    """Allow Super Admin, School Admin, and Teachers"""
    if current_user.get("role") not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER]:
        raise HTTPException(status_code=403, detail="Teacher or Admin access required")
    return current_user

# ============== EMAIL SERVICE ==============
async def send_email(to_email: str, subject: str, html_content: str):
    """Send email using Gmail SMTP"""
    try:
        message = MIMEMultipart("alternative")
        message["From"] = EMAIL_FROM
        message["To"] = to_email
        message["Subject"] = subject
        
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            start_tls=True,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
        )
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

async def send_welcome_email(to_email: str, name: str, password: str, role: str, school_name: str = "MySchool"):
    """Send welcome email with auto-generated password"""
    subject = f"Welcome to {school_name} - Your Account Details"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
            .credentials {{ background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ddd; }}
            .password {{ font-size: 18px; font-weight: bold; color: #1976d2; background: #e3f2fd; padding: 10px; border-radius: 4px; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            .btn {{ display: inline-block; background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎓 Welcome to {school_name}</h1>
            </div>
            <div class="content">
                <p>Dear <strong>{name}</strong>,</p>
                <p>Your account has been created successfully as a <strong>{role}</strong>.</p>
                
                <div class="credentials">
                    <h3>Your Login Credentials:</h3>
                    <p><strong>Email:</strong> {to_email}</p>
                    <p><strong>Temporary Password:</strong></p>
                    <p class="password">{password}</p>
                </div>
                
                <p>⚠️ <strong>Important:</strong> Please change your password after your first login for security purposes.</p>
                
                <p>If you have any questions, please contact your administrator.</p>
                
                <div class="footer">
                    <p>This is an automated message from MySchool. Please do not reply to this email.</p>
                    <p>© 2024 MySchool - Solutions Beyond School</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    await send_email(to_email, subject, html_content)

async def send_password_reset_email(to_email: str, name: str, reset_code: str):
    """Send password reset email"""
    subject = "MySchool - Password Reset Request"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #f44336; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
            .code {{ font-size: 32px; font-weight: bold; color: #f44336; background: #ffebee; padding: 15px; border-radius: 8px; text-align: center; letter-spacing: 8px; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset</h1>
            </div>
            <div class="content">
                <p>Dear <strong>{name}</strong>,</p>
                <p>We received a request to reset your password. Use the code below to reset your password:</p>
                
                <p class="code">{reset_code}</p>
                
                <p>This code will expire in <strong>15 minutes</strong>.</p>
                
                <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
                
                <div class="footer">
                    <p>© 2024 MySchool - Solutions Beyond School</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    await send_email(to_email, subject, html_content)

# ============== MODELS ==============
class SchoolModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str  # Unique school code
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    logo_url: Optional[str] = None
    admin_id: Optional[str] = None  # School admin user ID
    principal_name: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None

class UserLoginRequest(BaseModel):
    username: str
    password: str
    school_code: Optional[str] = Field(None, alias="schoolCode")

class UserRegisterRequest(BaseModel):
    email: EmailStr = Field(alias="emailId", max_length=30)
    name: str = Field(min_length=1, max_length=40)
    password: Optional[str] = None  # Auto-generated if not provided
    mobile_number: Optional[str] = Field(None, alias="mobileNumber")
    user_role: str = Field(UserRole.INDIVIDUAL, alias="userRole")
    school_code: Optional[str] = Field(None, alias="schoolCode", max_length=16)
    address: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=35)
    state: Optional[str] = Field(None, max_length=35)
    postal_code: Optional[str] = Field(None, alias="postalCode")
    # School Admin fields
    principal_name: Optional[str] = Field(None, alias="principalName", max_length=40)
    # Teacher fields
    teacher_code: Optional[str] = Field(None, alias="teacherCode")
    subject: Optional[str] = None
    # Student fields
    roll_number: Optional[str] = Field(None, alias="rollNumber", max_length=10)
    class_name: Optional[str] = Field(None, alias="className", max_length=10)
    section_name: Optional[str] = Field(None, alias="sectionName", max_length=10)
    father_name: Optional[str] = Field(None, alias="fatherName", max_length=40)
    mother_name: Optional[str] = Field(None, alias="motherName", max_length=40)
    # Parent fields
    student_ids: Optional[List[str]] = Field(None, alias="studentIds")
    # Publication fields
    organization_name: Optional[str] = Field(None, alias="organizationName")
    
    model_config = {"populate_by_name": True}
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if v and not re.match(r'^[A-Za-z\s]+$', v):
            raise ValueError('Name must contain only alphabets and spaces')
        return v
    
    @field_validator('mobile_number')
    @classmethod
    def validate_mobile(cls, v):
        if v:
            # Remove any spaces or dashes
            v = re.sub(r'[\s\-]', '', v)
            if not re.match(r'^\d{10}$', v):
                raise ValueError('Mobile number must be exactly 10 digits')
        return v
    
    @field_validator('school_code')
    @classmethod
    def validate_school_code(cls, v):
        if v and not re.match(r'^[A-Za-z0-9]+$', v):
            raise ValueError('School code must contain only alphanumeric characters')
        return v
    
    @field_validator('address')
    @classmethod
    def validate_address(cls, v):
        if v and not re.match(r'^[A-Za-z0-9\s\-\#\,\.\/]+$', v):
            raise ValueError('Address contains invalid characters')
        return v
    
    @field_validator('city', 'state')
    @classmethod
    def validate_city_state(cls, v):
        if v and not re.match(r'^[A-Za-z\s]+$', v):
            raise ValueError('City/State must contain only alphabets')
        return v
    
    @field_validator('postal_code')
    @classmethod
    def validate_postal_code(cls, v):
        if v:
            v = v.strip()
            if not re.match(r'^\d{6}$', v):
                raise ValueError('Postal code must be exactly 6 digits')
        return v
    
    @field_validator('principal_name', 'father_name', 'mother_name')
    @classmethod
    def validate_person_names(cls, v):
        if v and not re.match(r'^[A-Za-z\s]+$', v):
            raise ValueError('Name must contain only alphabets and spaces')
        return v
    
    @field_validator('roll_number')
    @classmethod
    def validate_roll_number(cls, v):
        if v and not re.match(r'^[A-Za-z0-9]+$', v):
            raise ValueError('Roll number must be alphanumeric')
        return v
    
    @field_validator('class_name')
    @classmethod
    def validate_class_name(cls, v):
        if v and not re.match(r'^[A-Za-z0-9\s\-]+$', v):
            raise ValueError('Class name must be alphanumeric')
        return v
    
    @field_validator('section_name')
    @classmethod
    def validate_section(cls, v):
        if v and not re.match(r'^[A-Za-z]+$', v):
            raise ValueError('Section must contain only alphabets')
        return v
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if v:
            if len(v) < 6:
                raise ValueError('Password must be at least 6 characters')
            if not re.match(r'^[A-Za-z0-9@#$%^&*!]+$', v):
                raise ValueError('Password contains invalid characters')
        return v

class CreateSchoolRequest(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    admin_email: EmailStr = Field(alias="adminEmail", max_length=30)
    admin_name: str = Field(alias="adminName", min_length=1, max_length=40)
    admin_phone: Optional[str] = Field(None, alias="adminPhone")
    principal_name: Optional[str] = Field(None, alias="principalName", max_length=40)
    address: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=35)
    state: Optional[str] = Field(None, max_length=35)
    postal_code: Optional[str] = Field(None, alias="postalCode")
    
    model_config = {"populate_by_name": True}
    
    @field_validator('name')
    @classmethod
    def validate_school_name(cls, v):
        if v and not re.match(r'^[A-Za-z\s\.\-]+$', v):
            raise ValueError('School name must contain only alphabets, spaces, dots and hyphens')
        return v
    
    @field_validator('admin_name', 'principal_name')
    @classmethod
    def validate_person_name(cls, v):
        if v and not re.match(r'^[A-Za-z\s]+$', v):
            raise ValueError('Name must contain only alphabets and spaces')
        return v
    
    @field_validator('admin_phone')
    @classmethod
    def validate_phone(cls, v):
        if v:
            v = re.sub(r'[\s\-]', '', v)
            if not re.match(r'^\d{10}$', v):
                raise ValueError('Phone number must be exactly 10 digits')
        return v
    
    @field_validator('address')
    @classmethod
    def validate_address(cls, v):
        if v and not re.match(r'^[A-Za-z0-9\s\-\#\,\.\/]+$', v):
            raise ValueError('Address contains invalid characters')
        return v
    
    @field_validator('city', 'state')
    @classmethod
    def validate_city_state(cls, v):
        if v and not re.match(r'^[A-Za-z\s]+$', v):
            raise ValueError('City/State must contain only alphabets')
        return v
    
    @field_validator('postal_code')
    @classmethod
    def validate_postal_code(cls, v):
        if v:
            v = v.strip()
            if not re.match(r'^\d{6}$', v):
                raise ValueError('Postal code must be exactly 6 digits')
        return v

class LoginResponse(BaseModel):
    accessToken: str
    refreshToken: str
    message: str = "Login successful"
    school: Optional[dict] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr

class ConfirmPasswordResetRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str = Field(alias="newPassword")

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(alias="currentPassword")
    new_password: str = Field(alias="newPassword")

class ImageUploadRequest(BaseModel):
    category: str
    subcategory: Optional[str] = None
    tags: List[str] = []
    title: str
    description: Optional[str] = None

# ============== SCHOOL MANAGEMENT (Super Admin) ==============
school_mgmt_router = APIRouter(prefix="/schools", tags=["School Management"])

@school_mgmt_router.post("/create")
async def create_school(
    request: CreateSchoolRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_super_admin)
):
    """Create a new school with School Admin (Super Admin only)"""
    
    # Generate unique school code
    school_code = generate_code("SCH", 6)
    while await db.schools.find_one({"code": school_code}):
        school_code = generate_code("SCH", 6)
    
    # Check if admin email already exists
    existing_admin = await db.users.find_one({"email": request.admin_email})
    if existing_admin:
        raise HTTPException(status_code=400, detail="Admin email already registered")
    
    # Generate auto password for School Admin
    auto_password = generate_password()
    admin_id = str(uuid.uuid4())
    
    # Create School Admin user
    admin_data = {
        "id": admin_id,
        "email": request.admin_email,
        "name": request.admin_name,
        "password_hash": hash_password(auto_password),
        "mobile_number": request.admin_phone,
        "role": UserRole.SCHOOL_ADMIN,
        "school_code": school_code,
        "credits": 5000,
        "disabled": False,
        "require_password_change": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["id"]
    }
    
    # Create school record
    school_data = {
        "id": str(uuid.uuid4()),
        "name": request.name,
        "code": school_code,
        "principal_name": request.principal_name,
        "address": request.address,
        "city": request.city,
        "state": request.state,
        "postal_code": request.postal_code,
        "admin_id": admin_id,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["id"]
    }
    
    await db.schools.insert_one(school_data)
    await db.users.insert_one(admin_data)
    
    # Send welcome email with auto password
    background_tasks.add_task(
        send_welcome_email,
        request.admin_email,
        request.admin_name,
        auto_password,
        "School Admin",
        request.name
    )
    
    return {
        "message": "School created successfully",
        "schoolCode": school_code,
        "adminEmail": request.admin_email,
        "note": "School Admin credentials have been sent to the email address"
    }

@school_mgmt_router.get("/list")
async def list_schools(
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(require_super_admin)
):
    """List all schools (Super Admin only)"""
    schools_raw = await db.schools.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.schools.count_documents({})
    
    # Transform to frontend expected format
    schools = []
    for s in schools_raw:
        schools.append({
            "id": s.get("id"),
            "schoolCode": s.get("code"),
            "name": s.get("name"),
            "principalName": s.get("principal_name"),
            "address": s.get("address"),
            "city": s.get("city"),
            "state": s.get("state"),
            "postalCode": s.get("postal_code"),
            "isActive": s.get("is_active", True),
            "teachersEnrolled": await db.users.count_documents({"school_code": s.get("code"), "role": UserRole.TEACHER}),
            "studentsEnrolled": await db.users.count_documents({"school_code": s.get("code"), "role": UserRole.STUDENT}),
            "credits": s.get("credits", 0)
        })
    
    return {
        "data": schools,
        "total": total,
        "limit": limit,
        "skip": skip
    }

@school_mgmt_router.get("/public/active")
async def get_active_schools_public():
    """Get list of active schools for public registration dropdown (no auth required)"""
    schools = await db.schools.find(
        {"is_active": True}, 
        {"_id": 0, "code": 1, "name": 1}
    ).to_list(500)
    return {"schools": schools}

@school_mgmt_router.get("/{school_code}")
async def get_school(
    school_code: str,
    current_user: dict = Depends(get_current_user)
):
    """Get school details"""
    school = await db.schools.find_one({"code": school_code}, {"_id": 0})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Get admin details
    if school.get("admin_id"):
        admin = await db.users.find_one(
            {"id": school["admin_id"]}, 
            {"_id": 0, "password_hash": 0}
        )
        school["admin"] = admin
    
    # Get stats
    school["stats"] = {
        "teachers": await db.users.count_documents({"school_code": school_code, "role": UserRole.TEACHER}),
        "students": await db.users.count_documents({"school_code": school_code, "role": UserRole.STUDENT}),
        "parents": await db.users.count_documents({"school_code": school_code, "role": UserRole.PARENT})
    }
    
    return school

@school_mgmt_router.patch("/{school_code}/toggle-status")
async def toggle_school_status(
    school_code: str,
    current_user: dict = Depends(require_super_admin)
):
    """Enable/Disable school (Super Admin only)"""
    school = await db.schools.find_one({"code": school_code})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    new_status = not school.get("is_active", True)
    await db.schools.update_one(
        {"code": school_code},
        {"$set": {"is_active": new_status}}
    )
    
    return {"message": f"School {'activated' if new_status else 'deactivated'} successfully"}

# ============== AUTH ROUTES ==============
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])

@auth_router.post("/login")
async def login(request: UserLoginRequest):
    """Login with email and password, optionally with school code"""
    query = {"email": request.username}
    
    # If school code provided, filter by it
    if request.school_code:
        query["school_code"] = request.school_code
    
    user = await db.users.find_one(query)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(request.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.get("disabled", False):
        raise HTTPException(status_code=403, detail="Account is disabled")
    
    # Check if school admin is disabled (for teachers/students)
    if user.get("school_code") and user.get("role") in [UserRole.TEACHER, UserRole.STUDENT]:
        school_admin = await db.users.find_one({
            "school_code": user["school_code"], 
            "role": UserRole.SCHOOL_ADMIN
        })
        if school_admin and school_admin.get("disabled", False):
            raise HTTPException(status_code=403, detail="Your school is currently disabled. Please contact administrator.")
    
    # Check if school is active (for non-super-admins)
    if user.get("school_code") and user.get("role") != UserRole.SUPER_ADMIN:
        school = await db.schools.find_one({"code": user["school_code"]})
        if school and not school.get("is_active", True):
            raise HTTPException(status_code=403, detail="Your school is currently inactive. Please contact administrator.")
    
    # Check if password change is required
    if user.get("require_password_change", False):
        return {
            "message": "Password change required",
            "data": {
                "challengeName": "NEW_PASSWORD_REQUIRED",
                "session": str(uuid.uuid4()),
                "username": request.username
            }
        }
    
    token_data = {
        "userId": user["id"],
        "email": user["email"],
        "role": user.get("role", UserRole.INDIVIDUAL),
        "schoolCode": user.get("school_code")
    }
    
    logger.info(f"Login successful - User ID: {user['id']}, Name: {user.get('name')}, Email: {user['email']}")
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    # Update last_login timestamp
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc)}}
    )
    
    # Get school info if applicable
    school_info = None
    if user.get("school_code"):
        school = await db.schools.find_one({"code": user["school_code"]}, {"_id": 0})
        if school:
            school_info = {"name": school["name"], "code": school["code"]}
    
    return LoginResponse(
        accessToken=access_token,
        refreshToken=refresh_token,
        message="Login successful",
        school=school_info
    )

@auth_router.post("/register")
async def register(
    request: UserRegisterRequest,
    background_tasks: BackgroundTasks
):
    """Register a new user (public registration)"""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate password requirements if provided
    if request.password:
        if len(request.password) > 15:
            raise HTTPException(status_code=400, detail="Password must not exceed 15 characters")
        if not any(c.isupper() for c in request.password):
            raise HTTPException(status_code=400, detail="Password must contain at least one capital letter")
        if not request.password.isalnum():
            # Allow some special characters but check basic format
            pass  # We allow alphanumeric and some special chars
    
    # Check for unique school code ONLY when creating a SCHOOL_ADMIN
    # Teachers and students should use the existing school code of their school
    if request.school_code and request.user_role in [UserRole.SCHOOL_ADMIN, "SCHOOL", "ADMIN"]:
        existing_school_code = await db.users.find_one({
            "school_code": request.school_code,
            "role": UserRole.SCHOOL_ADMIN
        })
        if existing_school_code:
            raise HTTPException(status_code=400, detail="School code already exists. Please use a different code.")
    
    # Generate auto password if not provided
    auto_password = request.password or generate_password()
    send_email_flag = request.password is None
    
    # Determine registration type: self-registered or admin-created
    # If password is None, user was created by admin (password sent via email)
    # If password is provided, user self-registered
    registration_type = "admin_created" if send_email_flag else "self_registered"
    
    user_id = str(uuid.uuid4())
    user_data = {
        "id": user_id,
        "email": request.email,
        "name": request.name,
        "password_hash": hash_password(auto_password),
        "mobile_number": request.mobile_number,
        "role": request.user_role,
        "school_code": request.school_code,
        "address": request.address,
        "city": request.city,
        "state": request.state,
        "postal_code": request.postal_code,
        "credits": 100,  # Default 100 credits for all users
        "free_credits_used": False,
        "subscription_status": "free",  # free, active, expired
        "registration_type": registration_type,  # Track how user was registered
        "disabled": False,
        "require_password_change": send_email_flag,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Add role-specific fields
    # Handle 'SCHOOL' or 'ADMIN' from frontend as 'SCHOOL_ADMIN'
    effective_role = request.user_role
    if request.user_role in ["SCHOOL", "ADMIN"]:
        effective_role = UserRole.SCHOOL_ADMIN
    
    if effective_role == UserRole.SCHOOL_ADMIN or request.user_role in ["SCHOOL", "ADMIN"]:
        user_data["role"] = UserRole.SCHOOL_ADMIN
        school_code = request.school_code or generate_code("SCH", 6)
        user_data.update({
            "school_code": school_code,
            "principal_name": request.principal_name,
            "teachers_enrolled": 0,
            "students_enrolled": 0
        })
        
        # Also create a school record in the schools collection
        school_data = {
            "id": str(uuid.uuid4()),
            "name": request.name,  # School name comes from the 'name' field
            "code": school_code,
            "principal_name": request.principal_name,
            "address": request.address,
            "city": request.city,
            "state": request.state,
            "postal_code": request.postal_code,
            "admin_id": user_id,
            "is_active": True,
            "credits": 5000,  # Default credits for new schools
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.schools.insert_one(school_data)
        logger.info(f"School record created: {school_code} - {request.name}")
    elif request.user_role == UserRole.TEACHER:
        user_data.update({
            "school_code": request.school_code,
            "teacher_code": request.teacher_code or generate_code("TCH", 6),
            "students_enrolled": 0
        })
    elif request.user_role == UserRole.STUDENT:
        # Generate unique student code
        student_code = generate_code("STU", 6)
        while await db.users.find_one({"student_code": student_code}):
            student_code = generate_code("STU", 6)
        user_data.update({
            "school_code": request.school_code,
            "teacher_code": request.teacher_code,
            "student_code": student_code,
            "roll_number": request.roll_number,
            "class_name": request.class_name,
            "section_name": request.section_name,
            "father_name": request.father_name
        })
    elif request.user_role == UserRole.PUBLICATION:
        user_data.update({
            "organization_name": request.organization_name
        })
    
    await db.users.insert_one(user_data)
    
    # Send welcome email if password was auto-generated
    if send_email_flag:
        school_name = "MySchool"
        if request.school_code:
            school = await db.schools.find_one({"code": request.school_code})
            if school:
                school_name = school["name"]
        
        background_tasks.add_task(
            send_welcome_email,
            request.email,
            request.name,
            auto_password,
            request.user_role,
            school_name
        )
    
    return {
        "message": "Registration successful",
        "userId": user_id,
        "email": request.email,
        "emailSent": send_email_flag,
        "addedBy": "Self" if registration_type == "self_registered" else "Admin"
    }

@auth_router.post("/newPasswordChallenge")
async def new_password_challenge(body: dict):
    """Handle new password challenge after first login"""
    username = body.get("username")
    new_password = body.get("newPassword")
    
    if not username or not new_password:
        raise HTTPException(status_code=400, detail="Username and new password required")
    
    # Validate password requirements
    if len(new_password) > 15:
        raise HTTPException(status_code=400, detail="Password must not exceed 15 characters")
    if not any(c.isupper() for c in new_password):
        raise HTTPException(status_code=400, detail="Password must contain at least one capital letter")
    
    user = await db.users.find_one({"email": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check password history (last 3 passwords)
    password_history = user.get("password_history", [])
    for old_hash in password_history[-3:]:
        if verify_password(new_password, old_hash):
            raise HTTPException(status_code=400, detail="Password cannot be same as last 3 passwords")
    
    # Also check current password
    if verify_password(new_password, user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="New password must be different from current password")
    
    # Update password history
    new_history = password_history + [user.get("password_hash")]
    if len(new_history) > 5:  # Keep only last 5
        new_history = new_history[-5:]
    
    # Update password
    await db.users.update_one(
        {"email": username},
        {
            "$set": {
                "password_hash": hash_password(new_password),
                "require_password_change": False,
                "password_history": new_history
            }
        }
    )
    
    token_data = {
        "userId": user["id"],
        "email": user["email"],
        "role": user.get("role", UserRole.INDIVIDUAL),
        "schoolCode": user.get("school_code")
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return LoginResponse(
        accessToken=access_token,
        refreshToken=refresh_token,
        message="Password updated successfully"
    )

@auth_router.post("/refreshToken")
async def refresh_token_endpoint(body: dict):
    """Refresh access token"""
    refresh_tok = body.get("refreshToken")
    if not refresh_tok:
        raise HTTPException(status_code=400, detail="Refresh Token is required")
    
    try:
        payload = decode_token(refresh_tok)
    except:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")
    
    user = await db.users.find_one({"id": payload.get("userId")})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    token_data = {
        "userId": user["id"],
        "email": user["email"],
        "role": user.get("role", UserRole.INDIVIDUAL),
        "schoolCode": user.get("school_code")
    }
    
    new_access_token = create_access_token(token_data)
    
    return {
        "accessToken": new_access_token,
        "refreshToken": refresh_tok,
        "message": "Token refreshed successfully"
    }

@auth_router.get("/forgotPassword")
async def forgot_password(email: str, background_tasks: BackgroundTasks):
    """Send password reset email"""
    user = await db.users.find_one({"email": email})
    
    if not user:
        # Don't reveal if email exists
        return {"message": "If the email exists, a reset code has been sent"}
    
    # Generate reset code
    reset_code = generate_otp()
    
    # Store reset code
    await db.password_resets.delete_many({"email": email})  # Remove old codes
    await db.password_resets.insert_one({
        "email": email,
        "code": reset_code,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
    })
    
    # Send email
    background_tasks.add_task(
        send_password_reset_email,
        email,
        user.get("name", "User"),
        reset_code
    )
    
    return {"message": "If the email exists, a reset code has been sent"}

@auth_router.post("/confirmPassword")
async def confirm_password(request: ConfirmPasswordResetRequest):
    """Reset password with code"""
    reset = await db.password_resets.find_one({
        "email": request.email,
        "code": request.code
    })
    
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    
    # Check expiry
    expires_at = datetime.fromisoformat(reset["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        await db.password_resets.delete_one({"_id": reset["_id"]})
        raise HTTPException(status_code=400, detail="Code has expired")
    
    # Update password
    await db.users.update_one(
        {"email": request.email},
        {
            "$set": {
                "password_hash": hash_password(request.new_password),
                "require_password_change": False
            }
        }
    )
    
    # Delete used code
    await db.password_resets.delete_one({"_id": reset["_id"]})
    
    return {"message": "Password reset successfully"}

@auth_router.post("/changePassword")
async def change_password(
    request: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """Change password for logged-in user"""
    if not verify_password(request.current_password, current_user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"password_hash": hash_password(request.new_password)}}
    )
    
    return {"message": "Password changed successfully"}

@auth_router.get("/sendOtp")
async def send_otp(phoneNumber: str):
    """Send OTP to phone number"""
    otp = generate_otp()
    session_id = str(uuid.uuid4())
    
    await db.otp_sessions.insert_one({
        "session_id": session_id,
        "phone_number": phoneNumber,
        "otp": otp,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
    })
    
    logger.info(f"OTP for {phoneNumber}: {otp}")
    
    return {
        "message": "success",
        "sessionId": session_id,
        "phoneNumber": phoneNumber
    }

@auth_router.post("/loginViaOtp")
async def login_via_otp(body: dict):
    """Login using OTP"""
    phone_number = body.get("phoneNumber")
    otp = body.get("otp")
    
    session = await db.otp_sessions.find_one({
        "phone_number": phone_number,
        "otp": otp
    })
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid OTP")
    
    expires_at = datetime.fromisoformat(session["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=401, detail="OTP expired")
    
    user = await db.users.find_one({"mobile_number": phone_number})
    
    if not user:
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "email": f"{phone_number}@myschool.temp",
            "name": "User",
            "mobile_number": phone_number,
            "role": UserRole.INDIVIDUAL,
            "credits": 100,
            "disabled": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
    
    await db.otp_sessions.delete_one({"_id": session["_id"]})
    
    # Update last_login timestamp
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc)}}
    )
    
    token_data = {
        "userId": user["id"],
        "email": user.get("email", ""),
        "role": user.get("role", UserRole.INDIVIDUAL)
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return LoginResponse(
        accessToken=access_token,
        refreshToken=refresh_token,
        message="OTP Login successful"
    )

# ============== USER ROUTES ==============
users_router = APIRouter(prefix="/users", tags=["Users"])

@users_router.get("/getUserDetails")
async def get_user_details(current_user: dict = Depends(get_current_user)):
    """Get current user details with all codes and profile information"""
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Add userId for frontend compatibility
    user["userId"] = user["id"]
    
    # Get school name if user has school_code
    school_name = ""
    if user.get("school_code"):
        school = await db.users.find_one(
            {"role": UserRole.SCHOOL_ADMIN, "school_code": user["school_code"]},
            {"_id": 0, "name": 1}
        )
        if school:
            school_name = school.get("name", "")
        user["school_name"] = school_name
        user["schoolName"] = school_name
    
    # Get teacher name if user has teacher_code
    teacher_name = ""
    if user.get("teacher_code") and user.get("role") == UserRole.STUDENT:
        teacher = await db.users.find_one(
            {"role": UserRole.TEACHER, "teacher_code": user["teacher_code"]},
            {"_id": 0, "name": 1}
        )
        if teacher:
            teacher_name = teacher.get("name", "")
        user["teacher_name"] = teacher_name
        user["teacherName"] = teacher_name
    
    # Ensure all code fields are present with camelCase aliases
    user["schoolCode"] = user.get("school_code", "")
    user["teacherCode"] = user.get("teacher_code", "")
    user["studentCode"] = user.get("student_code", "")
    user["mobileNumber"] = user.get("mobile_number", "")
    user["postalCode"] = user.get("postal_code", "")
    user["className"] = user.get("class_name", "")
    user["sectionName"] = user.get("section_name", "")
    user["rollNumber"] = user.get("roll_number", "")
    user["fatherName"] = user.get("father_name", "")
    user["principalName"] = user.get("principal_name", "")
    user["subscriptionStatus"] = user.get("subscription_status", "free")
    user["createdAt"] = user.get("created_at", "")
    
    return user

@users_router.patch("/updateUserDetails")
async def update_user_details(
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update current user details"""
    allowed_fields = ["name", "mobile_number", "mobileNumber", "address", "city", "state", "postal_code", "postalCode"]
    update_data = {k: v for k, v in body.items() if k in allowed_fields and v is not None}
    
    # Convert camelCase to snake_case
    if "mobileNumber" in update_data:
        update_data["mobile_number"] = update_data.pop("mobileNumber")
    if "postalCode" in update_data:
        update_data["postal_code"] = update_data.pop("postalCode")
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": update_data}
    )
    
    updated_user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password_hash": 0})
    updated_user["userId"] = updated_user["id"]
    return updated_user

@users_router.patch("/updateUserSchoolCode")
async def update_user_school_code(
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user's school code - Super Admin only"""
    user_role = current_user.get("role")
    
    if user_role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can update school codes")
    
    user_id = body.get("userId")
    school_code = body.get("schoolCode")
    teacher_code = body.get("teacherCode")
    
    if not user_id:
        raise HTTPException(status_code=400, detail="userId is required")
    
    # Find the target user
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {}
    
    # Update school code if provided
    if school_code is not None:
        # Verify school code exists if it's not empty
        if school_code:
            school = await db.schools.find_one({"code": school_code})
            if not school:
                # Also check if any SCHOOL_ADMIN has this code
                school_admin = await db.users.find_one({"school_code": school_code, "role": UserRole.SCHOOL_ADMIN})
                if not school_admin:
                    raise HTTPException(status_code=400, detail=f"School code '{school_code}' not found. School code should be like 'SCH123456' (found in Schools tab). You entered a city/area name or invalid code.")
        update_data["school_code"] = school_code
    
    # Update teacher code if provided
    if teacher_code is not None:
        update_data["teacher_code"] = teacher_code
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return {
        "message": "User updated successfully",
        "user": updated_user
    }

@users_router.patch("/bulkUpdateSchoolCodes")
async def bulk_update_school_codes(
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """Bulk update school codes for multiple users - Super Admin only"""
    user_role = current_user.get("role")
    
    if user_role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can bulk update school codes")
    
    updates = body.get("updates", [])  # List of {userId, schoolCode, teacherCode}
    
    if not updates or not isinstance(updates, list):
        raise HTTPException(status_code=400, detail="updates array is required")
    
    success_count = 0
    errors = []
    
    for update in updates:
        user_id = update.get("userId")
        school_code = update.get("schoolCode")
        teacher_code = update.get("teacherCode")
        
        if not user_id:
            errors.append({"userId": user_id, "error": "userId is required"})
            continue
        
        try:
            update_data = {}
            if school_code is not None:
                update_data["school_code"] = school_code
            if teacher_code is not None:
                update_data["teacher_code"] = teacher_code
            
            if update_data:
                result = await db.users.update_one(
                    {"id": user_id},
                    {"$set": update_data}
                )
                if result.modified_count > 0:
                    success_count += 1
                else:
                    errors.append({"userId": user_id, "error": "User not found or no changes"})
        except Exception as e:
            errors.append({"userId": user_id, "error": str(e)})
    
    return {
        "message": f"Successfully updated {success_count} users",
        "success_count": success_count,
        "errors": errors
    }

@users_router.put("/{user_id}")
async def update_user_by_id(
    user_id: str,
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update any user by ID - Admin/Super Admin only"""
    user_role = current_user.get("role")
    
    if user_role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN]:
        raise HTTPException(status_code=403, detail="Only Super Admin or School Admin can update users")
    
    # Find the target user
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # School admins can only edit users in their school
    if user_role == UserRole.SCHOOL_ADMIN:
        if target_user.get("school_code") != current_user.get("school_code"):
            raise HTTPException(status_code=403, detail="You can only edit users in your school")
    
    # Allowed fields for update
    allowed_fields = ["name", "mobile_number", "address", "city", "state", "postal_code", 
                      "principal_name", "class_name", "section_name", "roll_number", "father_name", "parent_name"]
    
    update_data = {}
    for key, value in body.items():
        # Convert camelCase to snake_case
        snake_key = ''.join(['_' + c.lower() if c.isupper() else c for c in key]).lstrip('_')
        if snake_key in allowed_fields and value is not None:
            update_data[snake_key] = value
    
    # Also update school name if it's a school admin being updated
    if target_user.get("role") == UserRole.SCHOOL_ADMIN and "name" in update_data:
        # Update the school collection too
        await db.schools.update_one(
            {"code": target_user.get("school_code")},
            {"$set": {"name": update_data["name"]}}
        )
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    updated_user["userId"] = updated_user["id"]
    return {"message": "User updated successfully", "user": updated_user}

@users_router.patch("/adminUpdateUser")
async def admin_update_user(
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """Admin/Super Admin can edit any user's details"""
    user_role = current_user.get("role")
    
    if user_role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN]:
        raise HTTPException(status_code=403, detail="Only Super Admin or School Admin can update users")
    
    user_id = body.get("userId")
    if not user_id:
        raise HTTPException(status_code=400, detail="userId is required")
    
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # School Admin can only update users in their school
    if user_role == UserRole.SCHOOL_ADMIN:
        if target_user.get("school_code") != current_user.get("school_code"):
            raise HTTPException(status_code=403, detail="You can only update users in your school")
    
    # Fields that can be updated
    allowed_fields = [
        "name", "email", "mobile_number", "mobileNumber", "address", "city", "state", 
        "postal_code", "postalCode", "school_code", "schoolCode", "teacher_code", "teacherCode",
        "class_name", "className", "section_name", "sectionName", "roll_number", "rollNumber",
        "father_name", "fatherName", "disabled", "credits"
    ]
    
    update_data = {}
    for key, value in body.items():
        if key in allowed_fields and value is not None:
            # Convert camelCase to snake_case
            snake_key = key
            if key == "mobileNumber": snake_key = "mobile_number"
            elif key == "postalCode": snake_key = "postal_code"
            elif key == "schoolCode": snake_key = "school_code"
            elif key == "teacherCode": snake_key = "teacher_code"
            elif key == "className": snake_key = "class_name"
            elif key == "sectionName": snake_key = "section_name"
            elif key == "rollNumber": snake_key = "roll_number"
            elif key == "fatherName": snake_key = "father_name"
            update_data[snake_key] = value
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return {"message": "User updated successfully", "user": updated_user}

@users_router.delete("/deleteUser/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a user - Super Admin and School Admin only"""
    user_role = current_user.get("role")
    
    if user_role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN]:
        raise HTTPException(status_code=403, detail="Only Super Admin or School Admin can delete users")
    
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # School Admin can only delete users in their school
    if user_role == UserRole.SCHOOL_ADMIN:
        if target_user.get("school_code") != current_user.get("school_code"):
            raise HTTPException(status_code=403, detail="You can only delete users in your school")
    
    # Cannot delete Super Admins
    if target_user.get("role") == UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot delete Super Admin users")
    
    await db.users.delete_one({"id": user_id})
    
    return {"message": "User deleted successfully", "userId": user_id}

@users_router.get("/list")
async def list_users(
    noSchoolCode: bool = Query(False),
    limit: int = Query(100, ge=1, le=500),
    current_user: dict = Depends(get_current_user)
):
    """List users - Super Admin only. Can filter to show only users without school code."""
    user_role = current_user.get("role")
    
    if user_role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can list all users")
    
    query = {}
    if noSchoolCode:
        # Find users without school_code or with empty school_code
        query["$or"] = [
            {"school_code": {"$exists": False}},
            {"school_code": None},
            {"school_code": ""}
        ]
        # Exclude Super Admins
        query["role"] = {"$ne": UserRole.SUPER_ADMIN}
    
    users = await db.users.find(query, {"_id": 0, "password": 0}).limit(limit).to_list(limit)
    return {"users": users}

@users_router.get("/listUsersByRole")
async def list_users_by_role(
    role: str,
    limit: int = Query(100, ge=1, le=500),
    lastUserId: Optional[str] = None,
    schoolCode: Optional[str] = None,
    teacherCode: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List users by role with filtering based on user permissions"""
    user_role = current_user.get("role")
    if user_role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {"role": role}
    
    # Filter by school for non-super-admins
    if user_role == UserRole.SUPER_ADMIN:
        if schoolCode:
            query["school_code"] = schoolCode
    elif user_role == UserRole.SCHOOL_ADMIN:
        # Admin can only see users in their school
        query["school_code"] = current_user.get("school_code")
    elif user_role == UserRole.TEACHER:
        # Teachers can only see students assigned to them
        query["school_code"] = current_user.get("school_code")
        if role == "STUDENT":
            query["teacher_code"] = current_user.get("teacher_code")
    
    if teacherCode and user_role != UserRole.TEACHER:
        query["teacher_code"] = teacherCode
    
    if lastUserId:
        query["id"] = {"$gt": lastUserId}
    
    # Add search filter if provided
    if search and search.strip():
        search_term = search.strip()
        search_conditions = [
            {"name": {"$regex": f".*{re.escape(search_term)}.*", "$options": "i"}},
            {"email": {"$regex": f".*{re.escape(search_term)}.*", "$options": "i"}},
            {"school_code": {"$regex": f".*{re.escape(search_term)}.*", "$options": "i"}},
            {"teacher_code": {"$regex": f".*{re.escape(search_term)}.*", "$options": "i"}},
            {"student_code": {"$regex": f".*{re.escape(search_term)}.*", "$options": "i"}},
            {"city": {"$regex": f".*{re.escape(search_term)}.*", "$options": "i"}},
            {"state": {"$regex": f".*{re.escape(search_term)}.*", "$options": "i"}},
        ]
        query = {"$and": [query, {"$or": search_conditions}]}
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).limit(limit).to_list(limit)
    
    # Get school names for users
    school_codes = list(set([u.get("school_code") for u in users if u.get("school_code")]))
    school_names = {}
    if school_codes:
        schools = await db.users.find(
            {"role": "SCHOOL_ADMIN", "school_code": {"$in": school_codes}},
            {"_id": 0, "school_code": 1, "name": 1, "school_name": 1}
        ).to_list(len(school_codes))
        for school in schools:
            code = school.get("school_code")
            school_names[code] = school.get("school_name") or school.get("name") or ""
    
    # Get teacher names for students
    teacher_codes = list(set([u.get("teacher_code") for u in users if u.get("teacher_code") and u.get("role") == "STUDENT"]))
    teacher_names = {}
    if teacher_codes:
        teachers = await db.users.find(
            {"role": "TEACHER", "teacher_code": {"$in": teacher_codes}},
            {"_id": 0, "teacher_code": 1, "name": 1}
        ).to_list(len(teacher_codes))
        for teacher in teachers:
            code = teacher.get("teacher_code")
            teacher_names[code] = teacher.get("name") or ""
    
    # Get student counts for teachers
    teacher_student_counts = {}
    if role == "TEACHER":
        teacher_codes_for_counts = [u.get("teacher_code") for u in users if u.get("teacher_code")]
        if teacher_codes_for_counts:
            # Use aggregation to count students per teacher
            pipeline = [
                {"$match": {"role": "STUDENT", "teacher_code": {"$in": teacher_codes_for_counts}}},
                {"$group": {"_id": "$teacher_code", "count": {"$sum": 1}}}
            ]
            student_counts = await db.users.aggregate(pipeline).to_list(None)
            for item in student_counts:
                teacher_student_counts[item["_id"]] = item["count"]
    
    # Get teacher and student counts for SCHOOL_ADMIN (schools)
    school_teacher_counts = {}
    school_student_counts = {}
    if role == "SCHOOL_ADMIN":
        school_codes_for_counts = [u.get("school_code") for u in users if u.get("school_code")]
        if school_codes_for_counts:
            # Count teachers per school
            teacher_pipeline = [
                {"$match": {"role": "TEACHER", "school_code": {"$in": school_codes_for_counts}}},
                {"$group": {"_id": "$school_code", "count": {"$sum": 1}}}
            ]
            teacher_count_results = await db.users.aggregate(teacher_pipeline).to_list(None)
            for item in teacher_count_results:
                school_teacher_counts[item["_id"]] = item["count"]
            
            # Count students per school
            student_pipeline = [
                {"$match": {"role": "STUDENT", "school_code": {"$in": school_codes_for_counts}}},
                {"$group": {"_id": "$school_code", "count": {"$sum": 1}}}
            ]
            student_count_results = await db.users.aggregate(student_pipeline).to_list(None)
            for item in student_count_results:
                school_student_counts[item["_id"]] = item["count"]
    
    # Transform to frontend expected format (camelCase)
    transformed_users = []
    for user in users:
        # Helper function to safely get string values (handle NaN/None)
        def safe_str(val):
            if val is None or (isinstance(val, float) and str(val).lower() == 'nan'):
                return None
            str_val = str(val).strip() if val else None
            return str_val if str_val and str_val.lower() != 'nan' else None
        
        user_data = {
            "userId": user.get("id"),
            "id": user.get("id"),
            "email": safe_str(user.get("email")),
            "emailId": safe_str(user.get("email")),
            "name": safe_str(user.get("name")),
            "mobileNumber": safe_str(user.get("mobile_number")),
            "role": user.get("role"),
            "schoolCode": safe_str(user.get("school_code")),
            "schoolName": safe_str(user.get("school_name")) or school_names.get(user.get("school_code"), ""),
            "teacherCode": safe_str(user.get("teacher_code")),
            "teacherName": teacher_names.get(user.get("teacher_code"), "") if user.get("role") == "STUDENT" else "",
            "studentCode": safe_str(user.get("student_code")),
            "studentCount": teacher_student_counts.get(user.get("teacher_code"), 0) if user.get("role") == "TEACHER" else 0,
            "teachersEnrolled": school_teacher_counts.get(user.get("school_code"), 0) if user.get("role") == "SCHOOL_ADMIN" else 0,
            "studentsEnrolled": school_student_counts.get(user.get("school_code"), 0) if user.get("role") == "SCHOOL_ADMIN" else 0,
            "principalName": safe_str(user.get("principal_name")),
            "credits": user.get("credits", 0),
            "disabled": user.get("disabled", False),
            "className": safe_str(user.get("class_name")),
            "sectionName": safe_str(user.get("section_name")),
            "rollNumber": safe_str(user.get("roll_number")),
            "fatherName": safe_str(user.get("father_name")),
            "city": safe_str(user.get("city")),
            "state": safe_str(user.get("state")),
            "address": safe_str(user.get("address")),
            "postalCode": safe_str(user.get("postal_code")),
            "createdAt": user.get("created_at")
        }
        transformed_users.append(user_data)
    
    return {
        "data": {
            "users": transformed_users,
            "count": len(transformed_users),
            "lastUserId": users[-1]["id"] if users else None
        }
    }

@users_router.get("/search")
async def search_users(
    query: str = Query(..., min_length=1),
    role: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user)
):
    """
    Robust search for users - searches across name, email, mobile, school_code, teacher_code, student_code.
    Supports partial matching, case-insensitive search.
    """
    user_role = current_user.get("role")
    if user_role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    search_query = query.strip().lower()
    
    # Build search conditions - search across multiple fields
    or_conditions = [
        {"name": {"$regex": f".*{re.escape(search_query)}.*", "$options": "i"}},
        {"email": {"$regex": f".*{re.escape(search_query)}.*", "$options": "i"}},
        {"mobile_number": {"$regex": f".*{re.escape(search_query)}.*", "$options": "i"}},
        {"school_code": {"$regex": f".*{re.escape(search_query)}.*", "$options": "i"}},
        {"teacher_code": {"$regex": f".*{re.escape(search_query)}.*", "$options": "i"}},
        {"student_code": {"$regex": f".*{re.escape(search_query)}.*", "$options": "i"}},
        {"class_name": {"$regex": f".*{re.escape(search_query)}.*", "$options": "i"}},
        {"section_name": {"$regex": f".*{re.escape(search_query)}.*", "$options": "i"}},
        {"city": {"$regex": f".*{re.escape(search_query)}.*", "$options": "i"}},
        {"state": {"$regex": f".*{re.escape(search_query)}.*", "$options": "i"}},
        {"father_name": {"$regex": f".*{re.escape(search_query)}.*", "$options": "i"}},
        {"principal_name": {"$regex": f".*{re.escape(search_query)}.*", "$options": "i"}},
        {"address": {"$regex": f".*{re.escape(search_query)}.*", "$options": "i"}},
    ]
    
    db_query = {"$or": or_conditions}
    
    # Filter by role if specified
    if role:
        db_query["role"] = role
    
    # Filter by school for non-super-admins
    if user_role != UserRole.SUPER_ADMIN:
        db_query["school_code"] = current_user.get("school_code")
    
    users = await db.users.find(db_query, {"_id": 0, "password_hash": 0}).limit(limit).to_list(limit)
    
    # Get school names and principal names for users
    school_codes = list(set([u.get("school_code") for u in users if u.get("school_code")]))
    school_names = {}
    school_principals = {}
    if school_codes:
        # Get school info from schools collection
        schools_info = await db.schools.find(
            {"code": {"$in": school_codes}},
            {"_id": 0, "code": 1, "name": 1, "principal_name": 1}
        ).to_list(len(school_codes))
        for school in schools_info:
            code = school.get("code")
            school_names[code] = school.get("name") or ""
            school_principals[code] = school.get("principal_name") or ""
        
        # Also check users collection for school_name (fallback)
        if not school_names:
            schools = await db.users.find(
                {"role": "SCHOOL_ADMIN", "school_code": {"$in": school_codes}},
                {"_id": 0, "school_code": 1, "name": 1, "school_name": 1}
            ).to_list(len(school_codes))
            for school in schools:
                code = school.get("school_code")
                if code not in school_names or not school_names[code]:
                    school_names[code] = school.get("school_name") or school.get("name") or ""
    
    # Transform to frontend expected format
    results = []
    
    # Get teacher/student counts for SCHOOL_ADMIN users
    school_codes_for_counts = [u.get("school_code") for u in users if u.get("role") == "SCHOOL_ADMIN" and u.get("school_code")]
    teacher_counts = {}
    student_counts = {}
    if school_codes_for_counts:
        # Get teacher counts per school
        teacher_pipeline = [
            {"$match": {"role": "TEACHER", "school_code": {"$in": school_codes_for_counts}}},
            {"$group": {"_id": "$school_code", "count": {"$sum": 1}}}
        ]
        teacher_count_results = await db.users.aggregate(teacher_pipeline).to_list(None)
        for item in teacher_count_results:
            teacher_counts[item["_id"]] = item["count"]
        
        # Get student counts per school
        student_pipeline = [
            {"$match": {"role": "STUDENT", "school_code": {"$in": school_codes_for_counts}}},
            {"$group": {"_id": "$school_code", "count": {"$sum": 1}}}
        ]
        student_count_results = await db.users.aggregate(student_pipeline).to_list(None)
        for item in student_count_results:
            student_counts[item["_id"]] = item["count"]
    
    for user in users:
        user_data = {
            "id": user.get("id"),
            "userId": user.get("id"),
            "name": user.get("name"),
            "email": user.get("email"),
            "mobileNumber": user.get("mobile_number"),
            "role": user.get("role"),
            "schoolCode": user.get("school_code"),
            "schoolName": user.get("school_name") or school_names.get(user.get("school_code"), ""),
            "teacherCode": user.get("teacher_code"),
            "studentCode": user.get("student_code"),
            "className": user.get("class_name"),
            "sectionName": user.get("section_name"),
            "rollNumber": user.get("roll_number"),
            "fatherName": user.get("father_name"),
            "principalName": user.get("principal_name") or school_principals.get(user.get("school_code"), ""),
            "city": user.get("city"),
            "state": user.get("state"),
            "address": user.get("address"),
            "postalCode": user.get("postal_code"),
            "credits": user.get("credits", 0),
            "disabled": user.get("disabled", False),
            "createdAt": user.get("created_at"),
            "registrationType": user.get("registration_type", "self_registered")
        }
        
        # Add teacher/student counts for schools
        if user.get("role") == "SCHOOL_ADMIN":
            user_data["teachersEnrolled"] = teacher_counts.get(user.get("school_code"), 0)
            user_data["studentsEnrolled"] = student_counts.get(user.get("school_code"), 0)
        
        results.append(user_data)
    
    return {
        "users": results,
        "count": len(results),
        "query": query
    }

@users_router.get("/semantic-search")
async def semantic_search_users(
    query: str = Query(..., min_length=1),
    role: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user)
):
    """
    Enhanced semantic search for users - searches with fuzzy matching, synonyms, and partial words.
    Supports searching by name, code, class, section, roll number with intelligent matching.
    """
    user_role = current_user.get("role")
    if user_role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    search_query = query.strip()
    search_terms = search_query.lower().split()
    
    # Build comprehensive search conditions with multiple matching strategies
    or_conditions = []
    
    for term in search_terms:
        escaped_term = re.escape(term)
        # Exact partial match
        or_conditions.extend([
            {"name": {"$regex": f".*{escaped_term}.*", "$options": "i"}},
            {"email": {"$regex": f".*{escaped_term}.*", "$options": "i"}},
            {"mobile_number": {"$regex": f".*{escaped_term}.*", "$options": "i"}},
            {"school_code": {"$regex": f".*{escaped_term}.*", "$options": "i"}},
            {"teacher_code": {"$regex": f".*{escaped_term}.*", "$options": "i"}},
            {"student_code": {"$regex": f".*{escaped_term}.*", "$options": "i"}},
            {"class_name": {"$regex": f".*{escaped_term}.*", "$options": "i"}},
            {"section_name": {"$regex": f".*{escaped_term}.*", "$options": "i"}},
            {"roll_number": {"$regex": f".*{escaped_term}.*", "$options": "i"}},
            {"city": {"$regex": f".*{escaped_term}.*", "$options": "i"}},
            {"father_name": {"$regex": f".*{escaped_term}.*", "$options": "i"}},
        ])
        
        # Fuzzy matching - allow character variations
        if len(term) >= 3:
            # Match even with 1 character difference
            fuzzy_pattern = ".*".join(list(term))
            or_conditions.extend([
                {"name": {"$regex": f".*{fuzzy_pattern}.*", "$options": "i"}},
                {"school_code": {"$regex": f".*{fuzzy_pattern}.*", "$options": "i"}},
                {"teacher_code": {"$regex": f".*{fuzzy_pattern}.*", "$options": "i"}},
                {"student_code": {"$regex": f".*{fuzzy_pattern}.*", "$options": "i"}},
            ])
    
    # Handle class search patterns (e.g., "class 1", "1st", "class-1")
    class_patterns = re.findall(r'(?:class[-\s]?)?(\d+)(?:st|nd|rd|th)?', search_query.lower())
    for class_num in class_patterns:
        or_conditions.extend([
            {"class_name": {"$regex": f".*{class_num}.*", "$options": "i"}},
            {"class_name": {"$regex": f"class.*{class_num}.*", "$options": "i"}},
        ])
    
    db_query = {"$or": or_conditions}
    
    # Filter by role if specified
    if role:
        db_query = {"$and": [db_query, {"role": role}]}
    
    # Filter by school for non-super-admins
    if user_role == UserRole.SCHOOL_ADMIN:
        db_query = {"$and": [db_query, {"school_code": current_user.get("school_code")}]}
    elif user_role == UserRole.TEACHER:
        # Teachers can only see their students
        db_query = {"$and": [db_query, {"teacher_code": current_user.get("teacher_code")}]}
    
    users = await db.users.find(db_query, {"_id": 0, "password_hash": 0}).limit(limit).to_list(limit)
    
    # Get school and teacher names
    school_codes = list(set([u.get("school_code") for u in users if u.get("school_code")]))
    teacher_codes = list(set([u.get("teacher_code") for u in users if u.get("teacher_code")]))
    
    school_names = {}
    teacher_names = {}
    
    if school_codes:
        schools = await db.users.find(
            {"role": "SCHOOL_ADMIN", "school_code": {"$in": school_codes}},
            {"_id": 0, "school_code": 1, "name": 1}
        ).to_list(len(school_codes))
        for school in schools:
            school_names[school.get("school_code")] = school.get("name", "")
    
    if teacher_codes:
        teachers = await db.users.find(
            {"role": "TEACHER", "teacher_code": {"$in": teacher_codes}},
            {"_id": 0, "teacher_code": 1, "name": 1}
        ).to_list(len(teacher_codes))
        for teacher in teachers:
            teacher_names[teacher.get("teacher_code")] = teacher.get("name", "")
    
    # Transform and score results
    results = []
    for user in users:
        score = 0
        user_str = f"{user.get('name', '')} {user.get('email', '')} {user.get('school_code', '')} {user.get('teacher_code', '')} {user.get('student_code', '')}".lower()
        for term in search_terms:
            if term in user_str:
                score += 10
            elif any(term in word for word in user_str.split()):
                score += 5
        
        results.append({
            "id": user.get("id"),
            "name": user.get("name"),
            "email": user.get("email"),
            "mobileNumber": user.get("mobile_number"),
            "role": user.get("role"),
            "schoolCode": user.get("school_code"),
            "schoolName": school_names.get(user.get("school_code"), ""),
            "teacherCode": user.get("teacher_code"),
            "teacherName": teacher_names.get(user.get("teacher_code"), ""),
            "studentCode": user.get("student_code"),
            "className": user.get("class_name"),
            "sectionName": user.get("section_name"),
            "rollNumber": user.get("roll_number"),
            "fatherName": user.get("father_name"),
            "city": user.get("city"),
            "state": user.get("state"),
            "address": user.get("address"),
            "postalCode": user.get("postal_code"),
            "credits": user.get("credits", 0),
            "disabled": user.get("disabled", False),
            "createdAt": user.get("created_at"),
            "_score": score
        })
    
    # Sort by relevance score
    results.sort(key=lambda x: x.get("_score", 0), reverse=True)
    
    return {
        "users": results,
        "count": len(results),
        "query": query
    }

@users_router.put("/manage")
async def manage_user(
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Edit or delete user - with role-based permissions:
    - Super Admin: can edit/delete admin, teacher, student
    - School Admin: can edit/delete teacher, student (in their school)
    - Teacher: can edit/delete student (their students only)
    """
    user_role = current_user.get("role")
    action = body.get("action")  # "edit" or "delete"
    target_user_id = body.get("userId")
    
    if not target_user_id:
        raise HTTPException(status_code=400, detail="userId is required")
    
    if action not in ["edit", "delete"]:
        raise HTTPException(status_code=400, detail="action must be 'edit' or 'delete'")
    
    # Get target user
    target_user = await db.users.find_one({"id": target_user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    target_role = target_user.get("role")
    
    # Permission matrix
    allowed_targets = {
        UserRole.SUPER_ADMIN: [UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT, UserRole.INDIVIDUAL],
        UserRole.SCHOOL_ADMIN: [UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT],
        UserRole.TEACHER: [UserRole.STUDENT]
    }
    
    if user_role not in allowed_targets:
        raise HTTPException(status_code=403, detail="You don't have permission to manage users")
    
    if target_role not in allowed_targets.get(user_role, []):
        raise HTTPException(status_code=403, detail=f"You cannot manage {target_role} users")
    
    # School scope check for non-super-admins
    if user_role == UserRole.SCHOOL_ADMIN:
        if target_user.get("school_code") != current_user.get("school_code"):
            raise HTTPException(status_code=403, detail="You can only manage users in your school")
    
    # Teacher scope check
    if user_role == UserRole.TEACHER:
        if target_user.get("teacher_code") != current_user.get("teacher_code"):
            raise HTTPException(status_code=403, detail="You can only manage your own students")
    
    if action == "delete":
        await db.users.delete_one({"id": target_user_id})
        logger.info(f"User {target_user_id} deleted by {current_user.get('id')}")
        return {"message": "User deleted successfully", "deletedUserId": target_user_id}
    
    # Edit action
    update_data = body.get("data", {})
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    # Fields that can be updated
    allowed_fields = [
        "name", "mobile_number", "mobileNumber", "address", "city", "state", 
        "postal_code", "postalCode", "class_name", "className", "section_name", 
        "sectionName", "roll_number", "rollNumber", "father_name", "fatherName",
        "credits", "disabled"
    ]
    
    # Super admin can also update codes
    if user_role == UserRole.SUPER_ADMIN:
        allowed_fields.extend(["school_code", "schoolCode", "teacher_code", "teacherCode"])
    
    # Filter and convert field names
    clean_update = {}
    field_map = {
        "mobileNumber": "mobile_number",
        "postalCode": "postal_code",
        "className": "class_name",
        "sectionName": "section_name",
        "rollNumber": "roll_number",
        "fatherName": "father_name",
        "schoolCode": "school_code",
        "teacherCode": "teacher_code"
    }
    
    for key, value in update_data.items():
        if key in allowed_fields:
            db_key = field_map.get(key, key)
            clean_update[db_key] = value
    
    if not clean_update:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    clean_update["updated_at"] = datetime.now(timezone.utc).isoformat()
    clean_update["updated_by"] = current_user.get("id")
    
    await db.users.update_one(
        {"id": target_user_id},
        {"$set": clean_update}
    )
    
    updated_user = await db.users.find_one({"id": target_user_id}, {"_id": 0, "password_hash": 0})
    
    logger.info(f"User {target_user_id} updated by {current_user.get('id')}")
    
    return {
        "message": "User updated successfully",
        "user": {
            "id": updated_user.get("id"),
            "name": updated_user.get("name"),
            "email": updated_user.get("email"),
            "mobileNumber": updated_user.get("mobile_number"),
            "role": updated_user.get("role"),
            "schoolCode": updated_user.get("school_code"),
            "teacherCode": updated_user.get("teacher_code"),
            "studentCode": updated_user.get("student_code"),
            "className": updated_user.get("class_name"),
            "sectionName": updated_user.get("section_name"),
            "rollNumber": updated_user.get("roll_number"),
            "credits": updated_user.get("credits", 0)
        }
    }

@users_router.get("/details/{user_id}")
async def get_user_details_by_id(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get full details of a specific user - with role-based access"""
    user_role = current_user.get("role")
    
    target_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Permission check
    if user_role == UserRole.SCHOOL_ADMIN:
        if target_user.get("school_code") != current_user.get("school_code"):
            raise HTTPException(status_code=403, detail="Access denied")
    elif user_role == UserRole.TEACHER:
        if target_user.get("teacher_code") != current_user.get("teacher_code") and target_user.get("id") != current_user.get("id"):
            raise HTTPException(status_code=403, detail="Access denied")
    elif user_role not in [UserRole.SUPER_ADMIN]:
        if target_user.get("id") != current_user.get("id"):
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Get school name
    school_name = ""
    if target_user.get("school_code"):
        school = await db.users.find_one(
            {"role": "SCHOOL_ADMIN", "school_code": target_user.get("school_code")},
            {"_id": 0, "name": 1}
        )
        if school:
            school_name = school.get("name", "")
    
    # Get teacher name
    teacher_name = ""
    if target_user.get("teacher_code"):
        teacher = await db.users.find_one(
            {"role": "TEACHER", "teacher_code": target_user.get("teacher_code")},
            {"_id": 0, "name": 1}
        )
        if teacher:
            teacher_name = teacher.get("name", "")
    
    return {
        "id": target_user.get("id"),
        "name": target_user.get("name"),
        "email": target_user.get("email"),
        "mobileNumber": target_user.get("mobile_number"),
        "role": target_user.get("role"),
        "schoolCode": target_user.get("school_code"),
        "schoolName": school_name,
        "teacherCode": target_user.get("teacher_code"),
        "teacherName": teacher_name,
        "studentCode": target_user.get("student_code"),
        "className": target_user.get("class_name"),
        "sectionName": target_user.get("section_name"),
        "rollNumber": target_user.get("roll_number"),
        "fatherName": target_user.get("father_name"),
        "address": target_user.get("address"),
        "city": target_user.get("city"),
        "state": target_user.get("state"),
        "postalCode": target_user.get("postal_code"),
        "credits": target_user.get("credits", 0),
        "disabled": target_user.get("disabled", False),
        "createdAt": target_user.get("created_at"),
        "registrationType": target_user.get("registration_type")
    }

@users_router.get("/admin/list-all")
async def list_all_users_for_admin(
    role: Optional[str] = None,
    school_code: Optional[str] = None,
    teacher_code: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user)
):
    """List all users with full details for admin dashboard"""
    user_role = current_user.get("role")
    
    if user_role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {}
    
    # Filter by role
    if role:
        query["role"] = role
    
    # Scope based on user role
    if user_role == UserRole.SCHOOL_ADMIN:
        query["school_code"] = current_user.get("school_code")
        if not role:
            query["role"] = {"$in": [UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT]}
    elif user_role == UserRole.TEACHER:
        query["teacher_code"] = current_user.get("teacher_code")
        query["role"] = UserRole.STUDENT
    
    # Additional filters
    if school_code and user_role == UserRole.SUPER_ADMIN:
        query["school_code"] = school_code
    if teacher_code:
        query["teacher_code"] = teacher_code
    
    skip = (page - 1) * limit
    total = await db.users.count_documents(query)
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Get all school and teacher names
    school_codes = list(set([u.get("school_code") for u in users if u.get("school_code")]))
    teacher_codes = list(set([u.get("teacher_code") for u in users if u.get("teacher_code")]))
    
    school_names = {}
    teacher_names = {}
    
    if school_codes:
        schools = await db.users.find(
            {"role": "SCHOOL_ADMIN", "school_code": {"$in": school_codes}},
            {"_id": 0, "school_code": 1, "name": 1}
        ).to_list(len(school_codes))
        for school in schools:
            school_names[school.get("school_code")] = school.get("name", "")
    
    if teacher_codes:
        teachers = await db.users.find(
            {"role": "TEACHER", "teacher_code": {"$in": teacher_codes}},
            {"_id": 0, "teacher_code": 1, "name": 1}
        ).to_list(len(teacher_codes))
        for teacher in teachers:
            teacher_names[teacher.get("teacher_code")] = teacher.get("name", "")
    
    results = []
    for user in users:
        results.append({
            "id": user.get("id"),
            "name": user.get("name"),
            "email": user.get("email"),
            "mobileNumber": user.get("mobile_number"),
            "role": user.get("role"),
            "schoolCode": user.get("school_code"),
            "schoolName": school_names.get(user.get("school_code"), ""),
            "teacherCode": user.get("teacher_code"),
            "teacherName": teacher_names.get(user.get("teacher_code"), ""),
            "studentCode": user.get("student_code"),
            "className": user.get("class_name"),
            "sectionName": user.get("section_name"),
            "rollNumber": user.get("roll_number"),
            "fatherName": user.get("father_name"),
            "address": user.get("address"),
            "city": user.get("city"),
            "state": user.get("state"),
            "postalCode": user.get("postal_code"),
            "credits": user.get("credits", 0),
            "disabled": user.get("disabled", False),
            "createdAt": user.get("created_at")
        })
    
    return {
        "users": results,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": (total + limit - 1) // limit
    }

@users_router.post("/add")
async def add_user(
    request: UserRegisterRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Add a new user (admin/school/teacher only)"""
    user_role = current_user.get("role")
    
    if user_role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Validate mandatory fields based on role being added
    if request.user_role == UserRole.STUDENT:
        # Students MUST have school_code and teacher_code
        if user_role == UserRole.SUPER_ADMIN:
            # Super Admin adding student must provide school_code and teacher_code
            if not request.school_code:
                raise HTTPException(status_code=400, detail="School Code is required for students")
            if not request.teacher_code:
                raise HTTPException(status_code=400, detail="Teacher Code is required for students")
            # Validate school code exists
            school_exists = await db.users.find_one({"school_code": request.school_code, "role": UserRole.SCHOOL_ADMIN})
            if not school_exists:
                raise HTTPException(status_code=400, detail=f"School with code '{request.school_code}' not found")
            # Validate teacher code exists
            teacher_exists = await db.users.find_one({"teacher_code": request.teacher_code, "role": UserRole.TEACHER})
            if not teacher_exists:
                raise HTTPException(status_code=400, detail=f"Teacher with code '{request.teacher_code}' not found")
    
    if request.user_role == UserRole.TEACHER:
        # Teachers MUST have school_code
        if user_role == UserRole.SUPER_ADMIN and not request.school_code:
            raise HTTPException(status_code=400, detail="School Code is required for teachers")
    
    # Set school code from current user for non-super-admins
    if user_role != UserRole.SUPER_ADMIN:
        request.school_code = current_user.get("school_code")
    
    # Permission checks
    if user_role == UserRole.SCHOOL_ADMIN:
        if request.user_role not in [UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT]:
            raise HTTPException(status_code=403, detail="Admins can only add school staff and students")
    
    # Note: UserRole.SCHOOL doesn't exist - schools use SCHOOL_ADMIN role
    # This check is redundant as SCHOOL_ADMIN is already handled above
    
    if user_role == UserRole.TEACHER:
        if request.user_role != UserRole.STUDENT:
            raise HTTPException(status_code=403, detail="Teachers can only add students")
        request.school_code = current_user.get("school_code")
        request.teacher_code = current_user.get("teacher_code")
    
    # Auto-generate password
    request.password = None  # Will be auto-generated
    
    result = await register(request, background_tasks)
    
    await db.users.update_one(
        {"id": result["userId"]},
        {"$set": {"added_by": current_user["id"]}}
    )
    
    # Add extra info for admin
    result["addedBy"] = current_user["id"]
    
    return result

@users_router.patch("/updateCredits")
async def update_credits(
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user credits - with transfer logic for admins"""
    user_role = current_user.get("role")
    admin_id = current_user.get("id")
    
    if user_role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    user_id = body.get("userId")
    credits = body.get("credits")
    action = body.get("action", "set")  # "add", "remove", or "set"
    
    if not user_id or credits is None:
        raise HTTPException(status_code=400, detail="userId and credits are required")
    
    # Validate credits is a positive number
    try:
        credits = int(credits)
        if credits < 0:
            raise HTTPException(status_code=400, detail="Credits cannot be negative")
    except ValueError:
        raise HTTPException(status_code=400, detail="Credits must be a valid number")
    
    # Get target user
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    current_credits = target_user.get("credits", 0)
    
    # Super Admin has unlimited credits - no deduction from their account
    if user_role == UserRole.SUPER_ADMIN:
        if action == "add":
            new_credits = current_credits + credits
        elif action == "remove":
            new_credits = current_credits - credits
            if new_credits < 0:
                return {
                    "success": False,
                    "message": f"Cannot remove {credits} credits. User only has {current_credits} credits. Please enter {current_credits} or less.",
                    "user_credits": current_credits
                }
        else:  # "set"
            new_credits = credits
        
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"credits": new_credits}}
        )
        
        return {
            "success": True,
            "message": "Credits updated successfully",
            "new_credits": new_credits,
            "admin_credits": -1  # -1 indicates unlimited
        }
    
    # For School Admin or Teacher - credits are transferred from their account
    admin_user = await db.users.find_one({"id": admin_id})
    admin_credits = admin_user.get("credits", 0)
    
    if action == "add":
        # Check if admin has enough credits to transfer
        if admin_credits < credits:
            return {
                "success": False,
                "message": f"Insufficient credits. You have {admin_credits} credits but trying to transfer {credits}. Please purchase more credits from Super Admin.",
                "admin_credits": admin_credits
            }
        
        new_credits = current_credits + credits
        
        # Deduct from admin's account
        await db.users.update_one(
            {"id": admin_id},
            {"$set": {"credits": admin_credits - credits}}
        )
    elif action == "remove":
        new_credits = current_credits - credits
        if new_credits < 0:
            return {
                "success": False,
                "message": f"Cannot remove {credits} credits. User only has {current_credits} credits. Please enter {current_credits} or less.",
                "admin_credits": admin_credits,
                "user_credits": current_credits
            }
        
        # Add back to admin's account
        await db.users.update_one(
            {"id": admin_id},
            {"$set": {"credits": admin_credits + credits}}
        )
    else:  # "set"
        diff = credits - current_credits
        if diff > 0:  # Adding credits
            if admin_credits < diff:
                return {
                    "success": False,
                    "message": f"Insufficient credits. You have {admin_credits} credits but need {diff} more to set user credits to {credits}.",
                    "admin_credits": admin_credits
                }
            await db.users.update_one(
                {"id": admin_id},
                {"$set": {"credits": admin_credits - diff}}
            )
        elif diff < 0:  # Removing credits
            await db.users.update_one(
                {"id": admin_id},
                {"$set": {"credits": admin_credits + abs(diff)}}
            )
        new_credits = credits
    
    # Ensure credits don't go below 0
    if new_credits < 0:
        raise HTTPException(status_code=400, detail="Credits cannot be negative")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"credits": new_credits}}
    )
    
    # Get updated admin credits
    updated_admin = await db.users.find_one({"id": admin_id})
    
    return {
        "success": True,
        "message": "Credits updated successfully",
        "new_credits": new_credits,
        "admin_credits": updated_admin.get("credits", 0)
    }

@users_router.post("/purchaseCredits")
async def purchase_credits(
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """School Admin request to purchase credits from Super Admin"""
    user_role = current_user.get("role")
    user_id = current_user.get("id")
    
    if user_role != UserRole.SCHOOL_ADMIN:
        raise HTTPException(status_code=403, detail="Only School Admins can purchase credits")
    
    credits_requested = body.get("credits", 0)
    if credits_requested <= 0:
        raise HTTPException(status_code=400, detail="Credits must be positive")
    
    # Create a credit purchase request
    request_data = {
        "id": str(uuid.uuid4()),
        "requester_id": user_id,
        "requester_name": current_user.get("name"),
        "requester_email": current_user.get("email"),
        "school_code": current_user.get("school_code"),
        "credits_requested": credits_requested,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.credit_requests.insert_one(request_data)
    
    return {
        "success": True,
        "message": f"Credit purchase request for {credits_requested} credits has been submitted. Super Admin will review and approve.",
        "request_id": request_data["id"]
    }

@users_router.get("/creditRequests")
async def get_credit_requests(
    current_user: dict = Depends(get_current_user)
):
    """Get pending credit requests - Super Admin only"""
    user_role = current_user.get("role")
    
    if user_role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super Admin access required")
    
    requests = await db.credit_requests.find({"status": "pending"}, {"_id": 0}).to_list(100)
    return {"requests": requests}

@users_router.post("/approveCreditRequest")
async def approve_credit_request(
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """Approve a credit purchase request - Super Admin only"""
    user_role = current_user.get("role")
    
    if user_role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super Admin access required")
    
    request_id = body.get("requestId")
    approved = body.get("approved", True)
    
    if not request_id:
        raise HTTPException(status_code=400, detail="requestId is required")
    
    credit_request = await db.credit_requests.find_one({"id": request_id})
    if not credit_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if approved:
        # Add credits to requester
        requester_id = credit_request["requester_id"]
        credits = credit_request["credits_requested"]
        
        await db.users.update_one(
            {"id": requester_id},
            {"$inc": {"credits": credits}}
        )
        
        await db.credit_requests.update_one(
            {"id": request_id},
            {"$set": {
                "status": "approved",
                "approved_by": current_user["id"],
                "approved_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {"success": True, "message": f"Approved {credits} credits for {credit_request['requester_name']}"}
    else:
        await db.credit_requests.update_one(
            {"id": request_id},
            {"$set": {
                "status": "rejected",
                "rejected_by": current_user["id"],
                "rejected_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return {"success": True, "message": "Credit request rejected"}

@users_router.get("/checkCredits")
async def check_credits(current_user: dict = Depends(get_current_user)):
    """Check user's credit balance and subscription status"""
    user_id = current_user.get("id")
    user_role = current_user.get("role")
    
    # Super Admin has unlimited credits - no subscription page needed
    if user_role == UserRole.SUPER_ADMIN:
        return {
            "credits": -1,  # -1 indicates unlimited
            "isUnlimited": True,
            "subscriptionStatus": "unlimited",
            "needsSubscription": False,
            "message": "Unlimited credits",
            "canAccessSubscription": False,  # Super Admin doesn't need subscription page
            "showCreditsInNavbar": False
        }
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    credits = user.get("credits", 0)
    subscription_status = user.get("subscription_status", "free")
    registration_type = user.get("registration_type", "self_registered")  # Default to self_registered for existing users
    
    # Determine if user can access subscription page
    # School Admin: Always can access
    # Teacher/Student: Only if self-registered
    can_access_subscription = False
    if user_role == UserRole.SCHOOL_ADMIN:
        can_access_subscription = True
    elif user_role in [UserRole.TEACHER, UserRole.STUDENT]:
        can_access_subscription = registration_type == "self_registered"
    
    # Determine warning level
    warning_message = None
    warning_level = None
    
    if credits <= 0:
        warning_level = "critical"
        if user_role == UserRole.SCHOOL_ADMIN:
            warning_message = "You have 0 credits. Please purchase more credits from Super Admin."
        elif can_access_subscription:
            warning_message = "You have 0 credits. Please subscribe to get more credits."
        else:
            warning_message = "You have 0 credits. Please contact your School Admin to get more credits."
    elif credits <= 10:
        warning_level = "critical"
        warning_message = f"Only {credits} credits remaining. Credits are running low!"
    elif credits <= 25:
        warning_level = "warning"
        warning_message = f"You have {credits} credits remaining."
    
    # Determine current plan based on credits or subscription status
    current_plan = None
    if subscription_status == "enterprise" or credits >= 2000:
        current_plan = "enterprise"
    elif subscription_status == "premium" or credits >= 500:
        current_plan = "premium"
    elif subscription_status == "basic" or credits >= 100:
        current_plan = "basic"
    
    return {
        "credits": credits,
        "isUnlimited": False,
        "subscriptionStatus": subscription_status,
        "needsSubscription": credits <= 0,
        "message": warning_message or f"You have {credits} credits available",
        "warningLevel": warning_level,
        "canPurchase": user_role == UserRole.SCHOOL_ADMIN,
        "canAccessSubscription": can_access_subscription,
        "showCreditsInNavbar": True,
        "registrationType": registration_type,
        "currentPlan": current_plan
    }

@users_router.get("/subscription-history")
async def get_subscription_history(current_user: dict = Depends(get_current_user)):
    """Get user's subscription/payment history"""
    user_id = current_user.get("id")
    
    try:
        # Fetch payment history from payments collection
        payments = await db.payments.find(
            {"user_id": user_id, "status": "completed"},
            {"_id": 0}
        ).sort("created_at", -1).limit(20).to_list(20)
        
        history = []
        for payment in payments:
            history.append({
                "plan_name": payment.get("plan_name", "Unknown Plan"),
                "amount": payment.get("amount", 0) / 100,  # Convert from paise to rupees
                "credits": payment.get("credits_added", 0),
                "date": payment.get("created_at", ""),
                "status": payment.get("status", "completed"),
                "payment_id": payment.get("razorpay_payment_id", "")
            })
        
        return {"history": history}
    except Exception as e:
        logging.error(f"Error fetching subscription history: {e}")
        return {"history": []}

@users_router.post("/useCredits")
async def use_credits(
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """Deduct credits for using a resource (download, save, print)"""
    user_id = current_user.get("id")
    user_role = current_user.get("role")
    credits_to_use = body.get("credits", 1)
    action_type = body.get("actionType", "general")  # download, save, print
    
    # Super Admin has unlimited credits - no deduction needed
    if user_role == UserRole.SUPER_ADMIN:
        return {
            "success": True,
            "message": "Super Admin has unlimited credits",
            "creditsUsed": 0,
            "remainingCredits": -1,  # -1 indicates unlimited
            "needsSubscription": False,
            "isUnlimited": True
        }
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    current_credits = user.get("credits", 0)
    
    if current_credits < credits_to_use:
        warning_message = "Insufficient credits. "
        if user_role == UserRole.SCHOOL_ADMIN:
            warning_message += "Please purchase more credits from Super Admin."
        else:
            warning_message += "Please contact your School Admin to get more credits."
        
        return {
            "success": False,
            "message": warning_message,
            "needsSubscription": True,
            "currentCredits": current_credits,
            "warningLevel": "critical" if current_credits == 0 else "warning"
        }
    
    new_credits = current_credits - credits_to_use
    credits_used = user.get("credits_used", 0) + credits_to_use
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"credits": new_credits, "credits_used": credits_used}}
    )
    
    # Warning if credits are low
    warning_message = None
    warning_level = None
    if new_credits <= 10:
        warning_level = "critical"
        if user_role == UserRole.SCHOOL_ADMIN:
            warning_message = f"Only {new_credits} credits remaining. Please purchase more credits from Super Admin."
        else:
            warning_message = f"Only {new_credits} credits remaining. Please contact your School Admin for more credits."
    elif new_credits <= 25:
        warning_level = "warning"
        warning_message = f"You have {new_credits} credits remaining."
    
    return {
        "success": True,
        "message": "Credits used successfully",
        "creditsUsed": credits_to_use,
        "remainingCredits": new_credits,
        "needsSubscription": new_credits <= 0,
        "warningMessage": warning_message,
        "warningLevel": warning_level
    }

@users_router.post("/disableAccount")
async def disable_account(
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """Disable/Enable user account"""
    user_role = current_user.get("role")
    
    if user_role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    user_id = body.get("userId")
    disable = body.get("disable", True)
    
    if not user_id:
        raise HTTPException(status_code=400, detail="userId is required")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"disabled": disable}}
    )
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    user["userId"] = user["id"]
    return user

# ============== BULK UPLOAD ROUTES ==============

class BulkSchoolItem(BaseModel):
    """Schema for bulk school upload"""
    school_name: str = Field(min_length=1, max_length=40)
    admin_email: str = Field(max_length=30)
    admin_name: Optional[str] = Field(None, max_length=40)
    mobile_number: Optional[str] = None
    address: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=35)
    state: Optional[str] = Field(None, max_length=35)
    postal_code: Optional[str] = None
    principal_name: Optional[str] = Field(None, max_length=40)
    
    @field_validator('school_name')
    @classmethod
    def validate_school_name(cls, v):
        if v and not re.match(r'^[A-Za-z\s\.\-]+$', v.strip()):
            raise ValueError('School name must contain only alphabets, spaces, dots and hyphens')
        return v.strip() if v else v
    
    @field_validator('admin_name', 'principal_name')
    @classmethod
    def validate_names(cls, v):
        if v and not re.match(r'^[A-Za-z\s]+$', v.strip()):
            raise ValueError('Name must contain only alphabets and spaces')
        return v.strip() if v else v
    
    @field_validator('admin_email')
    @classmethod
    def validate_email(cls, v):
        if v:
            v = v.strip().lower()
            if not re.match(r'^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$', v):
                raise ValueError('Invalid email format')
        return v
    
    @field_validator('mobile_number')
    @classmethod
    def validate_mobile(cls, v):
        if v:
            v = re.sub(r'[\s\-]', '', str(v))
            if not re.match(r'^\d{10}$', v):
                raise ValueError('Mobile number must be exactly 10 digits')
        return v
    
    @field_validator('postal_code')
    @classmethod
    def validate_postal(cls, v):
        if v:
            v = str(v).strip()
            if not re.match(r'^\d{6}$', v):
                raise ValueError('Postal code must be exactly 6 digits')
        return v

class BulkUserItem(BaseModel):
    """Schema for bulk user upload"""
    email: str = Field(max_length=30)
    name: Optional[str] = Field(None, max_length=40)
    role: str  # TEACHER, STUDENT, PARENT
    phone: Optional[str] = None
    school_code: Optional[str] = Field(None, max_length=16)
    address: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=35)
    state: Optional[str] = Field(None, max_length=35)
    postal_code: Optional[str] = None
    # Student specific
    class_name: Optional[str] = Field(None, max_length=10)
    section: Optional[str] = Field(None, max_length=10)
    roll_number: Optional[str] = Field(None, max_length=10)
    father_name: Optional[str] = Field(None, max_length=40)
    teacher_code: Optional[str] = None
    
    @field_validator('name', 'father_name')
    @classmethod
    def validate_names(cls, v):
        if v and not re.match(r'^[A-Za-z\s]+$', v.strip()):
            raise ValueError('Name must contain only alphabets and spaces')
        return v.strip() if v else v
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if v:
            v = v.strip().lower()
            if not re.match(r'^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$', v):
                raise ValueError('Invalid email format')
        return v
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v:
            v = re.sub(r'[\s\-]', '', str(v))
            if not re.match(r'^\d{10}$', v):
                raise ValueError('Phone number must be exactly 10 digits')
        return v
    
    @field_validator('school_code')
    @classmethod
    def validate_school_code(cls, v):
        if v and not re.match(r'^[A-Za-z0-9]+$', v.strip()):
            raise ValueError('School code must be alphanumeric')
        return v.strip() if v else v
    
    @field_validator('postal_code')
    @classmethod
    def validate_postal(cls, v):
        if v:
            v = str(v).strip()
            if not re.match(r'^\d{6}$', v):
                raise ValueError('Postal code must be exactly 6 digits')
        return v
    
    @field_validator('class_name')
    @classmethod
    def validate_class(cls, v):
        if v and not re.match(r'^[A-Za-z0-9\s\-]+$', v.strip()):
            raise ValueError('Class name must be alphanumeric')
        return v.strip() if v else v
    
    @field_validator('section')
    @classmethod
    def validate_section(cls, v):
        if v and not re.match(r'^[A-Za-z]+$', v.strip()):
            raise ValueError('Section must contain only alphabets')
        return v.strip() if v else v
    
    @field_validator('roll_number')
    @classmethod
    def validate_roll(cls, v):
        if v and not re.match(r'^[A-Za-z0-9]+$', str(v).strip()):
            raise ValueError('Roll number must be alphanumeric')
        return str(v).strip() if v else v

@admin_router.post("/bulk-upload/schools")
async def bulk_upload_schools(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_super_admin)
):
    """
    Bulk upload schools from Excel/CSV file.
    Required columns: school_code, school_name, school_email, principal_name, mobile_number
    Optional columns: postal_code, address, city, state
    """
    import pandas as pd
    import io
    import re
    
    content = await file.read()
    
    try:
        # Try Excel first, then CSV - handle NaN values properly
        try:
            df = pd.read_excel(io.BytesIO(content), keep_default_na=False, na_values=[''])
        except:
            df = pd.read_csv(io.BytesIO(content), keep_default_na=False, na_values=[''])
        
        # Replace any remaining NaN values with empty string
        df = df.fillna('')
        
        # Log original columns for debugging
        logger.info(f"Original columns from file: {list(df.columns)}")
        
        # Clean column names - remove asterisks and normalize
        df.columns = [str(c).strip().lower().replace(' ', '_').replace('*', '') for c in df.columns]
        
        # Log cleaned columns for debugging
        logger.info(f"Cleaned columns: {list(df.columns)}")
        
        # Support both old (admin_email) and new (school_email) column names
        if 'admin_email' in df.columns and 'school_email' not in df.columns:
            df = df.rename(columns={'admin_email': 'school_email'})
            logger.info("Renamed admin_email to school_email for backward compatibility")
        
        # Required columns - postal_code is now optional
        required_cols = ['school_code', 'school_name', 'school_email', 'principal_name', 'mobile_number']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            logger.error(f"Missing columns: {missing_cols}. Available: {list(df.columns)}")
            raise HTTPException(status_code=400, detail=f"Missing required columns: {missing_cols}")
        
        # Helper function to validate name fields (only letters and spaces allowed)
        def is_valid_name(name):
            if not name or name.lower() == 'nan':
                return False
            # Allow only letters (including accented), spaces, and common name punctuation like apostrophe
            return bool(re.match(r"^[A-Za-z\s'.-]+$", name))
        
        results = {
            "total": len(df),
            "created": 0,
            "failed": 0,
            "errors": []
        }
        
        for idx, row in df.iterrows():
            try:
                school_code = str(row.get('school_code', '')).strip()
                school_name = str(row.get('school_name', '')).strip()
                school_email = str(row.get('school_email', '')).strip().lower()
                principal_name = str(row.get('principal_name', '')).strip()
                mobile_number = str(row.get('mobile_number', '')).strip()
                postal_code = str(row.get('postal_code', '')).strip() if 'postal_code' in df.columns else ''
                
                # Validate required fields
                if not school_code or school_code.lower() == 'nan':
                    results["failed"] += 1
                    results["errors"].append(f"Row {idx+2}: Invalid or missing school_code")
                    continue
                
                if not school_name or school_name.lower() == 'nan':
                    results["failed"] += 1
                    results["errors"].append(f"Row {idx+2}: Invalid or missing school_name")
                    continue
                
                # Validate school_name - no numeric or special characters
                if not is_valid_name(school_name):
                    results["failed"] += 1
                    results["errors"].append(f"Row {idx+2}: School name should only contain letters and spaces")
                    continue
                
                if not school_email or school_email.lower() == 'nan' or '@' not in school_email:
                    results["failed"] += 1
                    results["errors"].append(f"Row {idx+2}: Invalid or missing school_email")
                    continue
                
                if not principal_name or principal_name.lower() == 'nan':
                    results["failed"] += 1
                    results["errors"].append(f"Row {idx+2}: Invalid or missing principal_name")
                    continue
                
                # Validate principal_name - no numeric or special characters
                if not is_valid_name(principal_name):
                    results["failed"] += 1
                    results["errors"].append(f"Row {idx+2}: Principal name should only contain letters and spaces")
                    continue
                
                if not mobile_number or mobile_number.lower() == 'nan':
                    results["failed"] += 1
                    results["errors"].append(f"Row {idx+2}: Invalid or missing mobile_number")
                    continue
                
                # postal_code is now optional - skip validation if empty
                if postal_code and postal_code.lower() == 'nan':
                    postal_code = ''
                
                # Check if school code already exists
                existing_code = await db.users.find_one({"school_code": school_code})
                if existing_code:
                    results["failed"] += 1
                    results["errors"].append(f"Row {idx+2}: School code '{school_code}' already exists")
                    continue
                
                # Check if school name already exists
                existing_school = await db.schools.find_one({"name": {"$regex": f"^{re.escape(school_name)}$", "$options": "i"}})
                if existing_school:
                    results["failed"] += 1
                    results["errors"].append(f"Row {idx+2}: School '{school_name}' already exists")
                    continue
                
                # Check if email already exists
                existing_user = await db.users.find_one({"email": school_email})
                if existing_user:
                    results["failed"] += 1
                    results["errors"].append(f"Row {idx+2}: Email '{school_email}' already exists")
                    continue
                
                # Generate password
                password = generate_password()
                password_hash = pwd_context.hash(password)
                
                # Create admin user
                admin_id = str(uuid.uuid4())
                admin_user = {
                    "id": admin_id,
                    "email": school_email,
                    "password_hash": password_hash,
                    "name": school_name + " Admin",
                    "role": UserRole.SCHOOL_ADMIN,
                    "school_code": school_code,
                    "school_name": school_name,
                    "principal_name": principal_name,
                    "mobile_number": mobile_number,
                    "address": str(row.get('address', '')).strip() or None,
                    "city": str(row.get('city', '')).strip() or None,
                    "state": str(row.get('state', '')).strip() or None,
                    "postal_code": postal_code,
                    "credits": 100,
                    "is_active": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "added_by": current_user["id"]
                }
                
                await db.users.insert_one(admin_user)
                
                # Create school
                school = {
                    "id": str(uuid.uuid4()),
                    "code": school_code,
                    "name": school_name,
                    "admin_id": admin_id,
                    "admin_email": school_email,
                    "principal_name": principal_name,
                    "address": str(row.get('address', '')).strip() or None,
                    "city": str(row.get('city', '')).strip() or None,
                    "state": str(row.get('state', '')).strip() or None,
                    "postal_code": postal_code,
                    "is_active": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "created_by": current_user["id"]
                }
                
                await db.schools.insert_one(school)
                
                # Send welcome email
                background_tasks.add_task(
                    send_welcome_email,
                    school_email,
                    principal_name or school_name + " Admin",
                    password,
                    UserRole.SCHOOL_ADMIN,
                    school_name
                )
                
                results["created"] += 1
                
            except Exception as e:
                results["failed"] += 1
                results["errors"].append(f"Row {idx+2}: {str(e)}")
        
        return results
        
    except Exception as e:
        logger.error(f"Bulk school upload error: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")

@admin_router.post("/bulk-upload/users")
async def bulk_upload_users(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin_or_above)
):
    """
    Bulk upload users (teachers, students, parents) from Excel/CSV file.
    Required columns: email, role (TEACHER/STUDENT/PARENT)
    Optional columns: name, phone, address, city, state
    
    School Admins can upload for their school.
    Super Admins need to specify school_code in the file.
    """
    import pandas as pd
    import io
    
    user_role = current_user.get("role")
    user_school_code = current_user.get("school_code")
    
    content = await file.read()
    
    try:
        # Try Excel first, then CSV - handle NaN values properly
        try:
            df = pd.read_excel(io.BytesIO(content), keep_default_na=False, na_values=[''])
        except:
            df = pd.read_csv(io.BytesIO(content), keep_default_na=False, na_values=[''])
        
        # Replace any remaining NaN values with empty string
        df = df.fillna('')
        
        # Clean column names
        df.columns = [str(c).strip().lower().replace(' ', '_').replace('*', '') for c in df.columns]
        
        # Required columns check
        required_cols = ['email', 'role']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing required columns: {missing_cols}")
        
        # Super Admin needs school_code column
        if user_role == UserRole.SUPER_ADMIN and 'school_code' not in df.columns:
            raise HTTPException(status_code=400, detail="Super Admin must provide 'school_code' column")
        
        results = {
            "total": len(df),
            "created": 0,
            "failed": 0,
            "errors": []
        }
        
        valid_roles = ['TEACHER', 'STUDENT', 'PARENT']
        
        for idx, row in df.iterrows():
            try:
                email = str(row.get('email', '')).strip().lower()
                role = str(row.get('role', '')).strip().upper()
                
                if not email or not role:
                    results["failed"] += 1
                    results["errors"].append(f"Row {idx+2}: Missing email or role")
                    continue
                
                if role not in valid_roles:
                    results["failed"] += 1
                    results["errors"].append(f"Row {idx+2}: Invalid role '{role}'. Must be TEACHER, STUDENT, or PARENT")
                    continue
                
                # Determine school code
                if user_role == UserRole.SUPER_ADMIN:
                    school_code = str(row.get('school_code', '')).strip().upper()
                    if not school_code:
                        results["failed"] += 1
                        results["errors"].append(f"Row {idx+2}: Missing school_code")
                        continue
                else:
                    school_code = user_school_code
                
                # Check if user already exists
                existing_user = await db.users.find_one({"email": email})
                if existing_user:
                    results["failed"] += 1
                    results["errors"].append(f"Row {idx+2}: Email '{email}' already exists")
                    continue
                
                # Verify school exists
                school = await db.schools.find_one({"code": school_code})
                if not school:
                    results["failed"] += 1
                    results["errors"].append(f"Row {idx+2}: School code '{school_code}' not found. School code should be like 'SCH123456' (found in Schools tab). You entered a city/area name or invalid code.")
                    continue
                
                # Generate password
                password = generate_password()
                password_hash = pwd_context.hash(password)
                
                # Create user
                user_id = str(uuid.uuid4())
                new_user = {
                    "id": user_id,
                    "email": email,
                    "password_hash": password_hash,
                    "name": str(row.get('name', '')).strip() or email.split('@')[0],
                    "role": role,
                    "school_code": school_code,
                    "phone": str(row.get('phone', '')).strip() or None,
                    "address": str(row.get('address', '')).strip() or None,
                    "city": str(row.get('city', '')).strip() or None,
                    "state": str(row.get('state', '')).strip() or None,
                    "credits": 50,
                    "is_active": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "added_by": current_user["id"]
                }
                
                # Add teacher_code for teachers
                if role == "TEACHER":
                    new_user["teacher_code"] = f"TR{str(uuid.uuid4())[:8].upper()}"
                
                await db.users.insert_one(new_user)
                
                # Send welcome email
                user_name = str(row.get('name', '')).strip() or email.split('@')[0]
                background_tasks.add_task(
                    send_welcome_email,
                    email,
                    user_name,
                    password,
                    role,
                    school.get("name", "MySchool")
                )
                
                results["created"] += 1
                
            except Exception as e:
                results["failed"] += 1
                results["errors"].append(f"Row {idx+2}: {str(e)}")
        
        return results
        
    except Exception as e:
        logger.error(f"Bulk user upload error: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")

@admin_router.post("/bulk-upload/teachers")
async def bulk_upload_teachers(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin_or_above)
):
    """
    Bulk upload teachers from Excel/CSV file.
    Required columns: name, email, mobile_number, school_code (only for super admin)
    Optional columns: address, city, state, postal_code
    """
    import pandas as pd
    import io
    
    user_role = current_user.get("role")
    user_school_code = current_user.get("school_code")
    
    content = await file.read()
    
    try:
        try:
            df = pd.read_excel(io.BytesIO(content), keep_default_na=False, na_values=[''])
        except:
            df = pd.read_csv(io.BytesIO(content), keep_default_na=False, na_values=[''])
        
        # Replace any remaining NaN values with empty string
        df = df.fillna('')
        
        # Clean column names - remove asterisks and special chars
        df.columns = [str(c).strip().lower().replace(' ', '_').replace('*', '') for c in df.columns]
        
        # Map common column name variations
        column_mappings = {
            'user_name': 'name',
            'email_id': 'email',
            'mobile_no': 'mobile_number',
            'phone': 'mobile_number',
            'phone_number': 'mobile_number',
            'parent_mobile_number': 'mobile_number',
        }
        df.rename(columns=column_mappings, inplace=True)
        
        # Required columns check
        required_cols = ['name', 'email', 'mobile_number']
        if user_role == UserRole.SUPER_ADMIN:
            required_cols.append('school_code')
        
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing required columns: {missing_cols}")
        
        results = {
            "total": len(df),
            "success_count": 0,
            "error_count": 0,
            "errors": []
        }
        
        for idx, row in df.iterrows():
            try:
                name = str(row.get('name', '')).strip()
                email = str(row.get('email', '')).strip().lower()
                mobile = str(row.get('mobile_number', '')).strip()
                
                if not name or not email:
                    results["error_count"] += 1
                    results["errors"].append(f"Row {idx+2}: Missing name or email")
                    continue
                
                # Validate mobile number - must be exactly 10 digits
                mobile_digits = ''.join(filter(str.isdigit, mobile))
                if mobile and len(mobile_digits) != 10:
                    results["error_count"] += 1
                    results["errors"].append(f"Row {idx+2}: Mobile number must be exactly 10 digits, got {len(mobile_digits)} digits")
                    continue
                mobile = mobile_digits if mobile_digits else None  # Use cleaned 10-digit number
                
                # Determine school code - use from CSV if provided, otherwise use user's school code
                csv_school_code = str(row.get('school_code', '')).strip().upper() if pd.notna(row.get('school_code')) else ''
                if user_role == UserRole.SUPER_ADMIN:
                    school_code = csv_school_code
                    if not school_code:
                        results["error_count"] += 1
                        results["errors"].append(f"Row {idx+2}: Missing school_code (required for Super Admin)")
                        continue
                else:
                    # For School Admin - use their own school code (ignore CSV school_code)
                    school_code = user_school_code
                    if not school_code:
                        results["error_count"] += 1
                        results["errors"].append(f"Row {idx+2}: Your account doesn't have a school code assigned")
                        continue
                
                # Check if user already exists
                existing_user = await db.users.find_one({"email": email})
                if existing_user:
                    results["error_count"] += 1
                    results["errors"].append(f"Row {idx+2}: Email '{email}' already exists")
                    continue
                
                # Verify school exists - check both schools collection and users with SCHOOL_ADMIN role
                school = await db.schools.find_one({"code": school_code})
                school_user = None
                if not school:
                    # Also check if school_code exists in users collection (for self-registered schools)
                    school_user = await db.users.find_one({"school_code": school_code, "role": "SCHOOL_ADMIN"})
                    if not school_user:
                        results["error_count"] += 1
                        results["errors"].append(f"Row {idx+2}: School code '{school_code}' not found")
                        continue
                
                # Generate password
                password = generate_password()
                password_hash = hash_password(password)
                
                # Create teacher
                teacher_code = f"TR{str(uuid.uuid4())[:8].upper()}"
                teacher = {
                    "id": str(uuid.uuid4()),
                    "email": email,
                    "password_hash": password_hash,
                    "name": name,
                    "role": UserRole.TEACHER,
                    "school_code": school_code,
                    "teacher_code": teacher_code,
                    "mobile_number": mobile,
                    "address": str(row.get('address', '')).strip() or None,
                    "city": str(row.get('city', '')).strip() or None,
                    "state": str(row.get('state', '')).strip() or None,
                    "postal_code": str(row.get('postal_code', '')).strip() or None,
                    "credits": 50,
                    "is_active": True,
                    "must_change_password": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "added_by": current_user["id"]
                }
                
                await db.users.insert_one(teacher)
                
                # Send welcome email - handle case where school might be from users collection
                school_name = "MySchool"
                if school:
                    school_name = school.get("name", "MySchool")
                elif school_user:
                    school_name = school_user.get("school_name") or school_user.get("name", "MySchool")
                    
                background_tasks.add_task(
                    send_welcome_email,
                    email,
                    name,
                    password,
                    UserRole.TEACHER,
                    school_name
                )
                
                results["success_count"] += 1
                
            except Exception as e:
                results["error_count"] += 1
                results["errors"].append(f"Row {idx+2}: {str(e)}")
        
        return results
        
    except Exception as e:
        logger.error(f"Bulk teacher upload error: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")

@admin_router.post("/bulk-upload/students")
async def bulk_upload_students(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_teacher_or_above)
):
    """
    Bulk upload students from Excel/CSV file.
    Required columns: name, email, mobile_number, school_code (only for super admin), class_name, section
    Optional columns: roll_number, father_name, teacher_code, address, city, state, postal_code
    """
    import pandas as pd
    import io
    
    user_role = current_user.get("role")
    user_school_code = current_user.get("school_code")
    user_teacher_code = current_user.get("teacher_code")
    
    content = await file.read()
    
    try:
        try:
            df = pd.read_excel(io.BytesIO(content), keep_default_na=False, na_values=[''])
        except:
            df = pd.read_csv(io.BytesIO(content), keep_default_na=False, na_values=[''])
        
        # Replace any remaining NaN values with empty string
        df = df.fillna('')
        
        # Clean column names - remove asterisks and special chars
        df.columns = [str(c).strip().lower().replace(' ', '_').replace('*', '') for c in df.columns]
        
        # Map common column name variations
        column_mappings = {
            'user_name': 'name',
            'email_id': 'email',
            'mobile_no': 'mobile_number',
            'phone': 'mobile_number',
            'phone_number': 'mobile_number',
            'parent_mobile_number': 'mobile_number',
            'parent_name': 'father_name',
            'class': 'class_name',
            'section_name': 'section',
        }
        df.rename(columns=column_mappings, inplace=True)
        
        # Required columns check
        required_cols = ['name', 'email', 'mobile_number', 'class_name', 'section']
        if user_role == UserRole.SUPER_ADMIN:
            required_cols.append('school_code')
        
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing required columns: {missing_cols}")
        
        results = {
            "total": len(df),
            "success_count": 0,
            "error_count": 0,
            "errors": []
        }
        
        for idx, row in df.iterrows():
            try:
                name = str(row.get('name', '')).strip()
                email = str(row.get('email', '')).strip().lower()
                mobile = str(row.get('mobile_number', '')).strip()
                class_name = str(row.get('class_name', '')).strip()
                section = str(row.get('section', '')).strip()
                
                if not name or not email or not class_name or not section:
                    results["error_count"] += 1
                    results["errors"].append(f"Row {idx+2}: Missing required fields (name, email, class_name, section)")
                    continue
                
                # Validate mobile number - must be exactly 10 digits
                mobile_digits = ''.join(filter(str.isdigit, mobile))
                if mobile and len(mobile_digits) != 10:
                    results["error_count"] += 1
                    results["errors"].append(f"Row {idx+2}: Mobile number must be exactly 10 digits, got {len(mobile_digits)} digits")
                    continue
                mobile = mobile_digits  # Use cleaned 10-digit number
                
                # Determine school code - use from CSV if provided, otherwise use user's school code
                csv_school_code = str(row.get('school_code', '')).strip().upper() if pd.notna(row.get('school_code')) else ''
                if user_role == UserRole.SUPER_ADMIN:
                    school_code = csv_school_code
                    if not school_code:
                        results["error_count"] += 1
                        results["errors"].append(f"Row {idx+2}: Missing school_code (required for Super Admin)")
                        continue
                else:
                    # For School Admin/Teacher - use their own school code (ignore CSV school_code)
                    school_code = user_school_code
                    if not school_code:
                        results["error_count"] += 1
                        results["errors"].append(f"Row {idx+2}: Your account doesn't have a school code assigned")
                        continue
                
                # Check if user already exists
                existing_user = await db.users.find_one({"email": email})
                if existing_user:
                    results["error_count"] += 1
                    results["errors"].append(f"Row {idx+2}: Email '{email}' already exists")
                    continue
                
                # Verify school exists - check both schools collection and users with SCHOOL_ADMIN role
                school = await db.schools.find_one({"code": school_code})
                school_user = None
                if not school:
                    # Also check if school_code exists in users collection (for self-registered schools)
                    school_user = await db.users.find_one({"school_code": school_code, "role": "SCHOOL_ADMIN"})
                    if not school_user:
                        results["error_count"] += 1
                        results["errors"].append(f"Row {idx+2}: School code '{school_code}' not found")
                        continue
                
                # Generate password
                password = generate_password()
                password_hash = hash_password(password)
                
                # Create student
                student_code = f"ST{str(uuid.uuid4())[:8].upper()}"
                student = {
                    "id": str(uuid.uuid4()),
                    "email": email,
                    "password_hash": password_hash,
                    "name": name,
                    "role": UserRole.STUDENT,
                    "school_code": school_code,
                    "student_code": student_code,
                    "mobile_number": mobile,
                    "class_name": class_name,
                    "section_name": section,
                    "roll_number": str(row.get('roll_number', '')).strip() or None,
                    "father_name": str(row.get('father_name', '')).strip() or None,
                    "teacher_code": str(row.get('teacher_code', '')).strip() or user_teacher_code or None,
                    "address": str(row.get('address', '')).strip() or None,
                    "city": str(row.get('city', '')).strip() or None,
                    "state": str(row.get('state', '')).strip() or None,
                    "postal_code": str(row.get('postal_code', '')).strip() or None,
                    "credits": 50,
                    "is_active": True,
                    "must_change_password": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "added_by": current_user["id"]
                }
                
                await db.users.insert_one(student)
                
                # Send welcome email - handle case where school might be from users collection
                school_name = "MySchool"
                if school:
                    school_name = school.get("name", "MySchool")
                elif school_user:
                    school_name = school_user.get("school_name") or school_user.get("name", "MySchool")
                    
                background_tasks.add_task(
                    send_welcome_email,
                    email,
                    name,
                    password,
                    UserRole.STUDENT,
                    school_name
                )
                
                results["success_count"] += 1
                
            except Exception as e:
                results["error_count"] += 1
                results["errors"].append(f"Row {idx+2}: {str(e)}")
        
        return results
        
    except Exception as e:
        logger.error(f"Bulk student upload error: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")

@admin_router.get("/bulk-upload/template/{type}")
async def get_bulk_upload_template(
    type: str,
    current_user: dict = Depends(require_admin_or_above)
):
    """Get template information for bulk upload"""
    user_role = current_user.get("role")
    
    if type == "schools":
        return {
            "required_columns": ["school_code", "school_name", "school_email", "principal_name", "mobile_number", "postal_code"],
            "optional_columns": ["address", "city", "state"],
            "example": {
                "school_code": "SCH001",
                "school_name": "ABC Public School",
                "school_email": "admin@abcschool.com",
                "principal_name": "Dr. Smith",
                "mobile_number": "9876543210",
                "postal_code": "400001",
                "address": "123 Main Street",
                "city": "Mumbai",
                "state": "Maharashtra"
            }
        }
    elif type == "teachers":
        required = ["name", "email", "mobile_number"]
        if user_role == UserRole.SUPER_ADMIN:
            required.append("school_code")
        
        return {
            "required_columns": required,
            "optional_columns": ["address", "city", "state", "postal_code"],
            "example": {
                "name": "John Teacher",
                "email": "teacher@school.com",
                "mobile_number": "9876543210",
                "school_code": "SCH001" if user_role == UserRole.SUPER_ADMIN else "(auto-assigned)",
                "address": "123 Teacher Lane",
                "city": "Mumbai",
                "state": "Maharashtra"
            }
        }
    elif type == "students":
        required = ["name", "email", "mobile_number", "class_name", "section"]
        if user_role == UserRole.SUPER_ADMIN:
            required.append("school_code")
        
        return {
            "required_columns": required,
            "optional_columns": ["roll_number", "father_name", "teacher_code", "address", "city", "state", "postal_code"],
            "example": {
                "name": "Student Name",
                "email": "student@school.com",
                "mobile_number": "9876543210",
                "school_code": "SCH001" if user_role == UserRole.SUPER_ADMIN else "(auto-assigned)",
                "class_name": "Class 5",
                "section": "A",
                "roll_number": "101",
                "father_name": "Parent Name"
            }
        }
    elif type == "users":
        required = ["email", "role"]
        if user_role == UserRole.SUPER_ADMIN:
            required.append("school_code")
        
        return {
            "required_columns": required,
            "optional_columns": ["name", "phone", "address", "city", "state"],
            "valid_roles": ["TEACHER", "STUDENT", "PARENT"],
            "example": {
                "email": "teacher@school.com",
                "role": "TEACHER",
                "name": "Jane Doe",
                "phone": "9876543210",
                "school_code": "SC12345678" if user_role == UserRole.SUPER_ADMIN else "(auto-assigned)"
            }
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid template type. Use 'schools', 'teachers', 'students', or 'users'")

# ============== SEARCH ROUTES (Robust) ==============
search_router = APIRouter(prefix="/search", tags=["Search"])

def soundex(word):
    """Generate Soundex code for phonetic matching"""
    if not word:
        return ""
    word = word.upper()
    soundex_code = word[0]
    mapping = {
        'B': '1', 'F': '1', 'P': '1', 'V': '1',
        'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
        'D': '3', 'T': '3',
        'L': '4',
        'M': '5', 'N': '5',
        'R': '6'
    }
    for char in word[1:]:
        code = mapping.get(char, '0')
        if code != '0' and code != soundex_code[-1]:
            soundex_code += code
        if len(soundex_code) == 4:
            break
    return soundex_code.ljust(4, '0')

def fuzzy_match(query, text, threshold=0.6):
    """Simple fuzzy matching based on character overlap"""
    if not query or not text:
        return False
    query = query.lower()
    text = text.lower()
    if query in text or text in query:
        return True
    # Check for partial matches
    query_chars = set(query)
    text_chars = set(text)
    overlap = len(query_chars & text_chars) / max(len(query_chars), 1)
    return overlap >= threshold

def get_synonyms(word):
    """Get common synonyms for educational terms"""
    synonym_map = {
        'math': ['maths', 'mathematics', 'arithmetic', 'algebra', 'geometry'],
        'maths': ['math', 'mathematics', 'arithmetic', 'algebra', 'geometry'],
        'science': ['physics', 'chemistry', 'biology', 'scientific'],
        'english': ['language', 'grammar', 'literature', 'writing'],
        'animal': ['animals', 'creature', 'wildlife', 'fauna'],
        'fish': ['fishes', 'aquatic', 'marine'],
        'cow': ['cattle', 'bovine', 'dairy'],
        'bird': ['birds', 'avian', 'fowl'],
        'plant': ['plants', 'flora', 'vegetation', 'botanical'],
        'tree': ['trees', 'forest', 'woodland'],
        # Class/Grade synonyms
        'class': ['grade', 'standard', 'std'],
        'grade': ['class', 'standard', 'std'],
        '1st': ['first', '1', 'one', 'class 1', 'grade 1'],
        '2nd': ['second', '2', 'two', 'class 2', 'grade 2'],
        '3rd': ['third', '3', 'three', 'class 3', 'grade 3'],
        '4th': ['fourth', '4', 'four', 'class 4', 'grade 4'],
        '5th': ['fifth', '5', 'five', 'class 5', 'grade 5'],
        '6th': ['sixth', '6', 'six', 'class 6', 'grade 6'],
        '7th': ['seventh', '7', 'seven', 'class 7', 'grade 7'],
        '8th': ['eighth', '8', 'eight', 'class 8', 'grade 8'],
        '9th': ['ninth', '9', 'nine', 'class 9', 'grade 9'],
        '10th': ['tenth', '10', 'ten', 'class 10', 'grade 10'],
        'first': ['1st', '1', 'class 1'],
        'second': ['2nd', '2', 'class 2'],
        'third': ['3rd', '3', 'class 3'],
        'fourth': ['4th', '4', 'class 4'],
        'fifth': ['5th', '5', 'class 5'],
        # Common search terms
        'quiz': ['quizzes', 'test', 'puzzle', 'puzzles'],
        'puzzle': ['puzzles', 'quiz', 'quizzes', 'riddle', 'riddles'],
    }
    return synonym_map.get(word.lower(), [])

@search_router.get("/global")
async def global_search(
    query: str,
    category: Optional[str] = None,
    size: int = Query(50, ge=1, le=200),
    lastPath: Optional[str] = None
):
    """World-class global search with soundex, fuzzy matching, and semantic search"""
    
    # Clean and prepare search query
    original_query = query.strip()
    search_terms = original_query.lower().split()
    
    # Generate soundex codes for phonetic matching
    soundex_codes = [soundex(term) for term in search_terms]
    
    # Expand search terms with synonyms
    expanded_terms = set(search_terms)
    for term in search_terms:
        expanded_terms.update(get_synonyms(term))
    
    # Build comprehensive search query
    or_conditions = []
    
    # Exact and partial title match
    or_conditions.append({"title": {"$regex": f".*{re.escape(original_query)}.*", "$options": "i"}})
    
    # Individual term matching in title
    for term in search_terms:
        or_conditions.append({"title": {"$regex": f".*{re.escape(term)}.*", "$options": "i"}})
    
    # Expanded terms (synonyms)
    for term in expanded_terms:
        or_conditions.append({"title": {"$regex": f".*{re.escape(term)}.*", "$options": "i"}})
    
    # Tag matching - use regex for partial matches in array elements
    for term in search_terms:
        or_conditions.append({"tags": {"$elemMatch": {"$regex": f".*{re.escape(term)}.*", "$options": "i"}}})
    for term in expanded_terms:
        or_conditions.append({"tags": {"$elemMatch": {"$regex": f".*{re.escape(term)}.*", "$options": "i"}}})
    
    # Category matching
    or_conditions.append({"category": {"$regex": f".*{original_query}.*", "$options": "i"}})
    
    # Description matching
    or_conditions.append({"description": {"$regex": f".*{original_query}.*", "$options": "i"}})
    
    # File name / URL matching (for uploaded files)
    or_conditions.append({"url": {"$regex": f".*{re.escape(original_query)}.*", "$options": "i"}})
    or_conditions.append({"file_name": {"$regex": f".*{re.escape(original_query)}.*", "$options": "i"}})
    
    # Object key matching (R2 paths)
    for term in search_terms:
        or_conditions.append({"object_key": {"$regex": f".*{re.escape(term)}.*", "$options": "i"}})
    
    image_query = {"$or": or_conditions}
    
    if category:
        image_query["category"] = category.upper()
    
    # Search in multiple collections
    images = await db.resource_images.find(image_query, {"_id": 0}).limit(size).to_list(size)
    
    # Also search my_images collection for user uploads
    my_images = await db.my_images.find(image_query, {"_id": 0}).limit(size).to_list(size)
    
    # Search predefined categories
    categories = ["ACADEMIC", "EARLY-CAREER", "EDUTAINMENT", "PRINT-RICH", "MAKER", "INFO-HUB"]
    category_results = []
    
    for cat in categories:
        cat_lower = cat.lower().replace("-", " ")
        # Check if any search term matches category
        if any(fuzzy_match(term, cat_lower) for term in search_terms):
            if not category or category.upper() == cat:
                category_results.append({
                    "path": f"/views/{cat.lower()}",
                    "title": cat.replace("-", " ").title(),
                    "category": cat,
                    "type": "category"
                })
    
    # Combine and deduplicate results
    results = []
    seen_urls = set()
    
    # Get R2 base URL for constructing full image URLs
    # Using global R2_BASE_URL
    
    def get_full_url(relative_path):
        """Convert relative path to full R2 URL"""
        if not relative_path:
            return ""
        if relative_path.startswith("http"):
            return relative_path
        # Remove leading /uploads/ or / and construct R2 URL
        clean_path = relative_path.lstrip("/")
        if clean_path.startswith("uploads/"):
            clean_path = clean_path[8:]  # Remove 'uploads/'
        return f"{R2_BASE_URL}/{clean_path}"
    
    # Add image results from resource_images
    for img in images:
        url = img.get("url", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            # Use s3_path if available, otherwise url
            s3_path = img.get("s3_path", "")
            full_url = get_full_url(s3_path or url)
            results.append({
                "path": full_url,
                "title": img.get("title", ""),
                "category": img.get("category", ""),
                "thumbnail": full_url,  # Use same URL for thumbnail
                "type": "image",
                "tags": img.get("tags", [])
            })
    
    # Add results from my_images
    for img in my_images:
        url = img.get("url", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            full_url = get_full_url(url)
            results.append({
                "path": full_url,
                "title": img.get("title", img.get("file_name", "")),
                "category": img.get("category", "USER_UPLOAD"),
                "thumbnail": full_url,
                "type": "image",
                "tags": img.get("tags", [])
            })
    
    # Add category results
    results.extend(category_results)
    
    # Calculate relevance scores and sort
    def relevance_score(item):
        score = 0
        title = (item.get("title") or "").lower()
        for term in search_terms:
            if term in title:
                score += 10
            if title.startswith(term):
                score += 5
        return score
    
    results.sort(key=relevance_score, reverse=True)
    
    return {
        "results": results[:size],
        "total": len(results),
        "query": original_query,
        "expanded_terms": list(expanded_terms)
    }

@search_router.get("/suggestions")
async def search_suggestions(
    query: str,
    limit: int = Query(10, ge=1, le=50)
):
    """Get search suggestions based on partial query"""
    suggestions = []
    
    # Get unique tags matching query
    pipeline = [
        {"$match": {"tags": {"$regex": f"^{query}", "$options": "i"}}},
        {"$unwind": "$tags"},
        {"$match": {"tags": {"$regex": f"^{query}", "$options": "i"}}},
        {"$group": {"_id": "$tags"}},
        {"$limit": limit}
    ]
    
    tag_results = await db.resource_images.aggregate(pipeline).to_list(limit)
    suggestions.extend([r["_id"] for r in tag_results])
    
    # Add category suggestions
    categories = ["Academic", "Early Career", "Edutainment", "Print Rich", "Maker", "Info Hub"]
    for cat in categories:
        if query.lower() in cat.lower():
            suggestions.append(cat)
    
    return {"suggestions": list(set(suggestions))[:limit]}

# ============== IMAGE ROUTES ==============
images_router = APIRouter(prefix="/images", tags=["Images"])

# PDF Thumbnail cache directory
PDF_THUMBNAIL_CACHE = Path("/app/uploads/pdf_cache")
PDF_THUMBNAIL_CACHE.mkdir(parents=True, exist_ok=True)

@images_router.get("/pdf-thumbnail")
async def get_pdf_thumbnail(
    url: str = Query(..., description="PDF URL to generate thumbnail from"),
    width: int = Query(200, ge=50, le=500),
    height: int = Query(260, ge=50, le=600)
):
    """
    Generate and return a thumbnail image from a PDF's first page.
    This endpoint proxies the PDF fetch to avoid CORS issues.
    """
    import hashlib
    
    try:
        # Create cache key from URL
        cache_key = hashlib.md5(f"{url}_{width}_{height}".encode()).hexdigest()
        cache_file = PDF_THUMBNAIL_CACHE / f"{cache_key}.jpg"
        
        # Check cache first
        if cache_file.exists():
            try:
                with open(cache_file, "rb") as f:
                    cached_content = f.read()
                    if len(cached_content) > 0:
                        return Response(content=cached_content, media_type="image/jpeg")
            except Exception as e:
                logger.warning(f"Cache read error: {e}")
        
        # Fetch PDF from R2
        r2_base = R2_BASE_URL
        
        # Handle relative and absolute URLs
        if url.startswith("http"):
            pdf_url = url
        elif url.startswith("/uploads/"):
            pdf_url = f"{r2_base}/{url[9:]}"  # Remove /uploads/
        elif url.startswith("/"):
            pdf_url = f"{r2_base}{url}"
        else:
            pdf_url = f"{r2_base}/{url}"
        
        logger.info(f"Fetching PDF from: {pdf_url}")
        
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            response = await client.get(pdf_url)
            
            if response.status_code != 200:
                logger.error(f"PDF fetch failed: {response.status_code} for {pdf_url}")
                raise HTTPException(status_code=404, detail="PDF not found")
            
            pdf_content = response.content
            
            if len(pdf_content) < 100:
                logger.error(f"PDF content too small: {len(pdf_content)} bytes")
                raise HTTPException(status_code=400, detail="Invalid PDF content")
        
        # Generate thumbnail using pdf2image
        try:
            from pdf2image import convert_from_bytes
            from pdf2image.exceptions import PDFInfoNotInstalledError, PDFPageCountError
            
            # Convert first page to image with explicit poppler path
            images = convert_from_bytes(
                pdf_content,
                first_page=1,
                last_page=1,
                size=(width, None),  # Maintain aspect ratio
                fmt='jpeg',
                thread_count=1,  # Limit threads for stability
                use_cropbox=True,
                poppler_path='/usr/bin'  # Explicitly specify poppler path
            )
            
            if images and len(images) > 0:
                img = images[0]
                
                # Resize if needed
                if img.height > height:
                    ratio = height / img.height
                    new_width = int(img.width * ratio)
                    img = img.resize((new_width, height), Image.Resampling.LANCZOS)
                
                # Save to bytes
                img_byte_arr = io.BytesIO()
                img.save(img_byte_arr, format='JPEG', quality=85)
                thumbnail_bytes = img_byte_arr.getvalue()
                
                # Cache the result
                try:
                    with open(cache_file, "wb") as f:
                        f.write(thumbnail_bytes)
                    logger.info(f"Cached PDF thumbnail: {cache_key}")
                except Exception as e:
                    logger.warning(f"Failed to cache thumbnail: {e}")
                
                return Response(content=thumbnail_bytes, media_type="image/jpeg")
            else:
                logger.error("pdf2image returned no images")
                
        except PDFInfoNotInstalledError:
            logger.error("poppler-utils not installed - run: apt-get install poppler-utils")
        except PDFPageCountError as e:
            logger.error(f"PDF page count error: {e}")
        except ImportError as e:
            logger.error(f"pdf2image import error: {e}")
        except Exception as e:
            logger.error(f"PDF thumbnail generation error: {type(e).__name__}: {e}")
        
        # Return a placeholder image if thumbnail generation fails
        placeholder = generate_pdf_placeholder(width, height)
        return Response(content=placeholder, media_type="image/png")
        
    except httpx.TimeoutException:
        logger.error(f"PDF fetch timeout for: {url}")
        raise HTTPException(status_code=504, detail="PDF fetch timeout")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF thumbnail error: {type(e).__name__}: {e}")
        # Return placeholder instead of error
        placeholder = generate_pdf_placeholder(width, height)
        return Response(content=placeholder, media_type="image/png")

def generate_pdf_placeholder(width: int, height: int) -> bytes:
    """Generate a simple PDF placeholder image"""
    img = Image.new('RGB', (width, height), color='#fff5f5')
    
    # We can't easily add text without additional fonts, so return solid color
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    return img_byte_arr.read()

@images_router.get("/proxy")
async def proxy_image(url: str = Query(..., description="Image URL to proxy")):
    """
    Proxy an image to add CORS headers. This allows frontend to use images
    from external sources (like R2) in canvas export without CORS issues.
    """
    try:
        # Validate URL - only allow R2 URLs
        allowed_domains = ['r2.dev', 'r2.cloudflarestorage.com', 'cloudflare']
        if not any(domain in url for domain in allowed_domains):
            raise HTTPException(status_code=400, detail="Only R2 image URLs are allowed")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch image")
            
            # Determine content type
            content_type = response.headers.get('content-type', 'image/jpeg')
            
            return Response(
                content=response.content,
                media_type=content_type,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET",
                    "Cache-Control": "public, max-age=3600"
                }
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Image fetch timeout")
    except Exception as e:
        logging.error(f"Image proxy error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@images_router.post("/fetch")
async def fetch_images(body: dict, response: Response):
    """Fetch images from a folder path - maps folder paths to database structure"""
    # Add cache control headers for browser caching
    response.headers["Cache-Control"] = "public, max-age=300"  # 5 minute cache
    
    folder_path = body.get("folderPath", "").strip("/")
    images_per_page = body.get("imagesPerPage", 100)
    continuation_token = body.get("continuationToken")
    
    # Parse folder path to build query - remove 'thumbnails' from path
    parts = [p for p in folder_path.split("/") if p and p.lower() != 'thumbnails']
    
    # Include both "active" and "approved" images (approved = user-uploaded approved by admin)
    query = {"status": {"$in": ["active", "approved"]}}
    
    # Map common category names from URL format to database format
    category_map = {
        "ACADEMIC": "ACADEMIC",
        "EARLYCAREER": "EARLY-CAREER", 
        "EARLY_CAREER": "EARLY-CAREER",
        "EARLY-CAREER": "EARLY-CAREER",
        "EDUTAINMENT": "EDUTAINMENT",
        "PRINTRICH": "PRINT-RICH",
        "PRINT_RICH": "PRINT-RICH",
        "PRINT-RICH": "PRINT-RICH",
        "MAKER": "MAKER",
        "INFOHUB": "INFO-HUB",
        "INFO_HUB": "INFO-HUB",
        "INFO-HUB": "INFO-HUB",
        "ONE_CLICK_RESOURCE_CENTRE": "ONE CLICK RESOURCE CENTRE",
        "ONE CLICK RESOURCE CENTRE": "ONE CLICK RESOURCE CENTRE",
        "SECTIONS": "ONE CLICK RESOURCE CENTRE"
    }
    
    # Map menu names from URL format to database format
    menu_name_map = {
        "image bank": "IMAGE BANK",
        "imagebank": "IMAGE BANK",
        "image-bank": "IMAGE BANK",
        "comics": "COMICS",
        "rhymes": "RHYMES",
        "visual worksheets": "VISUAL WORKSHEETS",
        "visual-worksheets": "VISUAL WORKSHEETS",
        "safety": "SAFETY",
        "value education": "VALUE EDUCATION",
        "value-education": "VALUE EDUCATION",
        "art lessons": "ART LESSONS",
        "art-lessons": "ART LESSONS",
        "craft lessons": "CRAFT LESSONS",
        "craft-lessons": "CRAFT LESSONS",
        "computer lessons": "COMPUTER LESSONS",
        "computer-lessons": "COMPUTER LESSONS",
        "flash cards": "FLASH CARDS",
        "flash-cards": "FLASH CARDS",
        "gk & science": "GK & SCIENCE",
        "gk science": "GK & SCIENCE",
        "gk-science": "GK & SCIENCE",
        "project charts": "PROJECT CHARTS",
        "project-charts": "PROJECT CHARTS",
        "puzzels & riddles": "PUZZELS & RIDDLES",
        "puzzles riddles": "PUZZELS & RIDDLES",
        "puzzles-riddles": "PUZZELS & RIDDLES",
        "pictorial stories": "PICTORIAL STORIES",
        "pictorial-stories": "PICTORIAL STORIES",
        "picture stories": "PICTORIAL STORIES",
        "picture-stories": "PICTORIAL STORIES",
        "moral stories": "MORAL STORIES",
        "moral-stories": "MORAL STORIES",
        "learn hand writing": "LEARN HAND WRITING",
        "learn-hand-writing": "LEARN HAND WRITING",
        "offers": "OFFERS",
        "donors": "DONORS"
    }
    
    # Detect if this is a One Click Resource Centre path from header navigation
    # Paths like: PRINT-RICH/IMAGE BANK/ANIMALS -> should query ONE CLICK RESOURCE CENTRE
    # BUT: ACADEMIC/IMAGE BANK should use the synced R2 data, not ONE CLICK RESOURCE CENTRE
    is_one_click_menu = False
    if parts:
        first_part_upper = parts[0].upper().replace('-', '_').replace(' ', '_')
        # Skip One Click detection for ACADEMIC paths - they have their own handling
        if first_part_upper != "ACADEMIC":
            # Check if first part is a main category (PRINT-RICH, EDUTAINMENT, etc.)
            # and second part is a One Click menu item (IMAGE BANK, COMICS, etc.)
            if len(parts) > 1:
                second_part_lower = parts[1].lower().replace('_', ' ').replace('-', ' ')
                if second_part_lower in menu_name_map:
                    is_one_click_menu = True
    
    if is_one_click_menu:
        # This is a One Click Resource Centre item accessed from main nav (PRINT-RICH/IMAGE BANK/ANIMALS)
        query["category"] = "ONE CLICK RESOURCE CENTRE"
        menu_lower = parts[1].lower().replace('_', ' ').replace('-', ' ')
        query["menu"] = menu_name_map.get(menu_lower, parts[1].upper())
        if len(parts) > 2:
            query["sub_menu"] = {"$regex": f"^{parts[2]}$", "$options": "i"}
        if len(parts) > 3:
            query["subject"] = {"$regex": f"^{parts[3]}$", "$options": "i"}
        if len(parts) > 4:
            query["book_type"] = {"$regex": f"^{parts[4]}$", "$options": "i"}
    elif parts:
        # Standard path processing
        first_part = parts[0].upper().replace('-', '_').replace(' ', '_')
        
        # Check if first part is one_click_resource_centre
        if first_part in ["ONE_CLICK_RESOURCE_CENTRE", "ONE_CLICK_RESOURCE_CENTER", "SECTIONS"]:
            query["category"] = "ONE CLICK RESOURCE CENTRE"
            
            if len(parts) > 1:
                menu_lower = parts[1].lower().replace('_', ' ')
                query["menu"] = menu_name_map.get(menu_lower, parts[1].upper())
            
            if len(parts) > 2:
                # Third part is sub_menu (NURSERY, PRIMARY, etc.)
                query["sub_menu"] = {"$regex": f"^{parts[2]}$", "$options": "i"}
            
            if len(parts) > 3:
                # Fourth part is subject (ENGLISH, MATHS, etc.)
                query["subject"] = {"$regex": f"^{parts[3]}$", "$options": "i"}
                logger.info(f"Added subject filter: {parts[3]}")
            
            if len(parts) > 4:
                # Fifth part could be book_type or unit_lesson
                query["book_type"] = {"$regex": f"^{parts[4]}$", "$options": "i"}
        # Special handling for ACADEMIC/IMAGE BANK (synced from R2)
        elif first_part == "ACADEMIC" and len(parts) > 1 and parts[1].upper().replace('_', ' ') == "IMAGE BANK":
            # ACADEMIC IMAGE BANK has different data structure from R2 sync
            query["folder_path"] = "ACADEMIC/IMAGE BANK"
            
            if len(parts) > 2:
                # Third part is category (ANIMALS, BIRDS, etc.)
                query["category"] = {"$regex": f"^{parts[2]}$", "$options": "i"}
            
            if len(parts) > 3:
                # Fourth part is subcategory (DOMESTIC ANIMALS, WILD ANIMALS, etc.)
                query["subcategory"] = {"$regex": f"^{parts[3]}$", "$options": "i"}
            
            if len(parts) > 4:
                # Fifth part is nested_category (IMAGES, etc.)
                query["nested_category"] = {"$regex": f"^{parts[4]}$", "$options": "i"}
        else:
            # Regular category path (ACADEMIC, etc.)
            query["category"] = category_map.get(first_part, first_part.replace('_', ' '))
            
            if len(parts) > 1:
                # Second part is menu (CLASS, IMAGE BANK, COMICS, etc.)
                menu_lower = parts[1].lower().replace('_', ' ').replace('-', ' ')
                menu_db = menu_name_map.get(menu_lower)
                if menu_db:
                    query["menu"] = menu_db
                else:
                    query["menu"] = {"$regex": f"^{parts[1]}$", "$options": "i"}
            
            if len(parts) > 2:
                # Third part is sub_menu (CLASS-1, ANIMALS, etc.)
                query["sub_menu"] = {"$regex": f"^{parts[2]}$", "$options": "i"}
            
            if len(parts) > 3:
                # Fourth part is subject (ENGLISH, MATHS, etc.)
                query["subject"] = {"$regex": f"^{parts[3]}$", "$options": "i"}
            
            # For Academic paths, handle book_type and unit_lesson
            if len(parts) > 4:
                query["book_type"] = {"$regex": f"^{parts[4]}$", "$options": "i"}
            
            if len(parts) > 5:
                query["unit_lesson"] = {"$regex": f"^{parts[5]}$", "$options": "i"}
    
    logger.info(f"Fetch images - path: {folder_path} -> query: {query}")
    
    # Get available filters at this level for hierarchical navigation
    filters = []
    filter_field = None
    
    # Determine which field to get filters for based on current query depth
    if query.get("category") == "ONE CLICK RESOURCE CENTRE" and query.get("menu"):
        if "sub_menu" not in query:
            # At menu level (IMAGE BANK) - get sub_menu options as filters
            filter_field = "sub_menu"
            filter_query = {"category": query["category"], "menu": query["menu"], "status": {"$in": ["active", "approved"]}}
        elif "subject" not in query:
            # At sub_menu level (ANIMALS) - get subject options as filters (deeper categories)
            filter_field = "subject"
            filter_query = {"category": query["category"], "menu": query["menu"], "sub_menu": query["sub_menu"], "status": {"$in": ["active", "approved"]}}
        else:
            filter_field = None
            filter_query = None
        
        if filter_field and filter_query:
            filters = await db.resource_images.distinct(filter_field, filter_query)
            filters = sorted(list(set([f for f in filters if f])))  # Remove None, duplicates and sort
    
    # Handle ACADEMIC/IMAGE BANK hierarchical filtering
    elif query.get("folder_path") == "ACADEMIC/IMAGE BANK" or (query.get("menu") and "IMAGE BANK" in str(query.get("menu")).upper()):
        # For ACADEMIC IMAGE BANK, use folder_path based filtering
        base_filter_query = {"folder_path": "ACADEMIC/IMAGE BANK"}
        
        if "sub_menu" not in query and "category" not in query:
            # At IMAGE BANK level - get categories as filters
            filter_field = "category"
            filters = await db.resource_images.distinct(filter_field, base_filter_query)
            filters = sorted([f for f in filters if f])
        elif query.get("sub_menu") or query.get("category"):
            # At category level (e.g., ANIMALS) - get subcategories as filters
            cat_value = query.get("sub_menu") or query.get("category")
            # Handle regex pattern
            if isinstance(cat_value, dict) and "$regex" in cat_value:
                cat_value = cat_value["$regex"].replace("^", "").replace("$", "")
            
            filter_field = "subcategory"
            filter_query = {"folder_path": "ACADEMIC/IMAGE BANK", "category": {"$regex": f"^{cat_value}$", "$options": "i"}}
            filters = await db.resource_images.distinct(filter_field, filter_query)
            filters = sorted([f for f in filters if f])
    
    # Query database for images
    images = await db.resource_images.find(query, {"_id": 0}).limit(images_per_page).to_list(images_per_page)
    logger.info(f"Found {len(images)} images in MongoDB for query")
    
    # Transform to expected format - key should be the full path for frontend compatibility
    result_images = {}
    for img in images:
        # Create a key that includes the path structure
        key = img.get("s3_path") or img.get("url", "")
        if key:
            result_images[key] = img.get("url") or img.get("thumbnail_url", "")
    
    # If no images found in MongoDB, try R2 direct listing for CLASS paths
    if not result_images and "CLASS" in folder_path.upper():
        # Check cache first
        cache_key = get_cache_key(folder_path, images_per_page)
        cached_data = get_cached_r2_listing(cache_key)
        if cached_data:
            logger.info(f"Cache HIT for: {folder_path}")
            return cached_data
        
        try:
            import boto3
            from botocore.config import Config
            
            # Use connection pooling for better performance
            boto_config = Config(
                max_pool_connections=20,
                connect_timeout=5,
                read_timeout=10,
                retries={'max_attempts': 2}
            )
            
            s3_client = boto3.client(
                's3',
                endpoint_url=R2_ENDPOINT,
                aws_access_key_id=R2_ACCESS_KEY,
                aws_secret_access_key=R2_SECRET_KEY,
                region_name='auto',
                config=boto_config
            )
            
            # Convert path to R2 prefix
            r2_prefix = folder_path.replace(' ', '%20') + '/'
            logger.info(f"Fetching from R2 with prefix: {r2_prefix}")
            
            # List folders first to get filters
            response = s3_client.list_objects_v2(
                Bucket=R2_BUCKET,
                Prefix=folder_path + '/',
                Delimiter='/',
                MaxKeys=100
            )
            
            # Get folder filters
            r2_filters = []
            for prefix in response.get('CommonPrefixes', []):
                folder_name = prefix['Prefix'].rstrip('/').split('/')[-1]
                if folder_name and not folder_name.startswith('.'):
                    r2_filters.append(folder_name)
            
            if r2_filters:
                # Remove duplicates and sort
                filters = sorted(list(set(r2_filters)))
                filter_field = "subfolder"
            
            # List image and document files
            from urllib.parse import quote
            for obj in response.get('Contents', []):
                key = obj['Key']
                if key.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf')):
                    # URL-encode the path (but keep forward slashes)
                    encoded_key = quote(key, safe='/')
                    public_url = f"{R2_PUBLIC_URL}/{encoded_key}"
                    # For PDFs, try to find corresponding thumbnail in WEBP folder
                    if key.lower().endswith('.pdf'):
                        # Convert path to thumbnail path: ACADEMIC/CLASS/... -> ACADEMIC/WEBP/CLASS/...
                        thumb_key = key.replace('ACADEMIC/CLASS/', 'ACADEMIC/WEBP/CLASS/')
                        thumb_key = thumb_key.rsplit('.', 1)[0] + '.webp'
                        encoded_thumb_key = quote(thumb_key, safe='/')
                        thumb_url = f"{R2_PUBLIC_URL}/{encoded_thumb_key}"
                        result_images[public_url] = thumb_url  # Use thumbnail for display, key is PDF URL
                    else:
                        result_images[public_url] = public_url
            
            # If we got subfolder filters but no images, dig deeper
            if r2_filters and not result_images:
                # Get images from subfolders
                paginator = s3_client.get_paginator('list_objects_v2')
                for page in paginator.paginate(Bucket=R2_BUCKET, Prefix=folder_path + '/', MaxKeys=images_per_page):
                    for obj in page.get('Contents', []):
                        key = obj['Key']
                        if key.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf')):
                            encoded_key = quote(key, safe='/')
                            public_url = f"{R2_PUBLIC_URL}/{encoded_key}"
                            # For PDFs, try to find corresponding thumbnail
                            if key.lower().endswith('.pdf'):
                                thumb_key = key.replace('ACADEMIC/CLASS/', 'ACADEMIC/WEBP/CLASS/')
                                thumb_key = thumb_key.rsplit('.', 1)[0] + '.webp'
                                encoded_thumb_key = quote(thumb_key, safe='/')
                                thumb_url = f"{R2_PUBLIC_URL}/{encoded_thumb_key}"
                                result_images[public_url] = thumb_url
                            else:
                                result_images[public_url] = public_url
                            if len(result_images) >= images_per_page:
                                break
                    if len(result_images) >= images_per_page:
                        break
                        
            logger.info(f"R2 listing returned {len(result_images)} images and {len(filters)} filters")
            
            # Cache the result
            r2_result = {
                "list": result_images,
                "continuationToken": None,
                "isTruncated": len(result_images) >= images_per_page,
                "filters": filters,
                "filterField": filter_field,
                "totalCount": len(result_images)  # Use actual image count for R2 results
            }
            set_cached_r2_listing(cache_key, r2_result)
            return r2_result
            
        except Exception as e:
            logger.error(f"R2 listing error: {e}")
    
    # If no images found, return empty dict (not placeholder)
    if not result_images:
        logger.warning(f"No images found for query: {query}")
        return {
            "list": {},
            "continuationToken": None,
            "isTruncated": False,
            "filters": filters,
            "filterField": filter_field,
            "totalCount": 0
        }
    
    # Get total count for pagination
    total_count = await db.resource_images.count_documents(query)
    
    return {
        "list": result_images,
        "continuationToken": None,
        "isTruncated": len(result_images) >= images_per_page,
        "filters": filters,
        "filterField": filter_field,
        "totalCount": total_count
    }

# Academic filter endpoints
@app.post("/api/rest/academic/subjects")
async def get_academic_subjects(body: dict):
    """Get distinct subjects for a class"""
    class_level = body.get("class_level", "").upper()
    
    if not class_level:
        return {"subjects": []}
    
    query = {
        "category": "ACADEMIC",
        "menu": "CLASS",
        "sub_menu": class_level
    }
    
    subjects = await db.resource_images.distinct("subject", query)
    # Filter out None values and sort
    subjects = [s for s in subjects if s]
    subjects.sort()
    
    logger.info(f"Subjects for {class_level}: {subjects}")
    return {"subjects": subjects}

@app.post("/api/rest/academic/book-types")
async def get_academic_book_types(body: dict):
    """Get distinct book types for a class and subject"""
    class_level = body.get("class_level", "").upper()
    subject = body.get("subject", "").upper()
    
    if not class_level or not subject:
        return {"book_types": []}
    
    query = {
        "category": "ACADEMIC",
        "menu": "CLASS",
        "sub_menu": class_level,
        "subject": subject
    }
    
    book_types = await db.resource_images.distinct("book_type", query)
    # Filter out None values and sort
    book_types = [bt for bt in book_types if bt]
    book_types.sort()
    
    logger.info(f"Book types for {class_level}/{subject}: {book_types}")
    return {"book_types": book_types}

@app.post("/api/rest/academic/unit-lessons")
async def get_academic_unit_lessons(body: dict):
    """Get distinct unit lessons for a class, subject, and book type"""
    class_level = body.get("class_level", "").upper()
    subject = body.get("subject", "").upper()
    book_type = body.get("book_type", "").upper()
    
    if not class_level or not subject or not book_type:
        return {"unit_lessons": []}
    
    query = {
        "category": "ACADEMIC",
        "menu": "CLASS",
        "sub_menu": class_level,
        "subject": subject,
        "book_type": book_type
    }
    
    unit_lessons = await db.resource_images.distinct("unit_lesson", query)
    # Filter out None values
    unit_lessons = [ul for ul in unit_lessons if ul]
    
    logger.info(f"Unit lessons for {class_level}/{subject}/{book_type}: {len(unit_lessons)} lessons")
    return {"unit_lessons": unit_lessons}

@images_router.get("/myImages/get")
async def get_my_images(
    limit: int = Query(100, ge=1, le=500),
    lastId: Optional[str] = None,
    lastSavedOn: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get user's saved images"""
    query = {"user_id": current_user["id"]}
    
    if lastId and lastSavedOn:
        query["id"] = {"$gt": lastId}
    
    raw_images = await db.my_images.find(query, {"_id": 0}).sort("saved_on", -1).limit(limit).to_list(limit)
    
    # Get R2 base URL for constructing full image URLs
    # Using global R2_BASE_URL
    
    # Transform images to match frontend expected format (objectKey and url)
    images = []
    for img in raw_images:
        image_path = img.get("image_url", "")
        
        # Check if image_path is already a full URL
        if image_path.startswith("http://") or image_path.startswith("https://"):
            full_url = image_path
        else:
            # Build full URL from path
            clean_path = image_path.lstrip("/")
            if clean_path.startswith("uploads/"):
                clean_path = clean_path[8:]
            full_url = f"{R2_BASE_URL}/{clean_path}" if clean_path else ""
        
        images.append({
            "id": img.get("id"),
            "objectKey": image_path,  # Frontend expects objectKey
            "url": full_url,          # Frontend expects url for rendering
            "thumbnail_url": full_url,  # For thumbnails
            "is_favourite": img.get("is_favourite", False),
            "saved_on": img.get("saved_on")
        })
    
    return {
        "images": images,
        "count": len(images),
        "lastId": images[-1]["id"] if images else None,
        "lastSavedOn": images[-1].get("saved_on") if images else None
    }

@images_router.get("/myImages/getFavourite")
async def get_favourite_images(
    limit: int = Query(100, ge=1, le=500),
    lastId: Optional[str] = None,
    lastSavedOn: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get user's favourite images"""
    query = {"user_id": current_user["id"], "is_favourite": True}
    
    if lastId and lastSavedOn:
        query["id"] = {"$gt": lastId}
    
    raw_images = await db.my_images.find(query, {"_id": 0}).sort("saved_on", -1).limit(limit).to_list(limit)
    
    # Get R2 base URL for constructing full image URLs
    # Using global R2_BASE_URL
    
    # Transform images to match frontend expected format (objectKey and url)
    images = []
    for img in raw_images:
        image_path = img.get("image_url", "")
        
        # Check if image_path is already a full URL
        if image_path.startswith("http://") or image_path.startswith("https://"):
            full_url = image_path
        else:
            # Build full URL from path
            clean_path = image_path.lstrip("/")
            if clean_path.startswith("uploads/"):
                clean_path = clean_path[8:]
            full_url = f"{R2_BASE_URL}/{clean_path}" if clean_path else ""
        
        images.append({
            "id": img.get("id"),
            "objectKey": image_path,  # Frontend expects objectKey
            "url": full_url,          # Frontend expects url for rendering
            "thumbnail_url": full_url,  # For thumbnails
            "is_favourite": img.get("is_favourite", False),
            "saved_on": img.get("saved_on")
        })
    
    return {
        "images": images,
        "count": len(images),
        "lastId": images[-1]["id"] if images else None,
        "lastSavedOn": images[-1].get("saved_on") if images else None
    }

@images_router.put("/myImages/save")
async def save_my_images(body: dict, current_user: dict = Depends(get_current_user)):
    """Save images to user's collection"""
    images = body.get("images", [])
    mark_favourite = body.get("markFavourite", False)
    
    saved_count = 0
    for image_url in images:
        # Check if image already exists for this user
        existing = await db.my_images.find_one({
            "user_id": current_user["id"],
            "image_url": image_url
        })
        if existing:
            continue  # Skip duplicates
            
        image_doc = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "image_url": image_url,
            "is_favourite": mark_favourite,
            "saved_on": datetime.now(timezone.utc).isoformat()
        }
        await db.my_images.insert_one(image_doc)
        saved_count += 1
    
    # Note: Credit deduction removed per user request
    
    return {"message": "Success", "saved_count": saved_count}

@images_router.patch("/myImages/addToFavourite")
async def add_to_favourites(body: dict, current_user: dict = Depends(get_current_user)):
    """Add images to favourites"""
    ids = body.get("ids", [])
    result = await db.my_images.update_many(
        {"id": {"$in": ids}, "user_id": current_user["id"]},
        {"$set": {"is_favourite": True}}
    )
    return f"Updated {result.modified_count} images"

@images_router.patch("/myImages/removeFromFavourite")
async def remove_from_favourites(body: dict, current_user: dict = Depends(get_current_user)):
    """Remove images from favourites"""
    ids = body.get("ids", [])
    result = await db.my_images.update_many(
        {"id": {"$in": ids}, "user_id": current_user["id"]},
        {"$set": {"is_favourite": False}}
    )
    return f"Updated {result.modified_count} images"

@images_router.delete("/myImages/delete")
async def delete_my_images(body: dict, current_user: dict = Depends(get_current_user)):
    """Delete user's images"""
    ids = body.get("ids", [])
    result = await db.my_images.delete_many(
        {"id": {"$in": ids}, "user_id": current_user["id"]}
    )
    return f"Deleted {result.deleted_count} images"

@images_router.get("/download")
async def download_image(
    url: str = Query(..., description="Image URL to download"),
    filename: str = Query(None, description="Filename for download"),
    current_user: dict = Depends(get_current_user)
):
    """Proxy download for images to bypass CORS"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            
            if response.status_code != 200:
                raise HTTPException(status_code=404, detail="Image not found")
            
            content = response.content
            content_type = response.headers.get("content-type", "image/jpeg")
            
            # Determine filename
            if not filename:
                # Extract from URL
                filename = url.split("/")[-1].split("?")[0]
                if not filename:
                    filename = "download.jpg"
            
            # Decode URL-encoded filename
            from urllib.parse import unquote
            filename = unquote(filename)
            
            return Response(
                content=content,
                media_type=content_type,
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"',
                    "Access-Control-Allow-Origin": "*",
                }
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Download timeout")
    except Exception as e:
        logger.error(f"Download error: {e}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@images_router.get("/pdf-thumbnail")
async def generate_pdf_thumbnail(
    url: str = Query(..., description="URL of the PDF file"),
    width: int = Query(144, ge=50, le=500),
    height: int = Query(185, ge=50, le=500),
):
    """Generate a thumbnail from a PDF file using poppler (pdftoppm)"""
    import tempfile
    import subprocess
    import os
    from urllib.parse import unquote
    
    try:
        # Download the PDF
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, follow_redirects=True)
            if response.status_code != 200:
                raise HTTPException(status_code=404, detail="PDF not found")
            
            pdf_content = response.content
        
        # Create temp files
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as pdf_file:
            pdf_file.write(pdf_content)
            pdf_path = pdf_file.name
        
        output_prefix = pdf_path.replace('.pdf', '')
        
        try:
            # Use pdftoppm to generate thumbnail (first page only)
            cmd = [
                'pdftoppm',
                '-jpeg',
                '-f', '1',  # First page
                '-l', '1',  # Last page (same as first)
                '-scale-to', str(max(width, height)),
                pdf_path,
                output_prefix
            ]
            
            result = subprocess.run(cmd, capture_output=True, timeout=30)
            
            if result.returncode != 0:
                logger.error(f"pdftoppm error: {result.stderr.decode()}")
                raise HTTPException(status_code=500, detail="Failed to generate thumbnail")
            
            # Find the generated image
            output_path = f"{output_prefix}-1.jpg"
            if not os.path.exists(output_path):
                output_path = f"{output_prefix}-01.jpg"  # Sometimes has leading zero
            
            if not os.path.exists(output_path):
                raise HTTPException(status_code=500, detail="Thumbnail generation failed")
            
            # Read and return the thumbnail
            with open(output_path, 'rb') as img_file:
                thumbnail_content = img_file.read()
            
            # Cleanup temp files
            os.unlink(pdf_path)
            os.unlink(output_path)
            
            return Response(
                content=thumbnail_content,
                media_type="image/jpeg",
                headers={
                    "Cache-Control": "public, max-age=86400",  # Cache for 24 hours
                    "Access-Control-Allow-Origin": "*",
                }
            )
            
        except subprocess.TimeoutExpired:
            raise HTTPException(status_code=504, detail="Thumbnail generation timeout")
        finally:
            # Cleanup
            if os.path.exists(pdf_path):
                os.unlink(pdf_path)
    
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="PDF download timeout")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF thumbnail error: {e}")
        raise HTTPException(status_code=500, detail=f"Thumbnail generation failed: {str(e)}")

@images_router.post("/submitForApproval")
async def submit_image_for_approval(
    file: UploadFile = File(...),
    category: str = Form(...),
    subcategory: str = Form(None),
    title: str = Form(...),
    description: str = Form(None),
    tags: str = Form(""),
    current_user: dict = Depends(get_current_user)
):
    """Submit an image for Super Admin approval. After approval, it will be added to the resource library."""
    
    # Validate file type - Issue 27: Allow PDF files
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed. Only images and PDFs are accepted.")
    
    # Read file content
    content = await file.read()
    
    # Upload to R2 storage if available, or local storage
    file_ext = Path(file.filename).suffix.lower()
    unique_filename = f"pending/{uuid.uuid4()}{file_ext}"
    
    # Try to upload to R2
    image_url = None
    try:
        r2_client = boto3.client(
            's3',
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_ACCESS_KEY,
            aws_secret_access_key=R2_SECRET_KEY,
            region_name='auto'
        )
        r2_client.put_object(
            Bucket=R2_BUCKET,
            Key=unique_filename,
            Body=content,
            ContentType=file.content_type
        )
        image_url = f"{R2_PUBLIC_URL}/{unique_filename}"
    except Exception as e:
        # Fallback to local storage
        local_path = UPLOAD_DIR / "pending"
        local_path.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(local_path / Path(unique_filename).name, 'wb') as out_file:
            await out_file.write(content)
        image_url = f"/uploads/pending/{Path(unique_filename).name}"
    
    # Create pending approval record
    approval_doc = {
        "id": str(uuid.uuid4()),
        "filename": unique_filename,
        "original_filename": file.filename,
        "category": category.upper(),
        "subcategory": subcategory.lower() if subcategory else None,
        "title": title,
        "description": description,
        "tags": [t.strip().lower() for t in tags.split(",") if t.strip()],
        "url": image_url,
        "file_size": len(content),
        "content_type": file.content_type,
        "submitted_by": current_user["id"],
        "submitted_by_name": current_user.get("name"),
        "submitted_by_email": current_user.get("email"),
        "school_code": current_user.get("school_code"),
        "status": "pending",
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.pending_approvals.insert_one(approval_doc)
    
    return {
        "success": True,
        "message": "Image submitted for approval. Super Admin will review and approve.",
        "imageId": approval_doc["id"]
    }

@images_router.get("/mySubmissions")
async def get_my_submissions(
    status: Optional[str] = None,  # pending, approved, rejected
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get images submitted by current user for approval"""
    query = {"submitted_by": current_user["id"]}
    if status:
        query["status"] = status
    
    submissions = await db.pending_approvals.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return {"submissions": submissions}

@images_router.get("/admin/getPendingApprovals")
async def get_pending_approvals(
    limit: int = Query(10, ge=1, le=100),
    lastS3Key: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get pending image approvals for admin"""
    user_role = current_user.get("role")
    if user_role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {"status": "pending"}
    
    # Filter by school for school admins
    if user_role == UserRole.SCHOOL_ADMIN:
        query["school_code"] = current_user.get("school_code")
    
    pending_images = await db.pending_approvals.find(query, {"_id": 0}).limit(limit).to_list(limit)
    
    # Return empty array if no pending images
    return {"images": pending_images, "pendingImages": pending_images}

@images_router.post("/admin/approveImage")
async def approve_image(
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """Approve a pending image"""
    user_role = current_user.get("role")
    if user_role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    image_id = body.get("imageId")
    if not image_id:
        raise HTTPException(status_code=400, detail="imageId is required")
    
    # Move from pending to approved
    pending = await db.pending_approvals.find_one({"id": image_id})
    if not pending:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Add to resource images
    pending["status"] = "approved"
    pending["approved_by"] = current_user["id"]
    pending["approved_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.resource_images.insert_one(pending)
    await db.pending_approvals.delete_one({"id": image_id})
    
    return {"message": "Image approved successfully"}

@images_router.post("/admin/rejectImage")
async def reject_image(
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """Reject a pending image"""
    user_role = current_user.get("role")
    if user_role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    image_id = body.get("imageId")
    reason = body.get("reason", "")
    
    if not image_id:
        raise HTTPException(status_code=400, detail="imageId is required")
    
    # Update status to rejected
    result = await db.pending_approvals.update_one(
        {"id": image_id},
        {"$set": {
            "status": "rejected",
            "rejected_by": current_user["id"],
            "rejected_at": datetime.now(timezone.utc).isoformat(),
            "rejection_reason": reason
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Image not found")
    
    return {"message": "Image rejected successfully"}

# ============== ADMIN PANEL ROUTES ==============
@admin_router.get("/categories")
async def get_categories(current_user: dict = Depends(require_admin_or_above)):
    """Get all resource categories and their structure"""
    categories = [
        {
            "id": "ACADEMIC",
            "name": "Academic",
            "icon": "school",
            "subcategories": [
                {"id": "thumbnails", "name": "Thumbnails"},
                {"id": "class-1", "name": "Class 1"},
                {"id": "class-2", "name": "Class 2"},
                {"id": "class-3", "name": "Class 3"},
                {"id": "class-4", "name": "Class 4"},
                {"id": "class-5", "name": "Class 5"},
                {"id": "class-6", "name": "Class 6"},
                {"id": "class-7", "name": "Class 7"},
                {"id": "class-8", "name": "Class 8"},
                {"id": "class-9", "name": "Class 9"},
                {"id": "class-10", "name": "Class 10"},
                {"id": "class-11", "name": "Class 11"},
                {"id": "class-12", "name": "Class 12"}
            ]
        },
        {
            "id": "EARLY-CAREER",
            "name": "Early Career",
            "icon": "work",
            "subcategories": [
                {"id": "thumbnails", "name": "Thumbnails"},
                {"id": "resume-templates", "name": "Resume Templates"},
                {"id": "career-guidance", "name": "Career Guidance"},
                {"id": "skill-development", "name": "Skill Development"}
            ]
        },
        {
            "id": "EDUTAINMENT",
            "name": "Edutainment",
            "icon": "games",
            "subcategories": [
                {"id": "thumbnails", "name": "Thumbnails"},
                {"id": "puzzles", "name": "Puzzles"},
                {"id": "games", "name": "Games"},
                {"id": "activities", "name": "Activities"}
            ]
        },
        {
            "id": "PRINT-RICH",
            "name": "Print Rich",
            "icon": "print",
            "subcategories": [
                {"id": "thumbnails", "name": "Thumbnails"},
                {"id": "posters", "name": "Posters"},
                {"id": "certificates", "name": "Certificates"},
                {"id": "worksheets", "name": "Worksheets"}
            ]
        },
        {
            "id": "MAKER",
            "name": "Maker",
            "icon": "build",
            "subcategories": [
                {"id": "thumbnails", "name": "Thumbnails"},
                {"id": "templates", "name": "Templates"},
                {"id": "tools", "name": "Tools"}
            ]
        },
        {
            "id": "INFO-HUB",
            "name": "Info Hub",
            "icon": "info",
            "subcategories": [
                {"id": "thumbnails", "name": "Thumbnails"},
                {"id": "guides", "name": "Guides"},
                {"id": "resources", "name": "Resources"}
            ]
        }
    ]
    
    # Get counts for each category
    for cat in categories:
        cat["imageCount"] = await db.resource_images.count_documents({"category": cat["id"]})
        for subcat in cat["subcategories"]:
            subcat["imageCount"] = await db.resource_images.count_documents({
                "category": cat["id"],
                "subcategory": subcat["id"]
            })
    
    return {"categories": categories}

@admin_router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    category: str = Form(...),
    subcategory: str = Form(None),
    title: str = Form(...),
    description: str = Form(None),
    tags: str = Form(""),  # Comma-separated tags
    current_user: dict = Depends(require_admin_or_above)
):
    """Upload an image to the resource library - uploads to R2"""
    import boto3
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed")
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix.lower()
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    
    # Create S3 path
    if subcategory:
        s3_path = f"{category.upper()}/{subcategory.upper()}/IMAGES/{unique_filename}"
    else:
        s3_path = f"{category.upper()}/IMAGES/{unique_filename}"
    
    # Read file content
    content = await file.read()
    
    # Determine approval status based on role
    user_role = current_user.get("role")
    is_approved = user_role == UserRole.SUPER_ADMIN
    status = "approved" if is_approved else "pending"
    
    # Upload to R2
    try:
        r2_client = boto3.client(
            's3',
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_ACCESS_KEY,
            aws_secret_access_key=R2_SECRET_KEY,
            region_name='auto'
        )
        
        r2_client.put_object(
            Bucket=R2_BUCKET,
            Key=s3_path,
            Body=content,
            ContentType=file.content_type
        )
        
        public_url = f"{R2_PUBLIC_URL}/{s3_path}"
        
    except Exception as e:
        logger.error(f"R2 upload error: {e}")
        # Fallback to local storage
        category_dir = UPLOAD_DIR / category.upper()
        if subcategory:
            category_dir = category_dir / subcategory.upper() / "IMAGES"
        else:
            category_dir = category_dir / "IMAGES"
        category_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = category_dir / unique_filename
        async with aiofiles.open(file_path, 'wb') as out_file:
            await out_file.write(content)
        
        public_url = f"/uploads/{s3_path}"
    
    # Create database record
    image_doc = {
        "id": str(uuid.uuid4()),
        "filename": unique_filename,
        "original_filename": file.filename,
        "folder_path": f"{category.upper()}/{subcategory.upper() if subcategory else ''}".rstrip('/'),
        "category": category.upper(),
        "subcategory": subcategory.upper() if subcategory else None,
        "title": title,
        "description": description,
        "tags": [t.strip().lower() for t in tags.split(",") if t.strip()],
        "s3_path": s3_path,
        "url": public_url,
        "thumbnail_url": public_url,
        "file_size": len(content),
        "content_type": file.content_type,
        "status": status,
        "uploaded_by": current_user["id"],
        "uploaded_by_role": user_role,
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.resource_images.insert_one(image_doc)
    
    return {
        "message": f"Image uploaded successfully{' and approved' if is_approved else ' - pending approval'}",
        "status": status,
        "image": {k: v for k, v in image_doc.items() if k != "_id"}
    }

@admin_router.get("/images")
async def list_admin_images(
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(require_admin_or_above)
):
    """List all uploaded images with filtering"""
    query = {}
    
    if category:
        query["category"] = category.upper()
    if subcategory:
        query["subcategory"] = subcategory.lower()
    
    images = await db.resource_images.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.resource_images.count_documents(query)
    
    return {
        "images": images,
        "total": total,
        "limit": limit,
        "skip": skip
    }

@admin_router.get("/pending-images")
async def get_pending_images(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(require_super_admin)
):
    """Get all pending images for approval (Super Admin only)"""
    query = {"status": "pending"}
    
    total = await db.resource_images.count_documents(query)
    images = await db.resource_images.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    return {
        "images": images,
        "total": total,
        "limit": limit,
        "skip": skip
    }

@admin_router.post("/approve-image/{image_id}")
async def approve_image(
    image_id: str,
    current_user: dict = Depends(require_super_admin)
):
    """Approve a pending image (Super Admin only)"""
    result = await db.resource_images.update_one(
        {"id": image_id, "status": "pending"},
        {"$set": {
            "status": "approved",
            "approved_by": current_user["id"],
            "approved_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Image not found or already approved")
    
    return {"message": "Image approved successfully"}

@admin_router.post("/reject-image/{image_id}")
async def reject_image(
    image_id: str,
    reason: str = "",
    current_user: dict = Depends(require_super_admin)
):
    """Reject a pending image (Super Admin only)"""
    result = await db.resource_images.update_one(
        {"id": image_id, "status": "pending"},
        {"$set": {
            "status": "rejected",
            "rejected_by": current_user["id"],
            "rejection_reason": reason,
            "rejected_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Image not found or already processed")
    
    return {"message": "Image rejected"}

@admin_router.delete("/images/{image_id}")
async def delete_admin_image(
    image_id: str,
    current_user: dict = Depends(require_admin_or_above)
):
    """Delete an uploaded image"""
    image = await db.resource_images.find_one({"id": image_id})
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Delete file
    file_path = UPLOAD_DIR / image["category"] / (image.get("subcategory", "") + "/" if image.get("subcategory") else "") / image["filename"]
    if file_path.exists():
        file_path.unlink()
    
    # Delete database record
    await db.resource_images.delete_one({"id": image_id})
    
    return {"message": "Image deleted successfully"}

# ============== SUPPORT/HELP ROUTES ==============
support_router = APIRouter(prefix="/support", tags=["Support"])

class SupportRequest(BaseModel):
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=10, max_length=2000)
    category: Optional[str] = "general"

@support_router.post("/submit")
async def submit_support_request(
    request: SupportRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Submit a support/help request"""
    support_id = str(uuid.uuid4())
    
    support_data = {
        "id": support_id,
        "user_id": current_user["id"],
        "user_email": current_user.get("email"),
        "user_name": current_user.get("name"),
        "user_role": current_user.get("role"),
        "school_code": current_user.get("school_code"),
        "subject": request.subject,
        "message": request.message,
        "category": request.category,
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.support_requests.insert_one(support_data)
    
    # Send email notification to admin (background task)
    admin_email = os.environ.get("ADMIN_EMAIL", "support@myschool.in")
    if SMTP_HOST and SMTP_USER:
        try:
            background_tasks.add_task(
                send_email,
                admin_email,
                f"[Support Request] {request.subject}",
                f"""
                <h2>New Support Request</h2>
                <p><strong>From:</strong> {current_user.get('name')} ({current_user.get('email')})</p>
                <p><strong>Role:</strong> {current_user.get('role')}</p>
                <p><strong>School Code:</strong> {current_user.get('school_code', 'N/A')}</p>
                <p><strong>Category:</strong> {request.category}</p>
                <hr>
                <p><strong>Message:</strong></p>
                <p>{request.message}</p>
                """
            )
        except Exception as e:
            logger.error(f"Failed to send support email: {e}")
    
    return {
        "success": True,
        "message": "Your support request has been submitted successfully. We will get back to you soon.",
        "ticketId": support_id
    }

@support_router.get("/requests")
async def get_support_requests(
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user)
):
    """Get support requests - Super Admin sees all, others see their own"""
    user_role = current_user.get("role")
    
    query = {}
    if user_role != UserRole.SUPER_ADMIN:
        query["user_id"] = current_user["id"]
    
    if status:
        query["status"] = status
    
    requests = await db.support_requests.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"requests": requests}

@support_router.patch("/resolve/{ticket_id}")
async def resolve_support_request(
    ticket_id: str,
    body: dict,
    current_user: dict = Depends(require_super_admin)
):
    """Resolve a support request - Super Admin only"""
    resolution = body.get("resolution", "Resolved")
    
    result = await db.support_requests.update_one(
        {"id": ticket_id},
        {"$set": {
            "status": "resolved",
            "resolution": resolution,
            "resolved_by": current_user["id"],
            "resolved_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return {"message": "Support request resolved"}

@admin_router.get("/dashboard-stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get dashboard statistics based on user role"""
    user_role = current_user.get("role")
    school_code = current_user.get("school_code")
    teacher_code = current_user.get("teacher_code")
    
    stats = {
        "totalImages": 0,
        "totalUsers": 0,
        "totalStudents": 0,
        "totalTeachers": 0,
        "totalSchools": 0,
        "activeUsers": 0,
        "disabledUsers": 0,
        "totalCreditsUsed": 0,
        "recentActivity": [],
        "userRole": user_role
    }
    
    if user_role == UserRole.SUPER_ADMIN:
        # Super Admin sees everything
        stats["totalSchools"] = await db.users.count_documents({"role": UserRole.SCHOOL_ADMIN})
        stats["totalTeachers"] = await db.users.count_documents({"role": UserRole.TEACHER})
        stats["totalStudents"] = await db.users.count_documents({"role": UserRole.STUDENT})
        stats["totalUsers"] = stats["totalSchools"] + stats["totalTeachers"] + stats["totalStudents"]
        stats["totalImages"] = await db.resource_images.count_documents({})
        stats["activeUsers"] = await db.users.count_documents({"disabled": {"$ne": True}})
        stats["disabledUsers"] = await db.users.count_documents({"disabled": True})
        
        # Get total credits used (sum of all downloads)
        credit_pipeline = [{"$group": {"_id": None, "total": {"$sum": "$credits_used"}}}]
        credit_result = await db.users.aggregate(credit_pipeline).to_list(1)
        stats["totalCreditsUsed"] = credit_result[0]["total"] if credit_result else 0
        
        # Get recent registrations (last 5)
        recent_users = await db.users.find(
            {}, {"_id": 0, "name": 1, "email": 1, "role": 1, "created_at": 1}
        ).sort("created_at", -1).limit(5).to_list(5)
        stats["recentActivity"] = recent_users
        
    elif user_role == UserRole.SCHOOL_ADMIN:
        # Admin sees users in their school
        stats["totalTeachers"] = await db.users.count_documents({"school_code": school_code, "role": UserRole.TEACHER})
        stats["totalStudents"] = await db.users.count_documents({"school_code": school_code, "role": UserRole.STUDENT})
        stats["totalUsers"] = stats["totalTeachers"] + stats["totalStudents"]
        stats["activeUsers"] = await db.users.count_documents({"school_code": school_code, "disabled": {"$ne": True}})
        stats["disabledUsers"] = await db.users.count_documents({"school_code": school_code, "disabled": True})
        
        # Get total credits used by users in this school
        credit_pipeline = [
            {"$match": {"school_code": school_code}},
            {"$group": {"_id": None, "total": {"$sum": "$credits_used"}}}
        ]
        credit_result = await db.users.aggregate(credit_pipeline).to_list(1)
        stats["totalCreditsUsed"] = credit_result[0]["total"] if credit_result and credit_result[0].get("total") else 0
        
        # Recent registrations in this school
        recent_users = await db.users.find(
            {"school_code": school_code}, {"_id": 0, "name": 1, "email": 1, "role": 1, "created_at": 1}
        ).sort("created_at", -1).limit(5).to_list(5)
        stats["recentActivity"] = recent_users
        
    elif user_role == UserRole.TEACHER:
        # Teacher sees only their students
        stats["totalStudents"] = await db.users.count_documents({
            "school_code": school_code, 
            "teacher_code": teacher_code, 
            "role": UserRole.STUDENT
        })
        stats["totalUsers"] = stats["totalStudents"]
        stats["activeUsers"] = await db.users.count_documents({
            "school_code": school_code, 
            "teacher_code": teacher_code, 
            "role": UserRole.STUDENT,
            "disabled": {"$ne": True}
        })
        stats["disabledUsers"] = await db.users.count_documents({
            "school_code": school_code, 
            "teacher_code": teacher_code, 
            "role": UserRole.STUDENT,
            "disabled": True
        })
    
    return stats

@admin_router.get("/user-logs")
async def get_user_logs(
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Get recent user activity logs"""
    user_role = current_user.get("role")
    school_code = current_user.get("school_code")
    
    query = {}
    if user_role == UserRole.SCHOOL_ADMIN:
        query["school_code"] = school_code
    elif user_role == UserRole.TEACHER:
        query["teacher_code"] = current_user.get("teacher_code")
    
    # Get recent login/activity logs from users collection
    logs = []
    
    # Get users with last_login ordered by most recent
    users = await db.users.find(
        {**query, "last_login": {"$exists": True}},
        {"_id": 0, "name": 1, "email": 1, "role": 1, "last_login": 1, "created_at": 1, "school_name": 1, "credits_used": 1}
    ).sort("last_login", -1).limit(limit).to_list(limit)
    
    for user in users:
        if user.get("last_login"):
            logs.append({
                "user": user.get("name", "Unknown"),
                "email": user.get("email", ""),
                "action": "login",
                "timestamp": user.get("last_login").isoformat() if isinstance(user.get("last_login"), datetime) else user.get("last_login"),
                "school": user.get("school_name", ""),
                "details": f"Credits used: {user.get('credits_used', 0)}"
            })
    
    return {"logs": logs}

@admin_router.get("/user-logs/stats")
async def get_user_logs_stats(current_user: dict = Depends(get_current_user)):
    """Get user activity statistics"""
    user_role = current_user.get("role")
    school_code = current_user.get("school_code")
    
    query = {}
    if user_role == UserRole.SCHOOL_ADMIN:
        query["school_code"] = school_code
    elif user_role == UserRole.TEACHER:
        query["teacher_code"] = current_user.get("teacher_code")
    
    from datetime import datetime, timedelta
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Today's activity (logins today)
    today_query = {**query, "last_login": {"$gte": today}}
    todays_activity = await db.users.count_documents(today_query)
    
    # Total downloads (sum of credits_used)
    pipeline = [
        {"$match": query} if query else {"$match": {}},
        {"$group": {"_id": None, "total": {"$sum": "$credits_used"}}}
    ]
    download_result = await db.users.aggregate(pipeline).to_list(1)
    total_downloads = download_result[0]["total"] if download_result else 0
    
    return {
        "todays_activity": todays_activity,
        "total_downloads": total_downloads,
        "recent_activity_count": await db.users.count_documents({**query, "last_login": {"$exists": True}})
    }

# ============== ORDERS ROUTES ==============
orders_router = APIRouter(prefix="/orders", tags=["Orders"])

# ============== STRIPE PAYMENT ENDPOINTS ==============
payment_router = APIRouter(prefix="/payments", tags=["Payments"])

class CreateCheckoutRequest(BaseModel):
    plan_type: str = Field(..., description="Plan type: 'basic', 'premium', 'enterprise'")
    success_url: str = Field(..., description="URL to redirect after successful payment")
    cancel_url: str = Field(..., description="URL to redirect if payment is cancelled")

class SubscriptionPlan(BaseModel):
    id: str
    name: str
    price: int  # in cents/paise
    credits: int
    features: List[str]

# Subscription plans
SUBSCRIPTION_PLANS = {
    "basic": SubscriptionPlan(
        id="basic",
        name="Basic Plan",
        price=49900,  # ₹499
        credits=100,
        features=["100 Downloads", "Basic Templates", "Email Support"]
    ),
    "premium": SubscriptionPlan(
        id="premium", 
        name="Premium Plan",
        price=99900,  # ₹999
        credits=500,
        features=["500 Downloads", "All Templates", "Priority Support", "No Watermarks"]
    ),
    "enterprise": SubscriptionPlan(
        id="enterprise",
        name="Enterprise Plan", 
        price=249900,  # ₹2499
        credits=2000,
        features=["Unlimited Downloads", "All Features", "24/7 Support", "Custom Branding", "API Access"]
    )
}

@payment_router.get("/plans")
async def get_subscription_plans():
    """Get available subscription plans"""
    return {
        "plans": [
            {
                "id": plan.id,
                "name": plan.name,
                "price": plan.price / 100,  # Convert to rupees
                "credits": plan.credits,
                "features": plan.features
            }
            for plan in SUBSCRIPTION_PLANS.values()
        ]
    }

@payment_router.post("/create-checkout-session")
async def create_checkout_session(
    request: CreateCheckoutRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a Stripe checkout session"""
    plan = SUBSCRIPTION_PLANS.get(request.plan_type)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan type")
    
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'inr',
                    'unit_amount': plan.price,
                    'product_data': {
                        'name': plan.name,
                        'description': f"{plan.credits} credits - {', '.join(plan.features[:2])}",
                    },
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=request.success_url + '?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=request.cancel_url,
            client_reference_id=current_user["id"],
            metadata={
                'user_id': current_user["id"],
                'plan_type': request.plan_type,
                'credits': str(plan.credits)
            }
        )
        
        # Store order in database
        order = {
            "id": checkout_session.id,
            "user_id": current_user["id"],
            "plan_type": request.plan_type,
            "amount": plan.price,
            "currency": "INR",
            "credits": plan.credits,
            "status": "pending",
            "stripe_session_id": checkout_session.id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.orders.insert_one(order)
        
        return {
            "sessionId": checkout_session.id,
            "url": checkout_session.url
        }
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@payment_router.post("/verify-session")
async def verify_payment_session(
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """Verify a completed payment session"""
    session_id = body.get("sessionId")
    if not session_id:
        raise HTTPException(status_code=400, detail="sessionId is required")
    
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status == "paid":
            # Update order status
            order = await db.orders.find_one({"stripe_session_id": session_id})
            if order and order.get("status") != "completed":
                credits_to_add = order.get("credits", 0)
                plan_name = order.get("plan_name", "")
                
                # Calculate subscription expiry based on plan
                subscription_expiry = None
                if "monthly" in plan_name.lower():
                    subscription_expiry = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
                elif "annual" in plan_name.lower():
                    subscription_expiry = (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()
                elif "biannual" in plan_name.lower():
                    subscription_expiry = (datetime.now(timezone.utc) + timedelta(days=180)).isoformat()
                
                # Add credits to user and update subscription status
                update_data = {"$inc": {"credits": credits_to_add}}
                if subscription_expiry:
                    update_data["$set"] = {
                        "subscription_status": "active",
                        "subscription_expiry": subscription_expiry,
                        "last_subscription_plan": plan_name
                    }
                
                await db.users.update_one(
                    {"id": order["user_id"]},
                    update_data
                )
                
                # Update order status
                await db.orders.update_one(
                    {"stripe_session_id": session_id},
                    {"$set": {
                        "status": "completed",
                        "payment_id": session.payment_intent,
                        "completed_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                return {
                    "success": True,
                    "message": f"Payment successful! {credits_to_add} credits added.",
                    "credits_added": credits_to_add,
                    "subscription_status": "active" if subscription_expiry else "free"
                }
            elif order and order.get("status") == "completed":
                return {
                    "success": True,
                    "message": "Payment was already processed.",
                    "credits_added": order.get("credits", 0)
                }
        
        return {
            "success": False,
            "message": "Payment not completed",
            "status": session.payment_status
        }
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@payment_router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    if STRIPE_WEBHOOK_SECRET:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid signature")
    else:
        event = stripe.Event.construct_from(
            stripe.util.json.loads(payload), stripe.api_key
        )
    
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.get('client_reference_id') or session['metadata'].get('user_id')
        credits = int(session['metadata'].get('credits', 0))
        
        if user_id and credits:
            await db.users.update_one(
                {"id": user_id},
                {"$inc": {"credits": credits}}
            )
            await db.orders.update_one(
                {"stripe_session_id": session['id']},
                {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
            )
    
    return {"status": "success"}

@payment_router.get("/history")
async def get_payment_history(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100)
):
    """Get user's payment history"""
    orders = await db.orders.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"orders": orders}

# ============== RAZORPAY PAYMENT ENDPOINTS ==============

class RazorpayOrderRequest(BaseModel):
    plan_type: str = Field(..., description="Plan type: 'basic', 'premium', 'enterprise'")

class RazorpayVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@payment_router.post("/razorpay/create-order")
async def create_razorpay_order(
    request: RazorpayOrderRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a Razorpay order for payment"""
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Razorpay is not configured")
    
    plan = SUBSCRIPTION_PLANS.get(request.plan_type)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan type")
    
    try:
        # Create Razorpay order (amount in paise)
        razorpay_order = razorpay_client.order.create({
            "amount": plan.price,  # Already in paise
            "currency": "INR",
            "payment_capture": 1,  # Auto-capture payment
            "notes": {
                "user_id": current_user["id"],
                "plan_type": request.plan_type,
                "credits": str(plan.credits)
            }
        })
        
        # Store order in database
        order_doc = {
            "id": str(uuid.uuid4()),
            "razorpay_order_id": razorpay_order["id"],
            "user_id": current_user["id"],
            "plan_type": request.plan_type,
            "plan_name": plan.name,
            "amount": plan.price,  # Store in paise for consistency
            "credits": plan.credits,
            "currency": "INR",
            "status": "created",
            "payment_gateway": "razorpay",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.orders.insert_one(order_doc)
        
        return {
            "success": True,
            "order_id": razorpay_order["id"],
            "amount": plan.price,  # In paise for Razorpay
            "currency": "INR",
            "key_id": RAZORPAY_KEY_ID,
            "plan_name": plan.name,
            "credits": plan.credits,
            "user": {
                "name": current_user.get("name", ""),
                "email": current_user.get("email", ""),
                "phone": current_user.get("mobile", "")
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

@payment_router.post("/razorpay/verify-payment")
async def verify_razorpay_payment(
    request: RazorpayVerifyRequest,
    current_user: dict = Depends(get_current_user)
):
    """Verify Razorpay payment signature and add credits"""
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Razorpay is not configured")
    
    try:
        # Verify payment signature
        params_dict = {
            'razorpay_order_id': request.razorpay_order_id,
            'razorpay_payment_id': request.razorpay_payment_id,
            'razorpay_signature': request.razorpay_signature
        }
        
        # This will raise an exception if signature is invalid
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # Find the order
        order = await db.orders.find_one({"razorpay_order_id": request.razorpay_order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if order.get("status") == "completed":
            return {
                "success": True,
                "message": "Payment was already processed",
                "credits_added": 0
            }
        
        # Get payment details from Razorpay
        payment = razorpay_client.payment.fetch(request.razorpay_payment_id)
        
        if payment["status"] == "captured":
            credits_to_add = order.get("credits", 0)
            plan_type = order.get("plan_type", "basic")
            plan_name = order.get("plan_name", "Basic Plan")
            amount = order.get("amount", 0)
            
            # Determine subscription status based on plan
            subscription_status = plan_type
            
            # Add credits and update subscription status
            await db.users.update_one(
                {"id": current_user["id"]},
                {
                    "$inc": {"credits": credits_to_add},
                    "$set": {
                        "subscription_status": subscription_status,
                        "last_subscription_plan": plan_name,
                        "last_subscription_date": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            # Update order status
            await db.orders.update_one(
                {"razorpay_order_id": request.razorpay_order_id},
                {"$set": {
                    "status": "completed",
                    "razorpay_payment_id": request.razorpay_payment_id,
                    "razorpay_signature": request.razorpay_signature,
                    "completed_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Store payment record for history
            await db.payments.insert_one({
                "id": str(uuid4()),
                "user_id": current_user["id"],
                "razorpay_order_id": request.razorpay_order_id,
                "razorpay_payment_id": request.razorpay_payment_id,
                "plan_type": plan_type,
                "plan_name": plan_name,
                "amount": amount,
                "credits_added": credits_to_add,
                "status": "completed",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            return {
                "success": True,
                "message": f"Payment successful! {credits_to_add} credits added to your account.",
                "credits_added": credits_to_add,
                "plan": plan_name,
                "subscription_status": subscription_status
            }
        else:
            return {
                "success": False,
                "message": f"Payment not completed. Status: {payment['status']}"
            }
            
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment verification failed: {str(e)}")

@payment_router.post("/razorpay/webhook")
async def razorpay_webhook(request: Request):
    """Handle Razorpay webhooks"""
    try:
        payload = await request.json()
        event = payload.get("event")
        
        if event == "payment.captured":
            payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
            order_id = payment_entity.get("order_id")
            payment_id = payment_entity.get("id")
            
            if order_id:
                order = await db.orders.find_one({"razorpay_order_id": order_id})
                if order and order.get("status") != "completed":
                    credits_to_add = order.get("credits", 0)
                    user_id = order.get("user_id")
                    
                    # Add credits
                    await db.users.update_one(
                        {"id": user_id},
                        {"$inc": {"credits": credits_to_add}}
                    )
                    
                    # Update order
                    await db.orders.update_one(
                        {"razorpay_order_id": order_id},
                        {"$set": {
                            "status": "completed",
                            "razorpay_payment_id": payment_id,
                            "completed_at": datetime.now(timezone.utc).isoformat()
                        }}
                    )
        
        return {"status": "ok"}
    except Exception as e:
        print(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

# ============== SUPER ADMIN SUBSCRIPTION AGGREGATION ==============

@payment_router.get("/admin/subscription-stats")
async def get_subscription_stats(current_user: dict = Depends(require_super_admin)):
    """Get aggregated subscription and credits stats for Super Admin dashboard"""
    
    # Get all users onboarded by super admin (users without school_code or with registration_type='super_admin_onboarded')
    # Also get School Admins and their subscription status
    
    pipeline = [
        {
            "$match": {
                "role": {"$in": ["SCHOOL_ADMIN", "TEACHER", "STUDENT"]},
                "$or": [
                    {"added_by": current_user["id"]},
                    {"registration_type": "super_admin_onboarded"},
                    {"role": "SCHOOL_ADMIN"}  # All school admins
                ]
            }
        },
        {
            "$group": {
                "_id": "$role",
                "total_users": {"$sum": 1},
                "total_credits": {"$sum": {"$ifNull": ["$credits", 0]}},
                "subscribed_users": {
                    "$sum": {
                        "$cond": [{"$gt": [{"$ifNull": ["$credits", 0]}, 0]}, 1, 0]
                    }
                }
            }
        }
    ]
    
    role_stats = await db.users.aggregate(pipeline).to_list(None)
    
    # Get recent orders/payments
    recent_orders = await db.orders.find(
        {"status": "completed"},
        {"_id": 0}
    ).sort("completed_at", -1).limit(20).to_list(20)
    
    # Get total revenue
    revenue_pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {
            "_id": None,
            "total_revenue": {"$sum": "$amount"},
            "total_orders": {"$sum": 1},
            "total_credits_sold": {"$sum": {"$ifNull": ["$credits", 0]}}
        }}
    ]
    revenue_stats = await db.orders.aggregate(revenue_pipeline).to_list(1)
    
    # Format role stats
    stats_by_role = {}
    for stat in role_stats:
        role = stat["_id"]
        stats_by_role[role] = {
            "total_users": stat["total_users"],
            "total_credits": stat["total_credits"],
            "subscribed_users": stat["subscribed_users"]
        }
    
    return {
        "role_stats": stats_by_role,
        "revenue": revenue_stats[0] if revenue_stats else {
            "total_revenue": 0,
            "total_orders": 0,
            "total_credits_sold": 0
        },
        "recent_orders": recent_orders,
        "plans": [
            {"id": "basic", "price": 499, "credits": 100},
            {"id": "premium", "price": 999, "credits": 500},
            {"id": "enterprise", "price": 2499, "credits": 2000}
        ]
    }

@payment_router.get("/user/credits")
async def get_user_credits(current_user: dict = Depends(get_current_user)):
    """Get current user's credits - for real-time display"""
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "credits": 1, "role": 1})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    role = user.get("role", "")
    
    # Super Admin has unlimited
    if role == "SUPER_ADMIN":
        return {
            "credits": -1,
            "isUnlimited": True,
            "display": "Unlimited"
        }
    
    credits = user.get("credits", 0)
    return {
        "credits": credits,
        "isUnlimited": False,
        "display": str(credits)
    }

# ============== LEGACY ORDER ENDPOINTS ==============

@orders_router.post("/generate")
async def generate_order(body: dict, current_user: dict = Depends(get_current_user)):
    """Generate a new order"""
    order_id = str(uuid.uuid4())
    amount = body.get("amount", 0)
    
    order = {
        "id": order_id,
        "user_id": current_user["id"],
        "amount": amount,
        "currency": "INR",
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order)
    
    return {
        "orderId": order_id,
        "amount": amount,
        "currency": "INR",
        "status": "created"
    }

@orders_router.post("/verify")
async def verify_order(body: dict):
    """Verify order payment"""
    order_id = body.get("orderId")
    payment_id = body.get("paymentId")
    
    if not order_id:
        raise HTTPException(status_code=400, detail="orderId is required")
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "status": "paid",
            "payment_id": payment_id,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    order = await db.orders.find_one({"id": order_id})
    
    if order:
        credits_to_add = order.get("amount", 0) // 10
        await db.users.update_one(
            {"id": order["user_id"]},
            {"$inc": {"credits": credits_to_add}}
        )
    
    return {"message": "Payment verified successfully", "orderId": order_id}

# ============== BULK IMAGE IMPORT ==============

class BulkImageImportRequest(BaseModel):
    """Request model for bulk image import from Excel"""
    source_type: str = Field(..., description="'academic' or 'section'")

class ImageMetadata(BaseModel):
    """Model for individual image metadata"""
    category: str
    menu: str
    sub_menu: Optional[str] = None
    subject: Optional[str] = None
    sub_topic: Optional[str] = None
    book_type: Optional[str] = None
    unit_lesson: Optional[str] = None
    file_type: str = "JPG"
    image_name: str
    admin_code: Optional[str] = None
    meta_name: Optional[str] = None
    s3_path: str
    url: Optional[str] = None

@admin_router.post("/bulk-import/excel")
async def import_images_from_excel(
    background_tasks: BackgroundTasks,
    source_type: str = Form(..., description="'academic' or 'section'"),
    file: UploadFile = File(...),
    current_user: dict = Depends(require_super_admin)
):
    """
    Import images metadata from Excel file to database.
    This creates the database records - actual image files should be uploaded separately.
    """
    import pandas as pd
    import io
    
    content = await file.read()
    
    try:
        xl = pd.ExcelFile(io.BytesIO(content))
        
        # Find the data sheet (not 'status')
        data_sheet = None
        for sheet in xl.sheet_names:
            if 'format' in sheet.lower() or 'webp' in sheet.lower():
                data_sheet = sheet
                break
        
        if not data_sheet:
            data_sheet = xl.sheet_names[1] if len(xl.sheet_names) > 1 else xl.sheet_names[0]
        
        df = pd.read_excel(xl, sheet_name=data_sheet, keep_default_na=False, na_values=[''])
        
        # Replace any remaining NaN values with empty string
        df = df.fillna('')
        
        # Clean column names
        df.columns = [str(c).strip() for c in df.columns]
        
        imported_count = 0
        skipped_count = 0
        
        for _, row in df.iterrows():
            try:
                # Handle different column naming conventions
                category = str(row.get('Category', '')).strip()
                menu = str(row.get('Menu', '')).strip()
                sub_menu = str(row.get('Sub_Menu', row.get('Sub Menu', ''))).strip() if pd.notna(row.get('Sub_Menu', row.get('Sub Menu', ''))) else None
                
                # Subject column varies
                subject = None
                for col in ['Subjects', 'Subjects/Topic', 'Subject']:
                    if col in df.columns and pd.notna(row.get(col)):
                        subject = str(row.get(col)).strip()
                        break
                
                # Sub topic/section
                sub_topic = None
                for col in ['Sub_Topic', 'Sub_Section', 'Sub Section']:
                    if col in df.columns and pd.notna(row.get(col)):
                        sub_topic = str(row.get(col)).strip()
                        break
                
                # Book type
                book_type = None
                for col in ['BOOK TYPE', 'Book type', 'Book_Type']:
                    if col in df.columns and pd.notna(row.get(col)):
                        book_type = str(row.get(col)).strip()
                        break
                
                # Unit/Lesson
                unit_lesson = None
                for col in ['Unit/Lesson Names', 'Unit/Lesson', 'Unit_Lesson']:
                    if col in df.columns and pd.notna(row.get(col)):
                        unit_lesson = str(row.get(col)).strip()
                        break
                
                # File type
                file_type = str(row.get('Type', 'JPG')).strip().upper() if pd.notna(row.get('Type')) else 'JPG'
                
                # Image name / Admin code
                admin_code = None
                for col in ['Admin_Code', 'Admin Code', 'Image_Name']:
                    if col in df.columns and pd.notna(row.get(col)):
                        admin_code = str(row.get(col)).strip()
                        break
                
                # Meta name
                meta_name = None
                for col in ['META_NAME', 'Meta_Name', 'Meta Name']:
                    if col in df.columns and pd.notna(row.get(col)):
                        meta_name = str(row.get(col)).strip()
                        break
                
                # S3 Path
                s3_path = None
                for col in ['S3 PATH', 'S3_Path', 'S3Path']:
                    if col in df.columns and pd.notna(row.get(col)):
                        s3_path = str(row.get(col)).strip()
                        break
                
                if not category or not menu or not s3_path:
                    skipped_count += 1
                    continue
                
                # Create unique ID from admin_code or generate new one
                image_id = admin_code if admin_code else str(uuid.uuid4())
                
                # Check if already exists
                existing = await db.resource_images.find_one({"id": image_id})
                if existing:
                    skipped_count += 1
                    continue
                
                # Parse meta tags from meta_name
                tags = []
                if meta_name:
                    tags = [t.strip().lower() for t in meta_name.split(',') if t.strip()]
                
                # Construct the image URL based on path structure
                base_url = "/uploads"
                url = f"{base_url}/{s3_path}"
                
                # Create database record
                image_doc = {
                    "id": image_id,
                    "category": category,
                    "menu": menu,
                    "sub_menu": sub_menu,
                    "subject": subject,
                    "sub_topic": sub_topic,
                    "book_type": book_type,
                    "unit_lesson": unit_lesson,
                    "file_type": file_type,
                    "admin_code": admin_code,
                    "meta_name": meta_name,
                    "tags": tags,
                    "s3_path": s3_path,
                    "url": url,
                    "thumbnail_url": url,
                    "title": unit_lesson or admin_code or image_id,
                    "description": meta_name,
                    "source_type": source_type,
                    "status": "active",
                    "uploaded_at": datetime.now(timezone.utc).isoformat(),
                    "uploaded_by": current_user["id"]
                }
                
                await db.resource_images.insert_one(image_doc)
                imported_count += 1
                
            except Exception as e:
                logger.error(f"Error importing row: {e}")
                skipped_count += 1
                continue
        
        return {
            "message": "Import completed",
            "imported": imported_count,
            "skipped": skipped_count,
            "total_rows": len(df)
        }
        
    except Exception as e:
        logger.error(f"Excel import error: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to process Excel file: {str(e)}")

@admin_router.post("/bulk-import/folder")
async def import_images_from_folder(
    folder_path: str = Form(..., description="Base folder path containing images"),
    current_user: dict = Depends(require_super_admin)
):
    """
    Scan a folder structure and import image metadata.
    Expected structure: {category}/{menu}/{sub_menu}/.../{filename}
    """
    import glob
    
    base_path = Path(folder_path)
    if not base_path.exists():
        raise HTTPException(status_code=404, detail="Folder path does not exist")
    
    imported_count = 0
    
    # Scan for image files
    image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.webp', '*.gif', '*.pdf']
    
    for ext in image_extensions:
        for file_path in base_path.rglob(ext):
            try:
                rel_path = file_path.relative_to(base_path)
                parts = list(rel_path.parts)
                
                if len(parts) < 2:
                    continue
                
                category = parts[0]
                menu = parts[1] if len(parts) > 1 else None
                sub_menu = parts[2] if len(parts) > 2 else None
                
                image_id = str(uuid.uuid4())
                s3_path = str(rel_path)
                url = f"/uploads/{s3_path}"
                
                image_doc = {
                    "id": image_id,
                    "category": category,
                    "menu": menu,
                    "sub_menu": sub_menu,
                    "file_type": file_path.suffix.upper().replace('.', ''),
                    "admin_code": file_path.stem,
                    "s3_path": s3_path,
                    "url": url,
                    "thumbnail_url": url,
                    "title": file_path.stem,
                    "source_type": "folder_scan",
                    "status": "active",
                    "uploaded_at": datetime.now(timezone.utc).isoformat(),
                    "uploaded_by": current_user["id"]
                }
                
                await db.resource_images.insert_one(image_doc)
                imported_count += 1
                
            except Exception as e:
                logger.error(f"Error scanning file {file_path}: {e}")
                continue
    
    return {
        "message": "Folder scan completed",
        "imported": imported_count
    }

@admin_router.post("/bulk-upload")
async def bulk_upload_images(
    files: List[UploadFile] = File(...),
    category: str = Form(...),
    menu: str = Form(None),
    sub_menu: str = Form(None),
    subject: str = Form(None),
    current_user: dict = Depends(require_admin_or_above)
):
    """
    Bulk upload multiple image files at once.
    Creates folder structure based on category/menu/sub_menu.
    """
    uploaded = []
    failed = []
    
    for file in files:
        try:
            # Build folder path
            folder_parts = [category.upper()]
            if menu:
                folder_parts.append(menu)
            if sub_menu:
                folder_parts.append(sub_menu)
            
            folder_path = UPLOAD_DIR / "/".join(folder_parts)
            folder_path.mkdir(parents=True, exist_ok=True)
            
            # Generate unique filename
            file_ext = Path(file.filename).suffix
            unique_filename = f"{uuid.uuid4()}{file_ext}"
            file_path = folder_path / unique_filename
            
            # Save file
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            # Create database record
            s3_path = "/".join(folder_parts) + "/" + unique_filename
            url = f"/uploads/{s3_path}"
            
            image_doc = {
                "id": str(uuid.uuid4()),
                "category": category.upper(),
                "menu": menu,
                "sub_menu": sub_menu,
                "subject": subject,
                "file_type": file_ext.upper().replace('.', ''),
                "original_filename": file.filename,
                "filename": unique_filename,
                "s3_path": s3_path,
                "url": url,
                "thumbnail_url": url,
                "title": Path(file.filename).stem,
                "source_type": "bulk_upload",
                "status": "active",
                "uploaded_at": datetime.now(timezone.utc).isoformat(),
                "uploaded_by": current_user["id"],
                "school_code": current_user.get("school_code")
            }
            
            await db.resource_images.insert_one(image_doc)
            uploaded.append({
                "filename": file.filename,
                "url": url,
                "id": image_doc["id"]
            })
            
        except Exception as e:
            logger.error(f"Failed to upload {file.filename}: {e}")
            failed.append({
                "filename": file.filename,
                "error": str(e)
            })
    
    return {
        "message": f"Uploaded {len(uploaded)} files, {len(failed)} failed",
        "uploaded": uploaded,
        "failed": failed
    }

@admin_router.get("/image-categories")
async def get_image_categories(current_user: dict = Depends(require_admin_or_above)):
    """Get all unique image categories and their hierarchy"""
    
    # Get unique categories
    categories = await db.resource_images.distinct("category")
    
    hierarchy = {}
    for category in categories:
        if not category:
            continue
        
        menus = await db.resource_images.distinct("menu", {"category": category})
        hierarchy[category] = {}
        
        for menu in menus:
            if not menu:
                continue
            sub_menus = await db.resource_images.distinct("sub_menu", {"category": category, "menu": menu})
            hierarchy[category][menu] = [sm for sm in sub_menus if sm]
    
    return {
        "categories": categories,
        "hierarchy": hierarchy
    }

@admin_router.get("/import-stats")
async def get_import_stats(current_user: dict = Depends(require_admin_or_above)):
    """Get statistics about imported images"""
    
    total = await db.resource_images.count_documents({})
    
    # Group by source type
    pipeline = [
        {"$group": {"_id": "$source_type", "count": {"$sum": 1}}}
    ]
    source_stats = await db.resource_images.aggregate(pipeline).to_list(100)
    
    # Group by category
    cat_pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]
    category_stats = await db.resource_images.aggregate(cat_pipeline).to_list(100)
    
    return {
        "total": total,
        "by_source": {s["_id"]: s["count"] for s in source_stats if s["_id"]},
        "by_category": {c["_id"]: c["count"] for c in category_stats if c["_id"]}
    }

# ============== MAKER TEMPLATES ROUTES ==============
templates_router = APIRouter(prefix="/templates", tags=["Maker Templates"])

# Seed templates - disabled per user request (empty templates)
SEED_TEMPLATES = {
    "chart": [],
    "worksheet": [],
    "story": []
}

@templates_router.get("/list")
async def list_templates(
    makerType: str = Query(..., description="Type: chart, worksheet, story"),
    current_user: dict = Depends(get_current_user)
):
    """Get all templates for user - both seed templates and user's saved templates"""
    user_id = current_user["id"]
    
    # Get seed templates for this maker type
    seed = SEED_TEMPLATES.get(makerType, [])
    
    # Get user's saved templates from database
    user_templates = await db.maker_templates.find(
        {"user_id": user_id, "makerType": makerType},
        {"_id": 0}
    ).to_list(100)
    
    # Combine: seed templates first, then user templates
    all_templates = seed + user_templates
    
    return {"templates": all_templates, "total": len(all_templates)}

@templates_router.post("/save")
async def save_template(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Save a user template"""
    user_id = current_user["id"]
    
    template_id = request.get("id") or f"user-{str(uuid.uuid4())[:8]}"
    name = request.get("name", "Untitled Design")
    maker_type = request.get("makerType", "chart")
    
    template = {
        "id": template_id,
        "user_id": user_id,
        "name": name,
        "makerType": maker_type,
        "pageSize": request.get("pageSize", "A4"),
        "canvasBg": request.get("canvasBg", "#ffffff"),
        "elements": request.get("elements", []),
        "isSystem": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Upsert - update if exists, insert if not
    await db.maker_templates.update_one(
        {"id": template_id, "user_id": user_id},
        {"$set": template},
        upsert=True
    )
    
    return {"message": "Template saved successfully", "id": template_id}

@templates_router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a user template (cannot delete seed templates)"""
    user_id = current_user["id"]
    
    # Check if it's a seed template
    if template_id.startswith("seed-"):
        raise HTTPException(status_code=400, detail="Cannot delete system templates")
    
    result = await db.maker_templates.delete_one(
        {"id": template_id, "user_id": user_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"message": "Template deleted successfully"}

@templates_router.get("/{template_id}")
async def get_template(
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific template"""
    user_id = current_user["id"]
    
    # Check seed templates first
    for maker_type, templates in SEED_TEMPLATES.items():
        for t in templates:
            if t["id"] == template_id:
                return t
    
    # Check user templates
    template = await db.maker_templates.find_one(
        {"id": template_id, "user_id": user_id},
        {"_id": 0}
    )
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return template

# ============== INCLUDE ALL ROUTERS ==============
rest_router.include_router(auth_router)
rest_router.include_router(users_router)
rest_router.include_router(images_router)
rest_router.include_router(search_router)
rest_router.include_router(orders_router)
rest_router.include_router(payment_router)
rest_router.include_router(school_mgmt_router)
rest_router.include_router(support_router)
rest_router.include_router(templates_router)

api_router.include_router(rest_router)
api_router.include_router(admin_router)

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "MySchool API v2.0.0", "status": "running", "features": ["multi-tenant", "auto-password", "email-reset"]}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include routers in main app
app.include_router(api_router)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

@app.on_event("startup")
async def startup_event():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.users.create_index("role")
    await db.users.create_index("school_code")
    await db.users.create_index("school_code")
    await db.users.create_index("teacher_code")
    await db.users.create_index("mobile_number")
    
    await db.schools.create_index("code", unique=True)
    await db.schools.create_index("id", unique=True)
    
    await db.my_images.create_index("user_id")
    await db.my_images.create_index("id", unique=True)
    
    await db.resource_images.create_index("category")
    await db.resource_images.create_index("subcategory")
    await db.resource_images.create_index("tags")
    await db.resource_images.create_index("folder_path")
    await db.resource_images.create_index("status")
    # Compound indexes for faster filtering
    await db.resource_images.create_index([("folder_path", 1), ("category", 1), ("status", 1)])
    await db.resource_images.create_index([("folder_path", 1), ("category", 1), ("subcategory", 1), ("status", 1)])
    await db.resource_images.create_index([("title", "text"), ("description", "text"), ("tags", "text")])
    
    await db.orders.create_index("id", unique=True)
    await db.orders.create_index("user_id")
    
    # Create Super Admin if not exists
    super_admin = await db.users.find_one({"role": UserRole.SUPER_ADMIN})
    if not super_admin:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": "superadmin@myschool.in",
            "name": "Super Admin",
            "password_hash": hash_password("SuperAdmin@123"),
            "role": UserRole.SUPER_ADMIN,
            "credits": 999999,
            "disabled": False,
            "require_password_change": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Super Admin created: superadmin@myschool.in / SuperAdmin@123")
    
    logger.info("Database indexes created successfully")
