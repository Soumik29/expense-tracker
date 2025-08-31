import { type Expense } from "./types.ts";
const ExpenseCard = (props: { expenseList: Expense[] }) => {
  const { expenseList } = props;
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-[#EEEEEE] rounded-xl h-full shadow-md">
      <h1 className="w-full text-2xl font-bold text-center text-red-400 mb-2">
        Expenses
      </h1>
      {expenseList.length === 0 ? (
        <div>
          <p className="text-center">No expenses to add yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {expenseList.map((expense) =>
            !Number.isNaN(expense.amount) ? (
              <div
                className="bg-white shadow-md rounded-lg p-4 mb-4"
                key={expense.id}
              >
                <div className="flex justify-between text-center w-full">
                  <span className="font-bold text-lg">${expense.amount}</span>
                  <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-sm">
                    {expense.category}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{new Date(expense.date).toLocaleDateString()} </span>
                  <span>{expense.description}</span>
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
};

export default ExpenseCard;
