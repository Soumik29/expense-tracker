import { useState, useMemo, useCallback } from "react";
import type { Expense, Category, PaymentMethod } from "../types";

export interface FilterState {
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

export interface FilterActions {
  setSearchQuery: (query: string) => void;
  setCategory: (category: Category | "all") => void;
  setPaymentMethod: (method: PaymentMethod | "all") => void;
  setDateRange: (start: string, end: string) => void;
  setAmountRange: (min: number | "", max: number | "") => void;
  setIsRecurring: (isRecurring: boolean | "all") => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

const initialFilterState: FilterState = {
  searchQuery: "",
  category: "all",
  paymentMethod: "all",
  dateRange: {
    start: "",
    end: "",
  },
  amountRange: {
    min: "",
    max: "",
  },
  isRecurring: "all",
};

const useFilter = (expenses: Expense[]) => {
  const [filters, setFilters] = useState<FilterState>(initialFilterState);

  // Check if any filters are active
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

  // Filter actions
  const setSearchQuery = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const setCategory = useCallback((category: Category | "all") => {
    setFilters((prev) => ({ ...prev, category }));
  }, []);

  const setPaymentMethod = useCallback((method: PaymentMethod | "all") => {
    setFilters((prev) => ({ ...prev, paymentMethod: method }));
  }, []);

  const setDateRange = useCallback((start: string, end: string) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: { start, end },
    }));
  }, []);

  const setAmountRange = useCallback((min: number | "", max: number | "") => {
    setFilters((prev) => ({
      ...prev,
      amountRange: { min, max },
    }));
  }, []);

  const setIsRecurring = useCallback((isRecurring: boolean | "all") => {
    setFilters((prev) => ({ ...prev, isRecurring }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilterState);
  }, []);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      // Search query filter (searches in description and category)
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesDescription = expense.description
          ?.toLowerCase()
          .includes(query);
        const matchesCategory = expense.category.toLowerCase().includes(query);
        if (!matchesDescription && !matchesCategory) {
          return false;
        }
      }

      // Category filter
      if (filters.category !== "all" && expense.category !== filters.category) {
        return false;
      }

      // Payment method filter
      if (
        filters.paymentMethod !== "all" &&
        expense.paymentMethod !== filters.paymentMethod
      ) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const expenseDate = new Date(expense.date);
        if (filters.dateRange.start) {
          const startDate = new Date(filters.dateRange.start);
          if (expenseDate < startDate) return false;
        }
        if (filters.dateRange.end) {
          const endDate = new Date(filters.dateRange.end);
          endDate.setHours(23, 59, 59, 999); // Include the entire end day
          if (expenseDate > endDate) return false;
        }
      }

      // Amount range filter
      if (filters.amountRange.min !== "" || filters.amountRange.max !== "") {
        const amount = Number(expense.amount);
        if (
          filters.amountRange.min !== "" &&
          amount < filters.amountRange.min
        ) {
          return false;
        }
        if (
          filters.amountRange.max !== "" &&
          amount > filters.amountRange.max
        ) {
          return false;
        }
      }

      // Recurring filter
      if (
        filters.isRecurring !== "all" &&
        expense.isRecurring !== filters.isRecurring
      ) {
        return false;
      }

      return true;
    });
  }, [expenses, filters]);

  const filterActions: FilterActions = {
    setSearchQuery,
    setCategory,
    setPaymentMethod,
    setDateRange,
    setAmountRange,
    setIsRecurring,
    resetFilters,
    hasActiveFilters,
  };

  return {
    filters,
    filteredExpenses,
    ...filterActions,
  };
};

export default useFilter;
