"use client";

import React from "react";

interface PerceptronFormulaProps {
  type: "perceptron";
  w1: number;
  w2: number;
  bias: number;
}

interface GradientFormulaProps {
  type: "gradient-descent";
  learningRate: number;
  gradNorm?: number;
  currentLoss?: number;
}

interface NeuralNetFormulaProps {
  type: "neural-net";
}

type MathFormulaPanelProps = PerceptronFormulaProps | GradientFormulaProps | NeuralNetFormulaProps;

export const MathFormulaPanel: React.FC<MathFormulaPanelProps> = (props) => {
  return (
    <div
      className="w-full mt-4 bg-[#18110b] border-4 border-[#382219] p-4 shadow-[4px_4px_0px_0px_#0f0a07] rounded-none text-[#fefae0] font-vt323"
      id="math-formula-panel"
    >
      <div className="flex items-center justify-between border-b-2 border-[#382219] pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📐</span>
          <span className="font-pixel text-[10px] text-[#dda15e] uppercase tracking-wider">
            Mathematical Model &amp; Live Equation
          </span>
        </div>
        <span className="font-pixel text-[8px] text-[#8fc99a] bg-[#0c1510] px-2 py-0.5 border border-[#2a5c30]">
          REAL-TIME FORMULA
        </span>
      </div>

      {props.type === "perceptron" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* General Formula */}
          <div className="bg-[#120a06] p-3 border-2 border-[#2c1e15] space-y-1">
            <span className="font-pixel text-[8px] text-[#a3b18a] uppercase block">
              Linear Decision Boundary Equation:
            </span>
            <code className="text-xl text-[#fefae0] font-mono block">
              w₁ · x₁ + w₂ · x₂ + b = 0
            </code>
            <span className="text-sm text-[#8fc99a] block">
              Classification Rule: y = sign(w₁x₁ + w₂x₂ + b)
            </span>
          </div>

          {/* Substituted Live Values */}
          <div className="bg-[#120a06] p-3 border-2 border-[#5c3d2e] space-y-1">
            <span className="font-pixel text-[8px] text-[#dda15e] uppercase block">
              Live Model Parameter Substitution:
            </span>
            <code className="text-xl text-[#dda15e] font-mono block font-bold">
              {props.w1 >= 0 ? `+${props.w1.toFixed(2)}` : props.w1.toFixed(2)}·x₁{" "}
              {props.w2 >= 0 ? `+${props.w2.toFixed(2)}` : props.w2.toFixed(2)}·x₂{" "}
              {props.bias >= 0 ? `+${props.bias.toFixed(2)}` : props.bias.toFixed(2)} = 0
            </code>
            <span className="text-sm text-[#a3b18a] block">
              Updates in real-time as perceptron weights learn
            </span>
          </div>
        </div>
      )}

      {props.type === "gradient-descent" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* MSE Loss Formula */}
          <div className="bg-[#120a06] p-3 border-2 border-[#2c1e15] space-y-1">
            <span className="font-pixel text-[8px] text-[#a3b18a] uppercase block">
              Loss Function (Mean Squared Error):
            </span>
            <code className="text-xl text-[#fefae0] font-mono block">
              L(w) = ½N · ∑(yᵢ - ŷᵢ)²
            </code>
            <span className="text-sm text-[#8fc99a] block">
              Current Loss L: {props.currentLoss !== undefined ? props.currentLoss.toFixed(4) : "0.0000"}
            </span>
          </div>

          {/* Update Rule with Live Learning Rate */}
          <div className="bg-[#120a06] p-3 border-2 border-[#7a5225] space-y-1">
            <span className="font-pixel text-[8px] text-[#dda15e] uppercase block">
              Gradient Descent Weight Update Rule:
            </span>
            <code className="text-xl text-[#dda15e] font-mono block font-bold">
              w ← w - η · ∇L(w)
            </code>
            <div className="flex items-center justify-between text-sm text-[#a3b18a] pt-0.5">
              <span>Live Learning Rate (η): <strong className="text-[#dda15e]">{props.learningRate}</strong></span>
              {props.gradNorm !== undefined && (
                <span>|∇L|: <strong className="text-[#dda15e]">{props.gradNorm.toFixed(3)}</strong></span>
              )}
            </div>
          </div>
        </div>
      )}

      {props.type === "neural-net" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Forward Pass Equation */}
          <div className="bg-[#120a06] p-3 border-2 border-[#2c1e15] space-y-1">
            <span className="font-pixel text-[8px] text-[#a3b18a] uppercase block">
              2-Layer Deep Forward Pass:
            </span>
            <code className="text-xl text-[#fefae0] font-mono block">
              ŷ = σ( W₂ · σ( W₁ · x + b₁ ) + b₂ )
            </code>
            <span className="text-sm text-[#8fc99a] block">
              Non-linear composition allows solving complex boundaries (e.g. XOR)
            </span>
          </div>

          {/* Variable Breakdown */}
          <div className="bg-[#120a06] p-3 border-2 border-[#6b2123] space-y-1">
            <span className="font-pixel text-[8px] text-[#bc4749] uppercase block">
              Layer Component Map:
            </span>
            <div className="text-sm text-[#a3b18a] grid grid-cols-2 gap-x-2 gap-y-0.5">
              <span>• x: Input Vector</span>
              <span>• σ(z): Sigmoid 1/(1+e⁻ᶻ)</span>
              <span>• W₁, b₁: Hidden Layer</span>
              <span>• W₂, b₂: Output Layer</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
