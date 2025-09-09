import IndividualExpense from "./IndividualExpense";
import { type Expense } from "./types";
import { useState } from "react";
// The main component that wraps the list
const ExpenseCard = (props: {
  expenseList: { [key: string]: Expense[] };
  onDeleteExpense: (id: number) => void;
  onEditExpense: (expense: Expense) => void;
}) => {
  const { expenseList, onDeleteExpense, onEditExpense } = props;
  const [activeIndex, setActiveIndex] = useState<string | null>(null);
  //index in this case is the date of the expense
  const handleExpandItem = (index: string) => {
    setActiveIndex(activeIndex === index ? null : index);
  };
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
            const isActiveIndex = activeIndex === expense;
            return (
              <div>
                <h2
                  onClick={() => handleExpandItem(expense)}
                  className="bg-gray-800/50 border border-gray-700 rounded-xl shadow-lg p-5 transition-all duration-300 hover:border-blue-500 hover:shadow-blue-500/10 cursor-pointer"
                >
                  {expense}
                </h2>
                {isActiveIndex && (
                  <div className="p-4 space-y-5">
                    {expenseList[expense].map((expenses) => (
                      <div key={expenses.id}>
                        <IndividualExpense
                          key={expenses.id}
                          expense={expenses}
                          onDeleteExpense={onDeleteExpense}
                          onEditExpense={onEditExpense}
                        />
                      </div>
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
