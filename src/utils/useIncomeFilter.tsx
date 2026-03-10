import { useState, useMemo, useCallback } from "react";
import type { Income, IncomeCategory, PaymentMethod } from "../types";

export interface IncomeFilterState {
  searchQuery: string;
  category: IncomeCategory | "all";
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

export interface IncomeFilterActions {
  setSearchQuery: (query: string) => void;
  setCategory: (category: IncomeCategory | "all") => void;
  setPaymentMethod: (method: PaymentMethod | "all") => void;
  setDateRange: (start: string, end: string) => void;
  setAmountRange: (min: number | "", max: number | "") => void;
  setIsRecurring: (isRecurring: boolean | "all") => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

const initialFilterState: IncomeFilterState = {
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

const useIncomeFilter = (incomes: Income[]) => {
  const [filters, setFilters] = useState<IncomeFilterState>(initialFilterState);

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

  const setSearchQuery = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const setCategory = useCallback(
    (category: IncomeCategory | "all") => {
      setFilters((prev) => ({ ...prev, category }));
    },
    [],
  );

  const setPaymentMethod = useCallback(
    (method: PaymentMethod | "all") => {
      setFilters((prev) => ({ ...prev, paymentMethod: method }));
    },
    [],
  );

  const setDateRange = useCallback((start: string, end: string) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: { start, end },
    }));
  }, []);

  const setAmountRange = useCallback(
    (min: number | "", max: number | "") => {
      setFilters((prev) => ({
        ...prev,
        amountRange: { min, max },
      }));
    },
    [],
  );

  const setIsRecurring = useCallback(
    (isRecurring: boolean | "all") => {
      setFilters((prev) => ({ ...prev, isRecurring }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters(initialFilterState);
  }, []);

  const filteredIncomes = useMemo(() => {
    return incomes.filter((income) => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesDescription = income.description
          ?.toLowerCase()
          .includes(query);
        const matchesCategory = income.category.toLowerCase().includes(query);
        if (!matchesDescription && !matchesCategory) {
          return false;
        }
      }

      if (filters.category !== "all" && income.category !== filters.category) {
        return false;
      }

      if (
        filters.paymentMethod !== "all" &&
        income.paymentMethod !== filters.paymentMethod
      ) {
        return false;
      }

      if (filters.dateRange.start || filters.dateRange.end) {
        const incomeDate = new Date(income.date);
        if (filters.dateRange.start) {
          const startDate = new Date(filters.dateRange.start);
          if (incomeDate < startDate) return false;
        }
        if (filters.dateRange.end) {
          const endDate = new Date(filters.dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          if (incomeDate > endDate) return false;
        }
      }

      if (filters.amountRange.min !== "" || filters.amountRange.max !== "") {
        const amount = Number(income.amount);
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

      if (
        filters.isRecurring !== "all" &&
        income.isRecurring !== filters.isRecurring
      ) {
        return false;
      }

      return true;
    });
  }, [incomes, filters]);

  const filterActions: IncomeFilterActions = {
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
    filteredIncomes,
    ...filterActions,
  };
};

export default useIncomeFilter;

