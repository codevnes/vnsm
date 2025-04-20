#!/bin/bash

# This script is intended to be run as a cron job to automate database backups

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOYMENT_DIR="$(dirname "$SCRIPT_DIR")"

# Change to the deployment directory
cd "$DEPLOYMENT_DIR" || exit 1

# Execute the backup inside the database container
docker exec vnsm-db /backup/backup.sh

# Check the exit status
if [ $? -eq 0 ]; then
  echo "[$(date)] Automated backup completed successfully" >> "$SCRIPT_DIR/backup.log"
  exit 0
else
  echo "[$(date)] ERROR: Automated backup failed" >> "$SCRIPT_DIR/backup.log"
  exit 1
fi 