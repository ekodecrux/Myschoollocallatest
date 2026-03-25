#!/bin/bash

# MySchool Backup Script
# Add to crontab: 0 2 * * * /var/www/myschool/backup.sh

set -e

# Configuration
BACKUP_DIR="/var/backups/myschool"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR

echo "Starting backup at $(date)"

# Backup MongoDB
echo "Backing up MongoDB..."
mongodump --db myschool_db --out $BACKUP_DIR/db_$DATE
tar -czf $BACKUP_DIR/db_$DATE.tar.gz -C $BACKUP_DIR db_$DATE
rm -rf $BACKUP_DIR/db_$DATE

# Backup uploads folder
echo "Backing up uploads..."
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /var/www/myschool uploads

# Backup environment files
echo "Backing up configuration..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
    /var/www/myschool/backend/.env \
    /var/www/myschool/frontend/.env \
    /etc/nginx/sites-available/myschool 2>/dev/null || true

# Remove old backups
echo "Cleaning up old backups..."
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -type d -empty -delete 2>/dev/null || true

echo "Backup completed at $(date)"
echo "Backup location: $BACKUP_DIR"
ls -lh $BACKUP_DIR/*$DATE*
