# Patient Registry Service V2 - Production Dockerfile
# Multi-stage build for optimized production image
#
# @author Hospital Management Team
# @version 2.0.0
# @compliance Production-Ready, Security Hardened
#
# Build context should be: backend/services-v2
# Build command: docker build --no-cache -f patient-registry-service/Dockerfile -t patient-registry-service:latest .

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS dependencies

# Add build arguments for cache busting
ARG BUILD_DATE
ARG VERSION=2.0.0

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app/patient-registry-service

# Copy package files
COPY patient-registry-service/package*.json ./

# Install ALL dependencies (including devDependencies for build)
# Use --legacy-peer-deps to handle peer dependency conflicts
RUN npm install --legacy-peer-deps && \
    npm cache clean --force

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/patient-registry-service/node_modules ./patient-registry-service/node_modules

# Copy source code and shared modules
COPY patient-registry-service ./patient-registry-service
COPY shared ./shared

# Install dependencies in shared module for build
# If package.json exists, use it; otherwise install dependencies explicitly
RUN cd /app/shared && \
    if [ -f package.json ]; then \
      npm install; \
    else \
      npm init -y && \
      npm install uuid @types/uuid @supabase/supabase-js pino pino-pretty amqplib @types/amqplib redis --save; \
    fi

# Change to service directory
WORKDIR /app/patient-registry-service

# Install additional dependencies for patient-registry-service (needed during build)
RUN npm install uuid @types/uuid --save-dev

# Build TypeScript
RUN npm run build

# ============================================
# Stage 3: Production
# ============================================
FROM node:20-alpine AS production

# Add build arguments
ARG BUILD_DATE
ARG VERSION=2.0.0
ARG VCS_REF

# Add image labels for better management
LABEL org.opencontainers.image.title="Patient Registry Service" \
      org.opencontainers.image.description="Hospital Management System - Patient Registry Service" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="Hospital Management Team" \
      maintainer="Hospital Management Team"

# Install dumb-init for proper signal handling and curl for healthcheck
RUN apk add --no-cache dumb-init curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S patient -u 1001 -G nodejs

WORKDIR /app/patient-registry-service

# Copy package files
COPY --chown=patient:nodejs patient-registry-service/package*.json ./

# Install production dependencies only
RUN npm install --only=production --legacy-peer-deps && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=patient:nodejs /app/patient-registry-service/dist ./dist
COPY --from=builder --chown=patient:nodejs /app/shared ../shared

# Create necessary directories
RUN mkdir -p logs && chown -R patient:nodejs logs

# Set environment variables
ENV NODE_ENV=production \
    PORT=3002 \
    SERVICE_NAME=patient-registry-service \
    SERVICE_VERSION=2.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (res) => { \
  if (res.statusCode === 200) process.exit(0); else process.exit(1); \
  }).on('error', () => process.exit(1))"

# Switch to non-root user
USER patient

# Expose port
EXPOSE 3002

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/patient-registry-service/src/main.js"]
