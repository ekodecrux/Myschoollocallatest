import boto3
from botocore.config import Config

# R2 Configuration
R2_ACCESS_KEY = "b98a6dc5c0d8a4225e71b249e391ebda"
R2_SECRET_KEY = "88fb9eb73b2d7ae0accdd8072832b53883fb87ab33d3d3421ce9ad03ca7adff6"
R2_ENDPOINT = "https://750f1bde8d84ac72daacc5a06e28fa9f.r2.cloudflarestorage.com"
R2_BUCKET = "myschool"

s3_client = boto3.client(
    's3',
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    config=Config(signature_version='s3v4')
)

# Check inside ACADEMIC/
print("=" * 60)
print("Exploring ACADEMIC/ folder structure...")
response = s3_client.list_objects_v2(Bucket=R2_BUCKET, Prefix='ACADEMIC/', Delimiter='/', MaxKeys=100)

print("\nFolders inside ACADEMIC/:")
for prefix in response.get('CommonPrefixes', []):
    print(f"  📁 {prefix['Prefix']}")

# Check for IMAGE BANK specifically
print("\n" + "=" * 60)
print("Checking ACADEMIC/IMAGE BANK/ (with space)...")
response = s3_client.list_objects_v2(Bucket=R2_BUCKET, Prefix='ACADEMIC/IMAGE BANK/', Delimiter='/', MaxKeys=100)

print("\nFolders:")
for prefix in response.get('CommonPrefixes', []):
    print(f"  📁 {prefix['Prefix']}")
print("\nSample files:")
for obj in response.get('Contents', [])[:10]:
    print(f"  📄 {obj['Key']}")

# Check ACADEMIC/IMAGEBANK (without space)
print("\n" + "=" * 60)
print("Checking ACADEMIC/IMAGEBANK/ (no space)...")
response = s3_client.list_objects_v2(Bucket=R2_BUCKET, Prefix='ACADEMIC/IMAGEBANK/', Delimiter='/', MaxKeys=100)

print("\nFolders:")
for prefix in response.get('CommonPrefixes', []):
    print(f"  📁 {prefix['Prefix']}")

# Check ONE CLICK RESOURCE CENTER
print("\n" + "=" * 60)
print("Checking ONE CLICK RESOURCE CENTER/ folder...")
response = s3_client.list_objects_v2(Bucket=R2_BUCKET, Prefix='ONE CLICK RESOURCE CENTER/', Delimiter='/', MaxKeys=100)

print("\nFolders:")
for prefix in response.get('CommonPrefixes', []):
    print(f"  📁 {prefix['Prefix']}")

# Let's do a broad search for 'IMAGE BANK'
print("\n" + "=" * 60)
print("Searching for any paths containing 'IMAGE'...")
paginator = s3_client.get_paginator('list_objects_v2')
image_paths = set()
count = 0

for page in paginator.paginate(Bucket=R2_BUCKET, MaxKeys=1000):
    for obj in page.get('Contents', []):
        key = obj['Key']
        if 'IMAGE' in key.upper() or 'image' in key.lower():
            # Get the folder path
            parts = key.rsplit('/', 1)
            if len(parts) > 1:
                image_paths.add(parts[0] + '/')
            count += 1
            if count > 5000:
                break
    if count > 5000:
        break

print("\nUnique paths with 'IMAGE' in them:")
for path in sorted(image_paths)[:30]:
    print(f"  📁 {path}")
