"use client";

import React, { useState } from "react";
import { ByteSprite } from "@/components/sprites/ByteSprite";

export const GradientHouseProject: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const STEPS = [
    {
      title: "1. The Goal: Valuing Property at Scale",
      content: (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed text-[#c8ecd0]">
            When buying or selling a home, accurately predicting market value is critical. Platforms like Zillow analyze millions of property records to estimate a fair market price based on continuous characteristics like square footage, bedroom count, and location.
          </p>
          <div className="bg-[#1e140e] border-2 border-[#382219] p-4 font-vt323 text-lg space-y-2">
            <div className="text-[#dda15e] font-pixel text-[10px] mb-2">🏘️ REAL-WORLD TASK</div>
            <p className="text-sm text-[#a3b18a]">
              Unlike classification models that output a simple YES or NO, pricing estimators must output a precise dollar amount. By formulating a continuous linear model and defining a Mean Squared Error (MSE) loss function over historical sales data, Gradient Descent iteratively tunes the pricing weights to minimize error and hit the target price.
            </p>
          </div>
          <p className="text-base text-[#a3b18a]">
            Let&apos;s explore how a real estate estimator uses gradient descent to step downhill to optimal valuation weights!
          </p>
        </div>
      ),
    },
    {
      title: "2. Inputs & Parameters Mapping",
      content: (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed text-[#c8ecd0]">
            Unlike the Perceptron classification model, a real estate pricing estimator outputs a continuous value (price in thousands of dollars). We map continuous inputs: square footage (<code className="text-[#dda15e] bg-[#1e140e] px-1.5">x₁</code>) and bedrooms count (<code className="text-[#dda15e] bg-[#1e140e] px-1.5">x₂</code>).
          </p>
          <div className="bg-[#1e140e] border-2 border-[#382219] p-4 font-vt323 text-lg space-y-2">
            <div className="text-[#dda15e] font-pixel text-[10px] mb-2">🏘️ LINEAR PRICING REGRESSION MODEL</div>
            <div className="text-center py-2 bg-[#120c08] border border-[#2e1d14] rounded">
              <code className="text-xl text-[#fefae0] font-bold">Estimated Price (ŷ) = w₁ · x₁ + w₂ · x₂ + bias</code>
            </div>
            <p className="text-[#a3b18a] text-sm mt-2">
              Here, <code className="text-[#dda15e]">w₁</code> represents the dollar rate per square foot, <code className="text-[#dda15e]">w₂</code> is the price added per bedroom, and <code className="text-[#dda15e]">bias</code> is the baseline property value.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "3. Loss / Error Formulation",
      content: (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed text-[#c8ecd0]">
            To find the best weights, we measure how far our model estimates are from actual neighborhood sales using the Mean Squared Error (MSE) loss function.
          </p>
          <div className="bg-[#1e140e] border-2 border-[#382219] p-4 font-vt323 text-lg space-y-2">
            <div className="text-[#dda15e] font-pixel text-[10px] mb-2">📉 MEAN SQUARED ERROR (MSE) LOSS</div>
            <div className="text-center py-2 bg-[#120c08] border border-[#2e1d14] rounded">
              <code className="text-xl text-[#fefae0] font-bold">L(w, b) = 1/(2N) * Σ (ŷ_i - y_i)²</code>
            </div>
            <p className="text-[#a3b18a] text-sm mt-2">
              Squared errors penalize larger miscalculations heavily, guiding the optimization model to avoid massive predictive errors.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "4. Gradient Descent Steps",
      content: (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed text-[#c8ecd0]">
            Gradient Descent calculates the slope (gradient) of the loss surface with respect to parameters <code className="text-[#dda15e]">w</code> and <code className="text-[#dda15e]">b</code>. We then adjust the parameters downhill by subtraction:
          </p>
          <div className="bg-[#1e140e] border-2 border-[#382219] p-4 font-vt323 text-lg space-y-2">
            <div className="text-[#dda15e] font-pixel text-[10px] mb-2">⚙️ THE UPDATE STEP</div>
            <div className="grid grid-cols-1 gap-2 text-center">
              <div className="py-1 bg-[#120c08] border border-[#2e1d14] rounded">
                <code className="text-md text-[#fefae0] font-bold">w₁ ← w₁ - η · ∂L/∂w₁</code>
              </div>
              <div className="py-1 bg-[#120c08] border border-[#2e1d14] rounded">
                <code className="text-md text-[#fefae0] font-bold">w₂ ← w₂ - η · ∂L/∂w₂</code>
              </div>
              <div className="py-1 bg-[#120c08] border border-[#2e1d14] rounded">
                <code className="text-md text-[#fefae0] font-bold">bias ← bias - η · ∂L/∂bias</code>
              </div>
            </div>
            <p className="text-[#a3b18a] text-sm mt-2">
              By taking multiple iteration steps against the gradient direction, the pricing model converges on the optimal weight values.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "5. Python Implementation",
      content: (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed text-[#c8ecd0]">
            A complete linear regression estimator optimized via manual batch gradient descent:
          </p>
          <div className="bg-[#1e140e] border-2 border-[#382219] p-3 font-mono text-xs overflow-x-auto text-[#a3b18a]">
            <pre>{`class PriceEstimatorGD:
    def __init__(self, lr=0.0001):
        self.w = [0.1, 10.0] # w1 (sqft rate), w2 (beds rate)
        self.b = 50.0        # baseline bias
        self.lr = lr

    def predict(self, sqft, beds):
        return self.w[0] * sqft + self.w[1] * beds + self.b

    def train_step(self, data):
        # Compute gradients
        grad_w1, grad_w2, grad_b = 0, 0, 0
        N = len(data)
        for sqft, beds, actual_price in data:
            pred = self.predict(sqft, beds)
            err = pred - actual_price
            grad_w1 += err * sqft
            grad_w2 += err * beds
            grad_b += err
            
        # Update weights downhill
        self.w[0] -= self.lr * (grad_w1 / N)
        self.w[1] -= self.lr * (grad_w2 / N)
        self.b -= self.lr * (grad_b / N)
`}</pre>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-[#fefae0]">
      {/* BYTE Hero Narration Box */}
      <div className="bg-[#18110b] border-4 border-[#386641] p-5 shadow-[6px_6px_0px_#0f0a07] relative flex flex-col md:flex-row gap-5 items-start">
        <div className="flex-shrink-0 bg-[#0d150e] border-2 border-[#2a5c30] p-3 flex flex-col items-center gap-1 shadow-[2px_2px_0px_#050d07]">
          <ByteSprite scale={3} />
          <span className="font-pixel text-[8px] text-[#7ecb8a]">BYTE GUIDE</span>
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[9px] bg-[#dda15e] text-[#1e140e] px-2 py-0.5 border border-[#7a5225] uppercase">
              MODULE 02 • APPLIED PROJECT
            </span>
            <span className="font-pixel text-[8px] text-[#dda15e]">
              GRADIENT HOUSE ESTIMATOR
            </span>
          </div>

          <h2 className="font-pixel text-xl text-[#dda15e] uppercase tracking-wide">
            Building a Real Estate House Price Estimator with Gradient Descent
          </h2>

          <p className="text-lg leading-relaxed text-[#c8ecd0] font-vt323">
            Incredible work navigating the loss surfaces and learning rates in the Mountain visualizer! You&apos;ve mastered how gradient vectors guide parameters downhill to find the minimum error. Now, let&apos;s look at how this exact optimization technique is used to solve real-world continuous estimation problems. This is the core algorithm behind automated valuation engines used by platforms like Zillow, Redfin, and financial forecasting systems!
          </p>
        </div>
      </div>

      {/* Blueprint Tabs & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tab list */}
        <div className="lg:col-span-4 space-y-2">
          {STEPS.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`w-full text-left font-pixel text-[11px] uppercase p-4 border-4 transition-all ${
                activeStep === idx
                  ? "bg-[#dda15e] text-[#1e140e] border-[#7a5225] shadow-[4px_4px_0px_#0f0a07]"
                  : "bg-[#281b12] text-[#a3b18a] border-[#382219] hover:bg-[#342318]"
              }`}
            >
              {step.title}
            </button>
          ))}
        </div>

        {/* Right Column: Step details */}
        <div className="lg:col-span-8 bg-[#281b12] border-4 border-[#382219] p-6 shadow-[6px_6px_0px_#0f0a07] min-h-[300px]">
          <h3 className="font-pixel text-sm text-[#dda15e] border-b-2 border-[#382219] pb-3 mb-4 uppercase">
            {STEPS[activeStep].title}
          </h3>
          <div className="font-vt323 text-lg leading-relaxed text-[#a3b18a]">
            {STEPS[activeStep].content}
          </div>
        </div>
      </div>
    </div>
  );
};
