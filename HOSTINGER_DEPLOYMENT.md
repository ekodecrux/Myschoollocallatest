# MySchool Portal - Hostinger VPS Deployment Guide

## Server Details
- Provider: Hostinger VPS
- IP: 88.222.244.84
- OS: Ubuntu 22.04 LTS
- Domain: portal.myschoolct.com

## Directory Structure
```
/var/www/
├── portal.myschoolct/          # Frontend build
├── myschoollocalnew_backend/   # Backend API
└── myschool-github/            # Source code
```

## Backend Deployment

### Setup
```bash
cd /var/www/myschoollocalnew_backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Environment Variables (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=myschool_portal
JWT_SECRET=your-secret-key
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=your-bucket-name
```

### Start Server
```bash
nohup python3 -m uvicorn server:app --host 0.0.0.0 --port 3023 > /var/log/myschool-portal.log 2>&1 &
```

## Frontend Deployment

### Build
```bash
cd /var/www/myschool-github/frontend
echo "REACT_APP_BACKEND_URL=https://portal.myschoolct.com" > .env
yarn install
yarn build
```

### Deploy
```bash
rm -rf /var/www/portal.myschoolct/*
cp -r build/* /var/www/portal.myschoolct/
```

## Nginx Configuration
Location: `/etc/nginx/sites-available/portal.myschoolct.com`

Key settings:
- SSL enabled with Let's Encrypt
- `/api/` proxied to `http://127.0.0.1:3023`
- SPA routing with `try_files $uri /index.html`

## Maintenance

### Check Backend
```bash
lsof -i :3023
tail -f /var/log/myschool-portal.log
```

### Restart Backend
```bash
pkill -f "uvicorn server:app"
cd /var/www/myschoollocalnew_backend
nohup python3 -m uvicorn server:app --host 0.0.0.0 --port 3023 > /var/log/myschool-portal.log 2>&1 &
```

### Rebuild Frontend
```bash
cd /var/www/myschool-github/frontend
yarn build
cp -r build/* /var/www/portal.myschoolct/
```
