# Department Service Dockerfile
# Build context: backend/services-v2
FROM node:18-alpine

# Set working directory
WORKDIR /app/department-service

# Copy package files
COPY department-service/package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY department-service/src ./src
COPY department-service/tsconfig.json ./

# Build TypeScript
RUN npm run build

# Remove devDependencies after build
RUN npm prune --production

# Expose port
EXPOSE 3025

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3025/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start service
CMD ["node", "dist/main.js"]

