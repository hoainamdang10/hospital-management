# Appointments Service - Production Dockerfile
# Multi-stage build for optimized production image
#
# Build context should be: backend/services-v2
# Build command: docker build -f appointments-service/Dockerfile -t appointments-service:latest .

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS dependencies

ARG BUILD_DATE
ARG VERSION=2.0.0

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app/appointments-service

# Copy package manifests
COPY appointments-service/package*.json ./

# Install full dependencies for build (devDependencies included)
RUN npm ci --prefer-offline --no-audit --legacy-peer-deps && \
    npm cache clean --force

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Reuse node_modules from dependencies stage
COPY --from=dependencies /app/appointments-service/node_modules ./appointments-service/node_modules

# Copy source and shared modules
COPY appointments-service ./appointments-service
COPY shared ./shared

# Ensure shared module has its dependencies for build
RUN cd /app/shared && \
    if [ -f package.json ]; then \
      npm install; \
    else \
      npm init -y && \
      npm install uuid @types/uuid @supabase/supabase-js pino pino-pretty amqplib @types/amqplib redis --save; \
    fi

# Build service
WORKDIR /app/appointments-service
RUN npm run build

# ============================================
# Stage 3: Production
# ============================================
FROM node:20-alpine AS production

ARG BUILD_DATE
ARG VERSION=2.0.0
ARG VCS_REF

LABEL org.opencontainers.image.title="Appointments Service" \
      org.opencontainers.image.description="Hospital Management System - Appointments Service" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="Hospital Management Team"

# Install runtime utilities
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appointments -u 1001 -G nodejs

WORKDIR /app/appointments-service

# Copy package manifests and install production deps only
COPY --chown=appointments:nodejs appointments-service/package*.json ./
RUN npm ci --only=production --prefer-offline --no-audit --legacy-peer-deps && \
    npm cache clean --force

# Copy built artifacts
COPY --from=builder --chown=appointments:nodejs /app/appointments-service/dist ./dist
COPY --from=builder --chown=appointments:nodejs /app/shared ../shared

# Prepare directories
RUN mkdir -p logs && chown -R appointments:nodejs logs

ENV NODE_ENV=production \
    PORT=3004 \
    SERVICE_NAME=appointments-service \
    SERVICE_VERSION=2.0.0

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3004; const url = 'http://localhost:' + port + '/health'; require('http').get(url, (res) => { if (res.statusCode === 200) process.exit(0); else process.exit(1); }).on('error', () => process.exit(1));"

USER appointments

EXPOSE 3004

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/appointments-service/src/main.js"]
