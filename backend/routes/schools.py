"""
School Management Routes
Handles school CRUD operations
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
import uuid

from database import db
from models import UserRole
from utils.auth import generate_password, hash_password
from services.email_service import send_email, get_welcome_email_template

schools_router = APIRouter(prefix="/schools", tags=["School Management"])


def generate_code(prefix: str = "", length: int = 6) -> str:
    """Generate a unique code"""
    import random
    import string
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    return f"{prefix}{code}" if prefix else code


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


@schools_router.post("/create")
async def create_school(
    request: CreateSchoolRequest,
    current_user: dict,
    background_tasks: BackgroundTasks
):
    """Create a new school with admin account"""
    user_role = current_user.get("role")
    
    if user_role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can create schools")
    
    # Check if admin email already exists
    existing_user = await db.users.find_one({"email": request.admin_email.lower()})
    if existing_user:
        raise HTTPException(status_code=400, detail="Admin email already registered")
    
    # Generate school code and password
    school_code = f"SC{generate_code(length=12)}"
    password = generate_password()
    
    # Create school admin user
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": request.admin_email.lower(),
        "name": request.admin_name,
        "mobile_number": request.admin_phone,
        "password_hash": hash_password(password),
        "role": UserRole.SCHOOL_ADMIN,
        "school_code": school_code,
        "school_name": request.name,
        "address": request.address,
        "city": request.city,
        "state": request.state,
        "postal_code": request.postal_code,
        "credits": 100,
        "require_password_change": True,
        "disabled": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user)
    
    # Create school record
    school = {
        "code": school_code,
        "name": request.name,
        "principal_name": request.principal_name,
        "address": request.address,
        "city": request.city,
        "state": request.state,
        "postal_code": request.postal_code,
        "admin_id": user_id,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.schools.insert_one(school)
    
    # Send welcome email
    html_content = get_welcome_email_template(
        request.admin_name, 
        request.admin_email, 
        password, 
        "School Admin", 
        request.name
    )
    background_tasks.add_task(
        send_email, 
        request.admin_email, 
        f"Welcome to {request.name} - MySchool", 
        html_content
    )
    
    return {
        "message": "School created successfully",
        "schoolCode": school_code,
        "adminEmail": request.admin_email
    }


@schools_router.get("/list")
async def list_schools(
    current_user: dict,
    is_active: Optional[bool] = None,
    limit: int = 100,
    skip: int = 0
):
    """List all schools (Super Admin only)"""
    user_role = current_user.get("role")
    
    if user_role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can list all schools")
    
    query = {}
    if is_active is not None:
        query["is_active"] = is_active
    
    schools = await db.schools.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with admin info and counts
    for school in schools:
        admin = await db.users.find_one(
            {"school_code": school["code"], "role": UserRole.SCHOOL_ADMIN},
            {"_id": 0, "email": 1, "name": 1}
        )
        school["adminEmail"] = admin.get("email") if admin else None
        school["adminName"] = admin.get("name") if admin else None
        
        school["teachersEnrolled"] = await db.users.count_documents({
            "school_code": school["code"],
            "role": UserRole.TEACHER
        })
        school["studentsEnrolled"] = await db.users.count_documents({
            "school_code": school["code"],
            "role": UserRole.STUDENT
        })
    
    total = await db.schools.count_documents(query)
    
    return {
        "data": schools,
        "total": total
    }


@schools_router.get("/public/active")
async def get_active_schools_public():
    """Get list of active schools (public - for registration dropdown)"""
    schools = await db.schools.find(
        {"is_active": True},
        {"_id": 0, "code": 1, "name": 1, "city": 1}
    ).to_list(500)
    
    return {"schools": schools}


@schools_router.get("/{school_code}")
async def get_school(school_code: str, current_user: dict):
    """Get school details by code"""
    user_role = current_user.get("role")
    user_school_code = current_user.get("schoolCode")
    
    # Check access
    if user_role == UserRole.SCHOOL_ADMIN and user_school_code != school_code:
        raise HTTPException(status_code=403, detail="Not authorized to view this school")
    elif user_role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    school = await db.schools.find_one({"code": school_code}, {"_id": 0})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Get admin info
    admin = await db.users.find_one(
        {"school_code": school_code, "role": UserRole.SCHOOL_ADMIN},
        {"_id": 0, "email": 1, "name": 1, "mobile_number": 1}
    )
    school["admin"] = admin
    
    # Get counts
    school["teachersCount"] = await db.users.count_documents({
        "school_code": school_code, "role": UserRole.TEACHER
    })
    school["studentsCount"] = await db.users.count_documents({
        "school_code": school_code, "role": UserRole.STUDENT
    })
    
    return school


@schools_router.patch("/{school_code}/toggle-status")
async def toggle_school_status(school_code: str, current_user: dict):
    """Toggle school active/inactive status (Super Admin only)"""
    user_role = current_user.get("role")
    
    if user_role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can toggle school status")
    
    school = await db.schools.find_one({"code": school_code})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    new_status = not school.get("is_active", True)
    
    await db.schools.update_one(
        {"code": school_code},
        {
            "$set": {
                "is_active": new_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {
        "message": f"School {'activated' if new_status else 'deactivated'} successfully",
        "is_active": new_status
    }
