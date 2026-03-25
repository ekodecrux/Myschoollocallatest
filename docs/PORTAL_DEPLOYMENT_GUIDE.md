# MySchool Portal - Hostinger Deployment Guide

## Overview
This guide provides step-by-step instructions to deploy the MySchool Portal on a Hostinger VPS server. The deployment includes setting up the React frontend, FastAPI backend, MongoDB database, and Nginx reverse proxy.

---

## Prerequisites

### Server Requirements
- Hostinger VPS (minimum 2GB RAM, 2 vCPU)
- Ubuntu 22.04 LTS or later
- Root or sudo access
- Domain name pointed to server IP

### Local Requirements
- Git installed
- SSH client
- Node.js 18+ (for building frontend)
- Python 3.11+ (for testing backend)

---

## Step 1: Initial Server Setup

### 1.1 Connect to Server
```bash
ssh root@YOUR_SERVER_IP
```

### 1.2 Update System Packages
```bash
apt update && apt upgrade -y
```

### 1.3 Install Essential Packages
```bash
apt install -y curl wget git nano unzip software-properties-common
```

### 1.4 Create Non-Root User (Recommended)
```bash
adduser myschool
usermod -aG sudo myschool
```

---

## Step 2: Install Required Software

### 2.1 Install Node.js 18+
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
node --version
npm --version
```

### 2.2 Install Python 3.11
```bash
add-apt-repository ppa:deadsnakes/ppa -y
apt update
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
python3 --version
```

### 2.3 Install MongoDB
```bash
# Import MongoDB GPG key
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
apt update
apt install -y mongodb-org

# Start and enable MongoDB
systemctl start mongod
systemctl enable mongod
systemctl status mongod
```

### 2.4 Install Nginx
```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 2.5 Install PM2 (for Node.js process management)
```bash
npm install -g pm2
```

### 2.6 Install Additional Dependencies
```bash
# For PDF thumbnail generation
apt install -y poppler-utils

# For image processing
apt install -y libjpeg-dev libpng-dev
```

---

## Step 3: Deploy Backend

### 3.1 Create Application Directory
```bash
mkdir -p /var/www/myschool-backend
cd /var/www/myschool-backend
```

### 3.2 Clone Repository
```bash
git clone https://github.com/YOUR_ORG/myschool-backend.git .
# Or copy files from local machine
```

### 3.3 Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3.4 Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3.5 Configure Environment Variables
```bash
nano .env
```

Add the following configuration:
```
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=myschool_portal

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-key-change-this
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM="MySchool <your-email@gmail.com>"
ADMIN_EMAIL=admin@yourschool.com

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket
R2_PUBLIC_URL=https://your-bucket.r2.dev

# Razorpay (for payments)
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=your-secret
```

### 3.6 Create Systemd Service
```bash
nano /etc/systemd/system/myschool-backend.service
```

Add the following content:
```ini
[Unit]
Description=MySchool Backend Service
After=network.target mongod.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/myschool-backend
Environment="PATH=/var/www/myschool-backend/venv/bin"
ExecStart=/var/www/myschool-backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 3023
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3.7 Start Backend Service
```bash
systemctl daemon-reload
systemctl start myschool-backend
systemctl enable myschool-backend
systemctl status myschool-backend
```

### 3.8 Verify Backend
```bash
curl http://localhost:3023/api/health
# Should return: {"status": "healthy"}
```

---

## Step 4: Deploy Frontend

### 4.1 Build Frontend (On Local Machine)
```bash
cd frontend
npm install
# or
yarn install

# Set production backend URL
echo "REACT_APP_BACKEND_URL=https://YOUR_DOMAIN.com" > .env.production
echo "REACT_APP_RAZORPAY_KEY_ID=rzp_live_xxx" >> .env.production

