# Use Node.js 18 Alpine as base image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache python3 make g++

# Copy shared package first
COPY shared/ ./shared/

# Build shared package
WORKDIR /app/shared
COPY shared/package*.json ./
RUN npm install && npm run build

# Switch to service directory
WORKDIR /app/services/payment-service

# Copy service package files
COPY services/payment-service/package*.json ./
COPY services/payment-service/tsconfig.json ./

# Install dependencies (this will link to the shared package)
RUN npm install --only=production && npm cache clean --force

# Development stage
FROM base AS development
RUN npm install
COPY services/payment-service/ .
EXPOSE 3008
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS build
RUN npm install
COPY services/payment-service/ .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S payment -u 1001

# Copy shared package
COPY --from=build /app/shared/dist ./shared/dist
COPY --from=build /app/shared/package*.json ./shared/

# Install shared package dependencies
WORKDIR /app/shared
RUN npm install --only=production && npm cache clean --force

# Set up service directory structure
WORKDIR /app/services/payment-service

# Copy service package files
COPY services/payment-service/package*.json ./

# Install only production dependencies
RUN npm install --only=production && npm cache clean --force

# Copy built application
COPY --from=build /app/services/payment-service/dist ./dist

# Change ownership to nodejs user
RUN chown -R payment:nodejs /app
USER payment

# Expose port
EXPOSE 3009

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3009/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/app.js"]
