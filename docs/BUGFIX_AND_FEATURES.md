# Recent Bug Fixes and Features

**Date:** February 6, 2026

---

## Bug Fix: Login Failing Due to Environment Variable Loading Order

### The Problem

Login was failing with an error related to JWT signing. The secrets (`AUTH_SECRET`, `AUTH_REFRESH_SECRET`) were `undefined` when signing tokens.

### Root Cause

The environment variables were being captured at **module load time**, before `dotenv.config()` had a chance to run.

**How ES Modules Load:**

1. `index.ts` starts running
2. `import App from "./app.js"` - This triggers loading of App and ALL its dependencies
3. App imports routes → routes import controllers → controllers import `authConfig`
4. At this point, `authConfig.secret` reads `process.env.AUTH_SECRET` which is **undefined**
5. THEN `dotenv.config()` runs (too late!)
6. The secrets in `auth.controller.ts` are already captured as `undefined`

### The Problematic Code

**Before (auth.controller.ts):**

```typescript
import authConfig from "@config/auth.config.js";

// ❌ These run at MODULE LOAD TIME (before dotenv.config)
const sec = authConfig.secret as string; // undefined!
const refreshSec = authConfig.refreshToken as string; // undefined!

class AuthController {
  static login = async (req: Request, res: Response) => {
    // ... uses sec and refreshSec (both undefined)
  };
}
```

**Before (auth.middleware.ts):**

```typescript
import authConfig from "@config/auth.config.js";

// ❌ Runs at MODULE LOAD TIME
const secret: string = authConfig.secret as string;  // undefined!

class AuthMiddleware {
  static authenticateUser = (...) => {
    // ... uses secret (undefined)
  }
}
```

### The Fix

Move secret retrieval **inside the functions** so they run at **runtime** (after dotenv has loaded).

**After (auth.controller.ts):**

```typescript
import authConfig from "@config/auth.config.js";

const { sign } = jwt;

// ✅ Helper function that reads secrets at RUNTIME
const getSecrets = () => ({
  access: authConfig.secret as string,
  refresh: authConfig.refreshToken as string,
});

class AuthController {
  static login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { access: sec, refresh: refreshSec } = getSecrets(); // ✅ Called at runtime
    // ... rest of login logic
  };

  static refreshToken = async (req: Request, res: Response) => {
    const { access: sec } = getSecrets(); // ✅ Called at runtime
    // ... rest of refresh logic
  };
}
```

**After (auth.middleware.ts):**

```typescript
import authConfig from "@config/auth.config.js";

class AuthMiddleware {
  static authenticateUser = (req, res, next) => {
    const token = req.cookies.accessToken;
    // ✅ Read secret inside the function (at runtime)
    const secret = authConfig.secret as string;
    const decodedToken = verify(token, secret);
    // ...
  };
}
```

### Files Modified

| File                                             | Change                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `src/backend/src/controllers/auth.controller.ts` | Added `getSecrets()` helper, moved secret reading into `login()` and `refreshToken()` |
| `src/backend/src/middlewares/auth.middleware.ts` | Moved `const secret` inside `authenticateUser()` function                             |

### Key Takeaway

In ES Modules, code at the top level of a module runs **during import**, not when functions are called. Environment variables loaded via `dotenv.config()` must be read **inside functions** that run after the main module has initialized.

---

## New Feature: Password Visibility Toggle

### Overview

Added an eye icon button to all password fields that allows users to toggle between showing and hiding their password. This improves UX by letting users verify what they typed.

### Implementation

#### New Component: PasswordInput

**File:** `src/components/PasswordInput.tsx`

A reusable password input component with built-in show/hide toggle.

```tsx
import { useState } from "react";

interface PasswordInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const PasswordInput = ({
  id,
  name,
  value,
  onChange,
  placeholder = "••••••••",
  required = false,
  className = "",
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const baseClassName =
    "block w-full rounded-xl bg-white border border-zinc-200 px-4 py-3 pr-12 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all";

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={className || baseClassName}
      />
      <button
        type="button"
        onClick={toggleVisibility}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 focus:outline-none focus:text-zinc-600 transition-colors"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
};
```

#### How It Works

1. **State Management:** Uses `useState` to track visibility (`showPassword`)
2. **Input Type Toggle:** Switches between `type="password"` and `type="text"`
3. **Icon Toggle:** Shows eye icon when hidden, eye-off icon when visible
4. **Accessibility:** Includes `aria-label` for screen readers
5. **Styling:** Positioned absolutely inside a relative container

