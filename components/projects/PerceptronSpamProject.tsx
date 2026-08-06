"use client";

import React, { useState } from "react";
import { ByteSprite } from "@/components/sprites/ByteSprite";

const FEATURES = [
  { id: "urgent", name: "Contains 'URGENT' or 'FREE'", weight: 1.8, desc: "High spam correlation keyword" },
  { id: "unknown", name: "Sender Email Unknown / Suspicious", weight: 1.4, desc: "Domain unverified" },
  { id: "links", name: "Includes External Links (> 3)", weight: 1.2, desc: "Potential phishing attempt" },
  { id: "lateTime", name: "Sent between 1:00 AM - 4:00 AM", weight: 0.9, desc: "Unusual batch send time" },
  { id: "attachment", name: "Includes Executable Attachment", weight: 1.5, desc: "High security risk (.exe, .zip)" },
];

const PRESET_EMAILS = [
  {
    name: "Suspicious Offer Email",
    features: { urgent: true, unknown: true, links: true, lateTime: true, attachment: false },
  },
  {
    name: "Teammate Code Review",
    features: { urgent: false, unknown: false, links: true, lateTime: false, attachment: false },
  },
  {
    name: "Midnight Lottery Claims",
    features: { urgent: true, unknown: true, links: true, lateTime: true, attachment: true },
  },
];

