# Identity Service Consolidated - Production Dockerfile
# Multi-stage build for optimized production image
# 
# @author Hospital Management Team
# @version 2.0.0
# @compliance Production-Ready, Security Hardened

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy entire identity-service and shared folders to maintain structure
COPY identity-service/ ./identity-service/
COPY shared/ ./shared/

# Change to identity-service directory
WORKDIR /app/identity-service

# Install ALL dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Create symlink for node_modules at parent level so shared can access it
RUN ln -s /app/identity-service/node_modules /app/node_modules

# Build the application (tsconfig will find ../shared and ../node_modules)
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
  adduser -S identity -u 1001

# Set working directory to match build structure
WORKDIR /app/identity-service

# Copy entire structure from builder maintaining relative paths
COPY --from=builder --chown=identity:nodejs /app/identity-service/package*.json ./
COPY --from=builder --chown=identity:nodejs /app/identity-service/dist ./dist
COPY --from=builder --chown=identity:nodejs /app/identity-service/node_modules ./node_modules
COPY --from=builder --chown=identity:nodejs /app/shared ../shared

# Install production dependencies only (if needed)
RUN npm prune --production && npm cache clean --force

# Create necessary directories
RUN mkdir -p /app/identity-service/logs && chown identity:nodejs /app/identity-service/logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV SERVICE_NAME=identity-service
ENV SERVICE_VERSION=2.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { \
  if (res.statusCode === 200) process.exit(0); else process.exit(1); \
  }).on('error', () => process.exit(1))"

# Switch to non-root user
USER identity

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/identity-service/src/main.js"]
