#!/bin/bash
set -e

echo "MongoDB Setup Script for Hostinger VPS"
echo "======================================="

# Install MongoDB
echo "Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
echo "Starting MongoDB..."
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
echo "Creating database..."
mongosh --eval '
  use myschool_db;
  db.createUser({
    user: "myschool_user",
    pwd: "your_secure_password",
    roles: [{ role: "readWrite", db: "myschool_db" }]
  });
'

echo ""
echo "MongoDB setup complete!"
echo "Update your .env file with:"
echo 'MONGO_URL="mongodb://myschool_user:your_secure_password@localhost:27017/myschool_db"'
