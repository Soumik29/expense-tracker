# Project Improvements & Bug Fix Report

**Date:** February 3, 2026  
**Status:** ✅ All Changes Implemented

---

# Part 1: Architecture & Code Quality Improvements

## Overview

A series of improvements were made to enhance code organization, type safety, user experience, and maintainability.

---

## 1. Fixed AuthContext User Type Mismatch

**File:** `src/context/AuthContext.tsx`

**Problem:** The `User` interface had fields that didn't match the backend response.

### Before

```typescript
export interface User {
  id: number;
  username: string;
  name: string; // ❌ Backend doesn't return this
  createAt: string; // ❌ Backend doesn't return this
}
```

### After

```typescript
export interface User {
  id: number;
  username: string;
  email: string; // ✅ Matches backend response
}
```

---

## 2. Added Vite Proxy Configuration

**File:** `vite.config.ts`

**Problem:** Hardcoded `http://localhost:3000` URLs everywhere, potential CORS issues.

### Before

```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

### After

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
});
```

**Benefits:**

- No more CORS issues in development
- Cleaner API calls using `/api` instead of full URLs
- Easy to switch between environments

---

## 3. Improved TypeScript Types

**File:** `src/types.ts`

**Problem:** Inline type definitions were repetitive and didn't match Prisma schema exactly.

### Before

```typescript
export type Expense = {
  id: number;
  category: "Groceries" | "Food" | "Mobile_Bill" | ...;
  amount: number;
  description: string;
  date: string;
  isRecurring: boolean;
  paymentMethod: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "UPI";
}
```

### After

```typescript
// Reusable types matching Prisma schema
export type Category =
  | "Food"
  | "Groceries"
  | "Mobile_Bill"
  | "Travel"
  | "Shopping"
  | "Games"
  | "Subscription"
  | "EMI";
export type PaymentMethod = "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "UPI";

export type Expense = {
  id: number;
  category: Category;
  amount: number;
  description: string;
  date: string;
  isRecurring: boolean;
  paymentMethod: PaymentMethod;
  userId?: number;
};
```

---

## 4. Created Centralized API Service Layer

### New Files Created:

| File                              | Purpose                                            |
| --------------------------------- | -------------------------------------------------- |
| `src/services/api.ts`             | Base API class with fetch wrapper, error handling  |
| `src/services/auth.service.ts`    | Authentication endpoints (login, register, logout) |
| `src/services/expense.service.ts` | Expense CRUD operations                            |

### `src/services/api.ts`

```typescript
class ApiService {
  private baseUrl: string;

  async get<T>(endpoint: string): Promise<ApiResponse<T>>;
  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>>;
  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>>;
  async delete<T>(endpoint: string): Promise<ApiResponse<T>>;
}

export const api = new ApiService(API_BASE_URL);
```

### `src/services/auth.service.ts`

```typescript
export const authService = {
  async login(credentials): Promise<AuthResponse>
  async register(credentials): Promise<AuthResponse>
  async logout(): Promise<void>
  async getCurrentUser(): Promise<User | null>
}
```

### `src/services/expense.service.ts`

```typescript
export const expenseService = {
  async getAll(): Promise<Expense[]>
  async create(expense): Promise<Expense>
  async update(expense): Promise<Expense>
  async delete(id): Promise<void>
}
```

**Benefits:**

- Single source of truth for API calls
- Consistent error handling
- Easy to mock for testing
- No more scattered `fetch()` calls

---

## 5. Created Reusable UI Components

### `src/components/Spinner.tsx`

A customizable loading spinner with size variants.

```typescript
interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className = "" }: SpinnerProps);
```

### `src/components/LoadingButton.tsx`

A button that shows a spinner during async operations.

```typescript
interface LoadingButtonProps {
  loading?: boolean;
  children: React.ReactNode;
}

export function LoadingButton({
  loading,
  children,
  ...props
}: LoadingButtonProps);
```

---

## 6. Updated Components to Use New Services

### Login.tsx Changes

**Before:**

```typescript
const res = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ email, password }),
});
const data = await res.json();
if (!res.ok) throw new Error(data.message);
setUser(data.data);
```

**After:**

```typescript
const [loading, setLoading] = useState(false);

setLoading(true);
try {
  const userData = await authService.login({ email, password });
  setUser(userData);
} finally {
  setLoading(false);
}

// Button now shows loading state
<LoadingButton type="submit" loading={loading}>Sign in</LoadingButton>
```

### Register.tsx Changes

- Same pattern as Login
- Uses `authService.register()`
- Added loading state with `LoadingButton`

