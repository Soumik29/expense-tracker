import { useState } from "react";
import type { Expense } from "../types";
const useModal = () => {
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const onEditExpense = (expense: Expense | null) => {
    setEditExpense(expense);
    setIsOpen(true);
  };
  return {onEditExpense, isOpen, editExpense, setIsOpen};
};

export default useModal;
