# GitHub Copilot Changes - Detailed Documentation

**Date:** February 6-7, 2026  
**Purpose:** Document all changes made by GitHub Copilot when merging branches

---

## Overview

When you created Pull Requests to merge `input` into `main`, GitHub Copilot reviewed your code and made additional improvements. This document explains every change Copilot made in simple terms.

### Pull Requests Created by Copilot

| PR  | Description                           |
| --- | ------------------------------------- |
| #25 | First round of fixes (sub-PR of #24)  |
| #27 | Second round of fixes (sub-PR of #26) |

### Commits Made by Copilot

| Commit    | Description                                                        |
| --------- | ------------------------------------------------------------------ |
| `c4ea59b` | Fix env vars, auth, validation, types, remove build artifacts      |
| `79a3809` | Improve type safety with AuthenticatedRequest interface            |
| `0b2a230` | Correct Send.unauthorized parameter order and update endpoint path |

---

## Change #1: Fixed Environment Variable Names

### The Problem

Your code was looking for `host` (lowercase) but environment variables are typically `HOST` (uppercase).

### What Copilot Changed

**File:** `src/backend/src/config/app.config.ts`

```typescript
// Before
const appConfig = {
  host: process.env.Host, // Wrong! Should be uppercase
  port: Number(process.env.PORT),
};

// After
const appConfig = {
  host: process.env.HOST, // Correct!
  port: Number(process.env.PORT),
};
```

### Why This Matters

Environment variables on most systems (Linux, Docker, Render, etc.) are case-sensitive. Using the wrong case means your app wouldn't read the HOST value correctly.

---

## Change #2: Made JWT Secrets Flexible

### The Problem

Your code only looked for `AUTH_SECRET` but many tutorials and deployment guides use `JWT_SECRET`.

### What Copilot Changed

**File:** `src/backend/src/config/auth.config.ts`

```typescript
// Before
const authConfig = {
  secret: process.env.AUTH_SECRET,
  secret_expries_in: process.env.AUTH_SECRET_EXPIRES_IN,
  refreshToken: process.env.AUTH_REFRESH_SECRET,
  refreshToken_expries_in: process.env.AUTH_REFRESH_SECRET_EXPIRES_IN,
};

// After
const authConfig = {
  secret: process.env.JWT_SECRET ?? process.env.AUTH_SECRET,
  secret_expries_in:
    process.env.JWT_SECRET_EXPIRES_IN ?? process.env.AUTH_SECRET_EXPIRES_IN,
  refreshToken:
    process.env.JWT_REFRESH_SECRET ?? process.env.AUTH_REFRESH_SECRET,
  refreshToken_expries_in:
    process.env.JWT_REFRESH_SECRET_EXPIRES_IN ??
    process.env.AUTH_REFRESH_SECRET_EXPIRES_IN,
};
```

### Why This Matters

The `??` operator means "use the left value, but if it's undefined, use the right value". This makes your app work with either naming convention.

---

## Change #3: Removed Debug Logging (Security Fix)

### The Problem

The login controller had `console.log(req)` which would print the ENTIRE request object to the console, including sensitive data like passwords!

### What Copilot Changed

**File:** `src/backend/src/controllers/auth.controller.ts`

```typescript
// Before (SECURITY RISK!)
static login = async (req: Request, res: Response) => {
    console.log(req);  // This logs passwords!
    const { email, password } = req.body;

// After (Safe)
static login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
```

### Why This Matters

If someone looked at your server logs, they could see user passwords in plain text. This is a major security vulnerability.

---

## Change #4: Fixed Login Error Responses

### The Problem

When login failed (wrong email or password), your server returned a 500 error (Internal Server Error). This is wrong because:

- 500 means "the server crashed"
- 401 means "wrong credentials" (correct)

### What Copilot Changed

**File:** `src/backend/src/controllers/auth.controller.ts`

```typescript
// Before (Wrong error code)
if (!user) {
  return Send.error(res, null, "Invalid Credentials"); // Returns 500
}
if (!isPasswordValid) {
  return Send.error(res, null, "Incorrect Password"); // Returns 500
}

// After (Correct error code)
if (!user) {
  return Send.unauthorized(res, null, "Invalid Credentials"); // Returns 401
}
if (!isPasswordValid) {
  return Send.unauthorized(res, null, "Incorrect Password"); // Returns 401
}
```