#### Icon Design

**Eye Icon (Password Hidden):**

```tsx
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={1.5}
    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
  />
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={1.5}
    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
  />
</svg>
```

**Eye-Off Icon (Password Visible):**

```tsx
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={1.5}
    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
  />
</svg>
```

### Usage Examples

#### Login Page

```tsx
import PasswordInput from "../components/PasswordInput";

const Login = () => {
  const [password, setPassword] = useState("");

  return (
    <form>
      <label>Password</label>
      <PasswordInput
        id="password"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
      />
    </form>
  );
};
```

#### Register Page (Multiple Password Fields)

```tsx
import PasswordInput from "../components/PasswordInput";

const Register = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <form>
      <div>
        <label>Password</label>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
          required
        />
      </div>

      <div>
        <label>Confirm Password</label>
        <PasswordInput
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>
    </form>
  );
};
```

### Files Modified

| File                               | Change                                                    |
| ---------------------------------- | --------------------------------------------------------- |
| `src/components/PasswordInput.tsx` | **NEW** - Reusable password input component               |
| `src/auth/Login.tsx`               | Replaced `<input type="password">` with `<PasswordInput>` |
| `src/auth/Register.tsx`            | Replaced both password inputs with `<PasswordInput>`      |

### Component Props

| Prop          | Type       | Default          | Description             |
| ------------- | ---------- | ---------------- | ----------------------- |
| `id`          | `string`   | -                | HTML id attribute       |
| `name`        | `string`   | -                | HTML name attribute     |
| `value`       | `string`   | **required**     | Controlled input value  |
| `onChange`    | `function` | **required**     | Change handler          |
| `placeholder` | `string`   | `"••••••••"`     | Placeholder text        |
| `required`    | `boolean`  | `false`          | HTML required attribute |
| `className`   | `string`   | (default styles) | Custom CSS classes      |

### Styling Details

- **Container:** `relative` positioning for absolute button placement
- **Input:** Extra `pr-12` padding-right to prevent text overlap with icon
- **Button:**
  - `absolute right-3 top-1/2 -translate-y-1/2` - Centers vertically on right side
  - `text-zinc-400 hover:text-zinc-600` - Subtle gray with hover state
  - `transition-colors` - Smooth color transitions
- **Icon:** `w-5 h-5` (20x20px) with `strokeWidth={1.5}` for clean lines

### Accessibility Features

1. **Button Type:** `type="button"` prevents form submission on click
2. **Aria Label:** Dynamic label describes current action
3. **Focus States:** Visible focus outline on keyboard navigation
4. **Touch Targets:** Button has sufficient padding for touch devices

---

## New Feature: Dark/Light Theme Toggle

### Overview

Added a complete dark mode implementation with a toggle button. The theme:

- Persists in localStorage
- Respects system preference on first visit
- Smoothly transitions between modes
- Works across all pages (Login, Register, Dashboard)

### Color Design Philosophy

**Light Mode:** Clean, minimal zinc palette

- Background: `zinc-50` (light gray)
- Cards: `white` with `zinc-200` borders
- Text: `zinc-900` (near black)
- Accents: `zinc-900` buttons

**Dark Mode:** Elegant, easy on the eyes

- Background: `zinc-900` (dark charcoal)
- Cards: `zinc-800` with `zinc-700` borders
- Text: `zinc-100` (off white)
- Accents: `zinc-100` buttons (inverted)

### Implementation Details

#### 1. Theme Context

**File:** `src/context/ThemeContext.tsx`

```tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_KEY = "expense-tracker-theme";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(THEME_KEY) as Theme | null;
      if (stored === "light" || stored === "dark") {
        return stored;
      }
      // Check system preference
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
```

#### 2. Theme Toggle Component

**File:** `src/components/ThemeToggle.tsx`

