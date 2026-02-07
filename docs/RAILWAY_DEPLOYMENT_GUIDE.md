# Railway Deployment Guide - All-in-One Free Hosting

**Date:** February 7, 2026  
**Guide:** Deploy Frontend, Backend, Database & Docker all in one place for FREE

---

## 🎯 Overview

**Railway** is the perfect all-in-one solution for hosting your entire Expense Tracker application for free. Unlike the multi-platform approach (Vercel + Render + PlanetScale), Railway lets you host everything in one dashboard:

- ✅ **Frontend** (React + Vite)
- ✅ **Backend** (Node.js + Express)
- ✅ **Database** (MySQL)
- ✅ **Docker Support** (native Docker deployment)

### Why Railway for All-in-One Hosting?

| Feature | Railway | Other Platforms |
|---------|---------|-----------------|
| Frontend Hosting | ✅ Yes | Vercel, Netlify |
| Backend Hosting | ✅ Yes | Render, Heroku |
| MySQL Database | ✅ Yes | PlanetScale |
| Docker Support | ✅ Native | Limited |
| Single Dashboard | ✅ Yes | ❌ Multiple sites |
| **Free Tier** | **$5 credit/month** | Various |

---

## 💰 Railway Free Tier

Railway offers:
- **$5 in free credits per month** (enough for small projects)
- **500 hours of execution time**
- **100 GB network egress**
- **5 GB storage**

**Perfect for:** Development, personal projects, small applications

⚠️ **Note:** Railway is truly free to start, but you'll need to add a payment method after using the initial trial. The $5/month credit is usually sufficient for small apps like this expense tracker.

---

## 📋 Prerequisites

