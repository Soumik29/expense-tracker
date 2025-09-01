import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { type Expense } from "./types.ts";
type deleteExpenseProp =  (id: number) => void;
type editExpenseProp = (expense: Expense) => void;
const ExpenseCard = (props: { expenseList: Expense[]; onDeleteExpense: deleteExpenseProp; onEditExpense: editExpenseProp}) => {
  const { expenseList, onDeleteExpense, onEditExpense } = props;
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-[#EEEEEE] rounded-xl h-full shadow-md">
      <div className="sticky top-0 z-1 backdrop-blur p-2">
        <h1 className="w-full text-2xl font-bold text-center text-red-400 mb-2">
          Expenses
        </h1>
      </div>
      <div className="overflow-y-auto overscroll-contain bg-gradient-to-b from-white/70 to-transparent">
        {expenseList.length === 0 ? (
          <div>
            <p className="text-center">No expenses to add yet</p>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto overscroll-contain">
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
                    <button onClick={() => {
                      onEditExpense(expense);
                    }}><FontAwesomeIcon icon={faPen} /></button>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{new Date(expense.date).toLocaleDateString()} </span>
                    <span>{expense.description}</span>
                    <button onClick={() => {
                      onDeleteExpense(expense.id)}}><FontAwesomeIcon icon={faTrash}/></button>
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseCard;
