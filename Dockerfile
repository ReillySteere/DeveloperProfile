# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies (including dev deps for build tools)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application (Server + UI)
# This generates:
# - dist/src/server (Backend)
# - dist/client (Frontend assets)
RUN npm run build

# Stage 2: Production Runtime
FROM node:22-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Create data directory for SQLite (persisted via volume in prod)
RUN mkdir -p data

# Expose the API port
EXPOSE 3000

# Start the server
CMD ["npm", "run", "start:server:prod"]