Before starting:
- [ ] GitHub account with your expense-tracker repository
- [ ] Railway account (sign up at [railway.app](https://railway.app))
- [ ] Your code pushed to GitHub

---

## 🚀 Quick Start Deployment

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Sign up with GitHub (recommended for easier deployment)
4. Authorize Railway to access your repositories

### Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `expense-tracker` repository
4. Railway will automatically detect it as a monorepo

---

## 🗄️ Database Setup (MySQL)

### Step 1: Add MySQL Database

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database"** → **"Add MySQL"**
3. Railway will automatically provision a MySQL database

### Step 2: Get Database Connection String

1. Click on the MySQL service in your project
2. Go to **"Connect"** tab
3. Copy the **"MySQL Connection URL"**
   ```
   mysql://root:password@mysql.railway.internal:3306/railway
   ```

### Step 3: Initialize Database Schema

You have two options:

**Option A: Use Railway's MySQL Client**

1. In the MySQL service, click **"Data"** tab
2. Click **"Query"** to open SQL console
3. Create the database tables manually using your Prisma schema

**Option B: Push from Local (Recommended)**

```bash
# From your local machine, in src/backend folder
DATABASE_URL="mysql://root:password@containers-us-west-123.railway.app:1234/railway" npx prisma db push
```

Replace with your actual Railway MySQL URL from the "Connect" tab (use the external URL for local connections).

---

## 🔧 Backend Service Setup

### Step 1: Add Backend Service

1. In your project dashboard, click **"+ New"**
2. Select **"GitHub Repo"** → Choose your repository
3. Click **"Add variables"** (we'll configure this next)

### Step 2: Configure Backend Build Settings

Railway auto-detects Node.js, but we need to specify the backend directory:

1. Click on your backend service
2. Go to **"Settings"** tab
3. Update these settings:

| Setting | Value |
|---------|-------|
| **Root Directory** | `src/backend` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npm run start` |
| **Watch Paths** | `src/backend/**` |

### Step 3: Add Environment Variables

In the backend service, go to **"Variables"** tab and add:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `DATABASE_URL` | `${{MySQL.DATABASE_URL}}` | Railway reference to MySQL |
| `JWT_SECRET` | (generate random) | JWT signing secret |
| `JWT_REFRESH_SECRET` | (generate random) | JWT refresh secret |
| `FRONTEND_URL` | `${{Frontend.url}}` | Reference to frontend URL |
| `PORT` | `3000` | Backend port |

**Railway Magic:** The `${{MySQL.DATABASE_URL}}` syntax automatically references other services in your project! This creates dynamic connections between services.

### Step 4: Deploy Backend

1. Click **"Deploy"**
2. Wait for build to complete (5-10 minutes first time)
3. Once deployed, Railway will provide a public URL: `https://your-backend.up.railway.app`

### Step 5: Add Health Check (Verify Deployment)

Visit: `https://your-backend.up.railway.app/api/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-07T12:00:00.000Z"
}
```

---

## 🎨 Frontend Service Setup

### Step 1: Add Frontend Service

1. In your project dashboard, click **"+ New"**
2. Select **"GitHub Repo"** → Choose your repository again
3. This creates a second service from the same repo

### Step 2: Configure Frontend Build Settings

1. Click on your frontend service
2. Go to **"Settings"** tab
3. Update these settings:

| Setting | Value |
|---------|-------|
| **Root Directory** | `.` (leave empty for root) |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run preview` (or use static file serving) |
| **Watch Paths** | `src/**,index.html,vite.config.ts` |

### Step 3: Add Environment Variables

In the frontend service, go to **"Variables"** tab and add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `${{Backend.url}}/api` |

**Important:** Railway's service references (`${{Backend.url}}`) automatically inject the correct backend URL!

### Step 4: Deploy Frontend

1. Click **"Deploy"**
2. Wait for build to complete (2-3 minutes)
3. Railway will assign a public URL: `https://your-app.up.railway.app`

### Step 5: Configure Custom Domain (Optional)

1. In frontend service, go to **"Settings"**
2. Click **"Generate Domain"** for a railway.app subdomain
3. Or add your own custom domain if you have one

---

## 🐳 Docker Deployment Alternative

Railway has **native Docker support**! If you prefer a containerized approach:

### Step 1: Create Dockerfiles

**Backend Dockerfile** (`src/backend/Dockerfile`):
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "run", "start"]
```

**Frontend Dockerfile** (`Dockerfile`):
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config (optional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Step 2: Deploy with Docker

1. Railway will automatically detect Dockerfiles
2. It will build and deploy containers automatically
3. No need for build/start commands - Docker handles it!

---

## 🔗 Service Communication

One of Railway's best features is **internal networking**:

```
┌─────────────────────────────────────────┐
│         RAILWAY PROJECT                 │
│                                         │
│  ┌─────────────┐    ┌──────────────┐  │
│  │  Frontend   │───▶│   Backend    │  │
│  │   (Vite)    │    │  (Express)   │  │
│  └─────────────┘    └──────┬───────┘  │
│                              │          │
│                              ▼          │
│                     ┌──────────────┐   │
│                     │    MySQL     │   │
│                     │  (Database)  │   │
│                     └──────────────┘   │
│                                         │
│  All services communicate internally   │
│  via Railway's private network         │
└─────────────────────────────────────────┘
```

**Internal URLs:**
- Backend → Database: `mysql.railway.internal:3306`
- Frontend → Backend: `backend.railway.internal:3000`

**External URLs:**
- Frontend: `https://your-app.up.railway.app`
- Backend API: `https://your-backend.up.railway.app`

---

## 🧪 Testing Your Deployment

### 1. Test Backend Health

```bash
curl https://your-backend.up.railway.app/api/health
```

Expected:
```json
{"status":"ok","timestamp":"..."}
```

### 2. Test Frontend

1. Open `https://your-app.up.railway.app`
2. You should see the login page
3. Try registering a new user
4. Add an expense
5. Verify data persists after refresh

### 3. Test Database Connection

From the MySQL service in Railway:
1. Click **"Data"** tab
2. Run query: `SHOW TABLES;`
3. You should see: `User`, `Expense`

---

## 🔍 Troubleshooting

### Issue: "Service failed to start"

**Cause:** Build command or start command incorrect.

**Solution:**
1. Check logs in Railway dashboard (click service → "Logs" tab)
2. Verify build command includes `prisma generate`
3. Ensure start command points to compiled JS: `npm run start`

### Issue: "Database connection failed"

**Cause:** DATABASE_URL not configured correctly.

**Solution:**
1. Verify DATABASE_URL in backend service variables
2. Use Railway's reference syntax: `${{MySQL.DATABASE_URL}}`
3. Check MySQL service is running (green status)

### Issue: "CORS errors in browser"

**Cause:** FRONTEND_URL not set in backend.

**Solution:**
1. Add FRONTEND_URL to backend variables
2. Use service reference: `${{Frontend.url}}`
3. Redeploy backend service

### Issue: "Cannot find module 'prisma'"

**Cause:** Prisma client not generated during build.

**Solution:**
Update build command to:
```
npm install && npx prisma generate && npm run build
```

### Issue: "Out of credits / Service sleeping"

**Cause:** Exceeded $5 free credit limit.

**Solution:**
- Monitor usage in Railway dashboard
- Optimize services to use less resources
- Add payment method for additional credits
- Consider pausing unused services

---

## 💡 Cost Optimization Tips

### 1. Use Shared Database

Instead of separate MySQL per environment, use one database with different table prefixes or schemas.

### 2. Sleep Inactive Services

Railway can automatically sleep services after inactivity:
1. Go to service **"Settings"**
2. Enable **"Sleep after inactivity"**
3. Set timeout (e.g., 15 minutes)

### 3. Monitor Usage

1. Go to project **"Settings"**
2. Click **"Usage"** tab
3. Monitor your $5 credit consumption
4. Set up billing alerts

### 4. Efficient Builds

- Use caching in Docker builds
- Don't rebuild unchanged dependencies
- Use `.dockerignore` to exclude unnecessary files

---

## 📊 Monitoring & Logs

### View Logs

1. Click on any service
2. Go to **"Logs"** tab
3. Real-time logs appear here

### Common Log Filters

```
# Show only errors
level:error

# Show API requests
/api

# Show database queries
prisma

# Show authentication
auth
```

### Metrics

1. Click on service
2. Go to **"Metrics"** tab
3. View:
   - CPU usage
   - Memory usage
   - Network traffic
   - Request counts

---

## 🔒 Security Best Practices

### 1. Use Environment Variables

Never hardcode secrets in code. Always use Railway's environment variables.

### 2. Regenerate Secrets

For production, generate strong secrets:

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Enable Private Networking

For internal service communication, use Railway's private URLs:
- More secure
- Faster (no external routing)
- Free bandwidth

### 4. Set Up CORS Properly

Only allow your frontend domain in CORS settings:

```typescript
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://your-app.up.railway.app'
];
```

---

## 🚀 Advanced: GitHub Integration

Railway can auto-deploy on every push!

### Step 1: Enable Auto-Deploy

1. Go to service **"Settings"**
2. Under **"Source"**, find **"Deploy Triggers"**
3. Enable **"Auto-deploy"**

### Step 2: Branch Deployments

1. Connect specific branches to services
2. Main branch → Production
3. Dev branch → Staging environment

### Step 3: Preview Deployments

Railway can create preview deployments for PRs:
1. Go to project **"Settings"**
2. Enable **"PR Deploys"**
3. Each PR gets its own temporary deployment

---

## 🆚 Railway vs. Other Platforms

### Railway vs. Vercel + Render + PlanetScale

| Aspect | Railway (All-in-One) | Split Platform |
|--------|----------------------|----------------|
| Setup Complexity | ⭐ Simple | ⭐⭐⭐ Complex |
| Number of Dashboards | 1 | 3 |
| Service Communication | Native | CORS + Proxies |
| Total Free Tier | $5/month | Unlimited* |
| Learning Curve | Easy | Moderate |
| Best For | Prototypes, Small Apps | Production, Scale |

*Split platform has higher individual limits but requires managing multiple services.

### When to Use Railway

✅ **Use Railway if:**
- You want everything in one place
- You're building a prototype or MVP
- You prefer simplicity over separate services
- You're comfortable with $5/month limit

❌ **Don't use Railway if:**
- You need unlimited free tier
- You expect high traffic (>100K requests/month)
- You need advanced CDN features
- Budget is absolutely $0

---

## 📝 Deployment Checklist

Use this checklist to ensure everything is set up correctly:

**Database:**
- [ ] MySQL service created
- [ ] Database connection string obtained
- [ ] Schema pushed (`prisma db push` completed)
- [ ] Tables verified (User, Expense exist)

**Backend:**
- [ ] Service created from GitHub repo
- [ ] Root directory set to `src/backend`
- [ ] Build command configured
- [ ] Start command configured
- [ ] Environment variables added (all 6)
- [ ] DATABASE_URL uses service reference
- [ ] Service deployed successfully
- [ ] Health endpoint returns 200 OK

**Frontend:**
- [ ] Service created from GitHub repo
- [ ] Root directory set to root (`.`)
- [ ] Build command configured
- [ ] Start command configured
- [ ] VITE_API_URL environment variable added
- [ ] VITE_API_URL uses backend service reference
- [ ] Service deployed successfully
- [ ] App loads in browser

**Testing:**
- [ ] Can access frontend URL
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Can add expense
- [ ] Expense persists after refresh
- [ ] No CORS errors in console

**Optional:**
- [ ] Custom domain configured
- [ ] Auto-deploy enabled
- [ ] Usage monitoring set up
- [ ] Billing alerts configured

---

## 🎓 Additional Resources

### Official Documentation
- [Railway Docs](https://docs.railway.app/)
- [Railway CLI](https://docs.railway.app/develop/cli)
- [Railway Templates](https://railway.app/templates)

### Community
- [Railway Discord](https://discord.gg/railway)
- [Railway GitHub](https://github.com/railwayapp)
- [Railway Blog](https://blog.railway.app/)

### Video Tutorials
- [Railway Quick Start](https://www.youtube.com/watch?v=...)
- [Deploying Full Stack Apps](https://www.youtube.com/watch?v=...)

---

## 🎯 Summary

**Railway is the best all-in-one free hosting solution for your expense tracker** because:

1. ✅ **Everything in One Place** - Frontend, backend, database, Docker all in one dashboard
2. ✅ **Native Service Communication** - Services talk to each other seamlessly
3. ✅ **$5 Free Credit** - Enough for small personal projects
4. ✅ **GitHub Integration** - Auto-deploy on push
5. ✅ **Docker Support** - Deploy containers natively
6. ✅ **Simple Setup** - Less configuration than multi-platform approach

**For truly unlimited free hosting**, consider the split platform approach in [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md):
- Vercel (Frontend) - Unlimited
- Render (Backend) - 750 hours/month
- PlanetScale (Database) - 5GB storage

Both approaches work great - choose based on your needs! 🚀

---

**Happy Deploying with Railway! 🚂**
