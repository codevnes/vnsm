#!/bin/bash

# This script fixes the syntax error in the Dockerfile related to the apostrophe in "doesn't"

# Create a backup of the original Dockerfile
cp backend/Dockerfile backend/Dockerfile.bak

# Option 1: Replace the problematic line using sed
# Find any line containing "doesn't crash" and use double quotes instead of single quotes
sed -i 's/RUN echo .* logs errors but doesn.t crash.*/RUN echo "  \/\/ Provide a mock PrismaClient that logs errors but doesn'\''t crash" >> \/app\/start.sh/g' backend/Dockerfile

# Option 2: If the above doesn't work, use the simplified Dockerfile we created
if [ $? -ne 0 ]; then
  echo "Using the simplified Dockerfile..."
  if [ -f backend/Dockerfile.fix ]; then
    cp backend/Dockerfile.fix backend/Dockerfile
  else
    echo "Simplified Dockerfile not found. Please run the script again with the simplified Dockerfile."
    exit 1
  fi
fi

echo "Dockerfile has been fixed."
echo "Now run 'docker-compose build backend' to rebuild the backend image." 