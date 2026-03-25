#!/bin/bash

# MySchool Quick Deployment Script for Hostinger VPS
# Run as root or with sudo

set -e

echo "========================================"
echo "MySchool Deployment Script for Hostinger"
echo "========================================"

# Configuration - UPDATE THESE
DOMAIN="yourdomain.com"
EMAIL="admin@yourdomain.com"
DB_PASSWORD="change_this_secure_password"
JWT_SECRET="change_this_jwt_secret_key_make_it_long"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install Node.js
print_status "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
npm install -g yarn pm2

# Install Python
print_status "Installing Python 3.10..."
apt install -y python3.10 python3.10-venv python3-pip

# Install MongoDB
print_status "Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# Install Nginx
print_status "Installing Nginx..."
apt install -y nginx

# Install Certbot
print_status "Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Create directories
print_status "Creating application directories..."
mkdir -p /var/www/myschool/{backend,frontend,uploads,logs}
mkdir -p /var/www/html/myschool

# Set permissions
chown -R www-data:www-data /var/www/myschool
chmod -R 755 /var/www/myschool

print_status "Base installation complete!"
print_warning "Next steps:"
echo "1. Upload your application files to /var/www/myschool/"
echo "2. Configure .env files"
echo "3. Run: certbot --nginx -d $DOMAIN"
echo "4. Update Nginx configuration"
echo ""
print_status "See README.md for detailed instructions."
