# Complete Full-Stack Deployment Guide
Stack: Vercel (Frontend) + Render (Backend) + TiDB Cloud(MySQL Database)

This guide documents the exact steps taken to deploy the Expense Tracker application. Use this as a reference for future deployments.
---

## Phase 1: The Database (TiDB Cloud)
Since PlanetScale removed their free tier, we use TiDB Cloud Serverless for a free MySQL-compatible database.

1. Create the Cluster
 - Go to TiDB Cloud and sign up.
 - Click Create Cluster.
 - Select Serverless (The "Always Free" plan).
 - Region: Choose the one closest to you.
 - Name: cluster0.
 - Click Create.

2. Get Connection Details
 - Once the cluster is ready, click Connect (top right).
 - Generate Password: Click the button to create a root password. Copy this immediately.
 - Copy the Connection String: It will look like this:
 ```bash
    mysql://<User>:<Password>@<Host>:4000/<Database>?sslaccept=strict
 ```   
  - Note 1: TiDB uses port 4000 (Standard MySQL is 3306).
  - Note 2: You MUST ensure ?sslaccept=strict is at the end of the URL for Prisma to connect securely.

3. Push Schema (from VS Code)
 - Open your local project in VS code.
 - In your .env file paste the DATABASE_URL you got from TiDB.
 - Open the terminal and type this following command:
 ```bash
    npx prisma db push --schema=./src/backend/prisma/schema.prisma
 ```
 *Success Message: 🚀Your database is now in sync with your Prisma schema.*
---

## Phase 2: Backend Code Preparation
Before deploying to Render, specific code changes were required to prevent crashes in the cloud environment.

1. Fix Host Binding (src/backend/src/app.ts)
Cloud containers must listen on 0.0.0.0 (all network interfaces), not localhost.
 - Action: Update start() method in App class.
 - Code changes:
 ```javascript
 public start() {
  const { port } = appConfig;
  // CHANGED: Default to "0.0.0.0" instead of "localhost"
  const host = appConfig.host ?? "0.0.0.0"; 
  this.app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
  });
}
```
2. Fix Module Crash (src/backend/src/index.ts)
The tsconfig-paths library conflicts with ES Modules (type: "module") in production.
 - Action: Removed the import.
 - Code Change:
 ```javascript
 // REMOVED: import "tsconfig-paths/register.js"; 
import dotenv from "dotenv";
// ... rest of the file
```
3. Configure CORS (src/backend/src/app.ts)
The backend must explicitly allow the frontend domain to fetch data.
-Action: Verified allowedOrigins includes the FRONTEND_URL environment variable.
---

## Phase 3: Backend Hosting (Render)

1. Create Service
- Go to Render Dashboard.
- Click New + -> Web Service.
- Connect your GitHub repository.

2. Configure Settings(Crucial)
- Name: expense-tracker
- Root Directory: src/backend
    - Why? Your backend code lives in a subfolder. This tells Render where package.json is.
- Runtime: Node
- Build Command:
```bash
npm install && npx prisma generate && npm run build
```
- Why? npm install gets libraries. npx prisma generate creates the database client. npm run build compiles TypeScript.
- Start command:
```bash
npm run dev
```
3. Environment Variables
Go to the Environment tab in Render and add these secrets manually:
|Key | Value | Note |
|---|---|---|
|Database_URL | mysql://... | The TiDB string from Phase 1. |
|NODE_ENV | production | Optimizes performance |
|JWT_SECRET | (Random String) | For signing login tokens. |
|JWT_REFRESH_SECRET | (Random String) | For refresh toke |
|FRONTEND_URL | https://your-app.vercel.app | Exact URL from browser. No trailing slash. |
-Important: If HOST is present in the list, set it to 0.0.0.0 or delete it. Never set it to localhost.
---

## Phase 4: Frontend Connection (Vercel)
1. Add Environment Variable
- Go to Vercel Dashboard.
- Select your project -> Settings -> Environment Variables.
- Add New Variable:
    - Key: VITE_API_URL
    - Value: https://expense-tracker-api-xyz.onrender.com/api
    - CRITICAL: You must add /api at the end.
    - CRITICAL: You must not have a trailing slash after /api.
2. Redeploy Frontend
Changing variables does not update the live site automatically.
- Go to the Deployments tab. 
- Click the three dots (...) on the existing deployment.
-Select Redeploy.
---

## Troubleshooting Cheat Sheet

### Error: "No open ports detected"

- Cause: Your backend is listening on localhost (127.0.0.1).

- Fix: Change app.listen host to 0.0.0.0 in app.ts. Ensure Render Env Variable HOST is NOT localhost.

### Error: "Not allowed by CORS" (In Browser Console)

- Cause: The FRONTEND_URL in Render Env Vars does not match the browser URL exactly.

- Fix: Copy the URL from the browser address bar (e.g., https://myapp.vercel.app) and paste it into Render. Remove /login or trailing slashes.

### Error: "SyntaxError: JSON.parse: unexpected character..."

- Cause: Frontend is getting a 404 HTML page instead of JSON data.

- Fix: This means VITE_API_URL is missing or wrong on Vercel. The frontend is trying to call /api on itself instead of Render. Add the variable and redeploy.

### Error: "Prisma Client not initialized"

- Cause: You forgot npx prisma generate in the Build Command.

- Fix: Update Build Command to: npm install && npx prisma generate && npm run build.