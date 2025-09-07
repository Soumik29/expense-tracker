import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { type Expense } from "./types.ts";

type deleteExpenseProp = (id: number) => void;
type editExpenseProp = (expense: Expense) => void;

const ExpenseCard = (props: {
  expenseList: Expense[];
  onDeleteExpense: deleteExpenseProp;
  onEditExpense: editExpenseProp;
}) => {
  const { expenseList, onDeleteExpense, onEditExpense } = props;

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl shadow-xl h-full">
      {/* Header */}
      <div className="sticky top-0 z-1 backdrop-blur p-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-400 mb-4">
          💸 Expenses
        </h1>
      </div>

      {/* Expense List */}
      <div className="overflow-y-auto overscroll-contain space-y-4">
        {expenseList.length === 0 ? (
          <p className="text-center text-gray-400">No expenses to add yet</p>
        ) : (
          expenseList.map((expense) =>
            !Number.isNaN(expense.amount) ? (
              <div
                key={expense.id}
                className="relative bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-2xl shadow-md p-5 hover:shadow-blue-500/20 transition duration-300"
              >
                {/* Amount */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-2xl font-extrabold text-green-400">
                    ${expense.amount}
                  </span>
                </div>

                {/* Category + Actions */}
                <div className="flex justify-between items-center mb-2">
                  <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow">
                    {expense.category}
                  </span>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => onEditExpense(expense)}
                      className="p-2 rounded-full bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 hover:text-blue-300 transition"
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button
                      onClick={() => onDeleteExpense(expense.id)}
                      className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>

                {/* Date + Description */}
                <div className="flex justify-between items-center text-sm text-gray-300">
                  <span>{new Date(expense.date).toLocaleDateString()}</span>
                  <span className="italic truncate max-w-[50%]">
                    {expense.description}
                  </span>
                </div>
              </div>
            ) : null
          )
        )}
      </div>
    </div>
  );
};

export default ExpenseCard;