### Why This Matters

Using correct HTTP status codes helps frontend developers know what went wrong and show appropriate error messages.

---

## Change #5: Used Separate Secrets for Tokens

### The Problem

Both access tokens and refresh tokens were using the same secret key.

### What Copilot Changed

**File:** `src/backend/src/controllers/auth.controller.ts`

```typescript
// Before (Same secret for both)
const accessToken = sign({ userId: user.id }, sec, { ... });
const refreshToken = sign({ userId: user.id }, sec, { ... });  // Same 'sec'!

// After (Different secrets)
const accessToken = sign({ userId: user.id }, sec, { ... });
const refreshTokenSecret = authConfig.refreshToken as string;
const refreshToken = sign({ userId: user.id }, refreshTokenSecret, { ... });
```

### Why This Matters

If one secret is stolen/compromised:

- Before: Attacker can forge BOTH types of tokens
- After: Attacker can only forge one type, limiting damage

---

## Change #6: Fixed Logout Reading Wrong Property

### The Problem

The logout function was looking for `req.user?.userId` but the authentication middleware actually sets `req.userId` directly.

### What Copilot Changed

**File:** `src/backend/src/controllers/auth.controller.ts`

```typescript
// Before (Looking in wrong place)
const userId = (req as Request & { user?: { userId: number } }).user?.userId;

// After (Looking in right place)
const userId = (req as Request & { userId?: number }).userId;
```

### Why This Matters

Logout would always fail because it couldn't find the user ID.

---

## Change #7: Fixed Auth Middleware Return Statements

### The Problem

When authentication failed, the middleware didn't `return` the response, so the code would continue executing.

### What Copilot Changed

**File:** `src/backend/src/middlewares/auth.middleware.ts`

```typescript
// Before (Missing return)
} catch (err) {
    console.error("Authentication Failed:", err);
    Send.unauthorized(res, null);  // No return!
    // Code continues...
}

// After (Proper return)
} catch (err) {
    console.error("Authentication Failed:", err);
    return Send.unauthorized(res, null);  // Stops execution
}
```

### Why This Matters

Without `return`, the middleware might try to send multiple responses, causing "headers already sent" errors.

---

## Change #8: Used Correct Secret for Refresh Token Validation

### The Problem

The refresh token validation was using the access token secret instead of the refresh token secret.

### What Copilot Changed

**File:** `src/backend/src/middlewares/auth.middleware.ts`

```typescript
// Before (Wrong secret)
const decodedToken = verify(refreshToken, secret) as DecodedToken;

// After (Correct secret)
const refreshTokenSecret = authConfig.refreshToken as string;
const decodedToken = verify(refreshToken, refreshTokenSecret) as DecodedToken;
```

### Why This Matters

Refresh tokens signed with one secret can't be verified with a different secret. This was causing all refresh attempts to fail.

---

## Change #9: Removed Console Logs from Validation

### The Problem

The validation middleware had debug `console.log` statements that would clutter your server logs.

### What Copilot Changed

**File:** `src/backend/src/middlewares/validation.middleware.ts`

```typescript
// Before
static validateBody(schema: ZodType) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            console.log("This is the req.body", req.body);  // Debug log
            schema.parse(req.body);
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                err.issues.forEach((error) => {
                    console.log(error)  // Debug log

// After (Clean)
static validateBody(schema: ZodType) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                err.issues.forEach((error) => {
```

### Why This Matters

Console logs in production slow down the server and fill up log storage.

---

## Change #10: Fixed Validation Error Handling

### The Problem

If validation failed with a non-Zod error, the code didn't handle it.

### What Copilot Changed

**File:** `src/backend/src/middlewares/validation.middleware.ts`

```typescript
// Before
} catch (err) {
    if (err instanceof ZodError) {
        // handle zod error
        return Send.validationErrors(res, formattedErrors);
    }
    // Missing else case!
}
// return Send.error(res, "Invalid request data");  // Commented out!

// After
} catch (err) {
    if (err instanceof ZodError) {
        // handle zod error
        return Send.validationErrors(res, formattedErrors);
    }
    return Send.error(res, null, "Invalid request data");  // Handle other errors
}
```

### Why This Matters

Without proper error handling, unexpected errors would cause the request to hang forever.

---

