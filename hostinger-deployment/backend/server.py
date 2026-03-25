from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query, UploadFile, File, Form, BackgroundTasks, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'myschool_db')]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'myschool_jwt_secret_key_2024_secure')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES', 60))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.environ.get('REFRESH_TOKEN_EXPIRE_DAYS', 7))

# Email Configuration
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USER = os.environ.get('SMTP_USER', 'ekodecrux@gmail.com')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', 'rfwc vhig cenr atoa')
EMAIL_FROM = os.environ.get('EMAIL_FROM', 'MySchool Auth <ekodecrux@gmail.com>')

# Stripe Configuration
stripe.api_key = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')

# Storage Configuration
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

# Create the main app
app = FastAPI(title="MySchool API", version="2.0.0")

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
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

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
    email: EmailStr
    name: str
    password: Optional[str] = None  # Auto-generated if not provided
    mobile_number: Optional[str] = Field(None, alias="mobileNumber")
    user_role: str = Field(UserRole.INDIVIDUAL, alias="userRole")
    school_code: Optional[str] = Field(None, alias="schoolCode")
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = Field(None, alias="postalCode")
    # School Admin fields
    principal_name: Optional[str] = Field(None, alias="principalName")
    # Teacher fields
    teacher_code: Optional[str] = Field(None, alias="teacherCode")
    subject: Optional[str] = None
    # Student fields
    roll_number: Optional[str] = Field(None, alias="rollNumber")
    class_name: Optional[str] = Field(None, alias="className")
    section_name: Optional[str] = Field(None, alias="sectionName")
    father_name: Optional[str] = Field(None, alias="fatherName")
    mother_name: Optional[str] = Field(None, alias="motherName")
    # Parent fields
    student_ids: Optional[List[str]] = Field(None, alias="studentIds")
    # Publication fields
    organization_name: Optional[str] = Field(None, alias="organizationName")

