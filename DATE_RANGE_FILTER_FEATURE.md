# Date Range Filter Feature Documentation

**Date:** February 6, 2026  
**Feature:** Enhanced Date Range Filter with Presets  
**Status:** ✅ Implemented

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Files Created/Modified](#files-createdmodified)
5. [Usage Guide](#usage-guide)
6. [Step-by-Step Implementation Tutorial](#step-by-step-implementation-tutorial)
7. [API Reference](#api-reference)
8. [Customization Guide](#customization-guide)

---

## Overview

This feature enhances the expense tracker with a user-friendly date range filter that includes:

- **Quick preset buttons** (Today, Last 7 Days, Last 30 Days, etc.)
- **All preset options** in a dropdown panel
- **Custom date picker** for specific date ranges
- **Smart detection** of which preset matches selected dates

### Available Presets

| Preset       | Description                         |
| ------------ | ----------------------------------- |
| Today        | Current day only                    |
| Yesterday    | Previous day only                   |
| Last 7 Days  | Past week including today           |
| Last 30 Days | Past month including today          |
| This Week    | Monday to Sunday of current week    |
| Last Week    | Monday to Sunday of previous week   |
| This Month   | First to last day of current month  |
| Last Month   | First to last day of previous month |
| This Year    | January 1st to today                |
| Custom       | User-defined start and end dates    |

---

## Features

- 📅 **One-Click Presets** - Apply common date ranges instantly
- 🎯 **Smart Detection** - Auto-highlights matching preset when dates change
- 📆 **Custom Range** - Full flexibility with date pickers
- 🔄 **Real-time Updates** - Filter applies immediately
- 💡 **Clear Display** - Shows selected range in human-readable format
- 📱 **Dropdown UI** - Compact button that expands to full panel

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SearchFilter.tsx                         │
│                           │                                  │
│                           ▼                                  │
│                  ┌─────────────────┐                         │
│                  │ DateRangeFilter │ ◄── UI Component        │
│                  │    Component    │                         │
│                  └────────┬────────┘                         │
│                           │                                  │
│                           ▼                                  │
│                  ┌─────────────────┐                         │
│                  │  useDateRange   │ ◄── Logic Hook          │
│                  │      Hook       │                         │
│                  └────────┬────────┘                         │
│                           │                                  │
│                           ▼                                  │
│                  ┌─────────────────┐                         │
│                  │   useFilter     │ ◄── Applies to expenses │
│                  │      Hook       │                         │
│                  └─────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. User clicks preset or enters custom dates in `DateRangeFilter`
2. `useDateRange` calculates the actual date strings
3. `onDateChange` callback passes dates to `useFilter`
4. `useFilter` filters expenses based on date range
5. Filtered results update in real-time

---

## Files Created/Modified

### New Files

| File                                 | Description                                          |
| ------------------------------------ | ---------------------------------------------------- |
| `src/utils/useDateRange.tsx`         | Hook with date utilities and preset definitions      |
| `src/components/DateRangeFilter.tsx` | Dropdown UI component with presets and custom picker |

### Modified Files

| File                              | Changes                                    |
| --------------------------------- | ------------------------------------------ |
| `src/components/SearchFilter.tsx` | Added DateRangeFilter to quick filters row |

---

## Usage Guide

### Quick Select (One Click)

1. Click the **calendar button** (shows "All Time" by default)
2. A dropdown panel opens
3. Click any **Quick Select** button:
   - Today
   - Last 7 Days
   - Last 30 Days
   - This Month
4. Panel closes and filter applies immediately

### All Presets

1. Open the dropdown
2. Scroll to **All Presets** grid
3. Choose from 10 preset options
4. Click to apply

### Custom Date Range

1. Open the dropdown
2. Click **"📅 Custom Date Range"**
3. Date pickers appear
4. Set **Start Date** and **End Date**
5. Click **"Apply Range"**

### Clear Filter

- Click **"Clear"** in the dropdown header
- Or click **"Clear all"** in the main SearchFilter header

---

## Step-by-Step Implementation Tutorial

This section explains exactly how I built this feature from scratch.

### Step 1: Plan the Architecture

Before coding, I identified what we need:

1. **Date utility functions** - For calculating week/month boundaries
2. **Preset definitions** - Array of preset objects with label and calculation
3. **A hook** - To encapsulate all date logic
4. **A component** - For the dropdown UI

**Key decision:** Separate the logic (hook) from the UI (component) for reusability.

### Step 2: Create Date Utility Functions

I started with helper functions in `useDateRange.tsx`:

```typescript
// Format date as YYYY-MM-DD for HTML date inputs
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Get start of day (00:00:00.000)
const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Get end of day (23:59:59.999)
const endOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};
```

**Why these helpers?**

- `formatDateForInput`: HTML `<input type="date">` requires `YYYY-MM-DD` format
- `startOfDay` / `endOfDay`: Ensure we include the entire day when filtering

### Step 3: Add Week and Month Helpers

```typescript
// Get start of week (Monday)
const startOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  return startOfDay(d);
};

// Get end of week (Sunday)
const endOfWeek = (date: Date): Date => {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  return endOfDay(d);
};

// Get start of month (1st day)
const startOfMonth = (date: Date): Date => {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return startOfDay(d);
};

// Get end of month (last day)
const endOfMonth = (date: Date): Date => {
  // Day 0 of next month = last day of current month
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return endOfDay(d);
};
```

**Tricky parts:**

- `startOfWeek`: JavaScript's `getDay()` returns 0 for Sunday, so we adjust
- `endOfMonth`: Using day `0` of the next month gives us the last day

### Step 4: Define Preset Types and Options

```typescript
export type DatePreset =
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "custom"
  | "all";

export interface DatePresetOption {
  id: DatePreset;
  label: string;
  getRange: () => { start: Date; end: Date };
}
```

Then define each preset:

```typescript
export const datePresets: DatePresetOption[] = [
  {
    id: "today",
    label: "Today",
    getRange: () => {
      const today = new Date();
      return { start: startOfDay(today), end: endOfDay(today) };
    },
  },
  {
    id: "last7days",
    label: "Last 7 Days",
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6); // Include today = 7 days
      return { start: startOfDay(start), end: endOfDay(end) };
    },
  },
  // ... more presets
];
```

**Why functions for getRange?** Each time we call `getRange()`, it calculates fresh dates based on "now". This ensures presets always reflect the current date.

### Step 5: Create the useDateRange Hook

```typescript
interface UseDateRangeOptions {
  onRangeChange?: (start: string, end: string) => void;
}

const useDateRange = (options: UseDateRangeOptions = {}) => {
  const { onRangeChange } = options;

  // Apply a preset
  const applyPreset = useCallback(
    (presetId: DatePreset): DateRangeValue => {
      if (presetId === "all") {
        onRangeChange?.("", "");
        return { start: "", end: "", preset: "all" };
      }

      const preset = datePresets.find((p) => p.id === presetId);
      if (!preset) return { start: "", end: "", preset: "all" };

      const { start, end } = preset.getRange();
      const startStr = formatDateForInput(start);
      const endStr = formatDateForInput(end);

      onRangeChange?.(startStr, endStr);
      return { start: startStr, end: endStr, preset: presetId };
    },
    [onRangeChange],
  );

  // Get human-readable label
  const getRangeLabel = useCallback((value: DateRangeValue): string => {
    if (value.preset !== "custom") {
      const preset = datePresets.find((p) => p.id === value.preset);
      if (preset) return preset.label;
    }

    // Format custom range: "Jan 15, 2026 - Feb 6, 2026"
    // ... formatting code
  }, []);

  // Detect which preset matches given dates
  const detectPreset = useCallback((start: string, end: string): DatePreset => {
    if (!start && !end) return "all";

    for (const preset of datePresets) {
      const range = preset.getRange();
      if (
        formatDateForInput(range.start) === start &&
        formatDateForInput(range.end) === end
      ) {
        return preset.id;
      }
    }

    return "custom";
  }, []);

  return {
    datePresets,
    applyPreset,
    getRangeLabel,
    detectPreset,
    // ... more
  };
};
```

**Key hook features:**

- `applyPreset`: Calculates dates and calls the parent's callback
- `getRangeLabel`: Shows "Last 7 Days" or "Jan 15 - Feb 6" for custom
- `detectPreset`: Reverse lookup - given dates, which preset matches?

### Step 6: Create the DateRangeFilter Component

#### 6.1 Define Props

```typescript
interface DateRangeFilterProps {
  startDate: string; // Current start date
  endDate: string; // Current end date
  onDateChange: (start: string, end: string) => void; // Callback
}
```

#### 6.2 Set Up State

```typescript
const DateRangeFilter = ({ startDate, endDate, onDateChange }) => {
  const [isOpen, setIsOpen] = useState(false);       // Dropdown visibility
  const [showCustom, setShowCustom] = useState(false);  // Custom picker visible
  const [localRange, setLocalRange] = useState({
    start: startDate,
    end: endDate,
    preset: "all",
  });

  const { datePresets, applyPreset, getRangeLabel, detectPreset } =
    useDateRange({ onRangeChange: onDateChange });
```

#### 6.3 Sync with External Props

When parent changes dates, update local state:

```typescript
useEffect(() => {
  const preset = detectPreset(startDate, endDate);
  setLocalRange({ start: startDate, end: endDate, preset });
  setShowCustom(preset === "custom");
}, [startDate, endDate, detectPreset]);
```

#### 6.4 Build the Trigger Button

```tsx
<button
  onClick={() => setIsOpen(!isOpen)}
  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${
    hasActiveFilter
      ? "bg-zinc-900 text-white" // Active = dark
      : "bg-zinc-50 text-zinc-700 border" // Inactive = light
  }`}
>
  <CalendarDaysIcon className="w-4 h-4" />
  <span>{getRangeLabel(localRange)}</span>
  <ChevronDownIcon className={`w-4 h-4 ${isOpen ? "rotate-180" : ""}`} />
</button>
```

**Visual feedback:** Button turns dark when a date filter is active.

#### 6.5 Build the Dropdown Panel

```tsx
{isOpen && (
  <>
    {/* Backdrop to close on outside click */}
    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

    {/* Panel */}
    <div className="absolute top-full left-0 mt-2 z-20 bg-white rounded-2xl border shadow-lg p-4">
      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2">
        {quickPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset.id)}
            className={preset === localRange.preset ? "bg-zinc-900 text-white" : "bg-zinc-100"}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* All Presets Grid */}
      <div className="grid grid-cols-2 gap-2">
        {datePresets.map((preset) => (
          <button key={preset.id} onClick={() => handlePresetClick(preset.id)}>
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Date Picker */}
      {showCustom && (
        <div>
          <input type="date" value={localRange.start} onChange={...} />
          <input type="date" value={localRange.end} onChange={...} />
        </div>
      )}
    </div>
  </>
)}
```

### Step 7: Integrate into SearchFilter

#### 7.1 Add Import

```typescript
import DateRangeFilter from "./DateRangeFilter";
```

#### 7.2 Add to Quick Filters Row

```tsx
<div className="flex flex-wrap gap-3">
  {/* Category dropdown */}
  {/* Payment method dropdown */}
  {/* Recurring dropdown */}

  {/* Date Range Filter - NEW */}
  <DateRangeFilter
    startDate={filters.dateRange.start}
    endDate={filters.dateRange.end}
    onDateChange={setDateRange}
  />

  {/* More Filters button */}
</div>
```

#### 7.3 Remove Old Date Inputs from Advanced Filters

The date range is now in the main row, so remove it from the "Advanced Filters" section. Keep only the Amount Range there.

### Step 8: Test the Integration

**Test checklist:**

1. ✅ Click "Last 7 Days" → Shows expenses from past week
2. ✅ Click "This Month" → Shows expenses from current month
3. ✅ Button label updates to show selected preset
4. ✅ Button turns dark when filter is active
5. ✅ Click "Custom" → Date pickers appear
6. ✅ Set custom dates → Filter applies
7. ✅ Click "Clear" → Resets to "All Time"
8. ✅ "Clear all" in main header also clears date filter
9. ✅ Result count updates correctly
10. ✅ Chart reflects filtered date range

---

## API Reference

### useDateRange Hook

```typescript
const {
  datePresets, // Array of all preset options
  quickPresets, // Subset: today, last7days, last30days, thisMonth
  applyPreset, // (presetId: DatePreset) => DateRangeValue
  applyCustomRange, // (start: string, end: string) => DateRangeValue
  getRangeLabel, // (value: DateRangeValue) => string
  detectPreset, // (start: string, end: string) => DatePreset
  formatDateForInput, // (date: Date) => string (YYYY-MM-DD)
} = useDateRange({ onRangeChange });
```

### DateRangeFilter Props

```typescript
interface DateRangeFilterProps {
  startDate: string; // Current start date (YYYY-MM-DD or "")
  endDate: string; // Current end date (YYYY-MM-DD or "")
  onDateChange: (start: string, end: string) => void;
}
```

### DatePresetOption Interface

```typescript
interface DatePresetOption {
  id: DatePreset; // Unique identifier
  label: string; // Display text
  getRange: () => { start: Date; end: Date }; // Calculation function
}
```

---

## Customization Guide

### Adding a New Preset

1. Add to `DatePreset` type:

```typescript
export type DatePreset =
  | "today"
  | // ... existing
  | "lastQuarter"  // NEW
  | "custom"
  | "all";
```

2. Add to `datePresets` array:

```typescript
{
  id: "lastQuarter",
  label: "Last Quarter",
  getRange: () => {
    const today = new Date();
    const currentQuarter = Math.floor(today.getMonth() / 3);
    const lastQuarterStart = new Date(today.getFullYear(), (currentQuarter - 1) * 3, 1);
    const lastQuarterEnd = new Date(today.getFullYear(), currentQuarter * 3, 0);
    return { start: startOfDay(lastQuarterStart), end: endOfDay(lastQuarterEnd) };
  },
},
```

### Changing Quick Presets

Edit the `quickPresets` filter in `useDateRange`:

```typescript
const quickPresets = useMemo(
  () =>
    datePresets.filter((p) =>
      ["today", "last7days", "last30days", "thisMonth", "lastQuarter"].includes(
        p.id,
      ),
    ),
  [],
);
```

### Styling the Component

Key Tailwind classes:

| Element                    | Classes                                           |
| -------------------------- | ------------------------------------------------- |
| Trigger button (active)    | `bg-zinc-900 text-white`                          |
| Trigger button (inactive)  | `bg-zinc-50 text-zinc-700 border border-zinc-200` |
| Dropdown panel             | `bg-white rounded-2xl border shadow-lg`           |
| Preset button (selected)   | `bg-zinc-900 text-white`                          |
| Preset button (unselected) | `bg-zinc-100 text-zinc-600`                       |

### Using in a Different Context

The hook and component are reusable! Example:

```tsx
// In a reports page
import DateRangeFilter from "../components/DateRangeFilter";

const Reports = () => {
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  return (
    <DateRangeFilter
      startDate={dateRange.start}
      endDate={dateRange.end}
      onDateChange={(start, end) => setDateRange({ start, end })}
    />
  );
};
```

---

## Performance Notes

1. **Presets recalculate on each call** - `getRange()` always returns fresh dates based on "now"
2. **Memoized quick presets** - `quickPresets` array is stable via `useMemo`
3. **Callback stability** - All functions use `useCallback` for referential equality
4. **Local state syncs with props** - `useEffect` ensures component stays in sync

---

## Future Enhancements

- [ ] Add keyboard navigation in dropdown
- [ ] Add fiscal year presets
- [ ] Add comparison mode (e.g., "vs Last Month")
- [ ] Persist last used preset to localStorage
- [ ] Add animation to dropdown open/close

---

**Happy date filtering! 📅**
