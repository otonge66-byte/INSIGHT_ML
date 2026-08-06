"use client";

import React, { useRef, useEffect, useState } from "react";
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
  const [placementClass, setPlacementClass] = useState<1 | -1>(1);
  const [kbCursor, setKbCursor] = useState<{ x: number; y: number } | null>(null);

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

    // Keyboard navigation cursor (blinking crosshair outline)
    if (kbCursor) {
      const { px, py } = cartesianToCanvas(kbCursor.x, kbCursor.y, width, height);
      ctx.strokeStyle = "#dda15e";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      // Horizontal crosshair line
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      // Vertical crosshair line
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();
      ctx.setLineDash([]); // reset

      // Target ring
      ctx.strokeStyle = "#fefae0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [points, weights, width, height, kbCursor]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const { x, y } = canvasToCartesian(px, py, width, height);
    // Right-click places opposite class, left-click places placementClass
    const label: 1 | -1 = e.button === 2 ? (placementClass === 1 ? -1 : 1) : placementClass;

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (!kbCursor) return;

    const step = 0.05;
    let nextX = kbCursor.x;
    let nextY = kbCursor.y;
    let handled = false;

    if (e.key === "ArrowUp") {
      nextY = Math.min(1.0, kbCursor.y + step);
      handled = true;
    } else if (e.key === "ArrowDown") {
      nextY = Math.max(-1.0, kbCursor.y - step);
      handled = true;
    } else if (e.key === "ArrowLeft") {
      nextX = Math.max(-1.0, kbCursor.x - step);
      handled = true;
    } else if (e.key === "ArrowRight") {
      nextX = Math.min(1.0, kbCursor.x + step);
      handled = true;
    } else if (e.key === " " || e.key === "1") {
      // Place Class A point
      onAddPoint({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        x: Number(kbCursor.x.toFixed(4)),
        y: Number(kbCursor.y.toFixed(4)),
        label: 1,
      });
      handled = true;
    } else if (e.key === "Enter" || e.key === "2") {
      // Place Class B point
      onAddPoint({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        x: Number(kbCursor.x.toFixed(4)),
        y: Number(kbCursor.y.toFixed(4)),
        label: -1,
      });
      handled = true;
    }

    if (handled) {
      e.preventDefault();
      setKbCursor({ x: nextX, y: nextY });
    }
  };

  return (
    <div 
      className="relative border-4 border-[#382219] shadow-[8px_8px_0px_0px_#0f0a07] bg-[#18110b] p-2 inline-block rounded-none w-full max-w-[624px]"
      aria-label="Interactive classification canvas. Click or tap to place data points. Focus the canvas and use arrow keys to navigate a crosshair, pressing Space/1 for Class A (+1) or Enter/2 for Class B (-1)."
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        tabIndex={0}
        onClick={(e) => {
          if (e.button === 0) handleCanvasClick(e);
        }}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        onFocus={() => setKbCursor({ x: 0, y: 0 })}
        onBlur={() => setKbCursor(null)}
        className="cursor-crosshair block rounded-none w-full aspect-square bg-[#18110b] focus:outline-none"
      />
      
      {/* Screen Reader coordinate updates */}
      {kbCursor && (
        <span className="sr-only" aria-live="polite">
          Crosshair position: X: {kbCursor.x.toFixed(2)}, Y: {kbCursor.y.toFixed(2)}
        </span>
      )}

      {/* Placement class toggle for touch/mobile screens */}
      <div className="flex items-center justify-between mt-3 px-1 border-t border-[#2c1e15] pt-3 w-full">
        <span className="font-pixel text-[10px] text-[#a3b18a] uppercase">Active Brush:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setPlacementClass(1)}
            className={`font-pixel text-[10px] px-3 py-1 border-2 transition-all cursor-pointer ${
              placementClass === 1 
                ? "bg-[#bc4749] text-[#fefae0] border-[#bc4749]" 
                : "bg-transparent text-[#bc4749] border-[#382219] hover:border-[#bc4749]"
            }`}
          >
            Class A (+)
          </button>
          <button
            onClick={() => setPlacementClass(-1)}
            className={`font-pixel text-[10px] px-3 py-1 border-2 transition-all cursor-pointer ${
              placementClass === -1 
                ? "bg-[#386641] text-[#fefae0] border-[#386641]" 
                : "bg-transparent text-[#386641] border-[#382219] hover:border-[#386641]"
            }`}
          >
            Class B (−)
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] font-pixel text-[#fefae0] mt-3 px-1 border-t border-[#2c1e15] pt-2">
        <span>
          TAP = <strong className="text-[#dda15e]">Place Active</strong>
        </span>
        <span className="hidden sm:inline">
          RIGHT CLICK = <strong className="text-[#a3b18a]">Place Opposite</strong>
        </span>
      </div>
    </div>
  );
};