```tsx
import { useTheme } from "../context/ThemeContext";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800
                 hover:bg-zinc-200 dark:hover:bg-zinc-700
                 border border-zinc-200 dark:border-zinc-700
                 flex items-center justify-center transition-all duration-200"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Sun Icon - visible in dark mode */}
      <svg className={`w-5 h-5 text-amber-500 absolute transition-all duration-300
        ${isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-0"}`}
        ...
      />

      {/* Moon Icon - visible in light mode */}
      <svg className={`w-5 h-5 text-zinc-600 absolute transition-all duration-300
        ${isDark ? "opacity-0 -rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"}`}
        ...
      />
    </button>
  );
};
```

#### 3. Tailwind Configuration

**File:** `tailwind.config.js`

```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",  // 👈 Enable class-based dark mode
  theme: { ... },
  plugins: [],
}
```

#### 4. Provider Setup

**File:** `src/main.tsx`

```tsx
import { ThemeProvider } from "./context/ThemeContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        {" "}
        {/* 👈 Wrap the entire app */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
```

### Dark Mode Classes Pattern

Every element needs both light and dark variants:

```tsx
// Background
className = "bg-white dark:bg-zinc-800";

// Text
className = "text-zinc-900 dark:text-zinc-100";

// Borders
className = "border-zinc-200 dark:border-zinc-700";

// Interactive elements (buttons)
className = "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900";

// Focus rings
className = "focus:ring-zinc-900 dark:focus:ring-zinc-100";

// Smooth transitions
className = "transition-colors duration-200";
```

### Files Modified

| File                                | Change                                    |
| ----------------------------------- | ----------------------------------------- |
| `src/context/ThemeContext.tsx`      | **NEW** - Theme context and provider      |
| `src/components/ThemeToggle.tsx`    | **NEW** - Toggle button component         |
| `tailwind.config.js`                | Added `darkMode: "class"`                 |
| `src/main.tsx`                      | Wrapped app with ThemeProvider            |
| `src/components/App.tsx`            | Added dark mode to loading spinner        |
| `src/components/ExpenseTracker.tsx` | Full dark mode support + toggle in header |
| `src/auth/Login.tsx`                | Full dark mode support + toggle in corner |
| `src/auth/Register.tsx`             | Full dark mode support + toggle in corner |
| `src/components/AddExpenseForm.tsx` | Dark mode for form elements               |
| `src/components/SearchFilter.tsx`   | Dark mode for filter UI                   |
| `src/components/PasswordInput.tsx`  | Dark mode for input styling               |
| `src/components/LoadingButton.tsx`  | Dark mode for button styling              |

### Color Palette Reference

| Element             | Light Mode          | Dark Mode  |
| ------------------- | ------------------- | ---------- |
| Page Background     | `zinc-50`           | `zinc-900` |
| Card Background     | `white`             | `zinc-800` |
| Card Border         | `zinc-200`          | `zinc-700` |
| Input Background    | `white` / `zinc-50` | `zinc-900` |
| Input Border        | `zinc-200`          | `zinc-700` |
| Primary Text        | `zinc-900`          | `zinc-100` |
| Secondary Text      | `zinc-500`          | `zinc-400` |
| Label Text          | `zinc-700`          | `zinc-300` |
| Primary Button BG   | `zinc-900`          | `zinc-100` |
| Primary Button Text | `white`             | `zinc-900` |
| Focus Ring          | `zinc-900`          | `zinc-100` |

### Icon Animation Details

The theme toggle uses rotating/scaling icons for a smooth transition:

```css
/* Light → Dark transition */
Sun icon: opacity-0 rotate-90 scale-0 → opacity-100 rotate-0 scale-100
Moon icon: opacity-100 rotate-0 scale-100 → opacity-0 -rotate-90 scale-0

/* Duration: 300ms with transition-all */
```

### System Preference Detection

The theme respects the user's OS preference on first visit:

```typescript
// Check system preference
if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  return "dark";
}
```

It also listens for system theme changes:

```typescript
useEffect(() => {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleChange = (e: MediaQueryListEvent) => {
    const stored = localStorage.getItem(THEME_KEY);
    if (!stored) {
      setThemeState(e.matches ? "dark" : "light");
    }
  };

  mediaQuery.addEventListener("change", handleChange);
  return () => mediaQuery.removeEventListener("change", handleChange);
}, []);
```

---

## Summary of Changes

| Category   | Item                    | Description                                  |
| ---------- | ----------------------- | -------------------------------------------- |
| 🐛 Bug Fix | Environment Variables   | Secrets now read at runtime, not module load |
| ✨ Feature | PasswordInput Component | Reusable component with eye icon toggle      |
| ✨ Feature | Dark Mode               | Full dark/light theme with toggle button     |
| 🔧 Update  | Login.tsx               | Uses PasswordInput + dark mode               |
| 🔧 Update  | Register.tsx            | Uses PasswordInput + dark mode               |
| 🔧 Update  | ExpenseTracker.tsx      | Dark mode + theme toggle in header           |
| 🔧 Update  | All form components     | Dark mode styling                            |

---

_This document was created on February 6, 2026_
