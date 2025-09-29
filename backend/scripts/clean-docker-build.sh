#!/bin/bash

# Clean Docker Build Script
# This script cleans up problematic files before Docker build

echo "🧹 Cleaning up for Docker build..."

# Remove all node_modules directories to avoid symlink issues
echo "📦 Removing node_modules directories..."
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true

# Remove TypeScript build info files
echo "🔧 Removing TypeScript build info..."
find . -name "*.tsbuildinfo" -delete 2>/dev/null || true

# Remove dist directories
echo "📁 Removing dist directories..."
find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true

# Remove log files
echo "📝 Removing log files..."
find . -name "*.log" -delete 2>/dev/null || true

# Remove coverage directories
echo "📊 Removing coverage directories..."
find . -name "coverage" -type d -exec rm -rf {} + 2>/dev/null || true

# Build shared package first
echo "🔨 Building shared package..."
cd shared
npm install
npm run build
cd ..

echo "✅ Cleanup complete! Ready for Docker build."
echo ""
echo "Now you can run:"
echo "  docker compose --profile full up -d --build"
