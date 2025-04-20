#!/bin/bash

# Import environment variables from .env file
set -a
source /path/to/deployment/.env
set +a

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="${BACKUP_PREFIX}_${TIMESTAMP}.sql.gz"
BACKUP_PATH="/backup/${BACKUP_NAME}"

# Perform the backup
echo "Creating backup: ${BACKUP_PATH}"
mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --all-databases | gzip > $BACKUP_PATH
if [ $? -eq 0 ]; then
  echo "Database backup created successfully: $BACKUP_NAME"
else
  echo "Error creating database backup"
  exit 1
fi

# Create a symlink to the latest backup
ln -sf $BACKUP_PATH /backup/latest.sql.gz

# Remove old backups
echo "Removing backups older than $BACKUP_KEEP_DAYS days"
find /backup -type f -name "${BACKUP_PREFIX}_*.sql.gz" -mtime +$BACKUP_KEEP_DAYS -delete

echo "Backup process completed" 