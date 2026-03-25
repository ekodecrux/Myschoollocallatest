# MySchool Platform - Hostinger VPS Deployment Guide

## Overview

MySchool is a full-stack educational platform built with:
- **Frontend**: React.js with Material-UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Storage**: Cloudflare R2 (S3-compatible)

## Prerequisites

- Hostinger VPS with Ubuntu 22.04 LTS
- Root or sudo access
- Domain name pointed to your VPS IP
- Cloudflare R2 bucket configured for image storage

## Server Requirements

- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: 20GB+ SSD
- **CPU**: 2 vCPU cores

---

## Step 1: Initial Server Setup

SSH into your VPS and run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx git curl wget unzip
```

## Step 2: Install Node.js (if rebuilding frontend)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g yarn
```

## Step 3: Install MongoDB

Run the MongoDB setup script:

```bash
chmod +x scripts/setup-mongodb.sh
sudo ./scripts/setup-mongodb.sh
```

Or manually:

```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Step 4: Deploy Application

### 4.1 Upload Files

Upload the deployment package to your VPS:

```bash
# On your local machine
scp -r hostinger-deployment/* user@your-vps-ip:/tmp/myschool/

# On VPS
cd /tmp/myschool
```

### 4.2 Run Deployment Script

```bash
chmod +x scripts/deploy.sh
sudo ./scripts/deploy.sh
```

### 4.3 Configure Environment

Edit the backend environment file:

```bash
sudo nano /var/www/myschool/backend/.env
```

Set the following values:

```env
# MongoDB - Use authentication URL if you set up a user
MONGO_URL="mongodb://localhost:27017"
DB_NAME="myschool_db"

# Security - Generate a strong secret key
CORS_ORIGINS="https://yourdomain.com"
JWT_SECRET="generate-a-secure-32-char-key-here"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Email - Use Gmail App Password
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-16-char-app-password"
EMAIL_FROM="MySchool <your-email@gmail.com>"

# Cloudflare R2
R2_BASE_URL="https://your-bucket-id.r2.dev"
```

## Step 5: Configure Nginx

Edit the nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/myschool
```

Replace `yourdomain.com` with your actual domain name.

Test and reload nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Step 6: Setup SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts to complete SSL setup.

## Step 7: Start Services

```bash
# Start backend service
sudo systemctl start myschool
sudo systemctl enable myschool

# Verify services
sudo systemctl status myschool
sudo systemctl status nginx
sudo systemctl status mongod
```

---

## Cloudflare R2 Integration

### Setting Up R2 Bucket

1. Log into Cloudflare Dashboard
2. Go to R2 Object Storage
3. Create a new bucket or use existing one
4. Enable Public Access for the bucket

### CORS Configuration

For images and PDFs to load properly in the browser, configure CORS on your R2 bucket:

1. Go to R2 bucket settings
2. Add CORS policy:

```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]
```

### Uploading Images to R2

Use the Cloudflare Dashboard, rclone, or AWS CLI (with S3-compatible endpoint) to upload your image assets to R2.

Directory structure in R2:
```
/ART LESSONS/
/PROJECT CHARTS/
/FLASH CARDS/
/COMICS/
...
```

---

## Maintenance

### View Logs

```bash
# Backend logs
sudo journalctl -u myschool -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Restart Services

```bash
sudo systemctl restart myschool
sudo systemctl restart nginx
sudo systemctl restart mongod
```

### Backup Database

Run the backup script:

```bash
chmod +x scripts/backup.sh
sudo ./scripts/backup.sh
```

Add to crontab for automatic daily backups:

```bash
sudo crontab -e
# Add this line:
0 2 * * * /var/www/myschool/scripts/backup.sh
```

### Update Application

```bash
# Stop service
sudo systemctl stop myschool

# Upload new files
# ... copy new files ...

# Restart service
sudo systemctl start myschool
```

---

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
sudo journalctl -u myschool -n 50

# Check if port is in use
sudo lsof -i :8001

# Test manually
cd /var/www/myschool/backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001
```

### MongoDB Connection Issues

```bash
# Check MongoDB status
sudo systemctl status mongod

# Test connection
mongosh --eval "db.adminCommand('ping')"
```

### Nginx 502 Bad Gateway

1. Check if backend is running: `sudo systemctl status myschool`
2. Check backend logs: `sudo journalctl -u myschool -n 20`
3. Verify proxy_pass port matches backend port

### Images Not Loading

1. Verify R2 bucket is publicly accessible
2. Check CORS configuration on R2 bucket
3. Ensure R2_BASE_URL in .env is correct
4. Check browser console for CORS errors

---

## Security Recommendations

1. **Firewall**: Configure UFW
   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```

2. **MongoDB Security**: Enable authentication
   ```bash
   mongosh
   use admin
   db.createUser({
     user: "admin",
     pwd: "strong_password",
     roles: ["root"]
   })
   ```

3. **Regular Updates**: Keep system updated
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

4. **SSL**: Always use HTTPS (already configured with certbot)

---

## Support

For issues or questions:
- Check logs first
- Review this documentation
- Contact your system administrator

---

## File Structure

```
hostinger-deployment/
├── frontend/           # Built React application
│   ├── index.html
│   └── static/
├── backend/           # Python FastAPI application
│   ├── server.py
│   ├── requirements.txt
│   └── .env.example
├── config/
│   ├── nginx.conf     # Nginx configuration
│   └── myschool.service # Systemd service
├── scripts/
│   ├── deploy.sh      # Main deployment script
│   ├── setup-mongodb.sh # MongoDB setup
│   └── backup.sh      # Database backup
└── README.md          # This file
```
