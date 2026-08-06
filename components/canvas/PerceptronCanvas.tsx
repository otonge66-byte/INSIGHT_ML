"use client";

import React, { useRef, useEffect } from "react";
import {
  DataPoint,
  PerceptronWeights,
  canvasToCartesian,
  cartesianToCanvas,
  getDecisionBoundaryEndpoints,
  predictPoint,
} from "@/lib/ml/perceptron";

interface PerceptronCanvasProps {
  points: DataPoint[];
  weights: PerceptronWeights;
  onAddPoint: (point: DataPoint) => void;
  width?: number;
  height?: number;
}

export const PerceptronCanvas: React.FC<PerceptronCanvasProps> = ({
  points,
  weights,
  onAddPoint,
  width = 600,
  height = 600,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background: Warm dark timber canvas
    ctx.fillStyle = "#18110b";
    ctx.fillRect(0, 0, width, height);

    // Decision region background shading (warm pixel grid fill)
    const gridSize = 30;
    const cellW = width / gridSize;
    const cellH = height / gridSize;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const px = (i + 0.5) * cellW;
        const py = (j + 0.5) * cellH;
        const cartesian = canvasToCartesian(px, py, width, height);
        const pred = predictPoint(cartesian, weights);

        // Class A (+1) = Terracotta tint, Class B (-1) = Warm Forest Green tint
        ctx.fillStyle = pred === 1 ? "rgba(188, 71, 73, 0.16)" : "rgba(56, 102, 65, 0.16)";
        ctx.fillRect(i * cellW, j * cellH, cellW, cellH);
      }
    }

    // Grid lines (muted warm brown)
    ctx.strokeStyle = "#2c1e15";
    ctx.lineWidth = 1;
    const gridStep = width / 10;
    for (let x = 0; x <= width; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Main Axes
    ctx.strokeStyle = "#5c3d2e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = "#dda15e";
    ctx.font = "bold 14px monospace";
    ctx.fillText("x1", width - 24, height / 2 - 8);
    ctx.fillText("x2", width / 2 + 10, 22);

    // Decision Boundary Line (Hard solid 4px line in warm golden ochre, no glow/shadow)
    const line = getDecisionBoundaryEndpoints(weights, width, height);
    if (line) {
      ctx.strokeStyle = "#dda15e";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(line.px1, line.py1);
      ctx.lineTo(line.px2, line.py2);
      ctx.stroke();
    }

    // Data Points (Pixel art circles with solid outlines)
    points.forEach((p) => {
      const { px, py } = cartesianToCanvas(p.x, p.y, width, height);
      const isClassA = p.label === 1;

      // Outer solid 2px outline
      ctx.fillStyle = isClassA ? "#bc4749" : "#386641";
      ctx.strokeStyle = "#fefae0";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(px, py, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Label symbol inside dot (+ or −)
      ctx.fillStyle = "#fefae0";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(isClassA ? "+" : "−", px, py);
    });
  }, [points, weights, width, height]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const { x, y } = canvasToCartesian(px, py, width, height);
    const label: 1 | -1 = e.button === 2 ? -1 : 1;

    const newPoint: DataPoint = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
      label,
    };

    onAddPoint(newPoint);
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleCanvasClick(e);
  };

  return (
    <div className="relative border-4 border-[#382219] shadow-[8px_8px_0px_0px_#0f0a07] bg-[#18110b] p-2 inline-block rounded-none">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={(e) => {
          if (e.button === 0) handleCanvasClick(e);
        }}
        onContextMenu={handleContextMenu}
        className="cursor-crosshair block rounded-none"
      />
      <div className="flex justify-between items-center text-sm font-vt323 text-[#fefae0] mt-2 px-1">
        <span>
          LEFT CLICK = <strong className="text-[#bc4749] font-pixel text-xs">Class A (+1)</strong>
        </span>
        <span>
          RIGHT CLICK = <strong className="text-[#386641] font-pixel text-xs">Class B (-1)</strong>
        </span>
      </div>
    </div>
  );
};
