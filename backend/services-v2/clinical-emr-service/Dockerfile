# clinical-emr-service - Hospital Management System
FROM node:20-alpine

WORKDIR /app/clinical-emr-service

# Install OS-level dependencies required for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Expose node_modules for shared runtime imports
RUN ln -s /app/clinical-emr-service/node_modules /app/node_modules

# Copy built source code
COPY dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose service port
EXPOSE 3007

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3007/health || exit 1

# Start application
CMD ["node", "dist/index.js"]
