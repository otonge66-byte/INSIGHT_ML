"use client";

import React, { useRef, useEffect } from "react";
import { LossPreset, Point2D } from "@/modules/gradient-descent/types";
import {
  computeLoss,
  canvasToCartesian,
  cartesianToCanvas,
} from "@/lib/ml/gradientDescent";

interface GradientDescentCanvasProps {
  path: Point2D[];
  preset: LossPreset;
  onSetStartPoint: (point: Point2D) => void;
  width?: number;
  height?: number;
  range?: number;
}

export const GradientDescentCanvas: React.FC<GradientDescentCanvasProps> = ({
  path,
  preset,
  onSetStartPoint,
  width = 600,
  height = 600,
  range = 5,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = "#18110b";
    ctx.fillRect(0, 0, width, height);

    // Render Loss Surface (Contour Heatmap Grid)
    const res = 40; // 40x40 grid
    const cellW = width / res;
    const cellH = height / res;

    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const px = (i + 0.5) * cellW;
        const py = (j + 0.5) * cellH;
        const { x, y } = canvasToCartesian(px, py, width, height, range);
        const loss = computeLoss(x, y, preset);

        // Warm Stardew Valley Loss Surface Gradient Mapping
        // Low loss = warm gold/cream, High loss = dark burgundy wood
        const normLoss = Math.min(1, loss / 25); // Normalize to [0, 1]

        // Color interpolation: Low loss (cream/gold) -> High loss (dark burgundy)
        const r = Math.round(221 - normLoss * 180); // 221 -> 41
        const g = Math.round(161 - normLoss * 140); // 161 -> 21
        const b = Math.round(94 - normLoss * 80);   // 94 -> 14
        const a = 0.45;

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
        ctx.fillRect(i * cellW, j * cellH, cellW, cellH);
      }
    }

    // Grid lines (muted warm timber)
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

    // Draw Contour Lines (Elevation Rings)
    const contourLevels = [0.5, 1.5, 3.5, 7.0, 12.0, 18.0, 25.0];
    ctx.strokeStyle = "rgba(221, 161, 94, 0.35)"; // Soft gold lines
    ctx.lineWidth = 1.5;

    // Draw concentric rings for bowl / valley presets
    contourLevels.forEach((level) => {
      ctx.beginPath();
      let first = true;
      const steps = 72;
      for (let s = 0; s <= steps; s++) {
        const angle = (s / steps) * Math.PI * 2;
        let rx = 0;
        let ry = 0;

        if (preset === "bowl") {
          const radius = Math.sqrt(level);
          rx = radius * Math.cos(angle);
          ry = radius * Math.sin(angle);
        } else if (preset === "valley") {
          rx = Math.sqrt(level / 0.5) * Math.cos(angle);
          ry = Math.sqrt(level / 2.5) * Math.sin(angle);
        } else {
          const radius = Math.sqrt(Math.max(0, level));
          rx = radius * Math.cos(angle);
          ry = radius * Math.sin(angle);
        }

        const { px, py } = cartesianToCanvas(rx, ry, width, height, range);
        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    });

    // Main Coordinate Axes
    ctx.strokeStyle = "#5c3d2e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = "#dda15e";
    ctx.font = "bold 14px monospace";
    ctx.fillText("x", width - 20, height / 2 - 8);
    ctx.fillText("y", width / 2 + 10, 20);

    // Target Global Minimum Marker (0,0)
    const minCanvas = cartesianToCanvas(0, 0, width, height, range);
    ctx.fillStyle = "#dda15e";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★", minCanvas.px, minCanvas.py);

    // Draw Trajectory Path
    if (path.length > 0) {
      // Connecting path line
      ctx.strokeStyle = "#bc4749"; // Terracotta Red path line
      ctx.lineWidth = 3;
      ctx.beginPath();

      path.forEach((pt, idx) => {
        const { px, py } = cartesianToCanvas(pt.x, pt.y, width, height, range);
        if (idx === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      });
      ctx.stroke();

      // Step dots along path
      path.forEach((pt, idx) => {
        const { px, py } = cartesianToCanvas(pt.x, pt.y, width, height, range);

        // Start point
        if (idx === 0) {
          ctx.fillStyle = "#dda15e"; // Gold start dot
          ctx.strokeStyle = "#18110b";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#18110b";
          ctx.font = "bold 10px monospace";
          ctx.fillText("S", px, py);
        } else if (idx === path.length - 1) {
          // Current head position
          ctx.fillStyle = "#386641"; // Forest Green current head
          ctx.strokeStyle = "#fefae0";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(px, py, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#fefae0";
          ctx.font = "bold 12px monospace";
          ctx.fillText("●", px, py);
        } else {
          // Intermediate step dot
          ctx.fillStyle = "#fefae0";
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
  }, [path, preset, width, height, range]);

  // Click canvas to select a new starting point
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const cartesian = canvasToCartesian(px, py, width, height, range);
    onSetStartPoint({
      x: Number(cartesian.x.toFixed(3)),
      y: Number(cartesian.y.toFixed(3)),
    });
  };

  return (
    <div className="relative border-4 border-[#382219] shadow-[8px_8px_0px_0px_#0f0a07] bg-[#18110b] p-2 inline-block rounded-none">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        className="cursor-crosshair block rounded-none"
      />
      <div className="flex justify-between items-center text-sm font-vt323 text-[#fefae0] mt-2 px-1">
        <span>
          CLICK CANVAS = <strong className="text-[#dda15e] font-pixel text-xs">Set Start Point (x0, y0)</strong>
        </span>
        <span>
          GLOBAL MINIMUM = <strong className="text-[#dda15e]">★ (0, 0)</strong>
        </span>
      </div>
    </div>
  );
};
