import { useMemo, useState } from "react";
import type { Budget, Category, Expense } from "../types";
import { EXPENSE_CATEGORIES } from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faCheck } from "@fortawesome/free-solid-svg-icons";

type BudgetManagerProps = {
  budgets: Budget[];
  expenses: Expense[];
  onSaveBudget: (category: Category, amount: number) => Promise<void>;
  onRemoveBudget: (category: Category) => Promise<void>;
};

const prettyCategory = (category: Category) => category.replace(/_/g, " ");

// Progress bar color by budget usage: calm below 80%, warning to 100%, alarm over
const barColor = (ratio: number) => {
  if (ratio > 1) return "bg-red-500";
  if (ratio >= 0.8) return "bg-amber-500";
  return "bg-emerald-500";
};

const BudgetManager = ({
  budgets,
  expenses,
  onSaveBudget,
  onRemoveBudget,
}: BudgetManagerProps) => {
  // Draft input values keyed by category; only categories being edited appear
  const [drafts, setDrafts] = useState<Partial<Record<Category, string>>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingCategory, setSavingCategory] = useState<Category | null>(null);

  const budgetByCategory = useMemo(() => {
    const map = new Map<Category, Budget>();
    budgets.forEach((b) => map.set(b.category, b));
    return map;
  }, [budgets]);

  // Current calendar month spending per category
  const spentByCategory = useMemo(() => {
    const now = new Date();
    const map = new Map<Category, number>();
    expenses.forEach((exp) => {
      const d = new Date(exp.date);
      if (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth()
      ) {
        map.set(exp.category, (map.get(exp.category) ?? 0) + Number(exp.amount));
      }
    });
    return map;
  }, [expenses]);

  const handleSave = async (category: Category) => {
    const raw = drafts[category];
    if (raw === undefined) return;
    const amount = Number(raw);
    if (raw.trim() === "" || Number.isNaN(amount) || amount <= 0) {
      setErrorMessage("Budget must be a positive number");
      return;
    }
    setSavingCategory(category);
    setErrorMessage(null);
    try {
      await onSaveBudget(category, amount);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[category];
        return next;
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save budget",
      );
    } finally {
      setSavingCategory(null);
    }
  };

  const handleRemove = async (category: Category) => {
    setErrorMessage(null);
    try {
      await onRemoveBudget(category);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to remove budget",
      );
    }
  };

  const monthLabel = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-8 transition-colors duration-200">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Monthly Budgets
        </h2>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {monthLabel}
        </span>
      </div>

      <div className="space-y-5">
        {EXPENSE_CATEGORIES.map((category) => {
          const budget = budgetByCategory.get(category);
          const spent = spentByCategory.get(category) ?? 0;
          const draft = drafts[category];
          const isEditing = draft !== undefined;
          const ratio = budget ? spent / budget.amount : 0;

          return (
            <div key={category}>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {prettyCategory(category)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    ${spent.toFixed(2)}
                    {budget ? ` / $${budget.amount.toFixed(2)}` : " spent"}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={budget ? budget.amount.toFixed(2) : "Set"}
                    aria-label={`Budget for ${prettyCategory(category)}`}
                    className="w-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 px-2 py-1 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition-all"
                    value={draft ?? ""}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [category]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave(category);
                    }}
                  />
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => handleSave(category)}
                      disabled={savingCategory === category}
                      className="p-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
                      title="Save budget"
                    >
                      <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                    </button>
                  )}
                  {budget && !isEditing && (
                    <button
                      type="button"
                      onClick={() => handleRemove(category)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Remove budget"
                    >
                      <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {budget && (
                <div>
                  <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${barColor(ratio)}`}
                      style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                    />
                  </div>
                  {ratio > 1 && (
                    <p className="text-xs text-red-500 mt-1">
                      Over budget by ${(spent - budget.amount).toFixed(2)}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {errorMessage && (
        <div
          className="mt-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-sm font-medium"
          role="alert"
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default BudgetManager;
