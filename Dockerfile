FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code (excluding backend)
COPY . .

# Build application
RUN npm run build

# Production stage - Use nginx for serving static files
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Default port (Railway overrides via $PORT env var)
ENV PORT=80

# Expose default port (Railway overrides with $PORT at runtime)
EXPOSE 80

# Health check using shell form for variable expansion
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD sh -c "wget --quiet --tries=1 --spider http://localhost:${PORT}/ || exit 1"

# Substitute PORT in nginx config and start nginx
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
