# Cross-Origin Cookie Authentication Fix

## Issue Summary

**Problem:** Users unable to add, view, or manage expenses after logging in.

**Error Message:**

```
API Error [/expenses]: Error: unauthorized
POST https://expense-tracker-nf1e.onrender.com/api/expenses 401 (Unauthorized)
```

**Date Fixed:** February 13, 2026

**Branch:** `fix/cross-origin-cookie-authentication`

---

## Root Cause Analysis

### The Core Issue

The application uses **HTTP-only cookies** to store JWT authentication tokens (`accessToken` and `refreshToken`). When the frontend and backend are deployed on **different domains** (cross-origin), the browser's cookie security policies prevent cookies from being sent with requests.

### Technical Details

**Deployment Architecture:**

- Frontend: Deployed on one domain (e.g., Vercel: `your-app.vercel.app`)
- Backend: Deployed on another domain (e.g., Render: `expense-tracker-nf1e.onrender.com`)

**Original Cookie Configuration:**

```typescript
res.cookie("accessToken", accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 24 * 60 * 60 * 1000,
  sameSite: "lax", // ❌ Problem: Blocks cross-origin cookie transmission
});
```

**Why `sameSite: "lax"` Causes the Issue:**

The `SameSite` cookie attribute controls when cookies are sent with cross-site requests:

| SameSite Value | Behavior                                                                 |
| -------------- | ------------------------------------------------------------------------ |
| `strict`       | Cookies only sent for same-site requests                                 |
| `lax`          | Cookies sent for same-site requests AND top-level navigations (GET only) |
| `none`         | Cookies sent for all requests (cross-site included)                      |

With `sameSite: "lax"`:

1. User logs in → Backend sets `accessToken` cookie
2. User navigates to expenses page → Frontend makes API request to backend
3. **Browser blocks the cookie** because it's a cross-origin request (not a top-level navigation)
4. Backend receives request without token → Returns `401 Unauthorized`

---

## How to Reproduce

### Prerequisites

- Frontend deployed on Domain A (e.g., Vercel)
- Backend deployed on Domain B (e.g., Render)

### Steps to Reproduce

1. Navigate to the deployed frontend application
2. Register a new account or log in with existing credentials
3. After successful login, observe the user is redirected to the main expense tracker page
4. Attempt to view expenses or add a new expense
5. Open browser developer tools → Console tab
6. **Observe the error:**
   ```
   API Error [/expenses]: Error: unauthorized
   POST https://expense-tracker-nf1e.onrender.com/api/expenses 401 (Unauthorized)
   ```

### Why This Doesn't Happen in Local Development

In local development, both frontend (`localhost:5173`) and backend (`localhost:3000` or proxied through Vite) share the same origin (`localhost`), so `sameSite: "lax"` works fine.

---

## Solution

### The Fix

Change `sameSite` from `"lax"` to `"none"` for production environments. This tells the browser to include cookies with cross-origin requests.

**Requirements for `sameSite: "none"`:**

1. `secure: true` must be set (cookies only sent over HTTPS)
2. CORS must be configured with `credentials: true` (already configured)

### Code Changes

**File Modified:** `src/backend/src/controllers/auth.controller.ts`

#### 1. Login Method - Cookie Setting

**Before:**

```typescript
res.cookie("accessToken", accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 24 * 60 * 60 * 1000,
  sameSite: "lax",
});
res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 24 * 60 * 60 * 1000,
  sameSite: "lax",
});
```

**After:**

```typescript
const isProduction = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  maxAge: 24 * 60 * 60 * 1000,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
};
res.cookie("accessToken", accessToken, cookieOptions);
res.cookie("refreshToken", refreshToken, cookieOptions);
```

#### 2. Logout Method - Cookie Clearing

**Before:**

```typescript
res.clearCookie("accessToken");
res.clearCookie("refreshToken");
```

**After:**

```typescript
const isProduction = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
};
res.clearCookie("accessToken", cookieOptions);
res.clearCookie("refreshToken", cookieOptions);
```

#### 3. Refresh Token Method - Cookie Setting

**Before:**

```typescript
res.cookie("accessToken", newAccessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 15 * 60 * 1000,
  sameSite: "lax",
});
```

