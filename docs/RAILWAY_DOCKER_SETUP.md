# Railway Docker Deployment Setup

This document details how the Railway deployment configuration was set up for the Expense Tracker application, using Docker containers for separate frontend and backend services.

## Overview

The deployment architecture uses **three separate Railway services**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Railway Project                               │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐         │
│  │   Frontend   │   │   Backend    │   │   MySQL      │         │
│  │  (Docker +   │──▶│  (Docker +   │──▶│  (Managed)   │         │
│  │   Nginx)     │   │   Node.js)   │   │              │         │
│  │              │   │              │   │              │         │
│  └──────────────┘   └──────────────┘   └──────────────┘         │
│        ▲                  ▲                  ▲                   │
│        │                  │                  │                   │
│  Dockerfile.railway  src/backend/       Railway MySQL            │
│  nginx.railway.conf  Dockerfile         Plugin                   │
│  railway.json        railway.json                                │
└─────────────────────────────────────────────────────────────────┘
```

## Why Separate Services?

Unlike local Docker Compose where containers share a network, Railway runs each service independently:

- **Each service has its own public URL** (e.g., `https://backend-xxx.up.railway.app`)
- **Services communicate over HTTPS**, not internal Docker networking
- **The frontend nginx must proxy to an external URL**, not `http://backend:3000`

## Files Created/Modified

### 1. `nginx.railway.conf` (NEW)

This nginx configuration is specifically for Railway deployment. The key difference from the local `nginx.conf` is the API proxy configuration:

**Local (docker-compose):**

```nginx
location /api/ {
    proxy_pass http://backend:3000/api/;  # Internal Docker network
}
```

**Railway (separate services):**

```nginx
location /api/ {
    resolver 1.1.1.1 8.8.8.8 valid=300s;  # DNS resolver for external URLs
    set $backend_upstream "${BACKEND_URL}";
    proxy_pass $backend_upstream/api/;    # External HTTPS URL
    proxy_ssl_server_name on;             # Required for HTTPS
}
```

**Full file content:**

```nginx
server {
    listen ${PORT};
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy API requests to external backend service
    location /api/ {
        resolver 1.1.1.1 8.8.8.8 valid=300s;
        resolver_timeout 5s;
        set $backend_upstream "${BACKEND_URL}";
        proxy_pass $backend_upstream/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $proxy_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_ssl_server_name on;
    }

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache index.html
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }

    # Health check endpoint
    location /health {
        access_log off;
        add_header Content-Type text/plain;
        return 200 "healthy\n";
    }
}
```

### 2. `Dockerfile.railway` (NEW)

A Railway-specific Dockerfile that:

- Builds the React frontend
- Uses `nginx.railway.conf` instead of `nginx.conf`
- Accepts `BACKEND_URL` as an environment variable

```dockerfile
# Railway-specific Dockerfile for Frontend
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

# Use Railway-specific nginx config
COPY nginx.railway.conf /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

ENV PORT=80
ENV BACKEND_URL=http://localhost:3000

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD sh -c "wget --quiet --tries=1 --spider http://localhost:${PORT}/health || exit 1"

# Substitute both PORT and BACKEND_URL at runtime
CMD ["/bin/sh", "-c", "envsubst '${PORT} ${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
```

### 3. `railway.json` (MODIFIED)

Updated to use the Railway-specific Dockerfile:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.railway"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  }
}
```

### 4. `src/backend/railway.json` (MODIFIED)

Updated to use Docker instead of Nixpacks:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300
  }
}
```

## File Structure Summary

```
expense-tracker/
├── Dockerfile              # Local Docker (docker-compose)
├── Dockerfile.railway      # Railway frontend Docker (NEW)
├── nginx.conf              # Local nginx config (docker-compose)
├── nginx.railway.conf      # Railway nginx config (NEW)
├── railway.json            # Frontend Railway config (MODIFIED)
├── docker-compose.yaml     # Local full-stack Docker
└── src/backend/
    ├── Dockerfile          # Backend Docker (unchanged)
    └── railway.json        # Backend Railway config (MODIFIED)
```

---

## How to Reproduce: Railway Deployment

### Prerequisites

