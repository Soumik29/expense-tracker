import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import type { Expense } from "../types";

const ExpenseChart = ({ expense }: { expense: Expense[] }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null); // Keep track of chart instance
  const [viewBy, setViewBy] = useState<"category" | "payment">("category");

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy previous chart instance if it exists to prevent "Canvas is already in use" error
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Aggregate Data
    const dataMap = new Map<string, number>();

    expense.forEach((exp) => {
      let key: string = viewBy === "category" ? exp.category : exp.paymentMethod;


      if (viewBy === "payment") {
        key = key
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }

      const currentTotal = dataMap.get(key) || 0;
      dataMap.set(key, currentTotal + Number(exp.amount));
    });

    const labels = Array.from(dataMap.keys());
    const data = Array.from(dataMap.values());

    // Create Chart
    chartInstanceRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: viewBy === "category" ? "Expenses by Category" : "Expenses by Payment Method",
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
            borderRadius: { topLeft: 10, topRight: 10 }, // Rounded bars
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false, // Hide legend for cleaner look
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(255, 255, 255, 0.1)", // Light grid lines for dark mode
            },
            ticks: {
              color: "#9ca3af", // Gray text
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: "#9ca3af",
            },
          },
        },
      },
    });

    // Cleanup on unmount or re-render
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [expense, viewBy]); // Re-run when expenses or view mode changes

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-gray-900 rounded-2xl shadow-xl border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Analysis</h2>
        
        {/* Toggle Switch */}
        <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button
            onClick={() => setViewBy("category")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewBy === "category"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Category
          </button>
          <button
            onClick={() => setViewBy("payment")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewBy === "payment"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Payment
          </button>
        </div>
      </div>

      <div className="relative h-64 w-full">
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
};

export default ExpenseChart;