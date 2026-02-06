import { useState } from "react";
import type { FilterState, FilterActions } from "../utils/useFilter";
import type { Category, PaymentMethod } from "../types";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

interface SearchFilterProps {
  filters: FilterState;
  filterActions: FilterActions;
  resultCount: number;
  totalCount: number;
}

const categories: Category[] = [
  "Food",
  "Groceries",
  "Mobile_Bill",
  "Travel",
  "Shopping",
  "Games",
  "Subscription",
  "EMI",
];

const paymentMethods: PaymentMethod[] = [
  "CASH",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "UPI",
];

const formatPaymentMethod = (method: string) => {
  return method
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatCategory = (category: string) => {
  return category.replace(/_/g, " ");
};

const SearchFilter = ({
  filters,
  filterActions,
  resultCount,
  totalCount,
}: SearchFilterProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    setSearchQuery,
    setCategory,
    setPaymentMethod,
    setDateRange,
    setAmountRange,
    setIsRecurring,
    resetFilters,
    hasActiveFilters,
  } = filterActions;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-zinc-500" />
          <h2 className="text-lg font-semibold text-zinc-900">
            Search & Filter
          </h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by description or category..."
          value={filters.searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
        />
        {filters.searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Category Filter */}
        <div className="relative">
          <select
            value={filters.category}
            onChange={(e) => setCategory(e.target.value as Category | "all")}
            className="appearance-none pl-4 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {formatCategory(cat)}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        </div>

        {/* Payment Method Filter */}
        <div className="relative">
          <select
            value={filters.paymentMethod}
            onChange={(e) =>
              setPaymentMethod(e.target.value as PaymentMethod | "all")
            }
            className="appearance-none pl-4 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent cursor-pointer"
          >
            <option value="all">All Payment Methods</option>
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {formatPaymentMethod(method)}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        </div>

        {/* Recurring Filter */}
        <div className="relative">
          <select
            value={
              filters.isRecurring === "all"
                ? "all"
                : filters.isRecurring
                  ? "true"
                  : "false"
            }
            onChange={(e) => {
              const val = e.target.value;
              setIsRecurring(val === "all" ? "all" : val === "true");
            }}
            className="appearance-none pl-4 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="true">Recurring Only</option>
            <option value="false">One-time Only</option>
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            showAdvanced
              ? "bg-zinc-900 text-white"
              : "bg-zinc-50 text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
          }`}
        >
          {showAdvanced ? "Hide Advanced" : "More Filters"}
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="pt-4 border-t border-zinc-200 space-y-4">
          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">
              Date Range
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) =>
                  setDateRange(e.target.value, filters.dateRange.end)
                }
                className="flex-1 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
              <span className="text-zinc-400">to</span>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) =>
                  setDateRange(filters.dateRange.start, e.target.value)
                }
                className="flex-1 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* Amount Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">
              Amount Range
            </label>
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.amountRange.min}
                  onChange={(e) =>
                    setAmountRange(
                      e.target.value === "" ? "" : Number(e.target.value),
                      filters.amountRange.max,
                    )
                  }
                  className="w-full pl-8 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                />
              </div>
              <span className="text-zinc-400">to</span>
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.amountRange.max}
                  onChange={(e) =>
                    setAmountRange(
                      filters.amountRange.min,
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="w-full pl-8 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      {hasActiveFilters && (
        <div className="pt-3 border-t border-zinc-200">
          <p className="text-sm text-zinc-500">
            Showing{" "}
            <span className="font-semibold text-zinc-900">{resultCount}</span>{" "}
            of <span className="font-semibold text-zinc-900">{totalCount}</span>{" "}
            expenses
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchFilter;
