# Railway Configuration Explained

This document explains the Railway deployment configuration for the Expense Tracker application.

## Overview

The Expense Tracker uses a **two-service architecture** on Railway:

1. **Frontend Service** (React + Vite) - Root directory
2. **Backend Service** (Express + Node.js) - `src/backend` directory

Each service has its own `railway.json` configuration file.

## Configuration Files

### Root `railway.json` (Frontend)

**Location:** `/railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "startCommand": "npm run preview -- --host 0.0.0.0"
  }
}
```

**Key Points:**

- **Builder:** Uses Nixpacks (Railway's auto-detection)
- **Build Command:** Installs dependencies and builds the Vite app
- **Start Command:** Runs Vite's preview server on `0.0.0.0` to accept external connections
- **Host:** Must bind to `0.0.0.0` (not `localhost`) for Railway to route traffic
- **Port:** Automatically read from `process.env.PORT` via `vite.config.ts`

### Backend `railway.json`

**Location:** `/src/backend/railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npx prisma generate && npm run build"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "startCommand": "npm run start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300
  }
}
```

**Key Points:**

- **Prisma Generate:** Must run `npx prisma generate` during build to create database client
- **TypeScript Build:** Compiles TypeScript to JavaScript before deployment
- **Start Command:** Runs the compiled Node.js server
- **Health Check:** Railway pings `/api/health` to verify the service is running

## Vite Configuration

**Location:** `/vite.config.ts`

```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: Number(process.env.PORT) || 4173,
    host: "0.0.0.0",
  },
});
```

**Key Points:**

- **Preview Port:** Reads from `PORT` environment variable (Railway injects this automatically)
- **Preview Host:** Binds to `0.0.0.0` to accept external connections
- **Server Proxy:** Only used for local development (proxies `/api` to backend on port 3000)

## Deployment Flow

### Frontend Deployment

1. **Railway detects `railway.json` in root**
2. **Build Phase:**
   - Runs `npm install` to install dependencies
   - Runs `npm run build` to create production build in `dist/`
3. **Deploy Phase:**
   - Runs `npm run preview -- --host 0.0.0.0`
   - Vite preview server starts on port from `$PORT` env var
   - Railway routes traffic to the application

### Backend Deployment

1. **Railway detects `railway.json` in `src/backend`**
2. **Build Phase:**
   - Runs `npm install` to install dependencies
   - Runs `npx prisma generate` to create Prisma client
   - Runs `npm run build` to compile TypeScript
3. **Deploy Phase:**
   - Runs `npm run start` which executes `node ./dist/index.js`
   - Railway routes traffic to the application
   - Health checks verify `/api/health` responds with 200 OK

## Environment Variables

### Frontend Service

- `VITE_API_URL` - Backend API URL (use `${{Backend.url}}/api` for Railway service reference)
- `PORT` - Automatically injected by Railway (don't set manually)

### Backend Service

- `NODE_ENV` - Set to `production`
- `DATABASE_URL` - MySQL connection string (use `${{MySQL.DATABASE_URL}}`)
- `JWT_SECRET` - Secret for JWT token signing
- `JWT_REFRESH_SECRET` - Secret for refresh token signing
- `FRONTEND_URL` - Frontend URL for CORS (use `${{Frontend.url}}`)
- `PORT` - Automatically injected by Railway (don't set manually)

## Common Issues and Solutions

### Issue: "Service failed to start"

**Cause:** Missing or incorrect `startCommand` in `railway.json`

**Solution:** 
- Frontend: Ensure `startCommand` is `npm run preview -- --host 0.0.0.0`
- Backend: Ensure `startCommand` is `npm run start`

### Issue: "EADDRINUSE: address already in use"

**Cause:** Application not reading `PORT` from environment variable

**Solution:**
- Frontend: Check `vite.config.ts` has `preview.port: Number(process.env.PORT) || 4173`
- Backend: Check server binds to `process.env.PORT`

### Issue: "Cannot connect to backend"

**Cause:** `VITE_API_URL` not set or incorrect

**Solution:**
- Set `VITE_API_URL` to `${{Backend.url}}/api` in frontend service variables
- Ensure backend service is deployed and running

### Issue: "Database connection failed"

**Cause:** `DATABASE_URL` not configured or Prisma client not generated

**Solution:**
- Set `DATABASE_URL` to `${{MySQL.DATABASE_URL}}` in backend service variables
- Ensure build command includes `npx prisma generate`
- Run `npx prisma db push` to initialize database schema

### Issue: "CORS errors in browser"

**Cause:** `FRONTEND_URL` not set in backend

**Solution:**
- Add `FRONTEND_URL` = `${{Frontend.url}}` to backend service variables
- Redeploy backend service

## Testing Locally

### Test Frontend Build

```bash
# Build the frontend
npm run build

# Test preview server (simulates Railway deployment)
PORT=3000 npm run preview -- --host 0.0.0.0

# Visit http://localhost:3000
```

### Test Backend Build

```bash
cd src/backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build TypeScript
npm run build

# Start production server
npm run start
```

## Railway Service References

Railway's service references (`${{ServiceName.variable}}`) are powerful features that:

- Automatically link services without hardcoding URLs
- Update dynamically if service URLs change
- Work for both internal and external connections

**Example:**

```
VITE_API_URL=${{Backend.url}}/api
```

This automatically resolves to something like:
```
VITE_API_URL=https://backend-xxx.up.railway.app/api
```

## Best Practices

1. ✅ **Use Service References** - Always use `${{Service.url}}` instead of hardcoding URLs
2. ✅ **Bind to 0.0.0.0** - Never bind to `localhost` in production
3. ✅ **Read PORT from Environment** - Always use `process.env.PORT`
4. ✅ **Include Prisma Generate** - Always run `npx prisma generate` in build command
5. ✅ **Set NODE_ENV=production** - Optimizes dependencies and performance
6. ✅ **Add Health Checks** - Backend should have a health check endpoint
7. ✅ **Monitor Logs** - Check Railway logs for deployment issues

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Nixpacks Documentation](https://nixpacks.com/)
- [Vite Preview Mode](https://vitejs.dev/guide/cli.html#vite-preview)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)

---

**Updated:** February 7, 2026
