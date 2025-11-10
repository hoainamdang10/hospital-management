# Billing Service - Production Dockerfile
# Multi-stage build for optimized production image
#
# @author Hospital Management Team
# @version 2.0.0 (Simplified)
# @compliance Production-Ready, Security Hardened, HIPAA-Compliant
#
# Build context should be: backend/services-v2
# Build command: docker build --no-cache -f billing-service/Dockerfile -t billing-service:latest .

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS dependencies

# Add build arguments for cache busting
ARG BUILD_DATE
ARG VERSION=2.0.0

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app/billing-service

# Copy package files
COPY billing-service/package*.json ./

# Install ALL dependencies (including devDependencies for build)
# Use --legacy-peer-deps to handle peer dependency conflicts
RUN npm ci --prefer-offline --no-audit --legacy-peer-deps && \
    npm cache clean --force

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/billing-service/node_modules ./billing-service/node_modules

# Copy shared modules first
COPY shared ./shared

# Install shared module dependencies
RUN cd /app/shared && \
    if [ -f package.json ]; then \
      npm install --legacy-peer-deps && npm cache clean --force; \
    else \
      npm init -y && \
      npm install uuid @types/uuid @supabase/supabase-js pino pino-pretty amqplib @types/amqplib redis --save --legacy-peer-deps && \
      npm cache clean --force; \
    fi

# Copy billing service source code
COPY billing-service/src ./billing-service/src
COPY billing-service/tsconfig.json ./billing-service/tsconfig.json
COPY billing-service/package*.json ./billing-service/

# Change to service directory
WORKDIR /app/billing-service

# Install additional build dependencies
RUN npm install uuid @types/uuid --save-dev --legacy-peer-deps

# Build TypeScript (this will compile both service and shared modules)
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
LABEL org.opencontainers.image.title="Billing Service" \
      org.opencontainers.image.description="Hospital Management System - Billing & Payment Service" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="Hospital Management Team" \
      maintainer="Hospital Management Team"

# Install dumb-init for proper signal handling and curl for healthcheck
RUN apk add --no-cache dumb-init curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S billing -u 1001 -G nodejs

WORKDIR /app/billing-service

# Copy package files
COPY --chown=billing:nodejs billing-service/package*.json ./

# Install production dependencies only
RUN npm ci --only=production --prefer-offline --no-audit --legacy-peer-deps && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=billing:nodejs /app/billing-service/dist ./dist

# Copy shared modules (source code, not built)
COPY --from=builder --chown=billing:nodejs /app/shared ../shared

# Install shared module dependencies in production
RUN cd ../shared && \
    npm init -y && \
    npm install uuid @types/uuid --save --legacy-peer-deps && \
    npm cache clean --force

# Create necessary directories
RUN mkdir -p logs && chown -R billing:nodejs logs

# Set environment variables
ENV NODE_ENV=production \
    PORT=3009 \
    SERVICE_NAME=billing-service \
    SERVICE_VERSION=2.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3009/api/v1/health', (res) => { \
  if (res.statusCode === 200) process.exit(0); else process.exit(1); \
  }).on('error', () => process.exit(1))"

# Switch to non-root user
USER billing

# Expose port
EXPOSE 3009

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
