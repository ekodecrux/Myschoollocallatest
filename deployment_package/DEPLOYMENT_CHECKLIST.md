# MySchool Deployment Checklist

## Pre-Deployment

- [ ] VPS server provisioned (min 2GB RAM, 2 vCPU)
- [ ] Domain name configured and pointing to server IP
- [ ] SSH access to server

## Server Setup

- [ ] Ubuntu/Debian system updated
- [ ] Node.js 18+ installed
- [ ] Python 3.10+ installed
- [ ] MongoDB 6.0+ installed and running
- [ ] Nginx installed
- [ ] PM2 installed globally
- [ ] Application directories created

## Backend Deployment

- [ ] Backend files uploaded to `/var/www/myschool/backend/`
- [ ] Python virtual environment created
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file configured with:
  - [ ] MongoDB connection string (with authentication)
  - [ ] JWT_SECRET (changed from default)
  - [ ] Email SMTP credentials
- [ ] Uploads directory created with proper permissions
- [ ] PM2 process started and saved

## Frontend Deployment

- [ ] Frontend files uploaded
- [ ] `.env` file configured with backend URL
- [ ] Dependencies installed (`yarn install`)
- [ ] Production build created (`yarn build`)
- [ ] Build files copied to Nginx directory

## Web Server

- [ ] Nginx configuration created
- [ ] Site enabled (symlinked to sites-enabled)
- [ ] Nginx configuration tested (`nginx -t`)
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] Nginx reloaded

## Database

- [ ] MongoDB user created with proper permissions
- [ ] Database indexes created
- [ ] Super Admin user created
- [ ] Default password changed
- [ ] Database backup script configured

## Security

- [ ] JWT_SECRET changed from default
- [ ] MongoDB password is strong
- [ ] MongoDB authentication enabled
- [ ] Firewall configured (UFW)
- [ ] Only ports 22, 80, 443 open
- [ ] fail2ban installed and configured
- [ ] SSL certificate auto-renewal tested

## Testing

- [ ] Frontend loads correctly
- [ ] Login works (Super Admin)
- [ ] API endpoints respond
- [ ] Image uploads work
- [ ] Email sending works
- [ ] Chatbot widget loads

## Post-Deployment

- [ ] Monitor logs for errors
- [ ] Set up regular backups (cron job)
- [ ] Document admin credentials securely
- [ ] Test backup restore procedure

## Cloudflare R2 (Optional)

- [ ] R2 bucket created
- [ ] Public access configured
- [ ] Images uploaded to R2
- [ ] Backend configured with R2 URLs
- [ ] Database records updated with R2 URLs

---

## Quick Commands

```bash
# Check backend status
pm2 status
pm2 logs myschool-backend

# Restart services
pm2 restart myschool-backend
sudo systemctl restart nginx

# Check logs
sudo tail -f /var/log/nginx/myschool_error.log
sudo tail -f /var/www/myschool/logs/backend-error.log

# MongoDB shell
mongosh myschool_db

# SSL renewal test
sudo certbot renew --dry-run
```

---

**Deployment Package Version**: 1.0.0  
**Created**: December 2025
