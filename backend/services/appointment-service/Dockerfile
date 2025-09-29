# Appointment Service Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package.json files
COPY services/appointment-service/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY services/appointment-service/src ./src/
COPY services/appointment-service/tsconfig.json ./
COPY services/appointment-service/.env ./

# Copy shared module and install its dependencies
COPY shared ./node_modules/@hospital/shared/
WORKDIR /app/node_modules/@hospital/shared
RUN npm install && npm run build

# Go back to app root and build
WORKDIR /app
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3004/health || exit 1

# Start the service
CMD ["node", "dist/index.js"]
