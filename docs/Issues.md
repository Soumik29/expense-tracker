# Bug Report: Login Request failing (404 Not Found)

## 1. Description
The frontend application is failing to authenticate users because it is sending login requests to the Vite development server (port 5173) instead of the Express backend server (port 3000). Additionally, the request path is incorrectly prefixed with `/api/auth/`.

## 2. Steps to Reproduce
1. Start the backend server (e.g., `node src/backend/server.js`).
2. Start the frontend development server using `npm run dev`.
3. Navigate to the login page and enter valid credentials.
4. Open the Browser Developer Tools (F12) and check the "Network" tab.
5. Observe the failed POST request to `http://localhost:5173/api/auth/login`.

## 3. Technical Details
- **Error:** `POST http://localhost:5173/api/auth/login 404 (Not Found)`
- **Frontend Origin:** `http://localhost:5173`
- **Backend Origin:** `http://localhost:3000`
- **Backend Endpoint:** `/login`
- **Frontend File:** `src/components/Login.tsx` or `src/auth/Login.tsx`

## 4. Expected Result
The frontend should send a POST request to `http://localhost:3000/login` with the username and password in the body. The backend should then return a JWT token and set a cookie.

## 5. Actual Result
The request is being directed to the Vite server on port 5173. Because Vite does not have a route defined for `/api/auth/login`, it returns a 404 error.

## 6. Proposed Solutions

### Option 1: Configure Vite Proxy (Recommended)
Update `vite.config.ts` to forward API requests to the backend server:
```typescript
// vite.config.ts
export default defineConfig({
  // ... other config
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```
### Option 2: Fix Fetch URL in Frontend
Ensure the fetch call in src/components/Login.tsx uses the correct backend URL:
```typescript
const res = await fetch("http://localhost:3000/login", { 
  method: "POST",
  // ... rest of config
});
```