## Change #11: Fixed Zod Email Validation Syntax

### The Problem

The Zod schema for email validation had incorrect syntax.

### What Copilot Changed

**File:** `src/backend/src/validations/auth.schema.ts`

```typescript
// Before (Invalid syntax)
const login = z.object({
    email: z.email().trim().min(1, "Email is required"),  // z.email() doesn't exist!

const register = z.object({
    email: z.email({pattern: z.regexes.rfc5322Email}),  // Wrong syntax

// After (Valid syntax)
const login = z.object({
    email: z.string().trim().email("Invalid email format").min(1, "Email is required"),

const register = z.object({
    email: z.string().trim().email("Invalid email format"),
```

### Why This Matters

The old code would crash when trying to validate emails because `z.email()` is not a valid Zod function.

---

## Change #12: Fixed Auth Service Endpoint Path

### The Problem

The frontend was calling `/auth/refresh` but the backend endpoint is `/auth/refresh-token`.

### What Copilot Changed

**File:** `src/services/auth.service.ts`

```typescript
// Before (Wrong path)
async refreshToken(): Promise<boolean> {
    try {
        await api.post("/auth/refresh", {});

// After (Correct path)
async refreshToken(): Promise<boolean> {
    try {
        await api.post("/auth/refresh-token", {});
```

### Why This Matters

Using the wrong path means the refresh token request would get a 404 error.

---

## Change #13: Fixed API Service Body Checking

### The Problem

The API service checked `if (body)` which would skip sending an empty object `{}` or the number `0`.

### What Copilot Changed

**File:** `src/services/api.ts`

```typescript
// Before (Skips empty objects)
if (body) {
  config.body = JSON.stringify(body);
}

// After (Only skips undefined)
if (body !== undefined) {
  config.body = JSON.stringify(body);
}
```

### Why This Matters

Some API calls need to send `{}` as the body. The old code would skip this, causing the request to fail.

---

## Change #14: Used Shared Types for Categories

### The Problem

The components defined their own Category and PaymentMethod types instead of using the shared ones from `types.ts`.

### What Copilot Changed

**File:** `src/components/AddExpenseForm.tsx`

```typescript
// Before (Duplicate types)
export type ExpenseCategory =
  | "Food"
  | "Groceries"
  | "Mobile_Bill"
  | "Travel"
  | "Shopping"
  | "Games"
  | "Subscription"
  | "EMI";

export type PaymentMethod = "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "UPI";

// After (Use shared types)
import type { newExpense, Category, PaymentMethod } from "../types";
```

### Why This Matters

Duplicate type definitions can get out of sync. If you add a new category, you'd have to update multiple files.

---

## Change #15: Fixed Package Scripts

### The Problem

The `start` script used `timeout /t 5` which only works on Windows.

### What Copilot Changed

**File:** `package.json`

```json
// Before (Windows only)
"start": "npm run docker:up && timeout /t 5 && npm run dev:full"

// After (Cross-platform)
"start": "npm run docker:up && npx wait-on tcp:3306 -t 30000 && npm run dev:full"
```

### Why This Matters

The app needs to wait for MySQL to be ready before starting. `wait-on` works on Windows, Mac, and Linux.

---

## Change #16: Fixed README Script Name

### The Problem

README mentioned `dev:all` but the actual script is called `dev:full`.

### What Copilot Changed

**File:** `README.md`

````markdown
// Before

```sh
npm run dev:all
```
````

// After

```sh
npm run dev:full
```

````

### Why This Matters
Users copying commands from the README would get "script not found" errors.

---

## Change #17: Removed Compiled JavaScript Files

### The Problem
Compiled `.js` files were committed to the repository.

### What Copilot Deleted

- `src/backend/src/app.js`
- `src/backend/src/index.js`
- `src/backend/src/config/auth.config.js`
- `src/backend/src/middlewares/auth.middleware.js`
- `src/backend/src/utils/response.utils.js`
- `src/backend/tsconfig.tsbuildinfo`

### Why This Matters
- Compiled files should be generated, not stored
- They can get out of sync with source files
- They bloat the repository size
- They cause merge conflicts

---

## Change #18: Updated .gitignore

### The Problem
Build artifacts weren't being ignored by Git.

### What Copilot Added

**File:** `.gitignore`

