# Appointments Service - Hospital Management System
# Multi-stage build for optimized production image
#
# @author Hospital Management Team
# @version 2.0.0
# @compliance Production-Ready, Security Hardened
#
# Build context should be: backend/services-v2
# Build command: docker build -f appointments-service/Dockerfile -t appointments-service:latest .

# ============================================
# Stage 1: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy entire appointments-service and shared folders to maintain structure
COPY appointments-service/ ./appointments-service/
COPY shared/ ./shared/

# Change to appointments-service directory
WORKDIR /app/appointments-service

# Install ALL dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Create symlink for node_modules at parent level so shared can access it
RUN ln -s /app/appointments-service/node_modules /app/node_modules

# Build the application (tsconfig will find ../shared and ../node_modules)
RUN npm run build

# ============================================
# Stage 2: Production
# ============================================
FROM node:20-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appointments -u 1001

# Set working directory to match build structure
WORKDIR /app/appointments-service

# Copy entire structure from builder maintaining relative paths
COPY --from=builder --chown=appointments:nodejs /app/appointments-service/package*.json ./
COPY --from=builder --chown=appointments:nodejs /app/appointments-service/dist ./dist
COPY --from=builder --chown=appointments:nodejs /app/appointments-service/node_modules ./node_modules
COPY --from=builder --chown=appointments:nodejs /app/shared ../shared

# Install production dependencies only (if needed)
RUN npm prune --production && npm cache clean --force

# Create necessary directories
RUN mkdir -p /app/appointments-service/logs && chown appointments:nodejs /app/appointments-service/logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3024
ENV SERVICE_NAME=appointments-service
ENV SERVICE_VERSION=2.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e 'const port = process.env.PORT || 3024; require("http").get(`http://localhost:${port}/health`, (res) => { if (res.statusCode === 200) process.exit(0); else process.exit(1); }).on("error", () => process.exit(1));'

# Switch to non-root user
USER appointments

# Expose port
EXPOSE 3024

# Start the application
CMD ["node", "dist/appointments-service/src/main.js"]
