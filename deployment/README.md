# VNSM Docker Deployment

This directory contains all necessary files to deploy VNSM (Vietnam Stock Market) application using Docker with automatic SSL certificate generation via Traefik.

## Requirements

- Docker and Docker Compose
- A domain name pointed to your server's IP address
- Open ports 80 and 443 on your firewall

## Quick Start

1. Clone this repository

2. Navigate to the deployment directory:
   ```bash
   cd deployment
   ```

3. Run the setup script:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

4. Edit the .env file with your domain and credentials:
   ```bash
   nano .env
   ```

5. Start the application:
   ```bash
   docker-compose up -d
   ```

6. Your application will be available at your configured domain with HTTPS!

## Configuration Details

### Environment Variables

Edit the `.env` file to configure the deployment:

- `DOMAIN`: Your domain name (e.g., vnsm.com)
- `ACME_EMAIL`: Email address for Let's Encrypt notifications
- `TRAEFIK_USER` and `TRAEFIK_PASSWORD`: Credentials for the Traefik dashboard
- `DB_*`: PostgreSQL database configuration
- `JWT_SECRET`: Secret for JWT authentication
- `BACKUP_*`: Database backup settings

### Traefik Dashboard

The Traefik dashboard is available at `traefik.yourdomain.com` and is protected with basic authentication.

### Automatic SSL Certificates

Traefik automatically obtains and renews SSL certificates from Let's Encrypt for your domains.

## Database Management

### Creating a Backup

To create a database backup:
```bash
docker exec vnsm-db /backup/backup.sh
```

Or set up a cron job for automatic backups:
```
0 2 * * * docker exec vnsm-db /backup/backup.sh
```

### Restoring from Backup

To restore the database from the latest backup:
```bash
docker exec -it vnsm-db /backup/restore.sh
```

Or specify a specific backup file:
```bash
docker exec -it vnsm-db /backup/restore.sh vnsm_20230101_120000.sql.gz
```

## Directory Structure

- `traefik/`: Traefik configuration files
- `backup/`: Database backup scripts and backup files
- `uploads/`: Persistent storage for uploaded files

## Maintenance

### Updating the Application

To update the application:

1. Pull the latest changes from the repository
2. Rebuild the containers:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

### Checking Logs

```bash
# All containers
docker-compose logs

# Specific container
docker-compose logs frontend
docker-compose logs backend
docker-compose logs db
docker-compose logs traefik
```

## Troubleshooting

### SSL Certificate Issues

1. Check if Traefik can connect to Let's Encrypt:
   ```bash
   docker-compose logs traefik | grep "certificate"
   ```

2. Verify that ports 80 and 443 are open and not used by other services

### Database Connection Issues

1. Check database logs:
   ```bash
   docker-compose logs db
   ```

2. Verify connection string in the .env file

### Need Help?

If you encounter any issues with this deployment, please open an issue on our GitHub repository. 