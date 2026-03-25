# MySchool - Hostinger Deployment Guide

## Overview
MySchool is a comprehensive educational platform with:
- React frontend (static files)
- FastAPI backend (Python)
- MongoDB database

## Folder Structure
```
hostinger_deploy/
├── frontend/          # Static files for web hosting
│   ├── index.html
│   ├── static/
│   └── .htaccess
├── backend/           # Python API server
│   ├── server.py
│   └── requirements.txt
└── README.md
```

## Frontend Deployment (Static Web Hosting)

### Option 1: Hostinger Shared Hosting
1. Upload all contents of `frontend/` folder to `public_html/`
2. The `.htaccess` file handles routing for React SPA

### Option 2: Hostinger VPS
1. Install Node.js or use nginx to serve static files
2. Copy frontend files to `/var/www/html/` or nginx root

### Environment Setup
Before building frontend, update `.env`:
```
REACT_APP_BACKEND_URL=https://api.yourdomain.com
```

## Backend Deployment

### Option 1: Hostinger VPS (Recommended)
1. SSH into your VPS
2. Install Python 3.9+: `apt install python3 python3-pip`
3. Upload `backend/` folder
4. Install dependencies: `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and configure
6. Run with gunicorn: `gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8001`
7. Set up nginx as reverse proxy

### Option 2: External Backend Host
Use services like:
- Railway.app
- Render.com
- DigitalOcean App Platform
- AWS Lambda

### Nginx Configuration (for VPS)
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Systemd Service (for VPS)
Create `/etc/systemd/system/myschool-api.service`:
```ini
[Unit]
Description=MySchool API
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/myschool/backend
ExecStart=/usr/bin/gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8001
Restart=always

[Install]
WantedBy=multi-user.target
```

## MongoDB Setup
1. Create MongoDB Atlas account (free tier available)
2. Create cluster and database
3. Get connection string
4. Update `MONGO_URL` in backend `.env`

## SSL/HTTPS
- Hostinger provides free SSL for shared hosting
- For VPS, use Let's Encrypt: `certbot --nginx`

## Post-Deployment Checklist
- [ ] Frontend loads correctly
- [ ] Backend API responds at /api/health
- [ ] Login/Registration works
- [ ] Image upload/download works
- [ ] Email notifications work
- [ ] Payments work (if enabled)

## Support
For issues, check:
1. Browser console for frontend errors
2. Backend logs: `journalctl -u myschool-api -f`
3. Nginx logs: `/var/log/nginx/error.log`
