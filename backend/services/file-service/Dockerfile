# Multi-stage build for file service
FROM node:18-alpine AS builder

# Install system dependencies for image processing and building
RUN apk add --no-cache \
    vips-dev \
    libc6-compat \
    make \
    g++ \
    python3 \
    binutils-dev

WORKDIR /app

# Copy package.json and install dependencies
COPY services/file-service/package*.json ./
RUN npm install && npm cache clean --force

# Production stage
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    vips-dev \
    libc6-compat \
    dumb-init

# Create app directory and user
WORKDIR /app
RUN addgroup -g 1001 -S nodejs
RUN adduser -S fileservice -u 1001

# Copy dependencies from builder

# Provide shared package at runtime/compile time
COPY shared ./node_modules/@hospital/shared/

COPY --from=builder --chown=fileservice:nodejs /app/node_modules ./node_modules

# Copy source code
COPY --chown=fileservice:nodejs services/file-service/src ./src
COPY --chown=fileservice:nodejs services/file-service/tsconfig.json ./
COPY --chown=fileservice:nodejs services/file-service/package*.json ./

# Install TypeScript and build
RUN npm install -g typescript
RUN npm run build

# Create logs directory
RUN mkdir -p logs && chown fileservice:nodejs logs

# Set user
USER fileservice

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3107/health', (res) => { \
    if (res.statusCode === 200) process.exit(0); else process.exit(1); \
  }).on('error', () => process.exit(1))"

# Expose port
EXPOSE 3107

# Start the application
CMD ["dumb-init", "node", "dist/index.js"]