**After:**

```typescript
const isProduction = process.env.NODE_ENV === "production";
res.cookie("accessToken", newAccessToken, {
  httpOnly: true,
  secure: isProduction,
  maxAge: 15 * 60 * 1000,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
});
```

---

## Why This Fix Works

### Cookie Flow After Fix

1. **Login Request:**
   - User submits credentials
   - Backend validates and creates JWT tokens
   - Backend sets cookies with `sameSite: "none"` and `secure: true`
   - Browser stores cookies and marks them as available for cross-origin requests

2. **Subsequent API Requests:**
   - Frontend makes request to backend API
   - Frontend includes `credentials: "include"` in fetch options (already configured)
   - Browser includes cookies because `sameSite: "none"` allows cross-origin transmission
   - Backend receives cookies → Validates token → Returns data

3. **Logout:**
   - Frontend calls logout endpoint
   - Backend clears cookies with matching options (important for clearing to work properly)
   - Browser removes cookies

---

## Security Considerations

### Is `sameSite: "none"` Safe?

Yes, when used correctly with these protections (all already implemented in this codebase):

| Security Measure | Status | Description                                            |
| ---------------- | ------ | ------------------------------------------------------ |
| `secure: true`   | ✅     | Cookies only sent over HTTPS                           |
| `httpOnly: true` | ✅     | Cookies not accessible via JavaScript (XSS protection) |
| CORS allowlist   | ✅     | Only allowed origins can make requests                 |
| JWT expiration   | ✅     | Tokens expire and require refresh                      |

### CSRF Considerations

With `sameSite: "none"`, CSRF protection is primarily handled by:

1. **CORS configuration** - Only allowed origins can make requests with credentials
2. **JWT validation** - Even if a malicious site could send a request, it cannot forge a valid JWT
3. **HTTP-only cookies** - Malicious scripts cannot read the token values

---

## Testing the Fix

### Local Testing

1. Run backend with `NODE_ENV=production`:

   ```bash
   cd src/backend
   NODE_ENV=production npm run dev
   ```

2. Verify cookies have `SameSite=None; Secure` attributes in browser DevTools:
   - Open DevTools → Application → Cookies

### Production Testing

1. Deploy the fix to Render (backend)
2. Navigate to the frontend application
3. Log in with valid credentials
4. Verify expenses load correctly
5. Add a new expense and confirm it saves successfully

---

## Related Configuration

### CORS Configuration (No Changes Needed)

The existing CORS configuration already supports this fix:

```typescript
// src/backend/src/app.ts
this.app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true, // ✅ Required for cookies
  }),
);
```

### Frontend API Configuration (No Changes Needed)

The frontend already sends credentials with requests:

```typescript
// src/services/api.ts
const config: RequestInit = {
  ...restOptions,
  credentials: "include", // ✅ Required for cookies
  headers: {
    "Content-Type": "application/json",
    ...headers,
  },
};
```

---

## Environment Variables

Ensure the following are set in production:

| Variable       | Required | Description                               |
| -------------- | -------- | ----------------------------------------- |
| `NODE_ENV`     | Yes      | Must be `"production"` for secure cookies |
| `FRONTEND_URL` | Yes      | Your frontend domain for CORS allowlist   |

---

## Additional Notes

### Why Keep `sameSite: "lax"` for Development?

In local development, keeping `sameSite: "lax"` provides better security defaults and matches how most browsers handle same-origin requests. It also avoids issues with `localhost` not being considered "secure" by some browsers when using `sameSite: "none"`.

### Browser Compatibility

`sameSite: "none"` with `secure: true` is supported by all modern browsers:

- Chrome 80+
- Firefox 69+
- Safari 13+
- Edge 80+

---

## Commit Information

**Files Changed:**

- `src/backend/src/controllers/auth.controller.ts`

**Commit Message:**

```
fix: enable cross-origin cookie transmission for production deployments

- Change sameSite from 'lax' to 'none' in production for accessToken
  and refreshToken cookies
- Add matching cookie options to clearCookie calls for proper logout
- Maintain 'lax' for development environment compatibility
- Fixes 401 Unauthorized errors when frontend/backend on different domains
```
