import IndividualExpense from "./IndividualExpense";
import { type Expense } from "./types";

const ExpenseCard = (props: {
  expenseList: { [key: string]: Expense[] };
  onDeleteExpense: (id: number) => void;
  onEditExpense: (expense: Expense) => void;
  expandItem: (index: string) => void;
  expenseActive: string;
}) => {
  const { expenseList, onDeleteExpense, onEditExpense, expandItem, expenseActive } = props;
  return (
    <div className="w-full mx-auto p-6 bg-gray-900/90 backdrop-blur-3xl rounded-2xl shadow-2xl border border-gray-700 h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 p-2 mb-4 backdrop-blur-xl">
        <h1 className="flex items-center justify-center gap-3 text-3xl font-bold text-white mb-4">
          💸 Your Expenses
        </h1>
      </div>

      {/* Expense List */}
      <div className="overflow-y-auto overscroll-contain space-y-5">
        {expenseList === null ? (
          <div className="text-center text-gray-500 py-10">
            <p className="text-lg">No expenses added yet.</p>
            <p className="text-sm">Add one to get started!</p>
          </div>
        ) : (
          Object.keys(expenseList).map((expense) => {
            const isActiveIndex = expenseActive === expense;
            return (
              <div key={expense}>
                <h2
                  className="bg-gray-800/50 border-b border-gray-700 rounded-t-xl p-5 cursor-pointer hover:bg-gray-700/40 transition-all"
                  onClick={() => expandItem(expense)}
                >
                  {expense}
                </h2>
                {isActiveIndex && expenseList[expense].map((expenses) => (
                  <div key={expenses.id}>
                    <IndividualExpense
                      expense={expenses}
                      onDeleteExpense={onDeleteExpense}
                      onEditExpense={onEditExpense}
                    />
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ExpenseCard;
