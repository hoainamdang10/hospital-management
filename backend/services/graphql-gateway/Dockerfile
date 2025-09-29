# GraphQL Gateway Dockerfile
# Hospital Management System - Vietnamese Support

# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Create non-root user early to avoid ownership issues
RUN addgroup -g 1001 -S nodejs && \
    adduser -S graphql -u 1001

# Install system dependencies for better performance
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Set working directory and change ownership
WORKDIR /app
RUN chown graphql:nodejs /app

# Copy package files
COPY services/graphql-gateway/package*.json ./
COPY services/graphql-gateway/tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY services/graphql-gateway/src ./src/
COPY services/graphql-gateway/.env ./

# Copy shared module and install its dependencies
COPY shared ./node_modules/@hospital/shared/
WORKDIR /app/node_modules/@hospital/shared
RUN npm install && npm run build

# Go back to app directory and build
WORKDIR /app
RUN npm run build

# Switch to non-root user
USER graphql

# Expose port
EXPOSE 3200

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3200/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]
