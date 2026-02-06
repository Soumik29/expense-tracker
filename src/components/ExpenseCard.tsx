import IndividualExpense from "./IndividualExpense";
import { type Expense } from "../types";

interface expenseCardProps {
  expenseList: { [key: string]: Expense[] };
  onDeleteExpense: (id: number) => void;
  onEditExpense: (expense: Expense) => void;
  expandItem: (index: string) => void;
  expenseActive: string;
}

const ExpenseCard = (props: expenseCardProps) => {
  const {
    expenseList,
    onDeleteExpense,
    onEditExpense,
    expandItem,
    expenseActive,
  } = props;
  return (
    <div className="w-full bg-white rounded-2xl border border-zinc-200 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
          Your Expenses
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Track and manage your spending
        </p>
      </div>

      {/* Expense List */}
      <div className="space-y-4">
        {Object.keys(expenseList).length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <p className="text-zinc-600 font-medium">No expenses yet</p>
            <p className="text-sm text-zinc-400 mt-1">
              Add one to get started
            </p>
          </div>
        ) : (
          Object.keys(expenseList).map((expense) => {
            const isActiveIndex = expenseActive === expense;
            return (
              <div
                key={expense}
                className="border border-zinc-200 rounded-xl overflow-hidden"
              >
                <h2
                  className="bg-zinc-50 px-5 py-4 cursor-pointer hover:bg-zinc-100 transition-colors flex items-center justify-between"
                  onClick={() => expandItem(expense)}
                >
                  <span className="font-medium text-zinc-900">
                    {expense}
                  </span>
                  <svg
                    className={`w-5 h-5 text-zinc-400 transition-transform ${isActiveIndex ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </h2>
                {isActiveIndex && (
                  <div className="divide-y divide-zinc-100">
                    {expenseList[expense].map((expenses) => (
                      <IndividualExpense
                        key={expenses.id}
                        expense={expenses}
                        onDeleteExpense={onDeleteExpense}
                        onEditExpense={onEditExpense}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ExpenseCard;