### AuthProvider.tsx Changes

**Before:**

```typescript
const res = await fetch("http://localhost:3000/api/user/info", {
  method: "GET",
  credentials: "include",
});
if (res.ok) {
  const data = await res.json();
  setUser(data);
}
```

**After:**

```typescript
const currentUser = await authService.getCurrentUser();
setUser(currentUser);
```

### App.tsx Changes

- Now uses `<Spinner />` component instead of plain "Loading..." text

### useCrud.tsx Changes

- Replaced all `fetch()` calls with `expenseService` methods
- Added `loading` and `error` states
- Returns `{ expense, addExpense, deleteExpense, updateExpenses, loading, error }`

---

## Summary of Files Changed (Improvements)

| File                               | Changes                                     |
| ---------------------------------- | ------------------------------------------- |
| `src/context/AuthContext.tsx`      | Fixed User interface to match backend       |
| `vite.config.ts`                   | Added proxy configuration                   |
| `src/types.ts`                     | Added reusable Category/PaymentMethod types |
| `src/services/api.ts`              | **NEW** - Centralized API service           |
| `src/services/auth.service.ts`     | **NEW** - Auth service                      |
| `src/services/expense.service.ts`  | **NEW** - Expense service                   |
| `src/components/Spinner.tsx`       | **NEW** - Loading spinner component         |
| `src/components/LoadingButton.tsx` | **NEW** - Button with loading state         |
| `src/auth/Login.tsx`               | Uses authService + LoadingButton            |
| `src/auth/Register.tsx`            | Uses authService + LoadingButton            |
| `src/context/AuthProvider.tsx`     | Uses authService                            |
| `src/components/App.tsx`           | Uses Spinner component                      |
| `src/utils/useCrud.tsx`            | Uses expenseService + exposes loading/error |

---

# Part 2: Bug Fix - Delete Expense Not Working

## Problem

Users were unable to delete expenses. The delete button would fail silently or throw an error in the console.

---

## Root Cause

**Mismatch between backend response and frontend handling.**

| Component    | Behavior                                                            |
| ------------ | ------------------------------------------------------------------- |
| **Backend**  | Returns `204 No Content` (empty response body) on successful delete |
| **Frontend** | Tried to parse JSON from every response with `response.json()`      |

When the frontend called `response.json()` on an empty `204` response, it threw a parsing error because there was no JSON to parse.

---

## The Fix

**File:** `src/services/api.ts`

### Before

```typescript
try {
  const response = await fetch(`${this.baseUrl}${endpoint}`, config);
  const data = await response.json();  // ❌ Fails on 204 No Content

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}
```

### After

```typescript
try {
  const response = await fetch(`${this.baseUrl}${endpoint}`, config);

  // ✅ Handle 204 No Content (common for DELETE requests)
  if (response.status === 204) {
    return { success: true } as ApiResponse<T>;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}
```

---

## Why This Works

1. **204 No Content** is the standard HTTP response for successful DELETE operations
2. The fix checks for this status code **before** attempting to parse JSON
3. Returns a simple `{ success: true }` object so the calling code knows the operation succeeded

---

# Part 3: Bug Fix - Backend Not Loading Environment Variables

## Problem

Login requests were returning `500 Internal Server Error` with an empty response body. The error in the browser console was:

```
API Error [/auth/login]: SyntaxError: JSON.parse: unexpected end of data
```

---

## Root Cause

The `.env` file was located in the **project root**, but the backend runs from `src/backend/`. The `dotenv` package loads `.env` from the current working directory, so the backend couldn't find the environment variables.

When `AUTH_SECRET` is `undefined`, `jwt.sign()` crashes with:

```
Error: secretOrPrivateKey must have a value
```

This caused the 500 error with an empty response body.

---

## The Fix

**File:** `src/backend/src/index.ts`

### Before

```typescript
import "tsconfig-paths/register.js";
import "dotenv/config";

import App from "./app.js";
const app = new App();

app.start();
```

### After

```typescript
import "tsconfig-paths/register.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (two levels up from src/backend/src)
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import App from "./app.js";
const app = new App();

app.start();
```

---

## Why This Works

1. **ES Modules don't have `__dirname`** - We recreate it using `fileURLToPath` and `import.meta.url`
2. **Explicit path to .env** - Instead of relying on CWD, we calculate the absolute path to the root `.env`
3. **Path resolution** - `../../../.env` goes from `src/backend/src/` up to the project root

---

# Quick Reference: All New Files

