#!/bin/bash

# Deployment Script
# Usage: ./deploy.sh

echo "Starting deployment..."

# 1. Pull latest changes (handled by CI usually, but good for manual run)
# git pull origin main

# 2. Stop existing containers
docker-compose down

# 3. Rebuild and start containers detached
docker-compose up --build -d

# 4. Wait for database to be ready (optional check)
# sleep 10

# 5. Run Database Migrations (if you have them)
# docker-compose exec -T backend npm run migrate

# 6. Verify containers are running
if [ "$(docker ps -q -f name=hr_backend)" ]; then
    echo "✅ Application deployed successfully!"
else
    echo "❌ Deployment failed. Check logs with 'docker-compose logs'"
    exit 1
fi
