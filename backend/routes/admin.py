"""
Admin Routes
Handles dashboard stats, bulk uploads, and admin-specific operations
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from typing import Optional, List
from datetime import datetime, timezone
import csv
import io
import uuid

from database import db
from models import UserRole
from utils.auth import generate_password, hash_password
from services.email_service import send_email, get_welcome_email_template

admin_router = APIRouter(prefix="/admin", tags=["Admin Panel"])


def generate_code(prefix: str = "", length: int = 6) -> str:
    """Generate a unique code"""
    import random
    import string
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    return f"{prefix}{code}" if prefix else code


@admin_router.get("/dashboard-stats")
async def get_dashboard_stats(current_user: dict):
    """Get dashboard statistics based on user role"""
    user_role = current_user.get("role")
    school_code = current_user.get("schoolCode")
    teacher_code = current_user.get("teacherCode")
    
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
        
        # Get total credits used
        credit_pipeline = [{"$group": {"_id": None, "total": {"$sum": "$credits_used"}}}]
        credit_result = await db.users.aggregate(credit_pipeline).to_list(1)
        stats["totalCreditsUsed"] = credit_result[0]["total"] if credit_result else 0
        
        # Get recent registrations
        recent_users = await db.users.find(
            {}, {"_id": 0, "name": 1, "email": 1, "role": 1, "created_at": 1}
        ).sort("created_at", -1).limit(5).to_list(5)
        stats["recentActivity"] = recent_users
        
    elif user_role == UserRole.SCHOOL_ADMIN:
        # School Admin sees users in their school
        stats["totalTeachers"] = await db.users.count_documents({"school_code": school_code, "role": UserRole.TEACHER})
        stats["totalStudents"] = await db.users.count_documents({"school_code": school_code, "role": UserRole.STUDENT})
        stats["totalUsers"] = stats["totalTeachers"] + stats["totalStudents"]
        stats["activeUsers"] = await db.users.count_documents({"school_code": school_code, "disabled": {"$ne": True}})
        stats["disabledUsers"] = await db.users.count_documents({"school_code": school_code, "disabled": True})
        
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
    
    return stats


@admin_router.post("/bulk-upload/schools")
async def bulk_upload_schools(
    file: UploadFile = File(...),
    current_user: dict = None,
    background_tasks: BackgroundTasks = None
):
    """Bulk upload schools from CSV"""
    user_role = current_user.get("role") if current_user else None
    if user_role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can upload schools")
    
    content = await file.read()
    decoded = content.decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(decoded))
    
    results = {"success_count": 0, "errors": []}
    
    for row_num, row in enumerate(reader, start=2):
        try:
            # Required fields
            school_name = row.get('school_name', '').strip()
            admin_email = row.get('admin_email', '').strip().lower()
            admin_name = row.get('admin_name', '').strip() or school_name
            mobile_number = row.get('mobile_number', '').strip()
            
            if not school_name or not admin_email:
                results["errors"].append({"row": row_num, "error": "Missing required fields"})
                continue
            
            # Validate mobile number
            if mobile_number and (not mobile_number.isdigit() or len(mobile_number) != 10):
                results["errors"].append({"row": row_num, "error": "Mobile number must be exactly 10 digits"})
                continue
            
            # Check if email exists
            existing = await db.users.find_one({"email": admin_email})
            if existing:
                results["errors"].append({"row": row_num, "error": f"Email {admin_email} already exists"})
                continue
            
            # Generate school code and password
            school_code = f"SC{generate_code(length=12)}"
            password = generate_password()
            
            # Create school admin user
            user = {
                "id": str(uuid.uuid4()),
                "email": admin_email,
                "name": admin_name,
                "mobile_number": mobile_number,
                "password_hash": hash_password(password),
                "role": UserRole.SCHOOL_ADMIN,
                "school_code": school_code,
                "school_name": school_name,
                "address": row.get('address', '').strip(),
                "city": row.get('city', '').strip(),
                "state": row.get('state', '').strip(),
                "postal_code": row.get('postal_code', '').strip(),
                "credits": 100,
                "require_password_change": True,
                "disabled": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.users.insert_one(user)
            
            # Create school record
            school = {
                "code": school_code,
                "name": school_name,
                "principal_name": row.get('principal_name', '').strip(),
                "address": row.get('address', '').strip(),
                "city": row.get('city', '').strip(),
                "state": row.get('state', '').strip(),
                "postal_code": row.get('postal_code', '').strip(),
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.schools.insert_one(school)
            
            # Send welcome email
            if background_tasks:
                html_content = get_welcome_email_template(admin_name, admin_email, password, "School Admin", school_name)
                background_tasks.add_task(send_email, admin_email, f"Welcome to {school_name} - MySchool", html_content)
            
            results["success_count"] += 1
            
        except Exception as e:
            results["errors"].append({"row": row_num, "error": str(e)})
    
    return results


@admin_router.post("/bulk-upload/teachers")
async def bulk_upload_teachers(
    file: UploadFile = File(...),
    current_user: dict = None,
    background_tasks: BackgroundTasks = None
):
    """Bulk upload teachers from CSV"""
    user_role = current_user.get("role") if current_user else None
    if user_role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    content = await file.read()
    decoded = content.decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(decoded))
    
    results = {"success_count": 0, "errors": []}
    default_school_code = current_user.get("schoolCode") if current_user else None
    
    for row_num, row in enumerate(reader, start=2):
        try:
            name = row.get('name', '').strip()
            email = row.get('email', '').strip().lower()
            mobile_number = row.get('mobile_number', '').strip()
            school_code = row.get('school_code', '').strip() or default_school_code
            
            if not name or not email:
                results["errors"].append({"row": row_num, "error": "Missing required fields"})
                continue
            
            # Validate mobile number
            if mobile_number and (not mobile_number.isdigit() or len(mobile_number) != 10):
                results["errors"].append({"row": row_num, "error": "Mobile number must be exactly 10 digits"})
                continue
            
            # Check if email exists
            existing = await db.users.find_one({"email": email})
            if existing:
                results["errors"].append({"row": row_num, "error": f"Email {email} already exists"})
                continue
            
            # Generate teacher code and password
            teacher_code = f"TCH{generate_code(length=6)}"
            password = generate_password()
            
            # Get school name
            school_name = None
            if school_code:
                school = await db.schools.find_one({"code": school_code})
                school_name = school.get("name") if school else None
            
            user = {
                "id": str(uuid.uuid4()),
                "email": email,
                "name": name,
                "mobile_number": mobile_number,
                "password_hash": hash_password(password),
                "role": UserRole.TEACHER,
                "school_code": school_code,
                "teacher_code": teacher_code,
                "address": row.get('address', '').strip(),
                "city": row.get('city', '').strip(),
                "state": row.get('state', '').strip(),
                "postal_code": row.get('postal_code', '').strip(),
                "credits": 50,
                "require_password_change": True,
                "disabled": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.users.insert_one(user)
            
            # Send welcome email
            if background_tasks:
                html_content = get_welcome_email_template(name, email, password, "Teacher", school_name)
                background_tasks.add_task(send_email, email, "Welcome to MySchool - Teacher Account", html_content)
            
            results["success_count"] += 1
            
        except Exception as e:
            results["errors"].append({"row": row_num, "error": str(e)})
    
    return results


@admin_router.post("/bulk-upload/students")
async def bulk_upload_students(
    file: UploadFile = File(...),
    current_user: dict = None,
    background_tasks: BackgroundTasks = None
):
    """Bulk upload students from CSV"""
    user_role = current_user.get("role") if current_user else None
    if user_role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    content = await file.read()
    decoded = content.decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(decoded))
    
    results = {"success_count": 0, "errors": []}
    default_school_code = current_user.get("schoolCode") if current_user else None
    
    for row_num, row in enumerate(reader, start=2):
        try:
            name = row.get('name', '').strip()
            email = row.get('email', '').strip().lower()
            mobile_number = row.get('mobile_number', '').strip()
            school_code = row.get('school_code', '').strip() or default_school_code
            teacher_code = row.get('teacher_code', '').strip()
            class_name = row.get('class_name', '').strip()
            section_name = row.get('section_name', '').strip()
            roll_number = row.get('roll_number', '').strip()
            
            if not name or not email or not class_name:
                results["errors"].append({"row": row_num, "error": "Missing required fields (name, email, class_name)"})
                continue
            
            # Validate mobile number
            if mobile_number and (not mobile_number.isdigit() or len(mobile_number) != 10):
                results["errors"].append({"row": row_num, "error": "Mobile number must be exactly 10 digits"})
                continue
            
            # Check if email exists
            existing = await db.users.find_one({"email": email})
            if existing:
                results["errors"].append({"row": row_num, "error": f"Email {email} already exists"})
                continue
            
            # Generate student code and password
            student_code = f"STU{generate_code(length=8)}"
            password = generate_password()
            
            # Get school name
            school_name = None
            if school_code:
                school = await db.schools.find_one({"code": school_code})
                school_name = school.get("name") if school else None
            
            user = {
                "id": str(uuid.uuid4()),
                "email": email,
                "name": name,
                "mobile_number": mobile_number,
                "password_hash": hash_password(password),
                "role": UserRole.STUDENT,
                "school_code": school_code,
                "teacher_code": teacher_code,
                "student_code": student_code,
                "class_name": class_name,
                "section_name": section_name,
                "roll_number": roll_number,
                "address": row.get('address', '').strip(),
                "city": row.get('city', '').strip(),
                "state": row.get('state', '').strip(),
                "postal_code": row.get('postal_code', '').strip(),
                "credits": 20,
                "require_password_change": True,
                "disabled": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.users.insert_one(user)
            
            # Send welcome email
            if background_tasks:
                html_content = get_welcome_email_template(name, email, password, "Student", school_name)
                background_tasks.add_task(send_email, email, "Welcome to MySchool - Student Account", html_content)
            
            results["success_count"] += 1
            
        except Exception as e:
            results["errors"].append({"row": row_num, "error": str(e)})
    
    return results
