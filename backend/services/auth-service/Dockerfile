# Auth Service Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies including Python and build tools for bcrypt
RUN apk add --no-cache \
    curl \
    python3 \
    make \
    g++ \
    && ln -sf python3 /usr/bin/python

# Copy package.json files
COPY services/auth-service/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY services/auth-service/src ./src/
COPY services/auth-service/tsconfig.json ./
COPY services/auth-service/.env ./

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
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["npm", "start"]
