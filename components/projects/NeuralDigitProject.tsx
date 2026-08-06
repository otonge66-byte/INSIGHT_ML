"use client";

import React, { useState, useRef, useEffect } from "react";
import { ByteSprite } from "@/components/sprites/ByteSprite";

// 16x16 = 256 input neurons
const GRID_SIZE = 16;
const INPUT_NEURONS = 256;
const HIDDEN_NEURONS = 16;
const OUTPUT_NEURONS = 10; // Digits 0-9

// Simple deterministic weight matrices for pure TS forward pass
const W1: number[][] = Array.from({ length: HIDDEN_NEURONS }, (_, h) =>
  Array.from({ length: INPUT_NEURONS }, (_, i) => {
    // Generate spatial feature receptive fields (edges, loops, diagonals)
    const row = Math.floor(i / GRID_SIZE);
    const col = i % GRID_SIZE;
    const centerDist = Math.sqrt((row - 8) ** 2 + (col - 8) ** 2);
    if (h === 0) return centerDist < 4 ? 1.2 : -0.5; // Circle / loop detector
    if (h === 1) return col < 5 ? 1.5 : -0.3; // Left vertical edge
    if (h === 2) return col > 11 ? 1.5 : -0.3; // Right vertical edge
    if (h === 3) return row < 5 ? 1.5 : -0.3; // Top horizontal bar
    if (h === 4) return row > 11 ? 1.5 : -0.3; // Bottom horizontal bar
    if (h === 5) return Math.abs(row - col) < 2 ? 1.4 : -0.4; // Main diagonal
    if (h === 6) return Math.abs(row + col - 15) < 2 ? 1.4 : -0.4; // Anti-diagonal
    if (h === 7) return row === Math.floor(GRID_SIZE / 2) ? 1.5 : -0.2; // Middle horizontal
    return (Math.sin(h * 3 + i * 7) * 0.8);
  })
);

