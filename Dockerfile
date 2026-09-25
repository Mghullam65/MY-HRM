# Multi-stage Dockerfile for HRM Pro Enterprise Human Resource Management System
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl

# Copy dependency files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --omit=dev

# Copy application assets, server code, and static web bundle
COPY . .

# Expose HTTP / WebSocket server port
EXPOSE 5000

# Healthcheck to verify dev server and API vitality
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the unified Express & WebSocket API backend
CMD ["node", "server/src/server.js"]
