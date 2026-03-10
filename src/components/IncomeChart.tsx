import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import type { Income } from "../types";

const IncomeChart = ({ incomes }: { incomes: Income[] }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [viewBy, setViewBy] = useState<"category" | "payment">("category");

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const dataMap = new Map<string, number>();

    incomes.forEach((inc) => {
      let key: string =
        viewBy === "category" ? inc.category : inc.paymentMethod;

      if (viewBy === "payment") {
        key = key
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }

      const currentTotal = dataMap.get(key) || 0;
      dataMap.set(key, currentTotal + Number(inc.amount));
    });

    const labels = Array.from(dataMap.keys());
    const data = Array.from(dataMap.values());

    chartInstanceRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label:
              viewBy === "category"
                ? "Income by Category"
                : "Income by Payment Method",
            data,
            backgroundColor: "rgba(16, 185, 129, 0.9)",
            borderColor: "rgba(16, 185, 129, 1)",
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
              color: "#047857",
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
              color: "#047857",
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

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [incomes, viewBy]);

  return (
    <div className="w-full bg-white rounded-2xl border border-zinc-200 p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">
            Income Analysis
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Visualize your income streams
          </p>
        </div>

        <div className="flex p-1 bg-zinc-100 rounded-xl">
          <button
            onClick={() => setViewBy("category")}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              viewBy === "category"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Category
          </button>
          <button
            onClick={() => setViewBy("payment")}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              viewBy === "payment"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
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

export default IncomeChart;

