import type { Expense } from "../types";

const useSaveExpense = () => {
    const savedExpense = localStorage.getItem("expenses");
      const getSavedExpense = () => {
        if (savedExpense) {
          return JSON.parse(savedExpense).map((expenditure: Expense) => ({
            ...expenditure,
            date: new Date(expenditure.date),
          }));
        } else {
          return [];
        }
      };
      return getSavedExpense;
}
export default useSaveExpense;