#!/bin/bash
set -e

# Backup configuration
BACKUP_DIR="/var/backups/myschool"
DATE=$(date +%Y%m%d_%H%M%S)
MONGO_DB="myschool_db"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MongoDB
echo "Backing up MongoDB..."
mongodump --db $MONGO_DB --out $BACKUP_DIR/mongodb_$DATE

# Compress backup
echo "Compressing backup..."
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR mongodb_$DATE
rm -rf $BACKUP_DIR/mongodb_$DATE

# Keep only last 7 backups
echo "Cleaning old backups..."
ls -t $BACKUP_DIR/backup_*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup complete: $BACKUP_DIR/backup_$DATE.tar.gz"