# Build
npm run build
# or
yarn build
```

### 4.2 Upload Build to Server
```bash
# From local machine
scp -r build/* root@YOUR_SERVER_IP:/var/www/myschool-portal/
```

Or on server:
```bash
mkdir -p /var/www/myschool-portal
# Then upload files
```

### 4.3 Set Permissions
```bash
chown -R www-data:www-data /var/www/myschool-portal
chmod -R 755 /var/www/myschool-portal
```

---

## Step 5: Configure Nginx

### 5.1 Create Nginx Configuration
```bash
nano /etc/nginx/sites-available/myschool-portal
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN.com www.YOUR_DOMAIN.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name YOUR_DOMAIN.com www.YOUR_DOMAIN.com;

    # SSL certificates (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/YOUR_DOMAIN.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # Frontend static files
    root /var/www/myschool-portal;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # API proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:3023/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
        
        # Increase buffer sizes for large responses
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # React SPA routing
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 5.2 Enable Site Configuration
```bash
ln -s /etc/nginx/sites-available/myschool-portal /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Remove default config
```

### 5.3 Test and Reload Nginx
```bash
nginx -t
systemctl reload nginx
```

---

## Step 6: SSL Certificate Setup

### 6.1 Install Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### 6.2 Obtain SSL Certificate
```bash
certbot --nginx -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com
```

### 6.3 Setup Auto-Renewal
```bash
certbot renew --dry-run
```

Certbot automatically adds a cron job for renewal.

---

## Step 7: Configure Firewall

### 7.1 Setup UFW Firewall
```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

---

## Step 8: Database Setup

### 8.1 Create Database and User (Optional)
```bash
mongosh

use myschool_portal
db.createUser({
  user: "myschool_user",
  pwd: "secure_password",
  roles: [{ role: "readWrite", db: "myschool_portal" }]
})
exit
```

### 8.2 Create Initial Admin User
```bash
# Use the API or create directly in MongoDB
mongosh myschool_portal

db.users.insertOne({
  userId: "admin-uuid",
  name: "Super Admin",
  email: "admin@yourschool.com",
  password_hash: "$2b$12$...", // bcrypt hash of password
  role: "SUPER_ADMIN",
  credits: 999999,
  isActive: true,
  created_at: new Date()
})
```

---

## Step 9: Monitoring Setup

### 9.1 Backend Logs
```bash
# View backend logs
journalctl -u myschool-backend -f

# View last 100 lines
journalctl -u myschool-backend -n 100
```

### 9.2 Nginx Logs
```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

### 9.3 MongoDB Logs
```bash
tail -f /var/log/mongodb/mongod.log
```

---

## Step 10: Backup Configuration

### 10.1 Create Backup Script
```bash
nano /root/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --out $BACKUP_DIR/mongodb_$DATE

# Backup environment files
cp /var/www/myschool-backend/.env $BACKUP_DIR/backend_env_$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -mtime +7 -delete

echo "Backup completed: $DATE"
```

### 10.2 Schedule Daily Backups
```bash
chmod +x /root/backup.sh
crontab -e

# Add line:
0 2 * * * /root/backup.sh >> /var/log/backup.log 2>&1
```

---

## Step 11: Deployment Updates

### 11.1 Update Backend
```bash
cd /var/www/myschool-backend
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
systemctl restart myschool-backend
```

### 11.2 Update Frontend
```bash
# Build locally and upload
scp -r build/* root@YOUR_SERVER_IP:/var/www/myschool-portal/

# Clear Nginx cache (if any)
systemctl reload nginx
```

---

## Troubleshooting

### Backend Won't Start
```bash
# Check logs
journalctl -u myschool-backend -n 50

# Check if port is in use
netstat -tulnp | grep 3023

# Verify Python environment
/var/www/myschool-backend/venv/bin/python --version
```

### Nginx 502 Bad Gateway
```bash
# Check if backend is running
systemctl status myschool-backend

# Check Nginx error log
tail -f /var/log/nginx/error.log

# Verify proxy settings
nginx -t
```

### MongoDB Connection Issues
```bash
# Check MongoDB status
systemctl status mongod

# Test connection
mongosh --eval "db.adminCommand('ping')"
```

### SSL Certificate Issues
```bash
# Renew certificate
certbot renew --force-renewal

# Check certificate status
certbot certificates
```

---

## Quick Reference Commands

| Action | Command |
|--------|---------|
| Start Backend | `systemctl start myschool-backend` |
| Stop Backend | `systemctl stop myschool-backend` |
| Restart Backend | `systemctl restart myschool-backend` |
| Backend Logs | `journalctl -u myschool-backend -f` |
| Reload Nginx | `systemctl reload nginx` |
| Nginx Status | `systemctl status nginx` |
| MongoDB Status | `systemctl status mongod` |
| Check Ports | `netstat -tulnp` |
| Disk Usage | `df -h` |
| Memory Usage | `free -m` |

---

## Security Checklist

- [ ] Changed default SSH port (optional)
- [ ] Disabled root SSH login (after creating sudo user)
- [ ] Firewall enabled (UFW)
- [ ] SSL certificate installed
- [ ] Strong database passwords
- [ ] Environment variables secured
- [ ] Regular backups configured
- [ ] Log monitoring enabled

---

**Document Version:** 1.0
**Last Updated:** March 2026
**Developer:** info@expertaid.in
