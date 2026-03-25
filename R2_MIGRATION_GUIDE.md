# R2 Content Migration Guide

## Current Issue
Your new R2 bucket `myschool` (https://pub-1adcb2fef0224429b1dfc0a5bb45dd31.r2.dev) is empty.
The old content is in the previous bucket (pub-d3fb13e2d4f5463d9efd67f15cc3e5b8).

## Option 1: Upload Content Using rclone (Recommended)

Since you have rclone installed at `D:\rclone-v1.72.1-windows-amd64\rclone-v1.72.1-windows-amd64`:

### Step 1: Configure rclone for your R2

Create or edit `rclone.conf`:

```ini
[myschool-r2]
type = s3
provider = Cloudflare
access_key_id = cd87ee3d1dc62e8fec52a4eae3c708d7
secret_access_key = 42e10bd32971975d2d0345c183aadfe9d93a9feb133d5b147a68ed46410982a4
endpoint = https://df062639da601bcc1a52d074c1a2be12.r2.cloudflarestorage.com
acl = private
```

### Step 2: List existing files (if any)
```cmd
rclone ls myschool-r2:myschool
```

### Step 3: Upload your content
```cmd
# Upload a folder
rclone copy "D:\path\to\your\content" myschool-r2:myschool --progress

# Upload with specific structure (matching database paths)
rclone copy "D:\ART LESSONS" myschool-r2:myschool/ART\ LESSONS --progress
```

### Step 4: Verify upload
```cmd
rclone ls myschool-r2:myschool --max-depth 2
```

## Option 2: Using AWS CLI

### Configure AWS CLI for R2
```cmd
aws configure --profile r2-myschool
```

Enter:
- Access Key ID: `cd87ee3d1dc62e8fec52a4eae3c708d7`
- Secret Access Key: `42e10bd32971975d2d0345c183aadfe9d93a9feb133d5b147a68ed46410982a4`
- Region: `auto`
- Output: `json`

### Upload files
```cmd
aws s3 sync "D:\your-content" s3://myschool/ ^
  --endpoint-url https://df062639da601bcc1a52d074c1a2be12.r2.cloudflarestorage.com ^
  --profile r2-myschool
```

## Option 3: Cloudflare Dashboard

1. Go to https://dash.cloudflare.com
2. Navigate to R2 Object Storage
3. Select `myschool` bucket
4. Click "Upload" and upload your files/folders

## Expected Folder Structure

Based on your database, files should be at:
```
myschool/
├── ART LESSONS/
│   ├── CLASS-1/
│   │   ├── ART BOOK/
│   │   │   ├── ATENIC01AR0001PDC.pdf
│   │   │   └── ...
│   │   ├── COLORING/
│   │   └── ...
│   ├── CLASS-2/
│   └── ...
├── PROJECT CHARTS/
├── FLASH CARDS/
└── ...
```

## After Upload

Once files are uploaded:
1. Test a URL directly: `https://pub-1adcb2fef0224429b1dfc0a5bb45dd31.r2.dev/ART%20LESSONS/CLASS-1/ART%20BOOK/ATENIC01AR0001PDC.pdf`
2. The PDF thumbnails and images should start working automatically
3. Make sure CORS is configured (see R2_CORS_CONFIGURATION.md)

## Quick Test After Upload

```bash
curl -I "https://pub-1adcb2fef0224429b1dfc0a5bb45dd31.r2.dev/ART%20LESSONS/CLASS-1/ART%20BOOK/ATENIC01AR0001PDC.pdf"
```

Expected: HTTP 200 OK
