#!/bin/bash

# Import environment variables from .env file
set -a
source /path/to/deployment/.env
set +a

# Configuration
if [ -z "$1" ]; then
  BACKUP_FILE="/backup/latest.sql.gz"
  echo "No backup file specified, using latest backup"
else
  BACKUP_FILE="/backup/$1"
fi

# Check if backup exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  echo "Available backups:"
  ls -la /backup/*.sql.gz 2>/dev/null || echo "No backups found"
  exit 1
fi

echo "Restoring database from backup: $BACKUP_FILE"
echo "WARNING: This will overwrite the current database!"
read -p "Are you sure you want to continue? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Restore cancelled"
  exit 0
fi

# Restore the database
echo "Restoring database..."
gunzip -c $BACKUP_FILE | psql -U $DB_USER -d $DB_NAME

if [ $? -eq 0 ]; then
  echo "Database restored successfully from $BACKUP_FILE"
else
  echo "Error restoring database"
  exit 1
fi 