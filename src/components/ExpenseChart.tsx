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
      let key: string =
        viewBy === "category" ? exp.category : exp.paymentMethod;

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

    // Create Chart with monochrome theme
    chartInstanceRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label:
              viewBy === "category"
                ? "Expenses by Category"
                : "Expenses by Payment Method",
            data: data,
            backgroundColor: "rgba(23, 23, 23, 0.9)",
            borderColor: "rgba(23, 23, 23, 1)",
            borderWidth: 0,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0, 0, 0, 0.06)",
            },
            ticks: {
              color: "#737373",
              font: {
                family: "system-ui",
              },
            },
            border: {
              display: false,
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: "#737373",
              font: {
                family: "system-ui",
              },
            },
            border: {
              display: false,
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
    <div className="w-full bg-white rounded-2xl border border-neutral-200 p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">
            Analysis
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Visualize your spending
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="flex p-1 bg-neutral-100 rounded-xl">
          <button
            onClick={() => setViewBy("category")}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              viewBy === "category"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            Category
          </button>
          <button
            onClick={() => setViewBy("payment")}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              viewBy === "payment"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-900"
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
