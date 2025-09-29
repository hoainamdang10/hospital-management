# Medical Records Service Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Build shared module at /shared so file:../../shared resolves correctly
COPY shared /shared
WORKDIR /shared
RUN npm install && npm run build

# Back to app dir
WORKDIR /app

# Copy package manifests
COPY services/medical-records-service/package*.json ./

# Install deps (will pick up file:../../shared)
RUN npm install

# Copy service source
COPY services/medical-records-service/src ./src/
COPY services/medical-records-service/tsconfig.json ./
COPY services/medical-records-service/.env ./

# Build the service
RUN npm run build

# Expose port
EXPOSE 3007

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3007/health || exit 1

# Start the application
CMD ["npm", "start"]