class CreateSchoolRequest(BaseModel):
    name: str
    admin_email: EmailStr = Field(alias="adminEmail")
    admin_name: str = Field(alias="adminName")
    admin_phone: Optional[str] = Field(None, alias="adminPhone")
    principal_name: Optional[str] = Field(None, alias="principalName")
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = Field(None, alias="postalCode")

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
    schools = await db.schools.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.schools.count_documents({})
    
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
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
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
    
    # Generate auto password if not provided
    auto_password = request.password or generate_password()
    send_email_flag = request.password is None
    
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
        "credits": 100,
        "disabled": False,
        "require_password_change": send_email_flag,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Add role-specific fields
    if request.user_role == UserRole.SCHOOL:
        user_data.update({
            "school_code": request.school_code or generate_code("SCH", 6),
            "principal_name": request.principal_name,
            "teachers_enrolled": 0,
            "students_enrolled": 0
        })
    elif request.user_role == UserRole.TEACHER:
        user_data.update({
            "school_code": request.school_code,
            "teacher_code": request.teacher_code or generate_code("TCH", 6),
            "students_enrolled": 0
        })
    elif request.user_role == UserRole.STUDENT:
        user_data.update({
            "school_code": request.school_code,
            "teacher_code": request.teacher_code,
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
        "emailSent": send_email_flag
    }

@auth_router.post("/newPasswordChallenge")
async def new_password_challenge(body: dict):
    """Handle new password challenge after first login"""
    username = body.get("username")
    new_password = body.get("newPassword")
    
    if not username or not new_password:
        raise HTTPException(status_code=400, detail="Username and new password required")
    
    user = await db.users.find_one({"email": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password
    await db.users.update_one(
        {"email": username},
        {
            "$set": {
                "password_hash": hash_password(new_password),
                "require_password_change": False
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
    """Get current user details"""
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Add userId for frontend compatibility
    user["userId"] = user["id"]
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

@users_router.get("/listUsersByRole")
async def list_users_by_role(
    role: str,
    limit: int = Query(100, ge=1, le=500),
    lastUserId: Optional[str] = None,
    schoolCode: Optional[str] = None,
    teacherCode: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List users by role"""
    user_role = current_user.get("role")
    if user_role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {"role": role}
    
    # Filter by school for non-super-admins
    if user_role != UserRole.SUPER_ADMIN:
        query["school_code"] = current_user.get("school_code")
    elif schoolCode:
        query["school_code"] = schoolCode
    
    if teacherCode:
        query["teacher_code"] = teacherCode
    
    if lastUserId:
        query["id"] = {"$gt": lastUserId}
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).limit(limit).to_list(limit)
    
    # Add userId for frontend compatibility
    transformed_users = []
    for user in users:
        user_data = {**user, "userId": user.get("id")}
        transformed_users.append(user_data)
    
    return {
        "data": {
            "users": transformed_users,
            "count": len(transformed_users),
            "lastUserId": users[-1]["id"] if users else None
        }
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
    
    # Set school code from current user for non-super-admins
    if user_role != UserRole.SUPER_ADMIN:
        request.school_code = current_user.get("school_code")
    
    # Permission checks
    if user_role == UserRole.SCHOOL_ADMIN:
        if request.user_role not in [UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT]:
            raise HTTPException(status_code=403, detail="Admins can only add school staff and students")
    
    if user_role == UserRole.SCHOOL:
        if request.user_role not in [UserRole.TEACHER, UserRole.STUDENT]:
            raise HTTPException(status_code=403, detail="Schools can only add teachers or students")
        request.school_code = current_user.get("school_code")
    
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
    
    return result

@users_router.patch("/updateCredits")
async def update_credits(
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user credits"""
    user_role = current_user.get("role")
    
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
    
    # Get current user credits
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    current_credits = target_user.get("credits", 0)
    
    if action == "add":
        new_credits = current_credits + credits
    elif action == "remove":
        new_credits = current_credits - credits
        if new_credits < 0:
            raise HTTPException(status_code=400, detail="Cannot remove more credits than available")
    else:  # "set"
        new_credits = credits
    
    # Ensure credits don't go below 0
    if new_credits < 0:
        raise HTTPException(status_code=400, detail="Credits cannot be negative")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"credits": new_credits}}
    )
    
    return {"message": "Credits updated successfully", "new_credits": new_credits}

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
    school_name: str
    admin_email: str
    admin_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

class BulkUserItem(BaseModel):
    """Schema for bulk user upload"""
    email: str
    name: Optional[str] = None
    role: str  # TEACHER, STUDENT, PARENT
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

@admin_router.post("/bulk-upload/schools")
async def bulk_upload_schools(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_super_admin)
):
    """
    Bulk upload schools from Excel/CSV file.
    Required columns: school_name, admin_email
    Optional columns: admin_name, address, city, state
    """
    import pandas as pd
    import io
    
    content = await file.read()
    
    try:
        # Try Excel first, then CSV
        try:
            df = pd.read_excel(io.BytesIO(content))
        except:
            df = pd.read_csv(io.BytesIO(content))
        
        # Clean column names
        df.columns = [str(c).strip().lower().replace(' ', '_') for c in df.columns]
        
        # Required columns check
        required_cols = ['school_name', 'admin_email']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing required columns: {missing_cols}")
        
        results = {
            "total": len(df),
            "created": 0,
            "failed": 0,
            "errors": []
        }
        
        for idx, row in df.iterrows():
            try:
                school_name = str(row.get('school_name', '')).strip()
                admin_email = str(row.get('admin_email', '')).strip().lower()
                
                if not school_name or not admin_email:
                    results["failed"] += 1
                    results["errors"].append(f"Row {idx+2}: Missing school_name or admin_email")
                    continue
                
                # Check if school or admin already exists
                existing_school = await db.schools.find_one({"name": {"$regex": f"^{re.escape(school_name)}$", "$options": "i"}})
                if existing_school:
                    results["failed"] += 1
                    results["errors"].append(f"Row {idx+2}: School '{school_name}' already exists")
                    continue
                
                existing_user = await db.users.find_one({"email": admin_email})
                if existing_user:
                    results["failed"] += 1
                    results["errors"].append(f"Row {idx+2}: Admin email '{admin_email}' already exists")
                    continue
                
                # Generate school code
                school_code = f"SC{str(uuid.uuid4())[:8].upper()}"
                
                # Generate password
                password = generate_password()
                password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                # Create admin user
                admin_id = str(uuid.uuid4())
                admin_user = {
                    "id": admin_id,
                    "email": admin_email,
                    "password_hash": password_hash,
                    "name": str(row.get('admin_name', '')).strip() or school_name + " Admin",
                    "role": UserRole.SCHOOL_ADMIN,
                    "school_code": school_code,
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
                    "admin_email": admin_email,
                    "address": str(row.get('address', '')).strip() or None,
                    "city": str(row.get('city', '')).strip() or None,
                    "state": str(row.get('state', '')).strip() or None,
                    "is_active": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "created_by": current_user["id"]
                }
                
                await db.schools.insert_one(school)
                
                # Send welcome email
                background_tasks.add_task(
                    send_welcome_email,
                    admin_email,
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
        # Try Excel first, then CSV
        try:
            df = pd.read_excel(io.BytesIO(content))
        except:
            df = pd.read_csv(io.BytesIO(content))
        
        # Clean column names
        df.columns = [str(c).strip().lower().replace(' ', '_') for c in df.columns]
        
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
                    results["errors"].append(f"Row {idx+2}: School code '{school_code}' not found")
                    continue
                
                # Generate password
                password = generate_password()
                password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
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
                background_tasks.add_task(
                    send_welcome_email,
                    email,
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

@admin_router.get("/bulk-upload/template/{type}")
async def get_bulk_upload_template(
    type: str,
    current_user: dict = Depends(require_admin_or_above)
):
    """Get template information for bulk upload"""
    
    if type == "schools":
        return {
            "required_columns": ["school_name", "admin_email"],
            "optional_columns": ["admin_name", "address", "city", "state"],
            "example": {
                "school_name": "ABC Public School",
                "admin_email": "admin@abcschool.com",
                "admin_name": "John Smith",
                "address": "123 Main Street",
                "city": "Mumbai",
                "state": "Maharashtra"
            }
        }
    elif type == "users":
        user_role = current_user.get("role")
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
        raise HTTPException(status_code=400, detail="Invalid template type. Use 'schools' or 'users'")

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
    r2_base_url = os.environ.get("R2_BASE_URL", "https://pub-1adcb2fef0224429b1dfc0a5bb45dd31.r2.dev")
    
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
        return f"{r2_base_url}/{clean_path}"
    
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

@images_router.post("/fetch")
async def fetch_images(body: dict):
    """Fetch images from a folder path - maps folder paths to database structure"""
    folder_path = body.get("folderPath", "").strip("/")
    images_per_page = body.get("imagesPerPage", 100)
    continuation_token = body.get("continuationToken")
    
    # Parse folder path to build query
    parts = [p for p in folder_path.split("/") if p and p.lower() != 'thumbnails']
    
    query = {"status": "active"}
    
    if parts:
        # First part is category
        category = parts[0].upper().replace('-', '_')
        # Map common category names
        category_map = {
            "ACADEMIC": "ACADEMIC",
            "EARLYCAREER": "EARLY-CAREER",
            "EARLY_CAREER": "EARLY-CAREER",
            "EDUTAINMENT": "EDUTAINMENT",
            "PRINTRICH": "PRINT-RICH",
            "PRINT_RICH": "PRINT-RICH",
            "MAKER": "MAKER",
            "INFOHUB": "INFO-HUB",
            "INFO_HUB": "INFO-HUB",
            "ONE_CLICK_RESOURCE_CENTRE": "ONE CLICK RESOURCE CENTRE"
        }
        query["category"] = category_map.get(category, category)
    
    if len(parts) > 1:
        # Second part could be menu (CLASS, GRADE, etc.)
        query["menu"] = {"$regex": f".*{parts[1]}.*", "$options": "i"}
    
    if len(parts) > 2:
        # Third part could be sub_menu (CLASS-1, CLASS-2, etc.)
        query["sub_menu"] = {"$regex": f".*{parts[2]}.*", "$options": "i"}
    
    if len(parts) > 3:
        # Fourth part could be subject
        query["subject"] = {"$regex": f".*{parts[3]}.*", "$options": "i"}
    
    logger.info(f"Fetch images query: {query}")
    
    # Query database for images
    images = await db.resource_images.find(query, {"_id": 0}).limit(images_per_page).to_list(images_per_page)
    
    # Transform to expected format - key should be the full path for frontend compatibility
    result_images = {}
    for img in images:
        # Create a key that includes the path structure
        key = img.get("s3_path") or img.get("url", "")
        if key:
            result_images[key] = img.get("url") or img.get("thumbnail_url", "")
    
    # If no images found, return empty dict (not placeholder)
    if not result_images:
        logger.warning(f"No images found for query: {query}")
        return {
            "list": {},
            "continuationToken": None,
            "isTruncated": False
        }
    
    return {
        "list": result_images,
        "continuationToken": None,
        "isTruncated": len(images) >= images_per_page
    }

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
    
    images = await db.my_images.find(query, {"_id": 0}).sort("saved_on", -1).limit(limit).to_list(limit)
    
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
    
    images = await db.my_images.find(query, {"_id": 0}).sort("saved_on", -1).limit(limit).to_list(limit)
    
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
        image_doc = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "image_url": image_url,
            "is_favourite": mark_favourite,
            "saved_on": datetime.now(timezone.utc).isoformat()
        }
        await db.my_images.insert_one(image_doc)
        saved_count += 1
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$inc": {"credits": -saved_count}}
    )
    
    return f"Successfully saved {saved_count} images"

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
    return {"pendingImages": pending_images}

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
    """Upload an image to the resource library"""
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed")
    
    # Create directory structure
    category_dir = UPLOAD_DIR / category.upper()
    if subcategory:
        category_dir = category_dir / subcategory.lower()
    category_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = category_dir / unique_filename
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
    
    # Create database record
    image_doc = {
        "id": str(uuid.uuid4()),
        "filename": unique_filename,
        "original_filename": file.filename,
        "category": category.upper(),
        "subcategory": subcategory.lower() if subcategory else None,
        "title": title,
        "description": description,
        "tags": [t.strip().lower() for t in tags.split(",") if t.strip()],
        "url": f"/uploads/{category.upper()}/{subcategory.lower() + '/' if subcategory else ''}{unique_filename}",
        "thumbnail_url": f"/uploads/{category.upper()}/{subcategory.lower() + '/' if subcategory else ''}{unique_filename}",
        "file_size": len(content),
        "content_type": file.content_type,
        "uploaded_by": current_user["id"],
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.resource_images.insert_one(image_doc)
    
    return {
        "message": "Image uploaded successfully",
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

@admin_router.get("/dashboard-stats")
async def get_dashboard_stats(current_user: dict = Depends(require_admin_or_above)):
    """Get admin dashboard statistics"""
    user_role = current_user.get("role")
    school_code = current_user.get("school_code")
    
    stats = {
        "totalImages": await db.resource_images.count_documents({}),
        "totalUsers": 0,
        "totalStudents": 0,
        "totalTeachers": 0,
        "totalSchools": 0,
        "totalSchools": 0
    }
    
    if user_role == UserRole.SUPER_ADMIN:
        stats["totalSchools"] = await db.schools.count_documents({})
        stats["totalUsers"] = await db.users.count_documents({})
        stats["totalStudents"] = await db.users.count_documents({"role": UserRole.STUDENT})
        stats["totalTeachers"] = await db.users.count_documents({"role": UserRole.TEACHER})
        stats["totalSchools"] = await db.users.count_documents({"role": UserRole.SCHOOL})
    else:
        # Institute-specific stats
        stats["totalUsers"] = await db.users.count_documents({"school_code": school_code})
        stats["totalStudents"] = await db.users.count_documents({"school_code": school_code, "role": UserRole.STUDENT})
        stats["totalTeachers"] = await db.users.count_documents({"school_code": school_code, "role": UserRole.TEACHER})
        stats["totalSchools"] = await db.users.count_documents({"school_code": school_code, "role": UserRole.SCHOOL})
    
    return stats

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
                
                # Add credits to user
                await db.users.update_one(
                    {"id": order["user_id"]},
                    {"$inc": {"credits": credits_to_add}}
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
                    "credits_added": credits_to_add
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
        
        df = pd.read_excel(xl, sheet_name=data_sheet)
        
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

# ============== INCLUDE ALL ROUTERS ==============
rest_router.include_router(auth_router)
rest_router.include_router(users_router)
rest_router.include_router(images_router)
rest_router.include_router(search_router)
rest_router.include_router(orders_router)
rest_router.include_router(payment_router)
rest_router.include_router(school_mgmt_router)

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