1. GitHub account with repository pushed
2. Railway account at [railway.app](https://railway.app)
3. Files created/modified as described above

### Step-by-Step Deployment

#### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway and select your `expense-tracker` repository

#### Step 2: Add MySQL Database

1. In your project dashboard, click **"+ New"**
2. Select **"Database"** → **"Add MySQL"**
3. Wait for provisioning (~30 seconds)
4. Click on MySQL service → **"Variables"** tab
5. Note the `DATABASE_URL` variable (Railway auto-generates this)

#### Step 3: Deploy Backend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository again
3. Click on the new service and rename to **"Backend"**
4. Go to **"Settings"** tab:
   - Set **Root Directory** = `src/backend`
   - Railway auto-detects `railway.json` and uses Docker
5. Go to **"Variables"** tab and add:

| Variable                         | Value                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| `NODE_ENV`                       | `production`                                                                         |
| `DATABASE_URL`                   | `${{MySQL.DATABASE_URL}}`                                                            |
| `AUTH_SECRET`                    | Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `AUTH_SECRET_EXPIRES_IN`         | `15m`                                                                                |
| `AUTH_REFRESH_SECRET`            | Generate another 64-char random string                                               |
| `AUTH_REFRESH_SECRET_EXPIRES_IN` | `7d`                                                                                 |

6. Click **"Deploy"** and wait for build (~5 minutes)
7. Once deployed, go to **"Settings"** → **"Networking"** → **"Generate Domain"**
8. Copy the public URL (e.g., `https://expense-backend-xxx.up.railway.app`)
9. Verify: Visit `https://your-backend-url/api/health`

#### Step 4: Run Database Migrations

From your local machine:

```bash
cd src/backend

# Get the external MySQL URL from Railway (Connect tab → External URL)
# It looks like: mysql://root:password@viaduct.proxy.rlwy.net:12345/railway

DATABASE_URL="mysql://root:xxx@viaduct.proxy.rlwy.net:xxxxx/railway" npx prisma db push
```

Or use Railway CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run migration
railway run npx prisma db push
```

#### Step 5: Deploy Frontend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository again
3. Click on the new service and rename to **"Frontend"**
4. Go to **"Settings"** tab:
   - Leave **Root Directory** empty (uses project root)
   - Railway auto-detects `railway.json` and uses `Dockerfile.railway`
5. Go to **"Variables"** tab and add:

| Variable      | Value                                                                       |
| ------------- | --------------------------------------------------------------------------- |
| `BACKEND_URL` | `https://expense-backend-xxx.up.railway.app` (your backend URL from Step 3) |

6. Click **"Deploy"** and wait for build (~3 minutes)
7. Go to **"Settings"** → **"Networking"** → **"Generate Domain"**
8. Copy the public URL (e.g., `https://expense-frontend-xxx.up.railway.app`)

#### Step 6: Configure CORS (Backend)

Go back to your **Backend** service and add:

| Variable       | Value                                         |
| -------------- | --------------------------------------------- |
| `FRONTEND_URL` | `https://expense-frontend-xxx.up.railway.app` |

This ensures the backend accepts requests from your frontend domain.

#### Step 7: Test the Application

1. Visit your frontend URL
2. Register a new account
3. Login and add expenses
4. Verify data persists after refresh

---

## Troubleshooting

### Frontend shows "502 Bad Gateway" for API calls

**Cause:** `BACKEND_URL` is not set or incorrect.

**Fix:**

1. Go to Frontend service → Variables
2. Verify `BACKEND_URL` is set to the full backend URL including `https://`
3. Redeploy the frontend

### Backend can't connect to database

**Cause:** `DATABASE_URL` is missing or incorrect.

**Fix:**

1. Go to Backend service → Variables
2. Set `DATABASE_URL` = `${{MySQL.DATABASE_URL}}`
3. Redeploy

### CORS errors in browser console

**Cause:** Backend doesn't allow frontend origin.

**Fix:**

1. Go to Backend service → Variables
2. Add `FRONTEND_URL` = `https://your-frontend-url.up.railway.app`
3. Redeploy

### Health check failing

**Cause:** Application not starting properly.

**Fix:**

1. Check deployment logs in Railway
2. Verify all environment variables are set
3. Check for TypeScript/build errors

---

## Environment Variables Reference

### Backend Service

| Variable                         | Required | Example                   | Description             |
| -------------------------------- | -------- | ------------------------- | ----------------------- |
| `DATABASE_URL`                   | Yes      | `${{MySQL.DATABASE_URL}}` | MySQL connection string |
| `AUTH_SECRET`                    | Yes      | 64-char hex string        | JWT signing secret      |
| `AUTH_SECRET_EXPIRES_IN`         | Yes      | `15m`                     | Access token expiry     |
| `AUTH_REFRESH_SECRET`            | Yes      | 64-char hex string        | Refresh token secret    |
| `AUTH_REFRESH_SECRET_EXPIRES_IN` | Yes      | `7d`                      | Refresh token expiry    |
| `NODE_ENV`                       | Yes      | `production`              | Environment mode        |
| `FRONTEND_URL`                   | Yes      | `https://...`             | For CORS configuration  |
| `PORT`                           | No       | `3000`                    | Railway auto-sets this  |

### Frontend Service

| Variable      | Required | Example                          | Description            |
| ------------- | -------- | -------------------------------- | ---------------------- |
| `BACKEND_URL` | Yes      | `https://backend.up.railway.app` | Backend service URL    |
| `PORT`        | No       | `80`                             | Railway auto-sets this |

---

## Cost Estimation

Railway provides **$5 free credit per month**. Typical usage:

| Service   | Estimated Cost  | Notes                   |
| --------- | --------------- | ----------------------- |
| MySQL     | ~$2-3/month     | Depends on storage      |
| Backend   | ~$1-2/month     | Depends on compute      |
| Frontend  | ~$0.50/month    | Static serving is cheap |
| **Total** | **~$3-5/month** | Within free tier        |

For low-traffic personal projects, you should stay within the free tier.

---

## Comparison: Local Docker vs Railway

| Aspect      | Local Docker Compose         | Railway Separate Services    |
| ----------- | ---------------------------- | ---------------------------- |
| Networking  | Internal Docker network      | Public HTTPS URLs            |
| API Proxy   | `http://backend:3000`        | `https://xxx.up.railway.app` |
| Config File | `nginx.conf`                 | `nginx.railway.conf`         |
| Dockerfile  | `Dockerfile`                 | `Dockerfile.railway`         |
| Database    | Self-managed MySQL container | Railway managed MySQL        |
| Scaling     | Manual                       | Railway handles it           |
| SSL/HTTPS   | Manual setup                 | Automatic                    |
