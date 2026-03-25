"""
Pydantic Models for Request/Response schemas
"""
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator, model_validator
from typing import List, Optional, Any, Dict
from datetime import datetime


# ============== AUTH MODELS ==============

class UserLoginRequest(BaseModel):
    username: str
    password: str
    school_code: Optional[str] = None


class UserRegisterRequest(BaseModel):
    """Registration request - handles all user types"""
    userRole: str
    emailId: str = Field(max_length=30)
    name: str = Field(max_length=40)
    mobileNumber: str
    schoolName: Optional[str] = Field(None, max_length=40)
    city: Optional[str] = Field(None, max_length=35)
    state: Optional[str] = Field(None, max_length=35)
    postalCode: Optional[str] = None
    schoolCode: Optional[str] = None
    teacherCode: Optional[str] = None
    address: Optional[str] = Field(None, max_length=100)
    className: Optional[str] = None
    sectionName: Optional[str] = None
    rollNumber: Optional[str] = None
    password: Optional[str] = None
    principalName: Optional[str] = Field(None, max_length=40)

    @field_validator('mobileNumber')
    def validate_mobile(cls, v):
        if v and not v.isdigit():
            raise ValueError('Mobile number must contain only digits')
        if v and len(v) != 10:
            raise ValueError('Mobile number must be exactly 10 digits')
        return v


class LoginResponse(BaseModel):
    accessToken: str
    refreshToken: str
    userId: str
    user: Dict[str, Any]


class PasswordResetRequest(BaseModel):
    email: str


class ConfirmPasswordResetRequest(BaseModel):
    email: str
    code: str
    newPassword: str


class ChangePasswordRequest(BaseModel):
    username: str
    newPassword: str


# ============== SCHOOL MODELS ==============

class SchoolModel(BaseModel):
    """School data model"""
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = None
    code: str = Field(..., description="Unique school code")
    name: str = Field(..., max_length=40)
    principal_name: Optional[str] = Field(None, max_length=40)
    address: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=35)
    state: Optional[str] = Field(None, max_length=35)
    postal_code: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CreateSchoolRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=40)
    admin_email: str = Field(..., max_length=30)
    admin_name: str = Field(..., min_length=1, max_length=40)
    admin_phone: str
    principal_name: Optional[str] = Field(None, max_length=40)
    address: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=35)
    state: Optional[str] = Field(None, max_length=35)
    postal_code: Optional[str] = None

    @field_validator('admin_phone')
    def validate_phone(cls, v):
        if v and not v.isdigit():
            raise ValueError('Phone number must contain only digits')
        if v and len(v) != 10:
            raise ValueError('Phone number must be exactly 10 digits')
        return v


# ============== BULK UPLOAD MODELS ==============

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


class BulkUserItem(BaseModel):
    """Schema for bulk teacher/student upload"""
    name: str = Field(min_length=1, max_length=40)
    email: str = Field(max_length=30)
    mobile_number: Optional[str] = None
    school_code: Optional[str] = None
    teacher_code: Optional[str] = None
    address: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=35)
    state: Optional[str] = Field(None, max_length=35)
    postal_code: Optional[str] = None
    class_name: Optional[str] = None
    section_name: Optional[str] = None
    roll_number: Optional[str] = None


# ============== IMAGE MODELS ==============

class ImageUploadRequest(BaseModel):
    url: str
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = []


class ImageMetadata(BaseModel):
    url: str
    thumbnail_url: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    subject: Optional[str] = None
    chapter: Optional[str] = None
    tags: Optional[List[str]] = []


class BulkImageImportRequest(BaseModel):
    images: List[ImageMetadata]
    folder_path: str


# ============== PAYMENT MODELS ==============

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


# ============== SUPPORT MODELS ==============

class SupportRequest(BaseModel):
    subject: str
    message: str
    category: Optional[str] = "general"
