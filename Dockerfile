# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies based on package-lock.json
COPY package*.json ./
RUN npm install

# Pass API URL for build time injection
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing on port 5173
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the configured port
EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
