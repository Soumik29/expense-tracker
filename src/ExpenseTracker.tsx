import { useState } from "react";
import { type Expense } from "./types";
import ExpenseCard from "./ExpenseCard";
import TotalExpense from "./TotalExpense";
import AddExpenseForm from "./AddExpenseForm";
import ModalFormExpense from "./ModalFormExpense";
const ExpenseTracker = () => {
  const [expense, setExpense] = useState<Expense[]>([]);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const addExpense = (expense: Expense) => {
    setExpense((prev) => [...prev, expense]);
  };
  const deleteExpense = (id: number) => {
    setExpense((prev) => prev.filter((expense) => expense.id !== id));
  };

  const updateExpense = (updatedExpense: Expense) => {
    setExpense((prev) =>
      prev.map((exp) => (exp.id === updatedExpense.id ? updatedExpense : exp))
    );
    setEditExpense(updatedExpense);
  };

  const modalClose = () => {
    setEditExpense(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 items-stretch">
      <AddExpenseForm onAddExpense={addExpense} />
      <div className="h-full w-full max-w-md mx-auto space-y-4">
        <div className="overflow-y-auto max-h-115">
          <ExpenseCard expenseList={expense} onDeleteExpense={deleteExpense} onEditExpense={setEditExpense}/>
        </div>
        {expense.length !== 0 ? <TotalExpense totalExp={expense} /> : null}
      </div>
      <ModalFormExpense 
        expense = {editExpense}
        onClose = {modalClose}
        onSave = {updateExpense}
        />
    </div>
  );
};

export default ExpenseTracker;