```
src/
├── services/
│   ├── api.ts              ← Base API service
│   ├── auth.service.ts     ← Auth methods
│   └── expense.service.ts  ← Expense CRUD
└── components/
    ├── Spinner.tsx         ← Loading spinner
    └── LoadingButton.tsx   ← Button with loading state
```

---

# Testing Checklist

- [ ] Login shows loading spinner on button while authenticating
- [ ] Register shows loading spinner on button while registering
- [ ] App shows spinner while checking auth status on initial load
- [ ] Expenses load correctly after login
- [ ] Adding an expense works
- [ ] Deleting an expense works (Part 2 bug fix)
- [ ] Updating an expense works
- [ ] Backend loads environment variables correctly (Part 3 bug fix)

---

## Testing

1. Log in to the application
2. Add an expense (if none exist)
3. Click the delete button on any expense
4. ✅ Expense should be removed from the list without errors

---

# Part 4: Development Startup Automation

**Date:** February 4, 2026  
**Status:** ✅ Implemented

## Overview

Previously, starting the development environment required multiple manual steps:

1. Open Docker Desktop
2. Navigate to `./src/backend` and run `npm run dev`
3. Navigate back to root and run `npm run dev` for frontend

This has been simplified with new npm scripts.

---

## Changes Made

**File:** `package.json` (root)

### New Dependencies Added

```json
"devDependencies": {
  "concurrently": "^9.2.1",
  "wait-on": "^8.x.x"
}
```

### New Scripts Added

```json
"scripts": {
  "dev": "vite",
  "dev:frontend": "vite",
  "dev:backend": "cd src/backend && npm run dev",
  "dev:full": "concurrently -n \"frontend,backend\" -c \"cyan,yellow\" \"npm run dev:frontend\" \"npm run dev:backend\"",
  "docker:up": "docker-compose up -d",
  "docker:down": "docker-compose down",
  "start": "npm run docker:up && timeout /t 5 && npm run dev:full",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

---

## Script Reference

| Script                 | Command                         | Description                                                 |
| ---------------------- | ------------------------------- | ----------------------------------------------------------- |
| `npm run dev`          | `vite`                          | Starts only the Vite frontend (original behavior)           |
| `npm run dev:frontend` | `vite`                          | Alias for frontend only                                     |
| `npm run dev:backend`  | `cd src/backend && npm run dev` | Starts only the Express backend                             |
| `npm run dev:full`     | `concurrently ...`              | Starts **both** frontend & backend simultaneously           |
| `npm run docker:up`    | `docker-compose up -d`          | Starts MySQL database container in detached mode            |
| `npm run docker:down`  | `docker-compose down`           | Stops the database container                                |
| `npm start`            | All-in-one                      | Starts Docker → waits 5 seconds → starts frontend & backend |

---

## Usage

### Option 1: One Command to Start Everything

_Requires Docker Desktop to already be running_

```bash
npm start
```

This will:

1. Start the MySQL container via Docker Compose
2. Wait 5 seconds for the database to initialize
3. Start both frontend (Vite) and backend (Express) concurrently

### Option 2: If Docker is Already Running

```bash
npm run dev:full
```

Starts frontend and backend together without touching Docker.

### Option 3: Individual Services

```bash
npm run docker:up      # Start database only
npm run dev:frontend   # Start frontend only
npm run dev:backend    # Start backend only
```

---

## Important Note: Docker Desktop

Docker Desktop must be **manually opened** before running `npm start` on Windows. The Docker daemon requires Docker Desktop to be running.

**Recommendation:** Enable auto-start for Docker Desktop:

1. Open Docker Desktop
2. Go to **Settings** → **General**
3. Enable **"Start Docker Desktop when you sign in to Windows"**

---

## Terminal Output

When running `npm run dev:full`, you'll see color-coded output:

- **Cyan** `[frontend]` - Vite dev server logs
- **Yellow** `[backend]` - Express/Nodemon logs

This makes it easy to distinguish which service is logging what.

---

## 📚 Tutorial: How to Set Up Development Automation

This tutorial explains how to automate starting multiple services (frontend, backend, database) with a single command. You can apply this to any full-stack project.

### Prerequisites

- Node.js and npm installed
- A project with separate frontend and backend
- (Optional) Docker for database services

---

### Step 1: Install Concurrently

`concurrently` is an npm package that runs multiple commands in parallel.

```bash
npm install concurrently --save-dev
```

**Why concurrently?**

- Runs multiple processes simultaneously
- Color-codes output from different processes
- Kills all processes when one exits (configurable)
- Works on Windows, Mac, and Linux

---

### Step 2: Understand Your Project Structure

Identify what needs to run:

```
my-project/
├── package.json          # Root (often frontend)
├── src/
│   └── backend/
│       └── package.json  # Backend with its own scripts
└── docker-compose.yaml   # Database (optional)
```

In this project:

- **Frontend:** Runs with `vite` from the root
- **Backend:** Runs with `npm run dev` from `src/backend/`
- **Database:** Runs with `docker-compose up`

---

### Step 3: Create Individual Scripts

First, create scripts that run each service independently:

```json
{
  "scripts": {
    "dev:frontend": "vite",
    "dev:backend": "cd src/backend && npm run dev"
  }
}
```

**Key Points:**

- Use `cd <folder> && npm run <script>` to run scripts in subdirectories
- On Windows, use `&&` (works in npm scripts even though PowerShell prefers `;`)

---

### Step 4: Combine with Concurrently

Create a script that runs both services together:

```json
{
  "scripts": {
    "dev:full": "concurrently -n \"frontend,backend\" -c \"cyan,yellow\" \"npm run dev:frontend\" \"npm run dev:backend\""
  }
}
```

**Concurrently Flags Explained:**

| Flag                    | Purpose                | Example                 |
| ----------------------- | ---------------------- | ----------------------- |
| `-n`                    | Name each process      | `-n "frontend,backend"` |
| `-c`                    | Color for each process | `-c "cyan,yellow"`      |
| `-k`                    | Kill all if one dies   | `-k`                    |
| `--kill-others-on-fail` | Kill all on failure    | `--kill-others-on-fail` |

**Available Colors:** `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `gray`

