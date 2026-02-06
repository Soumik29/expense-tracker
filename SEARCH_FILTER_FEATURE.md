# Search & Filter Feature Documentation

**Date:** February 6, 2026  
**Feature:** Search and Filter for Expenses  
**Status:** ✅ Implemented

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Files Created/Modified](#files-createdmodified)
5. [Implementation Details](#implementation-details)
6. [Usage Tutorial](#usage-tutorial)
7. [API Reference](#api-reference)
8. [Customization Guide](#customization-guide)

---

## Overview

This feature adds powerful search and filtering capabilities to the Expense Tracker, allowing users to quickly find specific expenses based on multiple criteria.

### Filter Capabilities

| Filter Type          | Description                                             |
| -------------------- | ------------------------------------------------------- |
| **Text Search**      | Search by description or category name                  |
| **Category**         | Filter by expense category (Food, Groceries, etc.)      |
| **Payment Method**   | Filter by payment method (Cash, UPI, Credit Card, etc.) |
| **Date Range**       | Filter expenses within a specific date range            |
| **Amount Range**     | Filter expenses by minimum/maximum amount               |
| **Recurring Status** | Filter by recurring or one-time expenses                |

---

## Features

- 🔍 **Real-time Search** - Instant results as you type
- 🎯 **Multi-criteria Filtering** - Combine multiple filters
- 🔄 **Clear All Filters** - One-click reset
- 📊 **Result Count** - Shows filtered vs total expenses
- 💾 **Memoized Performance** - Optimized re-renders
- 📱 **Responsive Design** - Works on all screen sizes

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ExpenseTracker.tsx                        │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────────┐   │
│  │  useCrud()  │──▶│  useFilter() │──▶│  useAccordion() │   │
│  │  (raw data) │   │  (filtered)  │   │   (grouped)     │   │
│  └─────────────┘   └──────────────┘   └─────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│                   ┌───────────────┐                          │
│                   │ SearchFilter  │                          │
│                   │  Component    │                          │
│                   └───────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. `useCrud()` fetches raw expenses from the API
2. `useFilter()` applies filters to the raw expenses
3. `useAccordion()` groups the filtered expenses by day/week/month
4. `ExpenseCard` displays the grouped & filtered expenses

---

## Files Created/Modified

### New Files

| File                              | Description                                 |
| --------------------------------- | ------------------------------------------- |
| `src/utils/useFilter.tsx`         | Custom hook containing all filter logic     |
| `src/components/SearchFilter.tsx` | UI component for search and filter controls |

### Modified Files

| File                                | Changes                                           |
| ----------------------------------- | ------------------------------------------------- |
| `src/components/ExpenseTracker.tsx` | Integrated filter hook and SearchFilter component |

---

## Implementation Details

### 1. useFilter Hook (`src/utils/useFilter.tsx`)

The hook manages filter state and provides memoized filtered results.

#### Filter State Interface

```typescript
interface FilterState {
  searchQuery: string;
  category: Category | "all";
  paymentMethod: PaymentMethod | "all";
  dateRange: {
    start: string;
    end: string;
  };
  amountRange: {
    min: number | "";
    max: number | "";
  };
  isRecurring: boolean | "all";
}
```

#### Key Implementation Details

**Memoized Filtering:**

```typescript
const filteredExpenses = useMemo(() => {
  return expenses.filter((expense) => {
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesDescription = expense.description
        ?.toLowerCase()
        .includes(query);
      const matchesCategory = expense.category.toLowerCase().includes(query);
      if (!matchesDescription && !matchesCategory) return false;
    }

    // Category filter
    if (filters.category !== "all" && expense.category !== filters.category) {
      return false;
    }

    // ... more filters
    return true;
  });
}, [expenses, filters]);
```

**Callback Actions (prevent unnecessary re-renders):**

```typescript
const setSearchQuery = useCallback((query: string) => {
  setFilters((prev) => ({ ...prev, searchQuery: query }));
}, []);
```

### 2. SearchFilter Component (`src/components/SearchFilter.tsx`)

A responsive UI component with:

- Search input with clear button
- Dropdown selects for category, payment method, and recurring status
- Expandable "Advanced Filters" section for date and amount ranges
- Result count display when filters are active

### 3. Integration in ExpenseTracker

```typescript
// Get raw expenses
const { expense, addExpense, deleteExpense, updateExpenses } = useCrud();

// Apply filters
const { filters, filteredExpenses, ...filterActions } = useFilter(expense);

// Group filtered results
const { groupedExpenses, ... } = useAccordion(filteredExpenses);

// Charts also use filtered data
<ExpenseChart expense={filteredExpenses} />
```

---

## Usage Tutorial

### Basic Search

1. Type in the search box to find expenses by description or category
2. Results update instantly as you type
3. Click the ✕ button to clear the search

![Search Demo](docs/search-demo.gif)

### Quick Filters

Use the dropdown menus to filter by:

| Dropdown       | Options                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------- |
| Category       | All Categories, Food, Groceries, Mobile Bill, Travel, Shopping, Games, Subscription, EMI |
| Payment Method | All Payment Methods, Cash, Credit Card, Debit Card, UPI                                  |
| Type           | All Types, Recurring Only, One-time Only                                                 |

### Advanced Filters

Click **"More Filters"** to reveal:

#### Date Range

- Set a **start date** to show expenses from that date onwards
- Set an **end date** to show expenses up to that date
- Use both for a specific date range

#### Amount Range

- Set a **minimum amount** to filter out smaller expenses
- Set a **maximum amount** to filter out larger expenses
- Use both for a specific amount range

### Combining Filters

Filters work together! For example:

- Search: "coffee"
- Category: "Food"
- Date Range: Last 30 days
- Amount: ₹50 - ₹500

This shows all Food expenses containing "coffee" in the last 30 days between ₹50-₹500.

### Clearing Filters

- Click **"Clear all"** in the header to reset all filters at once
- Or clear individual filters by selecting "All..." in dropdowns

### Understanding Results

When filters are active, you'll see:

> Showing **5** of **42** expenses

This helps you understand how many expenses match your criteria.

---

## API Reference

### useFilter Hook

```typescript
const {
  filters, // Current filter state
  filteredExpenses, // Filtered expense array
  setSearchQuery, // (query: string) => void
  setCategory, // (category: Category | "all") => void
  setPaymentMethod, // (method: PaymentMethod | "all") => void
  setDateRange, // (start: string, end: string) => void
  setAmountRange, // (min: number | "", max: number | "") => void
  setIsRecurring, // (isRecurring: boolean | "all") => void
  resetFilters, // () => void
  hasActiveFilters, // boolean
} = useFilter(expenses);
```

### SearchFilter Component Props

```typescript
interface SearchFilterProps {
  filters: FilterState; // Current filter state
  filterActions: FilterActions; // All filter action functions
  resultCount: number; // Number of filtered expenses
  totalCount: number; // Total number of expenses
}
```

---

## Customization Guide

### Adding a New Filter

1. **Update FilterState interface** in `useFilter.tsx`:

```typescript
interface FilterState {
  // ... existing filters
  newFilter: string | "all";
}
```

2. **Add initial state**:

```typescript
const initialFilterState: FilterState = {
  // ... existing
  newFilter: "all",
};
```

3. **Create setter function**:

```typescript
const setNewFilter = useCallback((value: string | "all") => {
  setFilters((prev) => ({ ...prev, newFilter: value }));
}, []);
```

4. **Add filter logic**:

```typescript
// In filteredExpenses useMemo
if (filters.newFilter !== "all" && expense.field !== filters.newFilter) {
  return false;
}
```

5. **Update hasActiveFilters**:

```typescript
const hasActiveFilters = useMemo(() => {
  return (
    // ... existing checks
    filters.newFilter !== "all"
  );
}, [filters]);
```

6. **Add UI control** in `SearchFilter.tsx`

### Changing Filter Appearance

The component uses Tailwind CSS. Key classes:

- Container: `bg-white rounded-2xl border border-zinc-200 p-6`
- Inputs: `bg-zinc-50 border border-zinc-200 rounded-xl`
- Focus states: `focus:ring-2 focus:ring-zinc-900`

### Adding Preset Date Ranges

You could add quick date buttons:

```typescript
const presets = [
  { label: "Today", days: 0 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "This month", days: "month" },
];

const applyPreset = (days: number | string) => {
  const end = new Date();
  const start = new Date();
  if (typeof days === "number") {
    start.setDate(start.getDate() - days);
  } else {
    start.setDate(1); // First day of month
  }
  setDateRange(
    start.toISOString().split("T")[0],
    end.toISOString().split("T")[0],
  );
};
```

---

## Performance Considerations

1. **Memoization**: All filter logic uses `useMemo` to prevent unnecessary recalculations
2. **Callbacks**: All setter functions use `useCallback` to maintain referential equality
3. **Efficient filtering**: Single pass through the expense array with early returns

---

## Step-by-Step Implementation Tutorial

This section walks you through exactly how this feature was built from scratch, so you can understand the process and apply it to similar features.

### Step 1: Analyze the Existing Codebase

Before writing any code, I studied the existing data flow:

```
useCrud() → useAccordion() → ExpenseCard
```

**Key findings:**

- `useCrud()` returns raw `expense[]` array from the API
- `useAccordion()` takes expenses and groups them by day/week/month
- The filter needs to sit between these two hooks

**Decision:** Create a `useFilter()` hook that takes raw expenses and returns filtered expenses.

### Step 2: Define the Filter State Interface

I started by defining what filters we need. Looking at the `Expense` type:

```typescript
// From src/types.ts
export type Expense = {
  id: number;
  category: Category;
  amount: number;
  description: string;
  date: string;
  isRecurring: boolean;
  paymentMethod: PaymentMethod;
};
```

I identified filterable fields and designed the state:

```typescript
// src/utils/useFilter.tsx
export interface FilterState {
  searchQuery: string; // Free text search
  category: Category | "all"; // Dropdown with "all" option
  paymentMethod: PaymentMethod | "all";
  dateRange: { start: string; end: string }; // Date inputs
  amountRange: { min: number | ""; max: number | "" }; // Number inputs
  isRecurring: boolean | "all"; // Three-way toggle
}
```

**Why these choices:**

- `"all"` sentinel value makes dropdowns cleaner than `null`
- Empty string `""` for number inputs allows clearing the field
- Date strings for easy HTML input binding

### Step 3: Create the useFilter Hook

#### 3.1 Set up initial state

```typescript
const initialFilterState: FilterState = {
  searchQuery: "",
  category: "all",
  paymentMethod: "all",
  dateRange: { start: "", end: "" },
  amountRange: { min: "", max: "" },
  isRecurring: "all",
};

const useFilter = (expenses: Expense[]) => {
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  // ...
};
```

#### 3.2 Create memoized setter functions

Each setter uses `useCallback` to prevent child component re-renders:

```typescript
const setSearchQuery = useCallback((query: string) => {
  setFilters((prev) => ({ ...prev, searchQuery: query }));
}, []);

const setCategory = useCallback((category: Category | "all") => {
  setFilters((prev) => ({ ...prev, category }));
}, []);

// ... similar for other setters
```

**Why useCallback?** When we pass these functions to the SearchFilter component, they maintain the same reference between renders, preventing unnecessary re-renders.

#### 3.3 Implement the filtering logic

The core filtering uses `useMemo` for performance:

```typescript
const filteredExpenses = useMemo(() => {
  return expenses.filter((expense) => {
    // 1. Text search - check description AND category
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesDescription = expense.description
        ?.toLowerCase()
        .includes(query);
      const matchesCategory = expense.category.toLowerCase().includes(query);
      if (!matchesDescription && !matchesCategory) {
        return false; // Early return for non-matches
      }
    }

    // 2. Category filter
    if (filters.category !== "all" && expense.category !== filters.category) {
      return false;
    }

    // 3. Payment method filter
    if (
      filters.paymentMethod !== "all" &&
      expense.paymentMethod !== filters.paymentMethod
    ) {
      return false;
    }

    // 4. Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      const expenseDate = new Date(expense.date);
      if (filters.dateRange.start) {
        const startDate = new Date(filters.dateRange.start);
        if (expenseDate < startDate) return false;
      }
      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end);
        endDate.setHours(23, 59, 59, 999); // Include entire end day
        if (expenseDate > endDate) return false;
      }
    }

    // 5. Amount range filter
    if (filters.amountRange.min !== "" || filters.amountRange.max !== "") {
      const amount = Number(expense.amount);
      if (filters.amountRange.min !== "" && amount < filters.amountRange.min) {
        return false;
      }
      if (filters.amountRange.max !== "" && amount > filters.amountRange.max) {
        return false;
      }
    }

    // 6. Recurring filter
    if (
      filters.isRecurring !== "all" &&
      expense.isRecurring !== filters.isRecurring
    ) {
      return false;
    }

    return true; // Passed all filters
  });
}, [expenses, filters]);
```

**Key patterns:**

- Early `return false` for non-matches (efficient)
- Check for "all" before comparing values
- Handle edge cases (empty strings, null descriptions)

#### 3.4 Add helper: hasActiveFilters

This boolean tells us if any filter is active (for UI feedback):

```typescript
const hasActiveFilters = useMemo(() => {
  return (
    filters.searchQuery !== "" ||
    filters.category !== "all" ||
    filters.paymentMethod !== "all" ||
    filters.dateRange.start !== "" ||
    filters.dateRange.end !== "" ||
    filters.amountRange.min !== "" ||
    filters.amountRange.max !== "" ||
    filters.isRecurring !== "all"
  );
}, [filters]);
```

### Step 4: Create the SearchFilter UI Component

#### 4.1 Define props interface

```typescript
interface SearchFilterProps {
  filters: FilterState;
  filterActions: FilterActions;
  resultCount: number;
  totalCount: number;
}
```

#### 4.2 Build the search input

```tsx
<div className="relative">
  <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
  <input
    type="text"
    placeholder="Search by description or category..."
    value={filters.searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl..."
  />
  {filters.searchQuery && (
    <button onClick={() => setSearchQuery("")}>
      <XMarkIcon className="w-5 h-5" />
    </button>
  )}
</div>
```

#### 4.3 Build dropdown filters

```tsx
<select
  value={filters.category}
  onChange={(e) => setCategory(e.target.value as Category | "all")}
  className="appearance-none pl-4 pr-10 py-2.5 bg-zinc-50 border..."
>
  <option value="all">All Categories</option>
  {categories.map((cat) => (
    <option key={cat} value={cat}>
      {formatCategory(cat)}
    </option>
  ))}
</select>
```

#### 4.4 Add advanced filters section (collapsible)

```tsx
const [showAdvanced, setShowAdvanced] = useState(false);

// Toggle button
<button onClick={() => setShowAdvanced(!showAdvanced)}>
  {showAdvanced ? "Hide Advanced" : "More Filters"}
</button>;

// Collapsible section
{
  showAdvanced && (
    <div className="pt-4 border-t">
      {/* Date Range Inputs */}
      {/* Amount Range Inputs */}
    </div>
  );
}
```

### Step 5: Integrate into ExpenseTracker

#### 5.1 Import the new hook and component

```typescript
import SearchFilter from "./SearchFilter";
import useFilter from "../utils/useFilter";
```

#### 5.2 Wire up the data flow

```typescript
const ExpenseTracker = () => {
  // 1. Get raw expenses
  const { expense, addExpense, deleteExpense, updateExpenses } = useCrud();

  // 2. Apply filters (NEW!)
  const {
    filters,
    filteredExpenses,
    setSearchQuery,
    setCategory,
    setPaymentMethod,
    setDateRange,
    setAmountRange,
    setIsRecurring,
    resetFilters,
    hasActiveFilters,
  } = useFilter(expense);

  // 3. Group the FILTERED expenses (not raw!)
  const { groupedExpenses, ... } = useAccordion(filteredExpenses);

  // ...
};
```

**Critical change:** `useAccordion` now receives `filteredExpenses` instead of `expense`.

#### 5.3 Add the SearchFilter component to JSX

```tsx
<main className="max-w-7xl mx-auto px-8 py-12">
  {/* Search and Filter Section */}
  <div className="mb-8">
    <SearchFilter
      filters={filters}
      filterActions={{
        setSearchQuery,
        setCategory,
        setPaymentMethod,
        setDateRange,
        setAmountRange,
        setIsRecurring,
        resetFilters,
        hasActiveFilters,
      }}
      resultCount={filteredExpenses.length}
      totalCount={expense.length}
    />
  </div>

  {/* Rest of the UI */}
</main>
```

#### 5.4 Update chart to use filtered data

```tsx
// Before: <ExpenseChart expense={expense} />
// After:
<ExpenseChart expense={filteredExpenses} />
```

### Step 6: Test the Integration

1. **Search works?** Type "food" → only Food category or descriptions with "food" appear
2. **Filters work?** Select "UPI" → only UPI payments shown
3. **Combining works?** Search + Category + Date Range all apply together
4. **Clear works?** Click "Clear all" → everything resets
5. **Result count accurate?** Shows correct "X of Y expenses"
6. **Chart updates?** Bar chart reflects filtered data
7. **Grouping works?** Day/Week/Month grouping applies to filtered results

### Summary: What We Built

```
┌──────────────────────────────────────────────────────────────┐
│                         DATA FLOW                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  API ──▶ useCrud() ──▶ useFilter() ──▶ useAccordion()       │
│           (fetch)       (filter)        (group)              │
│              │              │               │                │
│              │              ▼               ▼                │
│              │        SearchFilter    ExpenseCard            │
│              │         Component       Component             │
│              │                              │                │
│              └────────────────────────────▶ ExpenseChart     │
│                                            (filtered data)   │
└──────────────────────────────────────────────────────────────┘
```

This architecture keeps each hook focused on one responsibility:

- **useCrud**: API communication
- **useFilter**: Filtering logic
- **useAccordion**: Grouping logic

---

## Future Enhancements

- [ ] Save filter preferences to localStorage
- [ ] Add preset date ranges (Today, This Week, This Month)
- [ ] Export filtered results to CSV
- [ ] Add sorting options (amount, date, category)
- [ ] Keyboard shortcuts for quick filtering

---

**Happy filtering! 🎉**
