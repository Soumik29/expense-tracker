# Full-Stack Docker Deployment Guide

This guide explains how to run the entire Expense Tracker application (frontend + backend + database) using Docker, and how to deploy it to hosting platforms.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Frontend   │  │   Backend    │  │   Database   │   │
│  │  (Nginx +    │─▶│  (Express +  │─▶│   (MySQL)    │   │
│  │   React)     │  │   Prisma)    │  │              │   │
│  │  Port: 8080  │  │  Port: 3000  │  │  Port: 3306  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

- **Frontend**: React app built and served via Nginx, proxies `/api/*` requests to backend
- **Backend**: Express.js API with Prisma ORM
- **Database**: MySQL 8.0 with persistent volume storage

## Files Modified/Created

### 1. `docker-compose.yaml`

Updated to include all three services (previously only had database):

```yaml
services:
  # MySQL Database
  db:
    image: mysql:8.0
    restart: always
    container_name: expense-db
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-rootpassword}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-expense_tracker}
      MYSQL_USER: ${MYSQL_USER:-expense_user}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-expense_password}
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  # Backend API (Express + Prisma)
  backend:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    container_name: expense-backend
    restart: always
    environment:
      PORT: 3000
      DATABASE_URL: mysql://${MYSQL_USER:-expense_user}:${MYSQL_PASSWORD:-expense_password}@db:3306/${MYSQL_DATABASE:-expense_tracker}
      AUTH_SECRET: ${AUTH_SECRET:-your-super-secret-jwt-key-change-in-production}
      AUTH_SECRET_EXPIRES_IN: ${AUTH_SECRET_EXPIRES_IN:-15m}
      AUTH_REFRESH_SECRET: ${AUTH_REFRESH_SECRET:-your-refresh-secret-key}
      AUTH_REFRESH_SECRET_EXPIRES_IN: ${AUTH_REFRESH_SECRET_EXPIRES_IN:-7d}
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy

  # Frontend (React + Nginx)
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: expense-frontend
    restart: always
    environment:
      PORT: 80
    ports:
      - "8080:80"
    depends_on:
      - backend

volumes:
  db_data:
```

### 2. `nginx.conf`

Added API proxy configuration to route `/api/*` requests to the backend container:

```nginx
# Proxy API requests to backend service
location /api/ {
    proxy_pass http://backend:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 60s;
    proxy_connect_timeout 60s;
}
```

### 3. Existing Dockerfiles (unchanged)

- `Dockerfile` (root): Builds React frontend, serves with Nginx
- `src/backend/Dockerfile`: Builds Express API with Prisma

## Prerequisites

- Docker Desktop installed and running
- Git (to clone the repository)

## Step-by-Step Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd expense-tracker
```

### 2. Create Environment File

Copy the example environment file and customize it:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

Edit `.env` with secure values:

```env
# Database Configuration
MYSQL_ROOT_PASSWORD=your-secure-root-password
MYSQL_DATABASE=expense_tracker
MYSQL_USER=expense_user
MYSQL_PASSWORD=your-secure-password

# Authentication Secrets (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
AUTH_SECRET=your-64-char-hex-secret
AUTH_SECRET_EXPIRES_IN=15m
AUTH_REFRESH_SECRET=your-another-64-char-hex-secret
AUTH_REFRESH_SECRET_EXPIRES_IN=7d
```

### 3. Build and Start All Services

```bash
docker-compose up --build
```

This command:

1. Builds the frontend Docker image (React + Nginx)
2. Builds the backend Docker image (Express + Prisma)
3. Pulls the MySQL image
4. Starts all containers with proper networking

### 4. Run Database Migrations (First Time Only)

Wait for all services to be healthy, then run:

```bash
docker-compose exec backend npx prisma migrate deploy
```

### 5. Access the Application

| Service  | URL                       |
| -------- | ------------------------- |
| Frontend | http://localhost:8080     |
| Backend  | http://localhost:3000/api |
| Database | localhost:3306            |

## Useful Docker Commands

```bash
# Start in detached mode (background)
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# Stop all services
docker-compose down

# Stop and remove volumes (resets database)
docker-compose down -v

# Rebuild a specific service
docker-compose up --build backend

# Enter a container shell
docker-compose exec backend sh
docker-compose exec frontend sh

# Check service status
docker-compose ps
```

## Hosting the Dockerized Application

### Option 1: Railway (Recommended - Easiest)

Railway can deploy docker-compose directly:

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) and create new project
3. Select "Deploy from GitHub repo"
4. Railway auto-detects `docker-compose.yaml`
5. Add environment variables in the dashboard
6. Deploy!

**Cost**: $5/month credit on free tier

### Option 2: Render

Deploy as separate services:

1. **Database**: Use Render's managed MySQL or external (PlanetScale)
2. **Backend**: Create "Web Service" → Docker → point to `src/backend`
3. **Frontend**: Create "Static Site" or "Web Service" → Docker → point to root

### Option 3: Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Deploy each service
cd src/backend
flyctl launch

cd ../..
flyctl launch
```

### Option 4: DigitalOcean App Platform

1. Connect GitHub repository
2. Create app with Docker configuration
3. Add environment variables
4. Deploy

### Option 5: Self-Hosted VPS

On any VPS (DigitalOcean Droplet, AWS EC2, Linode, etc.):

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone repo
git clone <your-repo> && cd expense-tracker

# Create .env file with production values
nano .env

# Start with production settings
docker-compose up -d

# Setup reverse proxy (nginx/caddy) for HTTPS
```

## Production Considerations

### Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Generate strong JWT secrets (64+ characters)
- [ ] Use HTTPS in production (add SSL termination)
- [ ] Set `NODE_ENV=production`
- [ ] Don't expose database port (3306) publicly
- [ ] Use secrets management (not plain .env files)

### Performance

- [ ] Enable Nginx caching (already configured)
- [ ] Use connection pooling for database
- [ ] Add rate limiting to API endpoints
- [ ] Configure proper health checks

### Monitoring

- [ ] Add logging aggregation (Loki, CloudWatch, etc.)
- [ ] Set up uptime monitoring
- [ ] Configure alerts for container health

## Troubleshooting

### Database Connection Errors

```bash
# Check if database is healthy
docker-compose ps

# View database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### Backend Can't Connect to Database

1. Ensure `db` service is healthy before backend starts
2. Check `DATABASE_URL` format in docker-compose.yaml
3. Verify MySQL user has correct permissions

### Frontend Can't Reach Backend

1. Check nginx.conf proxy configuration
2. Ensure backend container name is `backend` (matches nginx upstream)
3. Verify backend is running: `docker-compose logs backend`

### Prisma Migration Errors

```bash
# Reset database and rerun migrations
docker-compose exec backend npx prisma migrate reset

# Generate Prisma client
docker-compose exec backend npx prisma generate
```

## Summary of Changes Made

| File                  | Change                                                                             |
| --------------------- | ---------------------------------------------------------------------------------- |
| `docker-compose.yaml` | Added `backend` and `frontend` services, configured health checks and dependencies |
| `nginx.conf`          | Added `/api/` proxy location to route API calls to backend container               |

The existing Dockerfiles (`Dockerfile` and `src/backend/Dockerfile`) were already properly configured and required no changes.
