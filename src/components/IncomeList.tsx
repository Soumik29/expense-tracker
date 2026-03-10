import type { Income } from "../types";

type IncomeListProps = {
  incomes: Income[];
  onDeleteIncome: (id: number) => void;
};

const IncomeList = ({ incomes, onDeleteIncome }: IncomeListProps) => {
  if (incomes.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Your Incomes
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No incomes recorded yet. Add one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Your Incomes
      </h2>
      <ul className="space-y-3">
        {incomes.map((income) => (
          <li
            key={income.id}
            className="flex items-center justify-between border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {income.category} • ${Number(income.amount).toFixed(2)}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {new Date(income.date).toLocaleDateString()} ·{" "}
                {income.description || "No description"}
              </p>
            </div>
            <button
              onClick={() => onDeleteIncome(income.id)}
              className="text-xs font-medium text-red-500 hover:text-red-600"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default IncomeList;

