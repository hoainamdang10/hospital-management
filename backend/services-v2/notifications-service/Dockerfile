# notifications-service - Hospital Management System
FROM node:20-alpine

WORKDIR /app/notifications-service

# Copy package files
COPY notifications-service/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Expose node_modules for shared runtime imports
RUN ln -s /app/notifications-service/node_modules /app/node_modules

# Copy built source code
COPY notifications-service/dist ./dist

# Copy shared runtime dependencies
COPY shared /app/shared

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3011

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3011/health || exit 1

# Start application
CMD ["node", "dist/index.js"]
