"""
User Management Routes
Handles user CRUD, credits, and profile operations
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
import re

from database import db
from models import UserRole

users_router = APIRouter(prefix="/users", tags=["Users"])


# Helper function to get current user (simplified - full version in server.py)
async def get_current_user_simple(user_id: str) -> dict:
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@users_router.get("/getUserDetails")
async def get_user_details(current_user: dict):
    """Get details of current logged-in user"""
    user = await db.users.find_one(
        {"id": current_user.get("userId")},
        {"_id": 0, "password_hash": 0}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get school info
    school_info = None
    if user.get("school_code"):
        school = await db.schools.find_one(
            {"code": user["school_code"]},
            {"_id": 0, "name": 1, "code": 1, "city": 1}
        )
        if school:
            school_info = school
    
    # Get stats for teachers
    stats = {}
    if user.get("role") == UserRole.TEACHER:
        stats["studentCount"] = await db.users.count_documents({
            "teacher_code": user.get("teacher_code"),
            "role": UserRole.STUDENT
        })
    
    return {
        **user,
        "school": school_info,
        "stats": stats
    }


@users_router.patch("/updateUserDetails")
async def update_user_details(body: dict, current_user: dict):
    """Update user profile details"""
    user_id = current_user.get("userId")
    
    allowed_fields = ["name", "mobile_number", "address", "city", "state", "postal_code"]
    updates = {k: v for k, v in body.items() if k in allowed_fields and v is not None}
    
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": updates}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found or no changes made")
    
    return {"message": "User details updated successfully"}


@users_router.get("/list")
async def list_users(
    current_user: dict,
    role: Optional[str] = None,
    school_code: Optional[str] = None,
    noSchoolCode: bool = False,
    limit: int = 100,
    skip: int = 0
):
    """List users with optional filters"""
    user_role = current_user.get("role")
    
    query = {}
    
    # Apply role-based filtering
    if user_role == UserRole.SCHOOL_ADMIN:
        query["school_code"] = current_user.get("schoolCode")
    elif user_role == UserRole.TEACHER:
        query["teacher_code"] = current_user.get("teacherCode")
        query["role"] = UserRole.STUDENT
    
    # Apply additional filters
    if role:
        query["role"] = role
    if school_code:
        query["school_code"] = school_code
    if noSchoolCode:
        query["school_code"] = {"$in": [None, ""]}
        query["role"] = {"$nin": [UserRole.SUPER_ADMIN]}
    
    users = await db.users.find(
        query,
        {"_id": 0, "password_hash": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    total = await db.users.count_documents(query)
    
    return {
        "users": users,
        "total": total,
        "limit": limit,
        "skip": skip
    }


@users_router.get("/listUsersByRole")
async def list_users_by_role(
    current_user: dict,
    role: str,
    school_code: Optional[str] = None,
    teacher_code: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    """List users by role with optional filters"""
    user_role = current_user.get("role")
    
    query = {"role": role}
    
    # Role-based access control
    if user_role == UserRole.SCHOOL_ADMIN:
        query["school_code"] = current_user.get("schoolCode")
    elif user_role == UserRole.TEACHER:
        if role != UserRole.STUDENT:
            raise HTTPException(status_code=403, detail="Teachers can only view students")
        query["teacher_code"] = current_user.get("teacherCode")
    elif user_role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Apply optional filters
    if school_code and user_role == UserRole.SUPER_ADMIN:
        query["school_code"] = school_code
    if teacher_code:
        query["teacher_code"] = teacher_code
    
    users = await db.users.find(
        query,
        {"_id": 0, "password_hash": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with school/teacher names
    for user in users:
        if user.get("school_code"):
            school = await db.schools.find_one({"code": user["school_code"]}, {"_id": 0, "name": 1})
            user["schoolName"] = school.get("name") if school else None
        
        if user.get("teacher_code"):
            teacher = await db.users.find_one({"teacher_code": user["teacher_code"], "role": UserRole.TEACHER}, {"_id": 0, "name": 1})
            user["teacherName"] = teacher.get("name") if teacher else None
        
        # Get student count for teachers
        if user.get("role") == UserRole.TEACHER and user.get("teacher_code"):
            user["studentCount"] = await db.users.count_documents({
                "teacher_code": user["teacher_code"],
                "role": UserRole.STUDENT
            })
    
    total = await db.users.count_documents(query)
    
    return {
        "data": {
            "users": users,
            "total": total
        }
    }


@users_router.get("/search")
async def search_users(
    current_user: dict,
    query: str,
    role: Optional[str] = None,
    limit: int = 50
):
    """Search users by name, email, or code"""
    user_role = current_user.get("role")
    
    search_query = {
        "$or": [
            {"name": {"$regex": query, "$options": "i"}},
            {"email": {"$regex": query, "$options": "i"}},
            {"school_code": {"$regex": query, "$options": "i"}},
            {"teacher_code": {"$regex": query, "$options": "i"}},
            {"student_code": {"$regex": query, "$options": "i"}}
        ]
    }
    
    # Role-based filtering
    if user_role == UserRole.SCHOOL_ADMIN:
        search_query["school_code"] = current_user.get("schoolCode")
    elif user_role == UserRole.TEACHER:
        search_query["teacher_code"] = current_user.get("teacherCode")
    
    if role:
        search_query["role"] = role
    
    users = await db.users.find(
        search_query,
        {"_id": 0, "password_hash": 0}
    ).limit(limit).to_list(limit)
    
    return {"users": users}


@users_router.put("/manage")
async def manage_user(body: dict, current_user: dict):
    """Manage user (update, delete, etc.)"""
    action = body.get("action")
    user_id = body.get("userId")
    
    if not action or not user_id:
        raise HTTPException(status_code=400, detail="Action and userId required")
    
    user_role = current_user.get("role")
    
    # Get target user
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Permission check
    if user_role == UserRole.SCHOOL_ADMIN:
        if target_user.get("school_code") != current_user.get("schoolCode"):
            raise HTTPException(status_code=403, detail="Not authorized to manage this user")
    elif user_role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if action == "delete":
        await db.users.delete_one({"id": user_id})
        return {"message": "User deleted successfully"}
    
    elif action == "update":
        allowed_fields = ["name", "mobile_number", "credits", "class_name", "section_name", "roll_number"]
        updates = {k: v for k, v in body.items() if k in allowed_fields}
        
        if updates:
            updates["updated_at"] = datetime.now(timezone.utc).isoformat()
            await db.users.update_one({"id": user_id}, {"$set": updates})
        
        return {"message": "User updated successfully"}
    
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")


@users_router.post("/disableAccount")
async def disable_account(body: dict, current_user: dict):
    """Disable/Enable user account"""
    user_id = body.get("userId")
    disable = body.get("disable", True)
    
    if not user_id:
        raise HTTPException(status_code=400, detail="userId required")
    
    user_role = current_user.get("role")
    
    # Get target user
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Permission check
    if user_role == UserRole.SCHOOL_ADMIN:
        if target_user.get("school_code") != current_user.get("schoolCode"):
            raise HTTPException(status_code=403, detail="Not authorized")
    elif user_role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Can't disable yourself
    if user_id == current_user.get("userId"):
        raise HTTPException(status_code=400, detail="Cannot disable your own account")
    
    await db.users.update_one(
        {"id": user_id},
        {
            "$set": {
                "disabled": disable,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"message": f"Account {'disabled' if disable else 'enabled'} successfully"}


@users_router.patch("/updateCredits")
async def update_credits(body: dict, current_user: dict):
    """Update user credits (admin only)"""
    user_id = body.get("userId")
    credits = body.get("credits")
    action = body.get("action", "set")  # set, add, subtract
    
    if not user_id or credits is None:
        raise HTTPException(status_code=400, detail="userId and credits required")
    
    user_role = current_user.get("role")
    if user_role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_op = {}
    if action == "add":
        update_op = {"$inc": {"credits": credits}}
    elif action == "subtract":
        update_op = {"$inc": {"credits": -credits}}
    else:
        update_op = {"$set": {"credits": credits}}
    
    update_op["$set"] = update_op.get("$set", {})
    update_op["$set"]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.users.update_one({"id": user_id}, update_op)
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Credits updated successfully"}
