# API Gateway Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package.json files
COPY services/api-gateway/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY services/api-gateway/src ./src/
COPY services/api-gateway/tsconfig.json ./
COPY services/api-gateway/.env ./

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
EXPOSE 3100

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3100/health || exit 1

# Start the application
CMD ["npm", "start"]
