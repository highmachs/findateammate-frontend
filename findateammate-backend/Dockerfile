FROM node:22-alpine AS builder

WORKDIR /app

# Update npm to latest version
RUN npm install -g npm@11.9.0

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# Production stage
FROM node:22-alpine AS runner

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

ENV NODE_ENV=production

# Copy files with proper ownership
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=nodejs:nodejs /app/script ./script
COPY --from=builder --chown=nodejs:nodejs /app/shared ./shared
COPY --from=builder --chown=nodejs:nodejs /app/migrations ./migrations
COPY --from=builder --chown=nodejs:nodejs /app/certs ./certs
COPY --chown=nodejs:nodejs start.sh ./start.sh

# Create logs and uploads directories with proper permissions
RUN mkdir -p /app/logs /app/uploads && chown -R nodejs:nodejs /app/logs /app/uploads

# Define volumes for persistent data
VOLUME ["/app/uploads"]

# Switch to non-root user
USER nodejs

# Expose the application port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Make start script executable
RUN chmod +x start.sh

# Start the application (with migrations)
CMD ["./start.sh"]
