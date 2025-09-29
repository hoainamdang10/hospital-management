# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY services/department-service/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY services/department-service/src ./src/
COPY services/department-service/tsconfig.json ./
COPY services/department-service/.env ./

# Copy shared library
COPY shared ./node_modules/@hospital/shared/

# Build shared library
WORKDIR /app/node_modules/@hospital/shared
RUN npm install && npm run build

# Build the application
WORKDIR /app
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3005/health || exit 1

# Start the application
CMD ["npm", "start"]
