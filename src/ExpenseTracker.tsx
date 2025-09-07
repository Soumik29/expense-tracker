import { useState } from "react";
import { type Expense } from "./types";
import ExpenseCard from "./ExpenseCard";
import TotalExpense from "./TotalExpense";
import AddExpenseForm from "./AddExpenseForm";
import ModalFormExpense from "./ModalFormExpense";
const ExpenseTracker = () => {
  const [expense, setExpense] = useState<Expense[]>([]);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const addExpense = (expense: Expense) => {
    setExpense((prev) => [...prev, expense]);
  };
  const deleteExpense = (id: number) => {
    setExpense((prev) => prev.filter((expense) => expense.id !== id));
  };

  const updateExpenses = (expense: Expense) => {
    setExpense((prev) =>
      prev.map((expenditure) =>
        expenditure.id === expense.id
          ? expense
          : expenditure
      )
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 items-stretch">
      <AddExpenseForm onAddExpense={addExpense} />
      <div className="h-full w-full max-w-md mx-auto space-y-4">
        <div className="overflow-y-auto max-h-115">
          <ExpenseCard
            expenseList={expense}
            onDeleteExpense={deleteExpense}
            onEditExpense={(expense) => {
              setEditExpense(expense);
              setIsOpen(true);
            }}
          />
        </div>
        {expense.length !== 0 ? <TotalExpense totalExp={expense} /> : null}
      </div>
      {editExpense ? (
        <ModalFormExpense
          open={isOpen}
          close={setIsOpen}
          exp={editExpense}
          onUpdateExpense={updateExpenses}
        />
      ) : null}
    </div>
  );
};

export default ExpenseTracker;
