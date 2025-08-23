# Use Node.js 18 Alpine as base image
FROM node:18-alpine AS builder
ARG VERSION=0.0.0
ENV APP_VERSION=$VERSION

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application (frontend and server)
RUN npm run build && npm run build:server

# Production stage
FROM node:18-alpine
ARG VERSION=0.0.0
ENV APP_VERSION=$VERSION

WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY server ./server
COPY package*.json ./

RUN npm prune --production || true

# Persist application data
VOLUME /app/dist/server/data

EXPOSE 3002

CMD ["node", "dist/server/index.js"]
