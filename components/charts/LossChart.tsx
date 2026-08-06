"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LossChartProps {
  lossHistory: number[];
}

export const LossChart: React.FC<LossChartProps> = ({ lossHistory }) => {
  const labels = lossHistory.map((_, idx) => `Step ${idx}`);

  const data = {
    labels,
    datasets: [
      {
        label: "Loss f(x, y)",
        data: lossHistory,
        borderColor: "#D79A55",
        backgroundColor: "rgba(215, 154, 85, 0.15)",
        borderWidth: 3,
        pointBackgroundColor: "#F0D6A2",
        pointBorderColor: "#6C4A33",
        pointRadius: lossHistory.length > 30 ? 2 : 4,
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#211813",
        titleColor: "#D79A55",
        bodyColor: "#F0D6A2",
        borderColor: "#6C4A33",
        borderWidth: 2,
        titleFont: { family: "monospace", size: 14 },
        bodyFont: { family: "monospace", size: 14 },
      },
    },
    scales: {
      x: {
        grid: {
          color: "#6C4A33",
        },
        ticks: {
          color: "#B89C76",
          font: { family: "monospace", size: 12 },
          maxTicksLimit: 10,
        },
      },
      y: {
        grid: {
          color: "#6C4A33",
        },
        ticks: {
          color: "#D79A55",
          font: { family: "monospace", size: 12 },
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-[#16110D] border-2 border-[#6C4A33] p-3 shadow-[3px_3px_0px_#000000] h-48 w-full rounded-none">
      <div className="flex justify-between items-center mb-1">
        <span className="font-pixel text-[10px] uppercase text-[#B89C76] font-bold">
          Loss Curve (f(x, y) vs Step)
        </span>
        <span className="text-xs text-[#D79A55] font-mono">
          Latest Loss: {lossHistory.length > 0 ? lossHistory[lossHistory.length - 1].toFixed(4) : "0.0000"}
        </span>
      </div>
      <div className="h-36 w-full">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};
