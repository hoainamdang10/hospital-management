# Identity Service - Production Dockerfile
# Multi-stage build for optimized production image
#
# @author Hospital Management Team
# @version 2.0.0
# @compliance Production-Ready, Security Hardened, HIPAA-Compliant
#
# Build context should be: backend/services-v2
# Build command: docker build --no-cache -f identity-service/Dockerfile -t identity-service:latest .

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:18-alpine AS dependencies

# Add build arguments for cache busting
ARG BUILD_DATE
ARG VERSION=2.0.0

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app/identity-service

# Copy package files
COPY identity-service/package*.json ./

# Install ALL dependencies (including devDependencies for build)
# Use --legacy-peer-deps to handle peer dependency conflicts
RUN npm ci --prefer-offline --no-audit --legacy-peer-deps && \
    npm cache clean --force

# ============================================
# Stage 2: Builder
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/identity-service/node_modules ./identity-service/node_modules

# Copy source code and shared modules
COPY identity-service ./identity-service
COPY shared ./shared

# Install uuid globally in shared module for build
RUN cd /app/shared && npm init -y && npm install uuid @types/uuid --save

# Change to service directory
WORKDIR /app/identity-service

# Install uuid for identity-service (needed during build)
RUN npm install uuid @types/uuid --save-dev

# Build TypeScript
RUN npm run build

# ============================================
# Stage 3: Production
# ============================================
FROM node:18-alpine AS production

# Add build arguments
ARG BUILD_DATE
ARG VERSION=2.0.0
ARG VCS_REF

# Add image labels for better management
LABEL org.opencontainers.image.title="Identity Service" \
      org.opencontainers.image.description="Hospital Management System - Identity & Access Service" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="Hospital Management Team" \
      maintainer="Hospital Management Team"

# Install dumb-init for proper signal handling and curl for healthcheck
RUN apk add --no-cache dumb-init curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S identity -u 1001 -G nodejs

WORKDIR /app/identity-service

# Copy package files
COPY --chown=identity:nodejs identity-service/package*.json ./

# Install production dependencies only
RUN npm ci --only=production --prefer-offline --no-audit --legacy-peer-deps && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=identity:nodejs /app/identity-service/dist ./dist
COPY --from=builder --chown=identity:nodejs /app/shared ../shared

# Create necessary directories
RUN mkdir -p logs && chown -R identity:nodejs logs

# Set environment variables
ENV NODE_ENV=production \
    PORT=3001 \
    SERVICE_NAME=identity-service \
    SERVICE_VERSION=2.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { \
  if (res.statusCode === 200) process.exit(0); else process.exit(1); \
  }).on('error', () => process.exit(1))"

# Switch to non-root user
USER identity

# Expose port
EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/identity-service/src/main.js"]
