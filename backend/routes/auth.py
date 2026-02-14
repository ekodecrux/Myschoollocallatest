"""
Authentication Routes
Handles login, registration, password reset, and token management
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid

from database import db
from models import UserRole
from utils.auth import (
    verify_password, hash_password, create_access_token, 
    create_refresh_token, decode_token, generate_password,
    generate_reset_code
)
from services.email_service import send_email, get_welcome_email_template, get_password_reset_email_template

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


# Request/Response Models
class UserLoginRequest(BaseModel):
    username: str
    password: str
    school_code: Optional[str] = None


class LoginResponse(BaseModel):
    accessToken: str
    refreshToken: str
    message: str = "Login successful"
    school: Optional[Dict[str, Any]] = None


class ConfirmPasswordResetRequest(BaseModel):
    email: str
    code: str
    newPassword: str


@auth_router.post("/login")
async def login(request: UserLoginRequest):
    """Login with email and password, optionally with school code"""
    query = {"email": request.username}
    
    if request.school_code:
        query["school_code"] = request.school_code
    
    user = await db.users.find_one(query)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(request.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.get("disabled", False):
        raise HTTPException(status_code=403, detail="Account is disabled")
    
    # Check if school is active
    if user.get("school_code") and user.get("role") != UserRole.SUPER_ADMIN:
        school = await db.schools.find_one({"code": user["school_code"]})
        if school and not school.get("is_active", True):
            raise HTTPException(status_code=403, detail="Your school is currently inactive")
    
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


@auth_router.post("/newPasswordChallenge")
async def new_password_challenge(body: dict):
    """Handle new password challenge after first login"""
    username = body.get("username")
    new_password = body.get("newPassword")
    
    if not username or not new_password:
        raise HTTPException(status_code=400, detail="Username and new password required")
    
    # Validate password
    if len(new_password) > 15:
        raise HTTPException(status_code=400, detail="Password must not exceed 15 characters")
    if not any(c.isupper() for c in new_password):
        raise HTTPException(status_code=400, detail="Password must contain at least one capital letter")
    
    user = await db.users.find_one({"email": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password and remove challenge flag
    await db.users.update_one(
        {"email": username},
        {
            "$set": {
                "password_hash": hash_password(new_password),
                "require_password_change": False,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Create tokens
    token_data = {
        "userId": user["id"],
        "email": user["email"],
        "role": user.get("role", UserRole.INDIVIDUAL),
        "schoolCode": user.get("school_code")
    }
    
    return {
        "accessToken": create_access_token(token_data),
        "refreshToken": create_refresh_token(token_data),
        "userId": user["id"],
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name", ""),
            "role": user.get("role", ""),
            "schoolCode": user.get("school_code")
        }
    }


@auth_router.post("/refreshToken")
async def refresh_token_endpoint(body: dict):
    """Refresh access token using refresh token"""
    refresh_token = body.get("refreshToken")
    
    if not refresh_token:
        raise HTTPException(status_code=400, detail="Refresh token required")
    
    try:
        payload = decode_token(refresh_token)
        
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        # Verify user still exists and is active
        user = await db.users.find_one({"id": payload.get("userId")})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        if user.get("disabled", False):
            raise HTTPException(status_code=403, detail="Account is disabled")
        
        # Create new access token
        token_data = {
            "userId": user["id"],
            "email": user["email"],
            "role": user.get("role", UserRole.INDIVIDUAL),
            "schoolCode": user.get("school_code")
        }
        
        return {
            "accessToken": create_access_token(token_data),
            "refreshToken": create_refresh_token(token_data)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@auth_router.get("/forgotPassword")
async def forgot_password(email: str, background_tasks: BackgroundTasks):
    """Send password reset code to email"""
    user = await db.users.find_one({"email": email})
    
    if not user:
        # Don't reveal if email exists
        return {"message": "If the email exists, a reset code will be sent"}
    
    # Generate reset code
    reset_code = generate_reset_code()
    expires_at = datetime.now(timezone.utc).isoformat()
    
    # Store reset code
    await db.password_reset_codes.update_one(
        {"email": email},
        {
            "$set": {
                "code": reset_code,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "expires_at": expires_at,
                "used": False
            }
        },
        upsert=True
    )
    
    # Send email
    html_content = get_password_reset_email_template(user.get("name", "User"), reset_code)
    background_tasks.add_task(
        send_email,
        email,
        "Password Reset - MySchool",
        html_content
    )
    
    return {"message": "Password reset code sent to your email"}


@auth_router.post("/confirmPassword")
async def confirm_password(request: ConfirmPasswordResetRequest):
    """Confirm password reset with code"""
    # Find reset code
    reset_record = await db.password_reset_codes.find_one({
        "email": request.email,
        "code": request.code,
        "used": False
    })
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")
    
    # Validate new password
    if len(request.newPassword) > 15:
        raise HTTPException(status_code=400, detail="Password must not exceed 15 characters")
    if not any(c.isupper() for c in request.newPassword):
        raise HTTPException(status_code=400, detail="Password must contain at least one capital letter")
    
    # Update password
    result = await db.users.update_one(
        {"email": request.email},
        {
            "$set": {
                "password_hash": hash_password(request.newPassword),
                "require_password_change": False,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Mark code as used
    await db.password_reset_codes.update_one(
        {"email": request.email, "code": request.code},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password reset successful"}


@auth_router.post("/changePassword")
async def change_password(body: dict, current_user: dict = None):
    """Change password (for logged-in users)"""
    username = body.get("username")
    new_password = body.get("newPassword")
    
    if not username or not new_password:
        raise HTTPException(status_code=400, detail="Username and new password required")
    
    # Validate password
    if len(new_password) > 15:
        raise HTTPException(status_code=400, detail="Password must not exceed 15 characters")
    
    await db.users.update_one(
        {"email": username},
        {
            "$set": {
                "password_hash": hash_password(new_password),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"message": "Password changed successfully"}
