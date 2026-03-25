# Cloudflare R2 CORS Configuration Guide

## Why CORS Configuration is Needed

When your MySchool application tries to load PDFs or images directly from Cloudflare R2 in the browser, the browser blocks these requests due to Cross-Origin Resource Sharing (CORS) policy. This causes:
- PDF thumbnails not displaying
- "Failed to fetch" errors in console
- Images showing placeholder icons

## Step-by-Step Configuration

### Method 1: Using Cloudflare Dashboard (Recommended)

1. **Log into Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Select your account

2. **Navigate to R2**
   - Click on "R2 Object Storage" in the left sidebar

3. **Select Your Bucket**
   - Click on the bucket containing your MySchool assets (e.g., `myschool-assets`)

4. **Go to Settings**
   - Click the "Settings" tab at the top

5. **Configure CORS**
   - Scroll down to "CORS Policy" section
   - Click "Add CORS policy" or "Edit"
   - Add the following JSON configuration:

```json
[
  {
    "AllowedOrigins": [
      "https://yourdomain.com",
      "https://www.yourdomain.com",
      "http://localhost:3000"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "Content-Length",
      "Content-Type",
      "ETag"
    ],
    "MaxAgeSeconds": 86400
  }
]
```

6. **Save Changes**
   - Click "Save" to apply the CORS policy

### Method 2: Using Wrangler CLI

If you prefer command line:

1. **Install Wrangler**
```bash
npm install -g wrangler
```

2. **Authenticate**
```bash
wrangler login
```

3. **Create CORS config file** (`cors.json`):
```json
{
  "cors_rules": [
    {
      "allowed_origins": ["https://yourdomain.com", "https://www.yourdomain.com"],
      "allowed_methods": ["GET", "HEAD"],
      "allowed_headers": ["*"],
      "expose_headers": ["Content-Length", "Content-Type"],
      "max_age_seconds": 86400
    }
  ]
}
```

4. **Apply configuration**
```bash
wrangler r2 bucket cors put myschool-assets --file cors.json
```

### Method 3: Using S3-Compatible API

Since R2 is S3-compatible, you can use AWS CLI:

1. **Configure AWS CLI for R2**
```bash
aws configure --profile r2
# Use your R2 credentials
# Endpoint: https://<account_id>.r2.cloudflarestorage.com
```

2. **Create CORS XML file** (`cors.xml`):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>https://yourdomain.com</AllowedOrigin>
    <AllowedOrigin>https://www.yourdomain.com</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <MaxAgeSeconds>86400</MaxAgeSeconds>
    <ExposeHeader>Content-Length</ExposeHeader>
    <ExposeHeader>Content-Type</ExposeHeader>
  </CORSRule>
</CORSConfiguration>
```

3. **Apply CORS**
```bash
aws s3api put-bucket-cors \
  --bucket myschool-assets \
  --cors-configuration file://cors.xml \
  --endpoint-url https://<account_id>.r2.cloudflarestorage.com \
  --profile r2
```

## Configuration Values Explained

| Field | Value | Description |
|-------|-------|-------------|
| AllowedOrigins | Your domain(s) | Domains allowed to access R2 |
| AllowedMethods | GET, HEAD | HTTP methods allowed |
| AllowedHeaders | * | All headers allowed |
| MaxAgeSeconds | 86400 | Cache preflight for 24 hours |
| ExposeHeaders | Content-Length, Content-Type | Headers exposed to browser |

## Verifying CORS Configuration

### Test with cURL
```bash
curl -I -X OPTIONS \
  -H "Origin: https://yourdomain.com" \
  -H "Access-Control-Request-Method: GET" \
  https://pub-xxxxx.r2.dev/path/to/file.pdf
```

**Expected Response Headers:**
```
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET, HEAD
Access-Control-Max-Age: 86400
```

### Test in Browser Console
```javascript
fetch('https://pub-xxxxx.r2.dev/path/to/image.jpg')
  .then(r => console.log('CORS OK:', r.status))
  .catch(e => console.error('CORS Error:', e));
```

## Troubleshooting

### Issue: Still getting CORS errors

1. **Check Origin Match**: Ensure your domain exactly matches (including https://)
2. **Clear Browser Cache**: Hard refresh (Ctrl+Shift+R)
3. **Check R2 Public Access**: Ensure bucket has public access enabled
4. **Wait for Propagation**: Changes may take up to 5 minutes

### Issue: PDF still not loading

1. **Check Content-Type**: Ensure PDFs have correct MIME type (`application/pdf`)
2. **Try direct URL**: Open the R2 URL directly in browser
3. **Check file permissions**: Ensure file is publicly accessible

### Issue: Works locally but not in production

Make sure production domain is in AllowedOrigins:
```json
"AllowedOrigins": [
  "https://production-domain.com",
  "https://www.production-domain.com",
  "http://localhost:3000"
]
```

## Quick Reference

### Your R2 Bucket URL
```
https://pub-1adcb2fef0224429b1dfc0a5bb45dd31.r2.dev
```

### Your R2 Configuration
- **Account ID:** df062639da601bcc1a52d074c1a2be12
- **Bucket Name:** myschool
- **Public URL:** https://pub-1adcb2fef0224429b1dfc0a5bb45dd31.r2.dev

### Domains to Add
Replace with your actual domains:
- Production: `https://yourdomain.com`
- WWW: `https://www.yourdomain.com`
- Preview: `https://digital-class-board.preview.emergentagent.com`
- Local: `http://localhost:3000`

## After Configuration

Once CORS is configured:
1. PDF thumbnails will display inline
2. Images will load without fallback icons
3. No more "Failed to fetch" CORS errors in console

The application already has fallback handling, so it will automatically use the inline display once CORS is properly configured.
