#!/bin/bash

# Prisma Tools - Helper script for common Prisma operations

print_help() {
  echo "Prisma Tools - Helper script for common Prisma operations"
  echo ""
  echo "Usage: ./prisma-tools.sh [command]"
  echo ""
  echo "Commands:"
  echo "  studio         - Run Prisma Studio (GUI for database management)"
  echo "  push           - Push schema changes to the database"
  echo "  pull           - Pull database schema into Prisma schema"
  echo "  generate       - Generate Prisma client"
  echo "  seed           - Run database seeding"
  echo "  migrate [name] - Create a new migration (requires name)"
  echo "  reset          - Reset the database (CAUTION: deletes all data)"
  echo "  status         - Check migration status"
  echo "  fix-schema     - Fix schema location issues"
  echo "  docker [cmd]   - Run a Prisma command in Docker"
  echo "  help           - Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./prisma-tools.sh studio"
  echo "  ./prisma-tools.sh migrate add-user-table"
  echo "  ./prisma-tools.sh docker 'npx prisma db push'"
}

run_in_docker() {
  if [ -f "./prisma-docker.sh" ]; then
    ./prisma-docker.sh "$1"
  else
    echo "Error: prisma-docker.sh script not found"
    echo "Make sure you're in the project root directory"
    exit 1
  fi
}

run_in_backend() {
  (cd backend && $1)
}

fix_schema_location() {
  echo "Fixing schema location issues..."
  
  # Check if we're in the right directory
  if [ ! -d "./backend" ]; then
    echo "Error: backend directory not found"
    echo "Make sure you're in the project root directory"
    exit 1
  fi
  
  # Create schema symlink if needed
  if [ ! -f "./backend/schema.prisma" ]; then
    echo "Creating schema.prisma symlink in backend directory..."
    ln -sf ./prisma/schema.prisma ./backend/schema.prisma
    echo "Done."
  else
    echo "Schema link already exists."
  fi
  
  # Check if schema exists in prisma directory
  if [ ! -f "./backend/prisma/schema.prisma" ]; then
    echo "Error: No schema.prisma file found in ./backend/prisma/"
    echo "Please create a schema.prisma file first"
    exit 1
  fi
  
  echo "Schema location should now be properly configured."
}

# Main script logic
case "$1" in
  studio)
    run_in_backend "npx prisma studio"
    ;;
  push)
    run_in_backend "npx prisma db push"
    ;;
  pull)
    run_in_backend "npx prisma db pull"
    ;;
  generate)
    run_in_backend "npx prisma generate"
    ;;
  seed)
    run_in_backend "npx prisma db seed"
    ;;
  migrate)
    if [ -z "$2" ]; then
      echo "Error: Migration name is required"
      echo "Usage: ./prisma-tools.sh migrate [name]"
      exit 1
    fi
    run_in_backend "npx prisma migrate dev --name $2"
    ;;
  reset)
    echo "WARNING: This will delete all data in your database!"
    read -p "Are you sure you want to continue? (y/N): " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
      run_in_backend "npx prisma migrate reset --force"
    else
      echo "Database reset cancelled."
    fi
    ;;
  status)
    run_in_backend "npx prisma migrate status"
    ;;
  fix-schema)
    fix_schema_location
    ;;
  docker)
    if [ -z "$2" ]; then
      run_in_docker "npx prisma studio"
    else
      run_in_docker "$2"
    fi
    ;;
  help|*)
    print_help
    ;;
esac 