---

### Step 5: Add Docker Scripts (Optional)

If you use Docker for your database:

```json
{
  "scripts": {
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down"
  }
}
```

**Flags:**

- `-d` runs in detached mode (background)

---

### Step 6: Create the Master Start Script

Combine everything into one command:

**For Windows:**

```json
{
  "scripts": {
    "start": "npm run docker:up && timeout /t 5 && npm run dev:full"
  }
}
```

**For Mac/Linux:**

```json
{
  "scripts": {
    "start": "npm run docker:up && sleep 5 && npm run dev:full"
  }
}
```

**Cross-platform (using wait-on):**

```bash
npm install wait-on --save-dev
```

```json
{
  "scripts": {
    "start": "npm run docker:up && npx wait-on tcp:3306 && npm run dev:full"
  }
}
```

This waits until port 3306 (MySQL) is available before starting the dev servers.

---

### Step 7: Complete Example

Here's a complete `package.json` scripts section:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:frontend": "vite",
    "dev:backend": "cd src/backend && npm run dev",
    "dev:full": "concurrently -n \"frontend,backend\" -c \"cyan,yellow\" \"npm run dev:frontend\" \"npm run dev:backend\"",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "start": "npm run docker:up && timeout /t 5 && npm run dev:full",
    "build": "tsc -b && vite build",
    "lint": "eslint ."
  }
}
```

---

### Advanced: More Concurrently Examples

**Run 3+ services:**

```json
"dev:all": "concurrently -n \"web,api,worker\" -c \"cyan,yellow,magenta\" \"npm run dev:web\" \"npm run dev:api\" \"npm run dev:worker\""
```

**With prefixes showing timestamps:**

```json
"dev:full": "concurrently --timestamp-format \"HH:mm:ss\" -t -n \"frontend,backend\" \"npm run dev:frontend\" \"npm run dev:backend\""
```

**Kill all if one fails:**

```json
"dev:full": "concurrently --kill-others-on-fail -n \"frontend,backend\" \"npm run dev:frontend\" \"npm run dev:backend\""
```

**Run commands directly (not npm scripts):**

```json
"dev:full": "concurrently \"vite\" \"cd src/backend && nodemon --exec tsx ./src/index.ts\""
```

---

### Troubleshooting

| Issue                              | Solution                                             |
| ---------------------------------- | ---------------------------------------------------- |
| `'concurrently' is not recognized` | Run `npm install` to install dependencies            |
| Backend starts before DB is ready  | Add `wait-on` or a `timeout`/`sleep`                 |
| Port already in use                | Kill existing processes or change ports              |
| Colors not showing                 | Your terminal may not support ANSI colors            |
| Scripts fail on Windows            | Avoid using `$(...)` syntax, use `&&` instead of `;` |

---

### Summary

1. **Install:** `npm install concurrently --save-dev`
2. **Create individual scripts** for each service
3. **Combine with concurrently** using `-n` for names and `-c` for colors
4. **Add Docker scripts** if using containers
5. **Create master `start` script** that runs everything

Now you can start your entire development stack with just `npm start`! 🚀
