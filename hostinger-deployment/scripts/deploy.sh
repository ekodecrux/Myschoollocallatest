#!/bin/bash
set -e

echo "MySchool Deployment Script"
echo "=========================="

# Variables
APP_DIR="/var/www/myschool"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

# Create directories
echo "Creating directories..."
sudo mkdir -p $APP_DIR
sudo mkdir -p $BACKEND_DIR
sudo mkdir -p $FRONTEND_DIR

# Copy frontend files
echo "Deploying frontend..."
sudo cp -r ./frontend/* $FRONTEND_DIR/

# Copy backend files
echo "Deploying backend..."
sudo cp -r ./backend/* $BACKEND_DIR/

# Setup Python virtual environment
echo "Setting up Python environment..."
cd $BACKEND_DIR
sudo python3 -m venv venv
sudo $BACKEND_DIR/venv/bin/pip install --upgrade pip
sudo $BACKEND_DIR/venv/bin/pip install -r requirements.txt

# Set permissions
echo "Setting permissions..."
sudo chown -R www-data:www-data $APP_DIR
sudo chmod -R 755 $APP_DIR

# Setup systemd service
echo "Setting up systemd service..."
sudo cp ./config/myschool.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable myschool
sudo systemctl start myschool

# Setup nginx
echo "Setting up nginx..."
sudo cp ./config/nginx.conf /etc/nginx/sites-available/myschool
sudo ln -sf /etc/nginx/sites-available/myschool /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "Deployment complete!"
echo "Next steps:"
echo "1. Update /var/www/myschool/backend/.env with your credentials"
echo "2. Update nginx config with your domain name"
echo "3. Setup SSL with: sudo certbot --nginx -d yourdomain.com"
echo "4. Restart services: sudo systemctl restart myschool nginx"
