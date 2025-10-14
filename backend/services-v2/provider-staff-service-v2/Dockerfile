# Provider Staff Service - Production Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy entire provider-staff-service-v2 and shared folders
COPY provider-staff-service-v2/ ./provider-staff-service-v2/
COPY shared/ ./shared/

# Change to provider-staff-service-v2 directory
WORKDIR /app/provider-staff-service-v2

# Install ALL dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Create symlink for node_modules at parent level
RUN ln -s /app/provider-staff-service-v2/node_modules /app/node_modules

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
  adduser -S provider -u 1001

# Set working directory
WORKDIR /app/provider-staff-service-v2

# Copy from builder
COPY --from=builder --chown=provider:nodejs /app/provider-staff-service-v2/package*.json ./
COPY --from=builder --chown=provider:nodejs /app/provider-staff-service-v2/dist ./dist
COPY --from=builder --chown=provider:nodejs /app/provider-staff-service-v2/node_modules ./node_modules
COPY --from=builder --chown=provider:nodejs /app/shared ../shared

# Install production dependencies only
RUN npm prune --production && npm cache clean --force

# Create necessary directories
RUN mkdir -p /app/provider-staff-service-v2/logs && chown provider:nodejs /app/provider-staff-service-v2/logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3003
ENV SERVICE_NAME=provider-staff-service
ENV SERVICE_VERSION=2.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (res) => { \
  if (res.statusCode === 200) process.exit(0); else process.exit(1); \
  }).on('error', () => process.exit(1))"

# Switch to non-root user
USER provider

# Expose port
EXPOSE 3003

# Start the application
CMD ["node", "dist/provider-staff-service-v2/src/main.js"]