export const PerceptronSpamProject: React.FC = () => {
  const [activeFeatures, setActiveFeatures] = useState<Record<string, boolean>>({
    urgent: true,
    unknown: true,
    links: true,
    lateTime: false,
    attachment: false,
  });

  const bias = -2.5;

  const score = FEATURES.reduce((acc, feat) => {
    return acc + (activeFeatures[feat.id] ? feat.weight : 0);
  }, bias);

  const isSpam = score >= 0;

  const toggleFeature = (id: string) => {
    setActiveFeatures((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const applyPreset = (presetFeatures: Record<string, boolean>) => {
    setActiveFeatures(presetFeatures);
  };

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
            <span className="font-pixel text-[9px] bg-[#386641] text-[#fefae0] px-2 py-0.5 border border-[#1b3521] uppercase">
              APPLIED PROJECT 01
            </span>
            <span className="font-pixel text-[8px] text-[#8fc99a]">
              BAG-OF-WORDS CLASSIFIER
            </span>
          </div>

          <h2 className="font-pixel text-xl text-[#7ecb8a] uppercase tracking-wide">
            Rule-Based Email Spam &amp; Priority Classifier
          </h2>

          <p className="text-lg leading-relaxed text-[#c8ecd0] font-vt323">
            Ever wondered how email services filter out spam before it reaches your inbox? Under the hood, early spam filters were built with a single <strong>Perceptron neuron</strong>! By treating email traits as binary inputs (0 or 1) and assigning weighted scores to risky signals, the perceptron calculates a dot-product score to decide: <strong>SPAM</strong> or <strong>INBOX</strong>.
          </p>

          <div className="text-base text-[#a3b18a] bg-[#0d150e] p-2 border border-[#2a5c30] font-vt323">
            💡 <strong>Project Concept:</strong> Inspired by classic Bag-of-Words text classification. Learn how feature weights combine linear decisions!
          </div>
        </div>
      </div>

      {/* Interactive Perceptron Spam Classifier Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Feature Toggles & Presets */}
        <div className="lg:col-span-7 bg-[#281b12] border-4 border-[#382219] p-5 shadow-[6px_6px_0px_#0f0a07] space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#382219] pb-3">
            <div>
              <h3 className="font-pixel text-xs text-[#dda15e] uppercase">
                1. Toggle Custom Email Traits
              </h3>
              <p className="text-sm text-[#a3b18a] font-vt323">
                Select features present in the incoming email to observe weight summation.
              </p>
            </div>
            <span className="font-pixel text-[8px] text-[#dda15e] bg-[#1e140e] px-2 py-1 border border-[#5c3d2e]">
              5 INPUT NEURONS
            </span>
          </div>

          {/* Feature List Toggles */}
          <div className="space-y-2">
            {FEATURES.map((feat) => {
              const active = activeFeatures[feat.id];
              return (
                <button
                  key={feat.id}
                  onClick={() => toggleFeature(feat.id)}
                  className={`w-full text-left p-3 border-2 transition-all flex items-center justify-between cursor-pointer ${
                    active
                      ? "bg-[#382219] border-[#dda15e] text-[#fefae0] shadow-[2px_2px_0px_#0f0a07]"
                      : "bg-[#18110b] border-[#2c1e15] text-[#8fc99a] hover:border-[#5c3d2e]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-4 h-4 flex items-center justify-center font-pixel text-[10px] border ${
                      active ? "bg-[#dda15e] text-[#1e140e] border-[#dda15e]" : "bg-[#120a06] border-[#382219]"
                    }`}>
                      {active ? "✓" : ""}
                    </span>
                    <div>
                      <p className="font-vt323 text-lg font-bold leading-tight">{feat.name}</p>
                      <p className="font-vt323 text-xs text-[#a3b18a]">{feat.desc}</p>
                    </div>
                  </div>

                  <span className="font-mono text-sm font-bold text-[#dda15e] bg-[#120a06] px-2 py-0.5 border border-[#382219]">
                    +{feat.weight.toFixed(1)} w
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sample Presets */}
          <div className="pt-2 border-t-2 border-[#382219] space-y-2">
            <span className="font-pixel text-[8px] text-[#a3b18a] uppercase block">
              Load Preset Email Examples:
            </span>
            <div className="flex gap-2 flex-wrap">
              {PRESET_EMAILS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p.features)}
                  className="bg-[#18110b] hover:bg-[#382219] text-[#dda15e] border border-[#5c3d2e] px-3 py-1 font-pixel text-[9px] uppercase transition-colors cursor-pointer"
                >
                  ✉️ {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Decision & Feature Weight Bar Chart */}
        <div className="lg:col-span-5 bg-[#281b12] border-4 border-[#382219] p-5 shadow-[6px_6px_0px_#0f0a07] space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b-2 border-[#382219] pb-3 mb-4">
              <h3 className="font-pixel text-xs text-[#dda15e] uppercase">
                2. Perceptron Decision Output
              </h3>
              <span className="font-pixel text-[8px] text-[#a3b18a]">
                BIAS = {bias.toFixed(1)}
              </span>
            </div>

            {/* Decision Badge */}
            <div className={`p-5 border-4 text-center shadow-[4px_4px_0px_#0f0a07] transition-all ${
              isSpam
                ? "bg-[#3d1214] border-[#bc4749] text-[#f87171]"
                : "bg-[#0d150e] border-[#386641] text-[#7ecb8a]"
            }`}>
              <span className="font-pixel text-[10px] uppercase tracking-widest block mb-1">
                CLASSIFICATION RESULT
              </span>
              <p className="font-pixel text-2xl uppercase tracking-wider font-bold">
                {isSpam ? "🚨 SPAM FOLDER" : "📥 INBOX SAFE"}
              </p>
              <p className="font-vt323 text-lg mt-1 text-[#fefae0]">
                Dot Product Score: <strong>{score >= 0 ? `+${score.toFixed(2)}` : score.toFixed(2)}</strong> (Threshold: 0.0)
              </p>
            </div>
          </div>

          {/* Feature Weight Contributions Bar Chart */}
          <div className="space-y-3 bg-[#18110b] p-4 border-2 border-[#382219]">
            <span className="font-pixel text-[8px] text-[#dda15e] uppercase block">
              Feature Weight Breakdown (Dot-Product Contribution)
            </span>

            <div className="space-y-2 font-vt323 text-sm">
              {FEATURES.map((f) => {
                const active = activeFeatures[f.id];
                const widthPct = Math.min(100, Math.round((f.weight / 2.0) * 100));
                return (
                  <div key={f.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={active ? "text-[#fefae0] font-bold" : "text-[#5c3d2e]"}>
                        {f.name.split(" ")[0]} ({active ? `+${f.weight}` : "0.0"})
                      </span>
                      <span className={active ? "text-[#7ecb8a]" : "text-[#5c3d2e]"}>
                        {active ? "ACTIVE" : "OFF"}
                      </span>
                    </div>
                    <div className="w-full bg-[#0f0a07] h-3 border border-[#382219]">
                      <div
                        className={`h-full transition-all duration-200 ${
                          active ? "bg-[#dda15e]" : "bg-[#382219]/30"
                        }`}
                        style={{ width: active ? `${widthPct}%` : "0%" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Encouraging closing narrative */}
          <div className="bg-[#120a06] p-3 border border-[#382219] text-base text-[#a3b18a] font-vt323 leading-tight">
            💬 <strong>BYTE says:</strong> &ldquo;Notice how each feature acts like a weight vector! Adding new features shifts the score linearly. Give it a shot and see how different combinations trigger the spam threshold!&rdquo;
          </div>
        </div>
      </div>
    </div>
  );
};
