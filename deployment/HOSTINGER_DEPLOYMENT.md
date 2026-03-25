# MySchool - Hostinger Deployment Guide

## Overview
MySchool is a comprehensive educational platform with React frontend and FastAPI backend.

## Directory Structure
```
/app/
├── frontend/          # React application
│   └── build/         # Production build (ready for Hostinger)
├── backend/           # FastAPI application
│   └── server.py      # Main server file
└── deployment/        # Deployment files
```

## Frontend Deployment (Hostinger Static Hosting)

### Option 1: File Manager Upload
1. Login to Hostinger hPanel
2. Go to File Manager → public_html
3. Upload contents of `/app/frontend/build/` folder
4. Ensure index.html is in the root

### Option 2: Git Deployment
1. Push to GitHub repository
2. Connect Hostinger to your GitHub repo
3. Set build directory to `frontend/build`

### Environment Variables
Create `.env` file in frontend with:
```
REACT_APP_BACKEND_URL=https://your-backend-domain.com
```

## Backend Deployment (Hostinger VPS or External)

### Requirements
- Python 3.9+
- MongoDB (use MongoDB Atlas for cloud)
- Poppler-utils (for PDF thumbnails)

### Steps
1. Upload `/app/backend/` folder to VPS
2. Install dependencies: `pip install -r requirements.txt`
3. Install system packages: `apt-get install poppler-utils`
4. Set environment variables in `.env`
5. Run with: `uvicorn server:app --host 0.0.0.0 --port 8001`

### Environment Variables (Backend .env)
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net
DB_NAME=myschool_db
JWT_SECRET=your-secret-key
CORS_ORIGINS=https://your-frontend-domain.com
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
R2_BASE_URL=https://pub-xxx.r2.dev
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=myschool
```

## CORS Configuration
Ensure backend allows your frontend domain in CORS_ORIGINS.

## SSL/HTTPS
- Use Hostinger's free SSL for frontend
- Configure HTTPS for backend API

## Testing After Deployment
1. Homepage loads correctly
2. Login/Registration works
3. Academic content loads
4. Image Bank shows images
5. Maker tools function properly

## Support
Contact: MySchool Support Team
