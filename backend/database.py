"""
Database Connection Module
Handles MongoDB connection setup
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
import logging

logger = logging.getLogger(__name__)

# MongoDB Configuration
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'myschool_db')

# Create MongoDB client
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

async def init_db():
    """Initialize database with required indexes"""
    try:
        # Create indexes for common queries
        await db.users.create_index("email", unique=True)
        await db.users.create_index("school_code")
        await db.users.create_index("teacher_code")
        await db.users.create_index("role")
        await db.resource_images.create_index("folder_path")
        await db.resource_images.create_index("category")
        await db.resource_images.create_index("status")
        await db.sessions.create_index("token")
        await db.password_reset_codes.create_index("email")
        
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")

async def close_db():
    """Close database connection"""
    client.close()
    logger.info("Database connection closed")

# Export db for use in other modules
__all__ = ['db', 'client', 'init_db', 'close_db']
