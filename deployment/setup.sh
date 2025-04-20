#!/bin/bash

echo "=== VNSM Docker Deployment Setup ==="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed."
echo ""

# Create the required directories
mkdir -p traefik/data backup/db uploads
chmod 600 traefik/acme.json 2>/dev/null || touch traefik/acme.json && chmod 600 traefik/acme.json

# Check if .env file exists, otherwise create from example
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "Creating .env file from .env.example..."
        cp .env.example .env
        echo "⚠️ Please edit the .env file with your own values."
        echo ""
    else
        echo "❌ .env.example file not found. Please create a .env file manually."
        exit 1
    fi
else
    echo "✅ .env file already exists."
fi

# Create the proxy network if it doesn't exist
if ! docker network ls | grep -q proxy; then
    echo "Creating 'proxy' Docker network..."
    docker network create proxy
    echo "✅ Docker network 'proxy' created."
else
    echo "✅ Docker network 'proxy' already exists."
fi

# Make backup scripts executable
chmod +x backup/*.sh
echo "✅ Backup scripts are now executable."

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To start the application:"
echo "1. Edit the .env file with your domain and credentials"
echo "2. Run 'docker-compose up -d' to start the containers"
echo ""
echo "To create a database backup:"
echo "./backup/backup.sh"
echo ""
echo "To restore a database backup:"
echo "./backup/restore.sh [backup_filename.sql.gz]"
echo ""
echo "Thank you for using VNSM!" 