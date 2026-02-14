import boto3
from botocore.config import Config

# R2 Configuration
R2_ACCESS_KEY = "b98a6dc5c0d8a4225e71b249e391ebda"
R2_SECRET_KEY = "88fb9eb73b2d7ae0accdd8072832b53883fb87ab33d3d3421ce9ad03ca7adff6"
R2_ENDPOINT = "https://750f1bde8d84ac72daacc5a06e28fa9f.r2.cloudflarestorage.com"
R2_BUCKET = "myschool"

# Initialize S3 client for R2
s3_client = boto3.client(
    's3',
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    config=Config(signature_version='s3v4')
)

print("Listing root-level prefixes in R2 bucket...")
print("=" * 60)

# List at root level
response = s3_client.list_objects_v2(Bucket=R2_BUCKET, Delimiter='/', MaxKeys=50)

print("\nRoot folders:")
for prefix in response.get('CommonPrefixes', []):
    print(f"  📁 {prefix['Prefix']}")

print("\nRoot files:")
for obj in response.get('Contents', [])[:10]:
    print(f"  📄 {obj['Key']}")

# Now check 'myschool/' specifically
print("\n" + "=" * 60)
print("Checking 'myschool/' folder...")
response = s3_client.list_objects_v2(Bucket=R2_BUCKET, Prefix='myschool/', Delimiter='/', MaxKeys=50)

print("\nFolders inside 'myschool/':")
for prefix in response.get('CommonPrefixes', []):
    print(f"  📁 {prefix['Prefix']}")

print("\nFiles inside 'myschool/':")
for obj in response.get('Contents', [])[:10]:
    print(f"  📄 {obj['Key']}")

# Check 'myschool/ACADEMIC/'
print("\n" + "=" * 60)
print("Checking 'myschool/ACADEMIC/' folder...")
response = s3_client.list_objects_v2(Bucket=R2_BUCKET, Prefix='myschool/ACADEMIC/', Delimiter='/', MaxKeys=50)

print("\nFolders inside 'myschool/ACADEMIC/':")
for prefix in response.get('CommonPrefixes', []):
    print(f"  📁 {prefix['Prefix']}")

print("\nFiles inside 'myschool/ACADEMIC/':")
for obj in response.get('Contents', [])[:10]:
    print(f"  📄 {obj['Key']}")

# Check 'myschool/ACADEMIC/IMAGE BANK/'
print("\n" + "=" * 60)
print("Checking 'myschool/ACADEMIC/IMAGE BANK/' folder...")
response = s3_client.list_objects_v2(Bucket=R2_BUCKET, Prefix='myschool/ACADEMIC/IMAGE BANK/', Delimiter='/', MaxKeys=50)

print("\nFolders inside 'myschool/ACADEMIC/IMAGE BANK/':")
for prefix in response.get('CommonPrefixes', []):
    print(f"  📁 {prefix['Prefix']}")

print("\nFiles inside 'myschool/ACADEMIC/IMAGE BANK/':")
for obj in response.get('Contents', [])[:10]:
    print(f"  📄 {obj['Key']}")

# Also check alternative paths with different casing
print("\n" + "=" * 60)
print("Checking alternative paths...")

for prefix in ['MYSCHOOL/', 'MySchool/', 'Myschool/']:
    response = s3_client.list_objects_v2(Bucket=R2_BUCKET, Prefix=prefix, MaxKeys=5)
    if response.get('Contents') or response.get('CommonPrefixes'):
        print(f"\n✅ Found content at '{prefix}'")
        for p in response.get('CommonPrefixes', [])[:5]:
            print(f"  📁 {p['Prefix']}")
        for obj in response.get('Contents', [])[:5]:
            print(f"  📄 {obj['Key']}")
