import { useEffect, useRef } from "react";
import useCrud from "../utils/useCrud";
import Chart from "chart.js/auto";

const ExpenseChart = () => {
  const { expense } = useCrud();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    console.log(expense);
    // Check if the canvas element is available
    if (!canvasRef.current) {
      return;
    }

    // Aggregate expenses by category, just like we planned
    const expensesByCategory = new Map<string, number>();
    expense.forEach((exp) => {
      const currentTotal = expensesByCategory.get(exp.category) || 0;
      expensesByCategory.set(exp.category, currentTotal + exp.amount);
    });

    // Extract labels and data from the Map for the chart
    const labels = Array.from(expensesByCategory.keys());
    const data = Array.from(expensesByCategory.values());

    // Create the chart
    const myChart = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Expenses by Category",
            data: data,
            backgroundColor: [
              "rgba(255, 99, 132, 0.6)",
              "rgba(54, 162, 235, 0.6)",
              "rgba(255, 206, 86, 0.6)",
              "rgba(75, 192, 192, 0.6)",
              "rgba(153, 102, 255, 0.6)",
              "rgba(255, 159, 64, 0.6)",
              "rgba(100, 200, 100, 0.6)",
              "rgba(200, 100, 100, 0.6)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
              "rgba(100, 200, 100, 1)",
              "rgba(200, 100, 100, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });

    // Cleanup function to destroy the chart when the component unmounts
    return () => {
      myChart.destroy();
    };
  }, [expense]);

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-gray-900 rounded-2xl shadow-xl border border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">
        Spending Breakdown
      </h2>
      <div style={{ width: "100%", height: "300px" }}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
};

export default ExpenseChart;
