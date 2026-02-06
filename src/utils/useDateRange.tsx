import { useCallback, useMemo } from "react";

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

export interface DateRangeValue {
  start: string;
  end: string;
  preset: DatePreset;
}

export interface DatePresetOption {
  id: DatePreset;
  label: string;
  getRange: () => { start: Date; end: Date };
}

// Helper function to format date as YYYY-MM-DD for input[type="date"]
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper to get start of day
const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper to get end of day
const endOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

// Helper to get start of week (Monday)
const startOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  return startOfDay(d);
};

// Helper to get end of week (Sunday)
const endOfWeek = (date: Date): Date => {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  return endOfDay(d);
};

// Helper to get start of month
const startOfMonth = (date: Date): Date => {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return startOfDay(d);
};

// Helper to get end of month
const endOfMonth = (date: Date): Date => {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return endOfDay(d);
};

// Helper to get start of year
const startOfYear = (date: Date): Date => {
  const d = new Date(date.getFullYear(), 0, 1);
  return startOfDay(d);
};

// Define all preset options
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
    id: "yesterday",
    label: "Yesterday",
    getRange: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    },
  },
  {
    id: "last7days",
    label: "Last 7 Days",
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6); // Include today
      return { start: startOfDay(start), end: endOfDay(end) };
    },
  },
  {
    id: "last30days",
    label: "Last 30 Days",
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29); // Include today
      return { start: startOfDay(start), end: endOfDay(end) };
    },
  },
  {
    id: "thisWeek",
    label: "This Week",
    getRange: () => {
      const today = new Date();
      return { start: startOfWeek(today), end: endOfWeek(today) };
    },
  },
  {
    id: "lastWeek",
    label: "Last Week",
    getRange: () => {
      const today = new Date();
      const lastWeekDate = new Date(today);
      lastWeekDate.setDate(lastWeekDate.getDate() - 7);
      return { start: startOfWeek(lastWeekDate), end: endOfWeek(lastWeekDate) };
    },
  },
  {
    id: "thisMonth",
    label: "This Month",
    getRange: () => {
      const today = new Date();
      return { start: startOfMonth(today), end: endOfMonth(today) };
    },
  },
  {
    id: "lastMonth",
    label: "Last Month",
    getRange: () => {
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    },
  },
  {
    id: "thisYear",
    label: "This Year",
    getRange: () => {
      const today = new Date();
      return { start: startOfYear(today), end: endOfDay(today) };
    },
  },
];

interface UseDateRangeOptions {
  initialPreset?: DatePreset;
  onRangeChange?: (start: string, end: string) => void;
}

const useDateRange = (options: UseDateRangeOptions = {}) => {
  const { onRangeChange } = options;

  // Apply a preset and get the date strings
  const applyPreset = useCallback(
    (presetId: DatePreset): DateRangeValue => {
      if (presetId === "all") {
        onRangeChange?.("", "");
        return { start: "", end: "", preset: "all" };
      }

      if (presetId === "custom") {
        // Custom doesn't auto-apply dates
        return { start: "", end: "", preset: "custom" };
      }

      const preset = datePresets.find((p) => p.id === presetId);
      if (!preset) {
        return { start: "", end: "", preset: "all" };
      }

      const { start, end } = preset.getRange();
      const startStr = formatDateForInput(start);
      const endStr = formatDateForInput(end);

      onRangeChange?.(startStr, endStr);
      return { start: startStr, end: endStr, preset: presetId };
    },
    [onRangeChange],
  );

  // Apply custom date range
  const applyCustomRange = useCallback(
    (start: string, end: string): DateRangeValue => {
      onRangeChange?.(start, end);
      return { start, end, preset: "custom" };
    },
    [onRangeChange],
  );

  // Get display label for current range
  const getRangeLabel = useCallback((value: DateRangeValue): string => {
    if (value.preset === "all" || (!value.start && !value.end)) {
      return "All Time";
    }

    if (value.preset !== "custom") {
      const preset = datePresets.find((p) => p.id === value.preset);
      if (preset) return preset.label;
    }

    // Custom range - format nicely
    const formatDisplayDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    if (value.start && value.end) {
      return `${formatDisplayDate(value.start)} - ${formatDisplayDate(value.end)}`;
    } else if (value.start) {
      return `From ${formatDisplayDate(value.start)}`;
    } else if (value.end) {
      return `Until ${formatDisplayDate(value.end)}`;
    }

    return "All Time";
  }, []);

  // Detect which preset matches current dates (if any)
  const detectPreset = useCallback((start: string, end: string): DatePreset => {
    if (!start && !end) return "all";

    for (const preset of datePresets) {
      const range = preset.getRange();
      const presetStart = formatDateForInput(range.start);
      const presetEnd = formatDateForInput(range.end);

      if (presetStart === start && presetEnd === end) {
        return preset.id;
      }
    }

    return "custom";
  }, []);

  // Quick presets for common use cases
  const quickPresets = useMemo(
    () =>
      datePresets.filter((p) =>
        ["today", "last7days", "last30days", "thisMonth"].includes(p.id),
      ),
    [],
  );

  return {
    datePresets,
    quickPresets,
    applyPreset,
    applyCustomRange,
    getRangeLabel,
    detectPreset,
    formatDateForInput,
  };
};

export default useDateRange;
