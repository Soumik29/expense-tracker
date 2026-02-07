# Railway Quick Start Checklist

Use this checklist to deploy your Expense Tracker to Railway in ~30 minutes.

## ☑️ Before You Start

- [ ] Repository pushed to GitHub
- [ ] GitHub account ready
- [ ] Railway account created at [railway.app](https://railway.app)

---

## 📦 Step 1: Create Railway Project (5 min)

- [ ] Log in to Railway with GitHub
- [ ] Click **"New Project"**
- [ ] Select **"Deploy from GitHub repo"**
- [ ] Choose `expense-tracker` repository
- [ ] Project created successfully

---

## 🗄️ Step 2: Add MySQL Database (5 min)

- [ ] Click **"+ New"** in your project
- [ ] Select **"Database"** → **"Add MySQL"**
- [ ] Wait for MySQL service to provision
- [ ] Click on MySQL service
- [ ] Go to **"Connect"** tab
- [ ] Copy the **MySQL Connection URL** (save for later)
- [ ] Click **"Data"** tab → **"Query"**
- [ ] Run: `SHOW DATABASES;` to verify connection

---

## 🔧 Step 3: Deploy Backend Service (10 min)

- [ ] Click **"+ New"** → **"GitHub Repo"**
- [ ] Select your repository again
- [ ] Click on the new service (rename it to "Backend")
- [ ] Go to **"Settings"** tab
- [ ] Set **Root Directory** = `src/backend`
- [ ] Set **Build Command** = `npm install && npx prisma generate && npm run build`
- [ ] Set **Start Command** = `npm run start`
- [ ] Go to **"Variables"** tab
- [ ] Add environment variables:
  - [ ] `NODE_ENV` = `production`
  - [ ] `DATABASE_URL` = `${{MySQL.DATABASE_URL}}`
  - [ ] `JWT_SECRET` = (generate random: use password generator)
  - [ ] `JWT_REFRESH_SECRET` = (generate random: different from JWT_SECRET)
  - [ ] `PORT` = `3000`
- [ ] Click **"Deploy"** (or it auto-deploys)
- [ ] Wait for build to complete (~5 minutes)
- [ ] Copy the public URL (e.g., `https://backend-xxx.up.railway.app`)
- [ ] Test health check: Visit `https://your-backend-url.up.railway.app/api/health`
- [ ] Verify response: `{"status":"ok","timestamp":"..."}`

---

## 🗄️ Step 4: Initialize Database Schema (5 min)

**Option A: From Local Machine**

- [ ] Open terminal on your local machine
- [ ] Navigate to `src/backend` folder
- [ ] Run: `DATABASE_URL="your-railway-mysql-url" npx prisma db push`
- [ ] Wait for schema to be pushed
- [ ] Verify: Go to Railway MySQL → **"Data"** → Run `SHOW TABLES;`
- [ ] Should see: `User`, `Expense` tables

**Option B: From Railway Console**

- [ ] Go to MySQL service in Railway
- [ ] Click **"Data"** tab → **"Query"**
- [ ] Copy SQL from your Prisma migrations
- [ ] Paste and execute in Railway console
- [ ] Verify tables created: `SHOW TABLES;`

---

## 🎨 Step 5: Deploy Frontend Service (5 min)

- [ ] Click **"+ New"** → **"GitHub Repo"**
- [ ] Select your repository again
- [ ] Click on the new service (rename it to "Frontend")
- [ ] Go to **"Settings"** tab
- [ ] Leave **Root Directory** blank (uses root)
- [ ] Set **Build Command** = `npm install && npm run build`
- [ ] Set **Start Command** = `npm run preview` or leave default
- [ ] Go to **"Variables"** tab
- [ ] Add environment variable:
  - [ ] `VITE_API_URL` = `${{Backend.url}}/api`
- [ ] Click **"Deploy"** (or it auto-deploys)
- [ ] Wait for build to complete (~3 minutes)
- [ ] Copy the public URL (e.g., `https://frontend-xxx.up.railway.app`)

---

## 🔗 Step 6: Connect Services (2 min)

- [ ] Go back to **Backend** service
- [ ] Go to **"Variables"** tab
- [ ] Add new variable:
  - [ ] `FRONTEND_URL` = `${{Frontend.url}}`
- [ ] Service will auto-redeploy

---

## ✅ Step 7: Test Deployment (5 min)

- [ ] Visit your frontend URL: `https://frontend-xxx.up.railway.app`
- [ ] You should see the login page
- [ ] Open browser DevTools (F12) → Console tab
- [ ] Check for any errors (should be none)
- [ ] Click **"Register"**
- [ ] Fill in test user details:
  - [ ] Username: `testuser`
  - [ ] Email: `test@example.com`
  - [ ] Password: `Test1234!`
- [ ] Click **"Register"** button
- [ ] Should redirect to dashboard
- [ ] Click **"Add Expense"** button
- [ ] Fill in expense details:
  - [ ] Description: `Test Coffee`
  - [ ] Amount: `5.50`
  - [ ] Category: `Food & Dining`
  - [ ] Date: Today
  - [ ] Payment Method: `Cash`
- [ ] Click **"Add"**
- [ ] Expense should appear in the list
- [ ] Refresh the page (F5)
- [ ] Expense should still be there (data persisted!)
- [ ] Open DevTools → Network tab
- [ ] Check API calls are going to your backend
- [ ] No CORS errors in console

---

## 🎯 Optional: Configure Custom Settings (5 min)

### Generate Custom Domain

- [ ] Go to Frontend service
- [ ] Go to **"Settings"** tab
- [ ] Click **"Generate Domain"**
- [ ] Get custom `*.up.railway.app` subdomain
- [ ] Update bookmark/share this URL

### Enable Auto-Deploy

- [ ] Go to Backend service → **"Settings"**
- [ ] Find **"Deploy Triggers"**
- [ ] Enable **"Auto-deploy"**
- [ ] Repeat for Frontend service
- [ ] Now every push to GitHub auto-deploys!

### Set Up Monitoring

- [ ] Go to project **"Settings"**
- [ ] Enable **"Usage Alerts"**
- [ ] Set alert threshold (e.g., $4)
- [ ] Add email for notifications
- [ ] Monitor from **"Usage"** tab

---

## 🐛 Troubleshooting Checklist

If something doesn't work, check these:

### Backend Issues

- [ ] Build Command includes `npx prisma generate`
- [ ] Start Command is `npm run start`
- [ ] Root Directory is `src/backend`
- [ ] DATABASE_URL uses service reference: `${{MySQL.DATABASE_URL}}`
- [ ] All 6 environment variables are set
- [ ] Health check endpoint returns 200: `/api/health`
- [ ] Check logs: Click service → **"Logs"** tab

### Frontend Issues

- [ ] Build Command is `npm install && npm run build`
- [ ] Root Directory is empty (root)
- [ ] VITE_API_URL includes `/api` suffix
- [ ] VITE_API_URL uses service reference: `${{Backend.url}}/api`
- [ ] Check browser console for errors
- [ ] Check logs: Click service → **"Logs"** tab

### Database Issues

- [ ] MySQL service is running (green status)
- [ ] Tables exist: Run `SHOW TABLES;` in MySQL console
- [ ] Connection string is correct
- [ ] Schema was pushed: `prisma db push` completed
- [ ] Check MySQL logs for connection errors

### CORS Issues

- [ ] FRONTEND_URL is set in Backend variables
- [ ] FRONTEND_URL uses service reference: `${{Frontend.url}}`
- [ ] Backend service redeployed after adding FRONTEND_URL
- [ ] No browser console errors about CORS

---

## 📊 Cost Monitoring

- [ ] Go to project **"Settings"** → **"Usage"**
- [ ] Check current usage against $5 limit
- [ ] Typical usage for this app: ~$4-5/month
- [ ] Set up billing alerts if needed
- [ ] Enable auto-sleep for unused services

---

## 🎉 Success Checklist

Your deployment is successful if:

- [ ] ✅ Frontend loads without errors
- [ ] ✅ Can register new user
- [ ] ✅ Can login with credentials
- [ ] ✅ Can add expense
- [ ] ✅ Expense persists after refresh
- [ ] ✅ No CORS errors in console
- [ ] ✅ Backend health check returns 200
- [ ] ✅ Database has tables with data
- [ ] ✅ All three services are running (green status)

---

## 📚 Next Steps

After successful deployment:

- [ ] Bookmark your app URL
- [ ] Share with friends/portfolio
- [ ] Set up custom domain (optional)
- [ ] Enable auto-deploy from GitHub
- [ ] Monitor usage in Railway dashboard
- [ ] Star the repository on GitHub! ⭐

---

## 🆘 Need Help?

If you're stuck, check these resources:

1. **Railway Deployment Guide:** [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)
2. **Railway Docs:** [docs.railway.app](https://docs.railway.app)
3. **Railway Discord:** [discord.gg/railway](https://discord.gg/railway)
4. **Troubleshooting Section:** See Railway guide for detailed solutions

---

## ⏱️ Estimated Time Breakdown

| Step | Time | Status |
|------|------|--------|
| Setup Account | 5 min | ⬜ |
| Add MySQL | 5 min | ⬜ |
| Deploy Backend | 10 min | ⬜ |
| Init Database | 5 min | ⬜ |
| Deploy Frontend | 5 min | ⬜ |
| Connect Services | 2 min | ⬜ |
| Test Deployment | 5 min | ⬜ |
| **Total** | **~37 min** | |

---

**Happy Deploying! 🚀**

Once complete, your expense tracker will be live at:
- Frontend: `https://your-app.up.railway.app`
- Backend: `https://your-api.up.railway.app`

All hosted in one place, completely free! 🎉
