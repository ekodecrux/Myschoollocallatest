"""
User Role Constants
Defines all user role types in the system
"""

class UserRole:
    SUPER_ADMIN = "SUPER_ADMIN"
    SCHOOL_ADMIN = "SCHOOL_ADMIN"  # School Admin (created by Super Admin)
    TEACHER = "TEACHER"  # Created by School Admin
    STUDENT = "STUDENT"  # Created by School Admin or Teacher
    PARENT = "PARENT"    # Created by School Admin
    INDIVIDUAL = "INDIVIDUAL"
    PUBLICATION = "PUBLICATION"
    
    @classmethod
    def all_roles(cls):
        return [
            cls.SUPER_ADMIN,
            cls.SCHOOL_ADMIN,
            cls.TEACHER,
            cls.STUDENT,
            cls.PARENT,
            cls.INDIVIDUAL,
            cls.PUBLICATION
        ]
    
    @classmethod
    def admin_roles(cls):
        return [cls.SUPER_ADMIN, cls.SCHOOL_ADMIN]
    
    @classmethod
    def can_manage_users(cls, role):
        return role in [cls.SUPER_ADMIN, cls.SCHOOL_ADMIN, cls.TEACHER]
