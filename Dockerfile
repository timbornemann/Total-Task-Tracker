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

# Build the application
RUN npm run build

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
VOLUME /app/server/data

EXPOSE 3002

CMD ["node", "server/index.js"]
