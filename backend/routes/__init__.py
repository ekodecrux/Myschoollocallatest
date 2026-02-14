"""
Routes Package
All API routes are organized here by feature
"""
from .auth import auth_router
from .users import users_router
from .admin import admin_router
from .schools import schools_router

__all__ = [
    'auth_router',
    'users_router', 
    'admin_router',
    'schools_router'
]
