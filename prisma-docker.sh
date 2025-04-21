#!/bin/bash

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
  echo "Error: docker-compose could not be found"
  echo "Please install docker-compose or ensure it's in your PATH"
  exit 1
fi

# Check if the backend container is running
if ! docker-compose ps | grep -q "vnsm-backend"; then
  echo "Error: vnsm-backend container is not running"
  echo "Please start the containers first with 'docker-compose up -d'"
  exit 1
fi

# Default command is to run Prisma Studio
COMMAND=${1:-"npx prisma studio"}

echo "Running in Docker container: $COMMAND"
docker-compose exec backend sh -c "$COMMAND" 