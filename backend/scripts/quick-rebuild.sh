#!/bin/bash

# Quick rebuild script for core services
echo "🔧 Quick rebuild of core services..."

# Stop services
echo "⏹️ Stopping services..."
docker compose --profile core down

# Build shared module first (locally)
echo "🏗️ Building shared module..."
cd shared
npm install
npm run build
cd ..

# Rebuild only the services that need it
echo "🔨 Rebuilding services..."

# Rebuild API Gateway (has build issues)
docker compose build --no-cache api-gateway

# Rebuild Patient Service (has code changes)
docker compose build --no-cache patient-service

# Start services
echo "🚀 Starting services..."
docker compose --profile core up -d

# Show status
echo "📊 Service status:"
docker compose ps

echo "✅ Quick rebuild completed!"
echo "🧪 Test at: http://localhost:3000/test/patient-api"