const W2: number[][] = Array.from({ length: OUTPUT_NEURONS }, (_, o) =>
  Array.from({ length: HIDDEN_NEURONS }, (_, h) => {
    if (o === 0) return h === 0 || h === 1 || h === 2 || h === 3 || h === 4 ? 1.2 : -0.4;
    if (o === 1) return h === 1 || h === 2 ? 1.8 : -0.5;
    if (o === 2) return h === 3 || h === 7 || h === 4 || h === 6 ? 1.5 : -0.4;
    if (o === 3) return h === 3 || h === 7 || h === 4 || h === 2 ? 1.5 : -0.4;
    if (o === 4) return h === 1 || h === 7 || h === 2 ? 1.6 : -0.4;
    if (o === 7) return h === 3 || h === 6 ? 1.8 : -0.5;
    if (o === 8) return h === 0 || h === 7 ? 1.6 : -0.3;
    return (Math.cos(o * 5 + h * 11) * 0.9);
  })
);

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export const NeuralDigitProject: React.FC = () => {
  const [pixels, setPixels] = useState<number[]>(Array(256).fill(0));
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Paint pixel on click or drag
  const paintPixel = (index: number) => {
    setPixels((prev) => {
      const next = [...prev];
      next[index] = 1.0;
      // Add subtle brush diffusion to adjacent pixels
      const row = Math.floor(index / GRID_SIZE);
      const col = index % GRID_SIZE;
      [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ].forEach(([r, c]) => {
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
          const adjIdx = r * GRID_SIZE + c;
          next[adjIdx] = Math.min(1.0, next[adjIdx] + 0.35);
        }
      });
      return next;
    });
  };

  const clearCanvas = () => setPixels(Array(256).fill(0));

  // Load preset sample drawing
  const loadPreset = (type: "zero" | "one" | "seven" | "square") => {
    const newPix = Array(256).fill(0);
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        const idx = r * 16 + c;
        if (type === "zero" && (r === 3 || r === 12 || c === 3 || c === 12) && r >= 3 && r <= 12 && c >= 3 && c <= 12) {
          newPix[idx] = 1;
        } else if (type === "one" && c === 8 && r >= 2 && r <= 13) {
          newPix[idx] = 1;
        } else if (type === "seven" && (r === 3 || (r > 3 && c === 15 - r + 3))) {
          if (r >= 3 && r <= 13) newPix[idx] = 1;
        } else if (type === "square" && (r === 4 || r === 11 || c === 4 || c === 11) && r >= 4 && r <= 11 && c >= 4 && c <= 11) {
          newPix[idx] = 1;
        }
      }
    }
    setPixels(newPix);
  };

  // ── Pure TypeScript Forward Pass ──────────────────────────────────────────
  // Layer 1: 256 inputs -> 16 hidden neurons
  const hiddenActivations = W1.map((wRow) => {
    const dot = wRow.reduce((sum, w, i) => sum + w * pixels[i], -1.0);
    return sigmoid(dot);
  });

  // Layer 2: 16 hidden -> 10 output classes
  const rawOutputs = W2.map((wRow) => {
    const dot = wRow.reduce((sum, w, h) => sum + w * hiddenActivations[h], -0.5);
    return sigmoid(dot);
  });

  // Softmax normalization for probabilities
  const sumExp = rawOutputs.reduce((acc, val) => acc + Math.exp(val * 3), 0);
  const probabilities = rawOutputs.map((val) => (Math.exp(val * 3) / sumExp) * 100);
  const predictedDigit = probabilities.indexOf(Math.max(...probabilities));

  return (
    <div className="space-y-6 text-[#fefae0]">
      {/* BYTE Capstone Hero Box */}
      <div className="bg-[#18110b] border-4 border-[#bc4749] p-5 shadow-[6px_6px_0px_#0f0a07] relative flex flex-col md:flex-row gap-5 items-start">
        <div className="flex-shrink-0 bg-[#120a06] border-2 border-[#6b2123] p-3 flex flex-col items-center gap-1 shadow-[2px_2px_0px_#050d07]">
          <ByteSprite scale={3} />
          <span className="font-pixel text-[8px] text-[#bc4749]">BYTE CAPSTONE</span>
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[9px] bg-[#bc4749] text-[#fefae0] px-2 py-0.5 border border-[#3d1214] uppercase font-bold">
              CAPSTONE PROJECT 03
            </span>
            <span className="font-pixel text-[8px] text-[#bc4749]">
              2-LAYER DEEP NEURAL NET (3BLUE1BROWN MODEL)
            </span>
          </div>

          <h2 className="font-pixel text-xl text-[#bc4749] uppercase tracking-wide">
            16×16 Hand-Drawn Digit &amp; Shape Recognizer
          </h2>

          <p className="text-lg leading-relaxed text-[#fefae0] font-vt323">
            Inspired by 3Blue1Brown&apos;s famous MNIST neural network explanation! Draw on the 16×16 grid below. Your 256 pixel values feed directly into a 2-layer neural network written in pure TypeScript (256 Inputs → 16 Hidden Neurons → 10 Outputs).
          </p>

          <div className="text-base text-[#a3b18a] bg-[#120a06] p-2 border border-[#6b2123] font-vt323">
            🏆 <strong>Capstone Note:</strong> Don&apos;t be intimidated if this looks complex at first! Draw digits or shapes and watch how hidden feature neurons light up in real time!
          </div>
        </div>
      </div>

      {/* Main Grid: 16x16 Canvas + Hidden Neuron Activations + Confidence Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: 16x16 Drawing Grid */}
        <div className="lg:col-span-4 bg-[#281b12] border-4 border-[#382219] p-4 shadow-[6px_6px_0px_#0f0a07] space-y-3 flex flex-col items-center">
          <div className="w-full flex items-center justify-between border-b-2 border-[#382219] pb-2">
            <span className="font-pixel text-[9px] text-[#dda15e] uppercase">
              1. Draw Digit / Shape (16×16)
            </span>
            <span className="font-pixel text-[8px] text-[#a3b18a]">256 INPUTS</span>
          </div>

          {/* 16x16 Grid */}
          <div
            className="grid grid-cols-16 gap-0 border-2 border-[#dda15e] bg-[#0f0a07] p-1 select-none cursor-crosshair shadow-[2px_2px_0px_#000]"
            style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))", width: "240px", height: "240px" }}
            onMouseDown={() => setIsMouseDown(true)}
            onMouseUp={() => setIsMouseDown(false)}
            onMouseLeave={() => setIsMouseDown(false)}
          >
            {pixels.map((val, idx) => (
              <div
                key={idx}
                onMouseDown={() => paintPixel(idx)}
                onMouseEnter={() => isMouseDown && paintPixel(idx)}
                className="w-full h-full border-[0.5px] border-[#2c1e15]"
                style={{
                  backgroundColor: `rgba(254, 250, 224, ${val})`,
                }}
              />
            ))}
          </div>

          {/* Preset & Clear Buttons */}
          <div className="w-full space-y-2 pt-1">
            <div className="flex gap-1.5 justify-center flex-wrap">
              <button
                onClick={() => loadPreset("zero")}
                className="bg-[#18110b] hover:bg-[#382219] text-[#dda15e] border border-[#5c3d2e] px-2 py-1 font-pixel text-[8px] uppercase transition-colors"
              >
                Draw &apos;0&apos;
              </button>
              <button
                onClick={() => loadPreset("one")}
                className="bg-[#18110b] hover:bg-[#382219] text-[#dda15e] border border-[#5c3d2e] px-2 py-1 font-pixel text-[8px] uppercase transition-colors"
              >
                Draw &apos;1&apos;
              </button>
              <button
                onClick={() => loadPreset("seven")}
                className="bg-[#18110b] hover:bg-[#382219] text-[#dda15e] border border-[#5c3d2e] px-2 py-1 font-pixel text-[8px] uppercase transition-colors"
              >
                Draw &apos;7&apos;
              </button>
              <button
                onClick={() => loadPreset("square")}
                className="bg-[#18110b] hover:bg-[#382219] text-[#dda15e] border border-[#5c3d2e] px-2 py-1 font-pixel text-[8px] uppercase transition-colors"
              >
                Square
              </button>
            </div>
            <button
              onClick={clearCanvas}
              className="w-full bg-[#3d1214] hover:bg-[#6b2123] text-[#f87171] border border-[#bc4749] font-pixel text-[9px] uppercase py-1.5 transition-colors cursor-pointer"
            >
              🧹 Clear Drawing Canvas
            </button>
          </div>
        </div>

        {/* Column 2: 16 Hidden Neuron Activation Diagram */}
        <div className="lg:col-span-4 bg-[#281b12] border-4 border-[#382219] p-4 shadow-[6px_6px_0px_#0f0a07] space-y-3">
          <div className="flex items-center justify-between border-b-2 border-[#382219] pb-2">
            <span className="font-pixel text-[9px] text-[#bc4749] uppercase">
              2. Hidden Layer (16 Feature Neurons)
            </span>
            <span className="font-pixel text-[8px] text-[#a3b18a]">SIGMOID σ(z)</span>
          </div>

          <p className="text-xs text-[#a3b18a] font-vt323 leading-snug">
            Each neuron below detects spatial feature patterns (edges, loops, diagonals) extracted from your drawing.
          </p>

          {/* 4x4 Grid of Hidden Neurons */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {hiddenActivations.map((act, hIdx) => {
              const glowPct = Math.round(act * 100);
              return (
                <div
                  key={hIdx}
                  className="bg-[#120a06] border-2 border-[#5c3d2e] p-2 flex flex-col items-center justify-center gap-1 transition-all"
                  style={{
                    borderColor: act > 0.6 ? "#bc4749" : "#382219",
                    backgroundColor: `rgba(188, 71, 73, ${act * 0.4})`,
                  }}
                >
                  <span className="font-pixel text-[7px] text-[#dda15e]">H_{hIdx + 1}</span>
                  <div
                    className="w-4 h-4 rounded-none border border-[#bc4749]"
                    style={{
                      backgroundColor: `rgba(254, 250, 224, ${act})`,
                      boxShadow: act > 0.6 ? "0 0 8px #bc4749" : "none",
                    }}
                  />
                  <span className="font-vt323 text-xs text-[#a3b18a]">{glowPct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Live Output Confidence Bar Chart */}
        <div className="lg:col-span-4 bg-[#281b12] border-4 border-[#382219] p-4 shadow-[6px_6px_0px_#0f0a07] space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b-2 border-[#382219] pb-2 mb-3">
              <span className="font-pixel text-[9px] text-[#7ecb8a] uppercase">
                3. Output Classification
              </span>
              <span className="font-pixel text-[8px] text-[#a3b18a]">SOFTMAX 0-9</span>
            </div>

            {/* Prediction Highlight */}
            <div className="bg-[#120a06] border-2 border-[#386641] p-3 text-center mb-3">
              <span className="font-pixel text-[8px] text-[#7ecb8a] uppercase block">PREDICTED CLASS</span>
              <p className="font-pixel text-3xl text-[#7ecb8a] font-bold mt-0.5">
                DIGIT &quot;{predictedDigit}&quot;
              </p>
            </div>

            {/* 10 Bar Distribution */}
            <div className="space-y-1 font-vt323 text-xs">
              {probabilities.map((prob, digit) => {
                const isMax = digit === predictedDigit;
                return (
                  <div key={digit} className="flex items-center gap-2">
                    <span className={`w-4 font-bold font-pixel text-[9px] ${isMax ? "text-[#7ecb8a]" : "text-[#a3b18a]"}`}>
                      {digit}
                    </span>
                    <div className="flex-1 bg-[#0f0a07] h-3 border border-[#382219]">
                      <div
                        className={`h-full transition-all duration-200 ${
                          isMax ? "bg-[#7ecb8a]" : "bg-[#5c3d2e]"
                        }`}
                        style={{ width: `${Math.max(2, prob)}%` }}
                      />
                    </div>
                    <span className={`w-10 text-right font-mono ${isMax ? "text-[#7ecb8a] font-bold" : "text-[#a3b18a]"}`}>
                      {prob.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#120a06] p-2 border border-[#382219] text-sm text-[#a3b18a] font-vt323 leading-tight mt-2">
            💬 <strong>BYTE Capstone Message:</strong> &ldquo;Congratulations on reaching the capstone! You&apos;ve seen how single neurons, optimization curves, and multi-layer networks connect to recognize complex patterns.&rdquo;
          </div>
        </div>
      </div>
    </div>
  );
};
