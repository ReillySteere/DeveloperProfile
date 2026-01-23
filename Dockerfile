# Stage 1: Build
FROM node:22.14-alpine AS builder

WORKDIR /app

# Install dependencies (including dev deps for build tools)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate dependency graphs (required for architecture module)
RUN npm run generate:deps

# Build the application (Server + UI)
# This generates:
# - dist/src/server (Backend)
# - dist/client (Frontend assets)
RUN npm run build

# Stage 2: Production Runtime
FROM node:22.14-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Create data directory for SQLite (persisted via volume in prod)
RUN mkdir -p data

# Install wget for healthcheck (alpine doesn't have curl by default)
RUN apk add --no-cache wget

# Expose the API port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the server
CMD ["npm", "run", "start:server:prod"]
