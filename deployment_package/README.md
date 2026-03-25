# MySchool Application - Deployment Guide for Hostinger

## Overview
MySchool is a full-stack educational platform with:
- **Frontend**: React.js application
- **Backend**: FastAPI (Python) REST API
- **Database**: MongoDB
- **Chatbot**: External AI Assistant widget

---

## Prerequisites

### Hostinger VPS Requirements
- Ubuntu 20.04+ or Debian 11+
- Minimum 2GB RAM, 2 vCPU
- 20GB+ storage
- Node.js 18+
- Python 3.10+
- MongoDB 6.0+
- Nginx (reverse proxy)
- PM2 (process manager)
- SSL certificate (Let's Encrypt)

---

## Directory Structure

```
/var/www/myschool/
├── frontend/          # React build files
├── backend/           # FastAPI application
├── uploads/           # Image uploads
└── logs/              # Application logs
```

---

## Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3.10
sudo apt install -y python3.10 python3.10-venv python3-pip

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
```

---

## Step 2: Deploy Backend

```bash
# Create directory
sudo mkdir -p /var/www/myschool/backend
cd /var/www/myschool/backend

# Copy backend files (from deployment package)
# Upload backend/ folder contents here

# Create virtual environment
python3.10 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << 'EOF'
MONGO_URL="mongodb://localhost:27017"
DB_NAME="myschool_db"
CORS_ORIGINS="*"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="MySchool <your-email@gmail.com>"
EOF

# Create uploads directory
mkdir -p /var/www/myschool/uploads
chmod 755 /var/www/myschool/uploads
```

### PM2 Configuration for Backend

Create `/var/www/myschool/backend/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'myschool-backend',
    script: 'venv/bin/uvicorn',
    args: 'server:app --host 0.0.0.0 --port 8001',
    cwd: '/var/www/myschool/backend',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

```bash
# Start backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Step 3: Deploy Frontend

```bash
# Create directory
sudo mkdir -p /var/www/myschool/frontend
cd /var/www/myschool/frontend

# Copy frontend source files
# Upload frontend/ folder contents here

# Create .env file
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=https://api.yourdomain.com
EOF

# Install dependencies and build
yarn install
yarn build

# Copy build to nginx directory
sudo cp -r build/* /var/www/html/myschool/
```

---

## Step 4: Nginx Configuration

Create `/etc/nginx/sites-available/myschool`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    root /var/www/html/myschool;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploaded files
    location /uploads {
        alias /var/www/myschool/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/myschool /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 5: SSL Certificate

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Step 6: MongoDB Setup

```bash
# Connect to MongoDB
mongosh

# Create database and user
use myschool_db
db.createUser({
  user: "myschool_user",
  pwd: "secure_password_here",
  roles: [{ role: "readWrite", db: "myschool_db" }]
})

# Create Super Admin
db.users.insertOne({
  id: "super-admin-001",
  email: "admin@yourdomain.com",
  password_hash: "$2b$12$...",  // Generate with bcrypt
  name: "Super Admin",
  role: "SUPER_ADMIN",
  credits: 9999,
  is_active: true,
  created_at: new Date().toISOString()
})
```

---

## Step 7: Cloudflare R2 Integration (Images)

Update backend `.env` with R2 credentials:

```env
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY="your-access-key"
R2_SECRET_KEY="your-secret-key"
R2_BUCKET_NAME="myschool-images"
R2_PUBLIC_URL="https://your-r2-domain.com"
```

---

## Step 8: Chatbot Widget

The chatbot is already embedded in the frontend. Update the URL in:
`/var/www/myschool/frontend/public/index.html`

```javascript
const CHATBOT_URL = 'https://your-chatbot-url.com';
```

---

## Environment Variables Summary

### Backend (.env)
| Variable | Description |
|----------|-------------|
| MONGO_URL | MongoDB connection string |
| DB_NAME | Database name |
| JWT_SECRET | Secret key for JWT tokens |
| EMAIL_HOST | SMTP server host |
| EMAIL_PORT | SMTP server port |
| EMAIL_USER | SMTP username |
| EMAIL_PASSWORD | SMTP password/app password |
| EMAIL_FROM | Sender email address |

### Frontend (.env)
| Variable | Description |
|----------|-------------|
| REACT_APP_BACKEND_URL | Backend API URL |

---

## Monitoring & Maintenance

```bash
# Check backend status
pm2 status
pm2 logs myschool-backend

# Check MongoDB
sudo systemctl status mongod

# Check Nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart myschool-backend
sudo systemctl restart nginx
```

---

## Backup Script

Create `/var/www/myschool/backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/myschool"

mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --db myschool_db --out $BACKUP_DIR/db_$DATE

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/myschool/uploads

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
find $BACKUP_DIR -type d -empty -delete
```

```bash
chmod +x /var/www/myschool/backup.sh
# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /var/www/myschool/backup.sh
```

---

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Use strong MongoDB password
- [ ] Enable MongoDB authentication
- [ ] Configure firewall (UFW)
- [ ] Enable fail2ban
- [ ] Regular system updates
- [ ] SSL certificate auto-renewal
- [ ] Regular backups

---

## Support

For issues or questions, contact the development team.

**Application Version**: 1.0.0  
**Last Updated**: December 2025
