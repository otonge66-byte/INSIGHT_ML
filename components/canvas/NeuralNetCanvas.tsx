"use client";

import React, { useRef, useEffect } from "react";
import { NNDataPoint, LayerWeightInfo } from "@/modules/neural-net/types";
import { cartesianToCanvas, canvasToCartesian } from "@/lib/ml/neural-net";

interface NeuralNetCanvasProps {
  points: NNDataPoint[];
  predictionGrid: Float32Array | null; // flat gridRes×gridRes sigmoid values
  gridRes?: number;
  layerWeights: LayerWeightInfo[];
  onAddPoint: (point: NNDataPoint) => void;
  width?: number;
  height?: number;
}

export const NeuralNetCanvas: React.FC<NeuralNetCanvasProps> = ({
  points,
  predictionGrid,
  gridRes = 50,
  layerWeights,
  onAddPoint,
  width = 560,
  height = 560,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nodeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // ── Main decision boundary canvas ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#18110b";
    ctx.fillRect(0, 0, width, height);

    // Prediction grid — coloured region
    if (predictionGrid && predictionGrid.length === gridRes * gridRes) {
      const cellW = width / gridRes;
      const cellH = height / gridRes;
      // row-major: index = j*gridRes + i  (j=row, i=col)
      for (let j = 0; j < gridRes; j++) {
        for (let i = 0; i < gridRes; i++) {
          const val = predictionGrid[j * gridRes + i]; // 0‒1 sigmoid
          const px = i * cellW;
          const py = j * cellH;
          if (val > 0.5) {
            // Class A region — terracotta
            const alpha = Math.min(0.45, (val - 0.5) * 1.2);
            ctx.fillStyle = `rgba(188, 71, 73, ${alpha})`;
          } else {
            // Class B region — forest green
            const alpha = Math.min(0.45, (0.5 - val) * 1.2);
            ctx.fillStyle = `rgba(56, 102, 65, ${alpha})`;
          }
          ctx.fillRect(px, py, cellW + 0.5, cellH + 0.5); // +0.5 avoids seams
        }
      }

      // Draw contour line at 0.5 decision boundary (golden ochre)
      ctx.strokeStyle = "#dda15e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      let lineStarted = false;
      for (let j = 0; j < gridRes - 1; j++) {
        for (let i = 0; i < gridRes - 1; i++) {
          const v00 = predictionGrid[j * gridRes + i];
          const v10 = predictionGrid[j * gridRes + i + 1];
          const v01 = predictionGrid[(j + 1) * gridRes + i];
          // If sign changes between adjacent cells, draw a dot there
          const cellW2 = width / gridRes;
          const cellH2 = height / gridRes;
          if ((v00 - 0.5) * (v10 - 0.5) < 0 || (v00 - 0.5) * (v01 - 0.5) < 0) {
            const px = (i + 0.5) * cellW2;
            const py = (j + 0.5) * cellH2;
            if (!lineStarted) {
              ctx.moveTo(px, py);
              lineStarted = true;
            } else {
              ctx.lineTo(px, py);
            }
          }
        }
      }
      ctx.stroke();
    } else {
      // No grid yet — show neutral warm tint
      ctx.fillStyle = "rgba(92, 61, 46, 0.15)";
      ctx.fillRect(0, 0, width, height);
    }

    // Grid lines
    ctx.strokeStyle = "#2c1e15";
    ctx.lineWidth = 1;
    const gridStep = width / 10;
    for (let x = 0; x <= width; x += gridStep) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridStep) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = "#5c3d2e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = "#dda15e";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText("x1", width - 22, height / 2 - 6);
    ctx.fillText("x2", width / 2 + 7, 18);

    // Data points
    points.forEach((p) => {
      const { px, py } = cartesianToCanvas(p.x, p.y, width, height);
      const isA = p.label === 1;

      ctx.fillStyle = isA ? "#bc4749" : "#386641";
      ctx.strokeStyle = "#fefae0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#fefae0";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(isA ? "+" : "−", px, py);
    });
  }, [points, predictionGrid, gridRes, width, height]);

  // ── Node & connection diagram canvas ─────────────────────────────────────
  useEffect(() => {
    const canvas = nodeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const nW = canvas.width;
    const nH = canvas.height;
    ctx.clearRect(0, 0, nW, nH);
    ctx.fillStyle = "#18110b";
    ctx.fillRect(0, 0, nW, nH);

    if (layerWeights.length === 0) {
      ctx.fillStyle = "#a3b18a";
      ctx.font = "13px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Add points & train to see weights", nW / 2, nH / 2);
      return;
    }

    // Build layer sizes: [2(input), ...hidden sizes..., 1(output)]
    const layerSizes: number[] = [2];
    for (const lw of layerWeights) {
      layerSizes.push(lw.outputSize);
    }
    const numLayers = layerSizes.length;
    const colSpacing = nW / (numLayers + 1);
    const MAX_NODES_DRAWN = 8; // cap for visual clarity

    // Compute node positions
    const nodePositions: { x: number; y: number }[][] = [];
    for (let l = 0; l < numLayers; l++) {
      const size = Math.min(layerSizes[l], MAX_NODES_DRAWN);
      const positions: { x: number; y: number }[] = [];
      const colX = colSpacing * (l + 1);
      const vSpacing = nH / (size + 1);
      for (let n = 0; n < size; n++) {
        positions.push({ x: colX, y: vSpacing * (n + 1) });
      }
      nodePositions.push(positions);
    }

    // Draw connections (weighted thickness + colour)
    for (let l = 0; l < layerWeights.length; l++) {
      const lw = layerWeights[l];
      const fromNodes = nodePositions[l];
      const toNodes = nodePositions[l + 1];
      const maxW = Math.max(...lw.weights.flat().map(Math.abs), 0.01);

      for (let i = 0; i < Math.min(fromNodes.length, lw.inputSize); i++) {
        for (let o = 0; o < Math.min(toNodes.length, lw.outputSize); o++) {
          const rawW = lw.weights[i]?.[o] ?? 0;
          const normW = rawW / maxW; // [-1, 1]
          const alpha = Math.min(0.9, Math.abs(normW) * 0.8 + 0.1);
          const thickness = Math.max(0.5, Math.abs(normW) * 3);

          if (normW > 0) {
            ctx.strokeStyle = `rgba(221, 161, 94, ${alpha})`; // warm gold — positive
          } else {
            ctx.strokeStyle = `rgba(188, 71, 73, ${alpha})`; // terracotta — negative
          }
          ctx.lineWidth = thickness;
          ctx.beginPath();
          ctx.moveTo(fromNodes[i].x, fromNodes[i].y);
          ctx.lineTo(toNodes[o].x, toNodes[o].y);
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    const nodeRadius = 10;
    const layerLabels = ["IN", ...Array(layerWeights.length - 1).fill("H"), "OUT"];
    nodePositions.forEach((layer, lIdx) => {
      layer.forEach((pos) => {
        const isInput = lIdx === 0;
        const isOutput = lIdx === numLayers - 1;
        ctx.fillStyle = isInput ? "#dda15e" : isOutput ? "#bc4749" : "#386641";
        ctx.strokeStyle = "#fefae0";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // Layer label below column
      ctx.fillStyle = "#a3b18a";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(layerLabels[Math.min(lIdx, layerLabels.length - 1)], layer[0]?.x ?? 0, nH - 14);
    });
  }, [layerWeights]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const { x, y } = canvasToCartesian(px, py, width, height);
    const label: 0 | 1 = e.button === 2 ? 0 : 1;
    onAddPoint({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
      label,
    });
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleClick(e);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Decision Boundary Canvas */}
      <div className="relative border-4 border-[#382219] shadow-[8px_8px_0px_0px_#0f0a07] bg-[#18110b] p-2 inline-block rounded-none">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onClick={(e) => { if (e.button === 0) handleClick(e); }}
          onContextMenu={handleContextMenu}
          className="cursor-crosshair block rounded-none"
        />
        <div className="flex justify-between items-center text-sm font-vt323 text-[#fefae0] mt-2 px-1">
          <span>LEFT CLICK = <strong className="text-[#bc4749] font-pixel text-[10px]">Class A (+1)</strong></span>
          <span>RIGHT CLICK = <strong className="text-[#386641] font-pixel text-[10px]">Class B (0)</strong></span>
        </div>
      </div>

      {/* Node & Connection Diagram */}
      <div className="border-4 border-[#382219] shadow-[4px_4px_0px_0px_#0f0a07] bg-[#18110b] p-2 rounded-none">
        <div className="font-pixel text-[10px] text-[#a3b18a] mb-1 uppercase">
          Network Diagram — weight colour: <span className="text-[#dda15e]">■ positive</span> / <span className="text-[#bc4749]">■ negative</span>
        </div>
        <canvas ref={nodeCanvasRef} width={width} height={100} className="block rounded-none" />
      </div>
    </div>
  );
};
