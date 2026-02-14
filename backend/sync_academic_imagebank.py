import asyncio
import boto3
from botocore.config import Config
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

# R2 Configuration
R2_ACCESS_KEY = "b98a6dc5c0d8a4225e71b249e391ebda"
R2_SECRET_KEY = "88fb9eb73b2d7ae0accdd8072832b53883fb87ab33d3d3421ce9ad03ca7adff6"
R2_ENDPOINT = "https://750f1bde8d84ac72daacc5a06e28fa9f.r2.cloudflarestorage.com"
R2_BUCKET = "myschool"
R2_PUBLIC_URL = "https://pub-0ddb0004edaa4980a580d6c3f79b3a3f.r2.dev"

# MongoDB Configuration
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = "myschool_portal"

# R2 Prefix to sync
R2_PREFIX = "myschool/ACADEMIC/IMAGE BANK/"

async def sync_academic_imagebank():
    """Sync images from R2 'myschool/ACADEMIC/IMAGE BANK/' to MongoDB"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Initialize S3 client for R2
    s3_client = boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        config=Config(signature_version='s3v4')
    )
    
    print(f"Starting sync from R2 prefix: {R2_PREFIX}")
    print(f"MongoDB database: {DB_NAME}")
    
    # List objects in R2
    paginator = s3_client.get_paginator('list_objects_v2')
    
    total_synced = 0
    categories_found = set()
    
    for page in paginator.paginate(Bucket=R2_BUCKET, Prefix=R2_PREFIX):
        for obj in page.get('Contents', []):
            key = obj['Key']
            
            # Skip if it's a directory marker
            if key.endswith('/'):
                continue
            
            # Parse the path to get category info
            # Example: myschool/ACADEMIC/IMAGE BANK/ANIMALS/cat.jpg
            relative_path = key.replace(R2_PREFIX, '')
            parts = relative_path.split('/')
            
            if len(parts) < 1:
                continue
            
            category = parts[0] if parts[0] else 'GENERAL'
            subcategory = parts[1] if len(parts) > 2 else None
            filename = parts[-1]
            
            # Get file extension
            ext = filename.split('.')[-1].lower() if '.' in filename else ''
            
            # Skip non-image files
            if ext not in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'mp4', 'mov']:
                continue
            
            categories_found.add(category)
            
            # Create document for MongoDB
            doc = {
                "path": key,
                "url": f"{R2_PUBLIC_URL}/{key}",
                "filename": filename,
                "category": "MYSCHOOL/ACADEMIC/IMAGE BANK",
                "subcategory": category,
                "nested_category": subcategory,
                "menu": "ACADEMIC",
                "sub_menu": "IMAGE BANK",
                "type": ext.upper(),
                "file_type": "image" if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] else ("video" if ext in ['mp4', 'mov'] else "document"),
                "size": obj.get('Size', 0),
                "last_modified": obj.get('LastModified', datetime.now(timezone.utc)).isoformat() if isinstance(obj.get('LastModified'), datetime) else str(obj.get('LastModified', '')),
                "synced_at": datetime.now(timezone.utc).isoformat(),
                "source": "r2_sync"
            }
            
            # Upsert to MongoDB (update if exists, insert if not)
            await db.resource_images.update_one(
                {"path": key},
                {"$set": doc},
                upsert=True
            )
            total_synced += 1
            
            if total_synced % 100 == 0:
                print(f"Synced {total_synced} files...")
    
    print(f"\n=== SYNC COMPLETE ===")
    print(f"Total files synced: {total_synced}")
    print(f"Categories found: {sorted(categories_found)}")
    
    # Verify count in MongoDB
    count = await db.resource_images.count_documents({"category": "MYSCHOOL/ACADEMIC/IMAGE BANK"})
    print(f"Total documents in MongoDB with category 'MYSCHOOL/ACADEMIC/IMAGE BANK': {count}")
    
    client.close()
    return total_synced, list(categories_found)

if __name__ == "__main__":
    asyncio.run(sync_academic_imagebank())