```gitignore
# TypeScript build artifacts
*.tsbuildinfo
tsconfig.tsbuildinfo

# Compiled JavaScript outputs in src directories
src/**/*.js
src/**/*.js.map
!src/**/*.config.js
!src/**/vite.config.js
!src/**/eslint.config.js
````

### Why This Matters

This prevents compiled files from being accidentally committed in the future.

---

## Change #19: Updated ESLint Config

### The Problem

ESLint was checking files in the `dist` folder (compiled output).

### What Copilot Changed

**File:** `eslint.config.js`

```javascript
// Before
globalIgnores(["dist"]);

// After
globalIgnores(["dist", "**/dist", "src/backend/dist"]);
```

### Why This Matters

Linting compiled code is a waste of time and can show false errors.

---

## Change #20: Created AuthenticatedRequest Type

### The Problem

Every time we accessed `req.userId`, we had to cast the request type manually.

### What Copilot Created

**File:** `src/backend/src/types/express.d.ts` (NEW FILE)

```typescript
import type { Request } from "express";

// Extend Express Request type to include userId from authentication middleware
export interface AuthenticatedRequest extends Request {
  userId: number;
}
```

### Why This Matters

Now we can import `AuthenticatedRequest` and use it everywhere, making the code cleaner and more type-safe.

---

## Change #21: Simplified getUserId Helper

### The Problem

The `getUserId` function was overly complex, checking many possible locations for the user ID.

### What Copilot Changed

**File:** `src/backend/src/controllers/expenses.controller.ts`

```typescript
// Before (Complex)
const getUserId = (req: Request): number | null => {
  const authReq = req as AuthenticatedRequest;
  const direct = authReq.userId;
  if (typeof direct === "number") return direct;
  if (typeof direct === "object" && typeof direct?.userId === "number")
    return direct.userId;
  const fromUser = authReq.user?.userId;
  if (typeof fromUser === "number") return fromUser;
  return null;
};

// After (Simple)
const getUserId = (req: Request): number | null => {
  const authReq = req as AuthenticatedRequest;
  return authReq.userId ?? null;
};
```

### Why This Matters

With proper typing, we know exactly where the userId is, so we don't need complex checks.

---

## Change #22: Fixed Send.unauthorized Parameter Order

### The Problem

`Send.unauthorized` was being called with parameters in the wrong order.

### What Copilot Changed

**File:** `src/backend/src/controllers/auth.controller.ts`

```typescript
// Before (Wrong order)
return Send.unauthorized(res, "User ID not found");
return Send.unauthorized(res, "Refresh token not found");
return Send.unauthorized(res, { message: "Invalid refresh token" });

// After (Correct order)
return Send.unauthorized(res, null, "User ID not found");
return Send.unauthorized(res, null, "Refresh token not found");
return Send.unauthorized(res, null, "Invalid refresh token");
```

### Why This Matters

The function signature is `Send.unauthorized(res, data, message)`. Passing the message as `data` would show the wrong thing to users.

---

## Change #23: Updated Deployment Guide

### The Problem

The deployment guide had unclear instructions about `VITE_API_URL`.

### What Copilot Changed

**File:** `DEPLOYMENT_GUIDE.md`

```markdown
// Before
| `VITE_API_URL` | `https://expense-tracker-api-xxxx.onrender.com` |

// After  
| `VITE_API_URL` | `https://expense-tracker-api-xxxx.onrender.com/api` |

**Important:** Replace with your actual Render URL from Step 2.4, **including the `/api` suffix**
```

### Why This Matters

Without the `/api` suffix, all API calls would go to the wrong path and fail.

---

## Summary

Copilot made **23 improvements** to your code:

| Category         | Count | Description                                       |
| ---------------- | ----- | ------------------------------------------------- |
| 🔐 Security      | 2     | Removed debug logs, separate token secrets        |
| 🐛 Bug Fixes     | 9     | Wrong paths, wrong parameters, missing returns    |
| 📝 Type Safety   | 4     | Proper TypeScript types, removed `any`            |
| 🧹 Cleanup       | 5     | Removed compiled files, unused code, console logs |
| 📚 Documentation | 2     | Fixed README and deployment guide                 |
| ⚙️ Configuration | 1     | Cross-platform npm scripts                        |

---

_This document was created on February 7, 2026 to track all automated improvements made by GitHub Copilot._
