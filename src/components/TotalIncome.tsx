import type { Income } from "../types";

const TotalIncome = ({ incomes }: { incomes: Income[] }) => {
  const total =
    incomes?.reduce((sum, inc) => sum + parseFloat(String(inc.amount)), 0) ?? 0;

  return (
    <div className="bg-emerald-600 rounded-xl px-6 py-5 flex items-center justify-between">
      <span className="text-emerald-100 font-medium">Total Income</span>
      <span className="text-2xl font-semibold text-white">
        ${total.toFixed(2)}
      </span>
    </div>
  );
};

export default TotalIncome;

