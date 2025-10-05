# Provider/Staff Service V2 - Production Dockerfile
# Multi-stage build for optimized production image
#
# @author Hospital Management Team
# @version 2.0.0
# @compliance Production-Ready, Security Hardened

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy entire provider-staff-service and shared folders to maintain structure
COPY provider-staff-service/ ./provider-staff-service/
COPY shared/ ./shared/

# Change to provider-staff-service directory
WORKDIR /app/provider-staff-service

# Install ALL dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Create symlink for node_modules at parent level so shared can access it
RUN ln -s /app/provider-staff-service/node_modules /app/node_modules

# Build the application (tsconfig will find ../shared and ../node_modules)
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
  adduser -S provider -u 1001

# Set working directory to match build structure
WORKDIR /app/provider-staff-service

# Copy entire structure from builder maintaining relative paths
COPY --from=builder --chown=provider:nodejs /app/provider-staff-service/package*.json ./
COPY --from=builder --chown=provider:nodejs /app/provider-staff-service/dist ./dist
COPY --from=builder --chown=provider:nodejs /app/provider-staff-service/node_modules ./node_modules
COPY --from=builder --chown=provider:nodejs /app/shared ../shared

# Install production dependencies only (if needed)
RUN npm prune --production && npm cache clean --force

# Create necessary directories
RUN mkdir -p /app/provider-staff-service/logs && chown provider:nodejs /app/provider-staff-service/logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3022
ENV SERVICE_NAME=provider-staff-service
ENV SERVICE_VERSION=2.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3022/health', (res) => { \
  if (res.statusCode === 200) process.exit(0); else process.exit(1); \
  }).on('error', () => process.exit(1))"

# Switch to non-root user
USER provider

# Expose port
EXPOSE 3022

# Start the application
CMD ["node", "dist/index.js"]
