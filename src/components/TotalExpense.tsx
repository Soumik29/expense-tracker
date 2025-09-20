import type { Expense } from "../types";

//This component will be responsible for calculating the total expenses incurred
const TotalExpense = ({ totalExp }: { totalExp: Expense[] }) => {
  const total = totalExp?.reduce((sum, exp) => sum + parseFloat(String(exp.amount)), 0) ?? 0;
  return (
    <div className="flex justify-between bg-gray-800/90 shadow-lg p-5 transition-all duration-300 hover:border-blue-100 hover:shadow-blue-500/20">
      <span className="text-red">Total Expenses: </span>
      <span>${total.toFixed(2)}</span>
    </div>
  );
};

export default TotalExpense;
