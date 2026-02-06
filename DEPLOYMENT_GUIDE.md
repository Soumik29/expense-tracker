# Deployment Guide - Expense Tracker

**Date:** February 6, 2026  
**Guide:** Complete deployment tutorial for free hosting

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Part 1: Database Setup (PlanetScale)](#part-1-database-setup-planetscale)
5. [Part 2: Backend Deployment (Render)](#part-2-backend-deployment-render)
6. [Part 3: Frontend Deployment (Vercel)](#part-3-frontend-deployment-vercel)
7. [Post-Deployment Configuration](#post-deployment-configuration)
8. [Troubleshooting](#troubleshooting)
9. [How This Was Configured](#how-this-was-configured)

---

## Overview

This guide walks you through deploying the Expense Tracker application using **100% free tiers**:

| Component | Service     | Free Tier Limits                                    |
| --------- | ----------- | --------------------------------------------------- |
| Frontend  | Vercel      | Unlimited sites, 100GB bandwidth/month              |
| Backend   | Render      | 750 hours/month (spins down after 15min inactivity) |
| Database  | PlanetScale | 5GB storage, 1 billion row reads/month              |

**Total Cost: $0/month** 💸

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                              │                                  │
│                              ▼                                  │
│                    ┌──────────────────┐                         │
│                    │     VERCEL       │                         │
│                    │   (Frontend)     │                         │
│                    │   React + Vite   │                         │
│                    └────────┬─────────┘                         │
│                              │                                  │
│                              │ API Requests                     │
│                              ▼                                  │
│                    ┌──────────────────┐                         │
│                    │     RENDER       │                         │
│                    │    (Backend)     │                         │
│                    │  Express + Node  │                         │
│                    └────────┬─────────┘                         │
│                              │                                  │
│                              │ Database Queries                 │
│                              ▼                                  │
│                    ┌──────────────────┐                         │
│                    │   PLANETSCALE    │                         │
│                    │   (Database)     │                         │
│                    │      MySQL       │                         │
│                    └──────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

Before starting, make sure you have:

- [ ] GitHub account with your repository pushed
- [ ] PlanetScale account (sign up at [planetscale.com](https://planetscale.com))
- [ ] Render account (sign up at [render.com](https://render.com))
- [ ] Vercel account (sign up at [vercel.com](https://vercel.com))

---

## Part 1: Database Setup (PlanetScale)

### Step 1.1: Create a PlanetScale Account

1. Go to [planetscale.com](https://planetscale.com)
2. Click **"Get Started"** → Sign up with GitHub
3. Verify your email

### Step 1.2: Create a Database

1. Click **"Create a database"**
2. Enter database name: `expense-tracker`
3. Select region: Choose closest to you (e.g., `us-east-1`)
4. Click **"Create database"**

### Step 1.3: Get Connection String

1. Click on your database
2. Click **"Connect"** button
3. Select **"Connect with: Prisma"**
4. Copy the connection string. It looks like:
   ```
   mysql://username:password@aws.connect.psdb.cloud/expense-tracker?sslaccept=strict
   ```

### Step 1.4: Initialize Database Schema

You have two options:

**Option A: Push from Local (Recommended)**

```bash
# In src/backend folder
DATABASE_URL="your-planetscale-url" npx prisma db push
```

**Option B: Use PlanetScale Console**

1. Go to **Branches** → **main**
2. Click **"Console"**
3. Run the SQL from your migration files manually

### Step 1.5: Verify Tables Created

1. In PlanetScale dashboard, go to **Console**
2. Run: `SHOW TABLES;`
3. You should see: `User`, `Expense`

---

## Part 2: Backend Deployment (Render)

### Step 2.1: Create a Render Account

1. Go to [render.com](https://render.com)
2. Click **"Get Started"** → Sign up with GitHub
3. Authorize Render to access your repositories

### Step 2.2: Create a New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `expense-tracker`
3. Configure the service:

| Setting        | Value                                                 |
| -------------- | ----------------------------------------------------- |
| Name           | `expense-tracker-api`                                 |
| Region         | Oregon (US West) or closest to you                    |
| Branch         | `input` (or `main`)                                   |
| Root Directory | `src/backend`                                         |
| Runtime        | Node                                                  |
| Build Command  | `npm install && npx prisma generate && npm run build` |
| Start Command  | `npm run start`                                       |
| Plan           | Free                                                  |

### Step 2.3: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**:

| Key                  | Value                                                      |
| -------------------- | ---------------------------------------------------------- |
| `NODE_ENV`           | `production`                                               |
| `DATABASE_URL`       | Your PlanetScale connection string                         |
| `JWT_SECRET`         | Click "Generate" for random value                          |
| `JWT_REFRESH_SECRET` | Click "Generate" for random value                          |
| `FRONTEND_URL`       | `https://your-app.vercel.app` (update after Vercel deploy) |
| `PORT`               | `3000`                                                     |

### Step 2.4: Deploy

1. Click **"Create Web Service"**
2. Wait for build to complete (5-10 minutes first time)
3. Once deployed, copy your URL: `https://expense-tracker-api-xxxx.onrender.com`

### Step 2.5: Verify Deployment

Visit: `https://your-render-url.onrender.com/api/health`

You should see:

```json
{ "status": "ok", "timestamp": "2026-02-06T12:00:00.000Z" }
```

---

## Part 3: Frontend Deployment (Vercel)

### Step 3.1: Create a Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** → Continue with GitHub
3. Authorize Vercel to access your repositories

### Step 3.2: Import Project

1. Click **"Add New..."** → **"Project"**
2. Select your `expense-tracker` repository
3. Click **"Import"**

### Step 3.3: Configure Build Settings

Vercel should auto-detect Vite. Verify these settings:

| Setting          | Value             |
| ---------------- | ----------------- |
| Framework Preset | Vite              |
| Root Directory   | `.` (leave empty) |
| Build Command    | `npm run build`   |
| Output Directory | `dist`            |
| Install Command  | `npm install`     |

### Step 3.4: Add Environment Variables

Click **"Environment Variables"** and add:

| Key            | Value                                           |
| -------------- | ----------------------------------------------- |
| `VITE_API_URL` | `https://expense-tracker-api-xxxx.onrender.com` |

**Important:** Replace with your actual Render URL from Step 2.4.

### Step 3.5: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-3 minutes)
3. Once deployed, copy your URL: `https://expense-tracker-xxxx.vercel.app`

### Step 3.6: Update Render CORS

Go back to Render and update the `FRONTEND_URL` environment variable with your Vercel URL.

---

## Post-Deployment Configuration

### Update vercel.json API Rewrite

Edit `vercel.json` in your repository and update the rewrite destination:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://expense-tracker-api-xxxx.onrender.com/api/:path*"
    }
  ]
}
```

Push the change to trigger a new Vercel deployment.

### Test the Full Flow

1. **Visit your Vercel URL** - You should see the login page
2. **Register a new account** - Should work if backend is connected
3. **Add an expense** - Verify data persists
4. **Refresh the page** - Data should still be there

---

## Troubleshooting

### Issue: "502 Bad Gateway" on API calls

**Cause:** Render free tier spins down after 15 minutes of inactivity.

**Solution:** Wait 30-60 seconds for the server to spin up on first request.

**Prevention:** Use a free cron service like [cron-job.org](https://cron-job.org) to ping your health endpoint every 14 minutes.

### Issue: CORS errors in browser console

**Cause:** `FRONTEND_URL` not set correctly in Render.

**Solution:**

1. Go to Render dashboard → Your service → Environment
2. Verify `FRONTEND_URL` matches your Vercel URL exactly
3. Click "Manual Deploy" to apply changes

### Issue: Database connection errors

**Cause:** PlanetScale connection string incorrect or expired.

**Solution:**

1. Go to PlanetScale dashboard → Your database → Connect
2. Generate a new password if needed
3. Update `DATABASE_URL` in Render environment variables
4. Redeploy the service

### Issue: Login works but expenses don't save

**Cause:** Database tables not created.

**Solution:**

```bash
# Run locally with production DATABASE_URL
DATABASE_URL="your-planetscale-url" npx prisma db push
```

### Issue: "Module not found" build errors on Render

**Cause:** Dependencies not installed or path issues.

**Solution:** Make sure your build command is:

```
npm install && npx prisma generate && npm run build
```

---

## How This Was Configured

### What Files Were Created/Modified

| File                       | Purpose                                                       |
| -------------------------- | ------------------------------------------------------------- |
| `vercel.json`              | Vercel build settings and API proxy rewrites                  |
| `render.yaml`              | Render deployment configuration (optional, can use dashboard) |
| `src/backend/.env.example` | Example environment variables for backend                     |
| `.env.example`             | Updated with production variables                             |
| `src/backend/src/app.ts`   | Added health check endpoint and production CORS               |

### vercel.json Explained

```json
{
  "buildCommand": "npm run build", // How to build the app
  "outputDirectory": "dist", // Where Vite outputs files
  "framework": "vite", // Auto-detected framework
  "rewrites": [
    {
      "source": "/api/:path*", // Catch all /api/* requests
      "destination": "https://..." // Forward to backend
    }
  ]
}
```

**Why rewrites?** In production, the frontend (Vercel) and backend (Render) are on different domains. The rewrite proxies API requests so they appear to come from the same origin, avoiding CORS issues.

### render.yaml Explained

```yaml
services:
  - type: web # Web service (not worker)
    name: expense-tracker-api
    runtime: node
    rootDir: src/backend # Backend is in subdirectory
    buildCommand: npm install && npx prisma generate && npm run build
    startCommand: npm run start # Runs compiled JS
    envVars:
      - key: DATABASE_URL
        sync: false # Manual entry (sensitive)
      - key: JWT_SECRET
        generateValue: true # Auto-generate random value
```

### CORS Configuration Explained

```typescript
const allowedOrigins = [
  "http://localhost:5173", // Local dev
  "http://localhost:5174", // Alternative port
  process.env.FRONTEND_URL, // Production (from env)
].filter(Boolean);
```

**Why dynamic origins?** In development we use localhost, in production we use the Vercel URL. The `FRONTEND_URL` environment variable lets us configure this without code changes.

### Health Check Endpoint

```typescript
this.app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
```

**Why needed?**

1. Render uses it to check if your service is running
2. Useful for monitoring and debugging
3. Can be pinged to keep free tier services awake

---

## Alternative Deployment Options

### Railway (All-in-One)

Railway can host frontend, backend, AND database in one place.

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub"**
3. Add a MySQL database from the Railway marketplace
4. Configure environment variables
5. Deploy both frontend and backend as separate services

**Pros:** Everything in one dashboard
**Cons:** Free tier is limited ($5 credit/month)

### Netlify (Frontend Alternative)

Similar to Vercel, supports Vite out of the box.

1. Go to [netlify.com](https://netlify.com)
2. Connect GitHub repository
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add `VITE_API_URL` environment variable

### Supabase (Database Alternative)

PostgreSQL alternative to PlanetScale (would require changing Prisma schema).

**Note:** Changing from MySQL to PostgreSQL requires:

1. Update `provider = "postgresql"` in `schema.prisma`
2. Change some column types (e.g., `@db.Decimal` → `Decimal`)
3. Run `npx prisma migrate dev` to regenerate

---

## Keeping Your App Running (Free Tier Tips)

### Problem: Render Free Tier Sleeps

Render's free tier spins down after 15 minutes of inactivity, causing slow first requests.

### Solution: Keep-Alive Pings

Use a free cron service to ping your health endpoint:

1. Go to [cron-job.org](https://cron-job.org)
2. Create a free account
3. Create a new cron job:
   - URL: `https://your-render-url.onrender.com/api/health`
   - Schedule: Every 14 minutes
4. Save and enable

This keeps your backend warm 24/7 without using your free tier hours.

---

## Deployment Checklist

- [ ] PlanetScale database created
- [ ] Database schema pushed (`prisma db push`)
- [ ] Render service deployed
- [ ] Render environment variables configured
- [ ] Render health check working
- [ ] Vercel project deployed
- [ ] Vercel `VITE_API_URL` set correctly
- [ ] Render `FRONTEND_URL` updated with Vercel URL
- [ ] `vercel.json` rewrite destination updated
- [ ] Registration works
- [ ] Login works
- [ ] Add expense works
- [ ] Data persists after refresh
- [ ] (Optional) Keep-alive cron job configured

---

**Happy Deploying! 🚀**
