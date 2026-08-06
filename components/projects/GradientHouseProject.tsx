"use client";

import React, { useState } from "react";
import { ByteSprite } from "@/components/sprites/ByteSprite";

interface SampleSale {
  id: number;
  sqft: number;
  bedrooms: number;
  actualPrice: number; // in $1000s
}

const RECENT_SALES: SampleSale[] = [
  { id: 1, sqft: 1200, bedrooms: 2, actualPrice: 280 },
  { id: 2, sqft: 1600, bedrooms: 3, actualPrice: 350 },
  { id: 3, sqft: 2000, bedrooms: 3, actualPrice: 420 },
  { id: 4, sqft: 2400, bedrooms: 4, actualPrice: 510 },
  { id: 5, sqft: 2800, bedrooms: 4, actualPrice: 590 },
];

export const GradientHouseProject: React.FC = () => {
  // Model Parameters: Price = w_sqft * sqft + w_beds * beds + bias
  const [wSqft, setWSqft] = useState<number>(0.1);
  const [wBeds, setWBeds] = useState<number>(10);
  const [bias, setBias] = useState<number>(50);

  // User input sliders for custom prediction
  const [userSqft, setUserSqft] = useState<number>(1800);
  const [userBeds, setUserBeds] = useState<number>(3);

  // Training state
  const [epoch, setEpoch] = useState<number>(0);

  // Compute Mean Squared Error (MSE Loss)
  const computeMSE = (wS: number, wB: number, b: number) => {
    let sumErr = 0;
    RECENT_SALES.forEach((s) => {
      const pred = (s.sqft / 10) * wS + s.bedrooms * wB + b;
      const err = pred - s.actualPrice;
      sumErr += err * err;
    });
    return sumErr / RECENT_SALES.length;
  };

  const currentLoss = computeMSE(wSqft, wBeds, bias);

  // Single step of Gradient Descent
  const stepGradientDescent = () => {
    const lr = 0.05;
    let gradWS = 0;
    let gradWB = 0;
    let gradB = 0;

    RECENT_SALES.forEach((s) => {
      const pred = (s.sqft / 10) * wSqft + s.bedrooms * wBeds + bias;
      const err = pred - s.actualPrice;
      gradWS += err * (s.sqft / 10);
      gradWB += err * s.bedrooms;
      gradB += err;
    });

    const N = RECENT_SALES.length;
    gradWS /= N;
    gradWB /= N;
    gradB /= N;

    setWSqft((prev) => Math.max(0, prev - lr * (gradWS * 0.01)));
    setWBeds((prev) => Math.max(0, prev - lr * (gradWB * 0.1)));
    setBias((prev) => Math.max(0, prev - lr * (gradB * 0.2)));
    setEpoch((prev) => prev + 1);
  };

  const resetModel = () => {
    setWSqft(0.1);
    setWBeds(10);
    setBias(50);
    setEpoch(0);
  };

  // Predicted price for user custom inputs
  const predictedPrice = Math.round((userSqft / 10) * wSqft + userBeds * wBeds + bias);

  return (
    <div className="space-y-6 text-[#fefae0]">
      {/* BYTE Hero Narration Box */}
      <div className="bg-[#18110b] border-4 border-[#dda15e] p-5 shadow-[6px_6px_0px_#0f0a07] relative flex flex-col md:flex-row gap-5 items-start">
        <div className="flex-shrink-0 bg-[#120a06] border-2 border-[#7a5225] p-3 flex flex-col items-center gap-1 shadow-[2px_2px_0px_#050d07]">
          <ByteSprite scale={3} />
          <span className="font-pixel text-[8px] text-[#dda15e]">BYTE GUIDE</span>
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[9px] bg-[#dda15e] text-[#1e140e] px-2 py-0.5 border border-[#7a5225] uppercase font-bold">
              APPLIED PROJECT 02
            </span>
            <span className="font-pixel text-[8px] text-[#dda15e]">
              LINEAR REGRESSION ESTIMATOR
            </span>
          </div>

          <h2 className="font-pixel text-xl text-[#dda15e] uppercase tracking-wide">
            Real Estate &amp; House Price Estimator
          </h2>

          <p className="text-lg leading-relaxed text-[#fefae0] font-vt323">
            Real estate platforms use continuous linear regression models optimized by <strong>Gradient Descent</strong> to estimate home values! By calculating the Mean Squared Error (MSE) between actual sale prices and predicted prices, the algorithm takes iterative downhill steps to tune the price per square foot and bedroom multipliers.
          </p>

          <div className="text-base text-[#a3b18a] bg-[#120a06] p-2 border border-[#7a5225] font-vt323">
            💡 <strong>Project Concept:</strong> Watch Gradient Descent fit the optimal pricing surface step-by-step and test custom home predictions live!
          </div>
        </div>
      </div>

      {/* Main Grid: Data Table + Interactive Estimator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Sales Table & GD Optimizer Controls */}
        <div className="lg:col-span-6 bg-[#281b12] border-4 border-[#382219] p-5 shadow-[6px_6px_0px_#0f0a07] space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#382219] pb-3">
            <h3 className="font-pixel text-xs text-[#dda15e] uppercase">
              1. Neighborhood Market Dataset
            </h3>
            <span className="font-pixel text-[8px] text-[#8fc99a]">
              5 RECENT SALES
            </span>
          </div>

          {/* Dataset Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-vt323 text-lg border-collapse border border-[#382219]">
              <thead>
                <tr className="bg-[#18110b] border-b-2 border-[#382219] text-[#dda15e]">
                  <th className="p-2">House</th>
                  <th className="p-2">Size (sq ft)</th>
                  <th className="p-2">Bedrooms</th>
                  <th className="p-2 text-right">Actual Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#382219] bg-[#120a06]">
                {RECENT_SALES.map((sale) => (
                  <tr key={sale.id} className="hover:bg-[#18110b]">
                    <td className="p-2">Home #{sale.id}</td>
                    <td className="p-2">{sale.sqft.toLocaleString()} sq ft</td>
                    <td className="p-2">{sale.bedrooms} Beds</td>
                    <td className="p-2 text-right font-bold text-[#7ecb8a]">
                      ${sale.actualPrice},000
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Gradient Descent Step Trainer Controls */}
          <div className="bg-[#18110b] p-4 border-2 border-[#382219] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-[9px] text-[#dda15e] uppercase">
                Gradient Descent Model Tuning
              </span>
              <span className="font-pixel text-[8px] text-[#a3b18a]">
                EPOCH: {epoch}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-base font-vt323">
              <div className="bg-[#120a06] p-2 border border-[#382219]">
                <span className="text-[#a3b18a] text-xs block">Price / SqFt Weight (w₁):</span>
                <span className="text-[#dda15e] font-bold text-xl">${(wSqft * 100).toFixed(1)}</span>
              </div>
              <div className="bg-[#120a06] p-2 border border-[#382219]">
                <span className="text-[#a3b18a] text-xs block">Bedroom Weight (w₂):</span>
                <span className="text-[#dda15e] font-bold text-xl">${wBeds.toFixed(1)}k</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-[#120a06] p-2 border border-[#382219] font-vt323 text-lg">
              <span className="text-[#a3b18a]">Current Loss (MSE):</span>
              <span className="text-[#bc4749] font-bold text-xl">{currentLoss.toFixed(1)}</span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={stepGradientDescent}
                className="flex-1 bg-[#dda15e] hover:bg-[#b37d36] text-[#1e140e] font-pixel text-[10px] uppercase py-2 border-2 border-[#7a5225] shadow-[2px_2px_0px_#0f0a07] font-bold transition-all cursor-pointer"
              >
                📉 Run 1 Step of GD
              </button>
              <button
                onClick={resetModel}
                className="bg-[#18110b] hover:bg-[#281b12] text-[#a3b18a] font-pixel text-[9px] uppercase px-3 py-2 border border-[#382219] transition-colors cursor-pointer"
              >
                ↺ Reset
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Custom Home Price Predictor */}
        <div className="lg:col-span-6 bg-[#281b12] border-4 border-[#382219] p-5 shadow-[6px_6px_0px_#0f0a07] space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b-2 border-[#382219] pb-3 mb-4">
              <h3 className="font-pixel text-xs text-[#dda15e] uppercase">
                2. Live Custom Price Predictor
              </h3>
              <span className="font-pixel text-[8px] text-[#8fc99a]">
                PREDICTION ENGINE
              </span>
            </div>

            {/* Input Sliders */}
            <div className="space-y-4 bg-[#18110b] p-4 border-2 border-[#382219]">
              {/* SqFt Slider */}
              <div className="space-y-1">
                <div className="flex justify-between font-vt323 text-lg">
                  <span className="text-[#a3b18a]">Property Size (sq ft):</span>
                  <span className="text-[#dda15e] font-bold">{userSqft.toLocaleString()} sq ft</span>
                </div>
                <input
                  type="range"
                  min={800}
                  max={3500}
                  step={50}
                  value={userSqft}
                  onChange={(e) => setUserSqft(Number(e.target.value))}
                  className="w-full accent-[#dda15e] cursor-pointer"
                />
              </div>

              {/* Bedrooms Slider */}
              <div className="space-y-1">
                <div className="flex justify-between font-vt323 text-lg">
                  <span className="text-[#a3b18a]">Bedroom Count:</span>
                  <span className="text-[#dda15e] font-bold">{userBeds} Bedrooms</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={6}
                  step={1}
                  value={userBeds}
                  onChange={(e) => setUserBeds(Number(e.target.value))}
                  className="w-full accent-[#dda15e] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Prediction Output Card */}
          <div className="bg-[#120a06] border-4 border-[#dda15e] p-5 text-center shadow-[4px_4px_0px_#0f0a07] space-y-2">
            <span className="font-pixel text-[10px] text-[#dda15e] uppercase tracking-widest block">
              ESTIMATED MARKET VALUE
            </span>
            <p className="font-vt323 text-5xl text-[#7ecb8a] font-bold leading-none">
              ${predictedPrice.toLocaleString()},000
            </p>
            <p className="font-vt323 text-base text-[#a3b18a]">
              Calculated via: (${(wSqft * 100).toFixed(0)} × {userSqft}) + (${wBeds.toFixed(1)}k × {userBeds}) + ${bias.toFixed(0)}k bias
            </p>
          </div>

          {/* BYTE Encouragement */}
          <div className="bg-[#120a06] p-3 border border-[#382219] text-base text-[#a3b18a] font-vt323 leading-tight">
            💬 <strong>BYTE says:</strong> &ldquo;Click &apos;Run 1 Step of GD&apos; multiple times and watch the MSE loss drop! As the loss decreases, your price predictions align accurately with actual neighborhood sales.&rdquo;
          </div>
        </div>
      </div>
    </div>
  );
};
