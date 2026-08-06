"use client";

import React, { useEffect } from "react";
import { ChallengeDefinition, ChallengeMetrics } from "@/lib/challenge/types";

interface ChallengeResultModalProps {
  challenge: ChallengeDefinition;
  stars: 1 | 2 | 3;
  metrics: ChallengeMetrics;
  onRetry: () => void;
  onNext: () => void;
  onDismiss: () => void;
}

const STAR_MESSAGES: Record<1 | 2 | 3, string> = {
  3: "PERFECT! Outstanding performance!",
  2: "GREAT JOB! Well done!",
  1: "CHALLENGE COMPLETE! Nice work!",
};

export const ChallengeResultModal: React.FC<ChallengeResultModalProps> = ({
  challenge,
  stars,
  metrics,
  onRetry,
  onNext,
  onDismiss,
}) => {
  useEffect(() => {
    console.log("🖼️ [ChallengePopup Mounted]", {
      challengeId: challenge.id,
      title: challenge.title,
      stars,
      metrics,
    });
  }, [challenge.id, challenge.title, stars, metrics]);

  const filledStars = stars;
  const emptyStars = 3 - stars;

  return (
    <>
      {/* Dark Backdrop */}
      <div
        className="fixed inset-0 bg-[#182320]/85 backdrop-blur-xs z-[60] animate-fade-in"
        onClick={onDismiss}
      />

      {/* Celebration Modal Panel */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-[#2C3C35] border border-[#4E665B] rounded-2xl shadow-2xl font-sans overflow-hidden transform transition-all scale-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Banner Header */}
          <div className="bg-[#22302B] px-6 py-4 text-center border-b border-[#4E665B]">
            <span className="font-pixel text-[10px] text-[#6FCF97] uppercase tracking-widest block mb-1">
              🎉 CHALLENGE SOLVED!
            </span>
            <h2 className="font-pixel text-sm sm:text-base font-bold text-[#EAF4EE] tracking-wide">
              {challenge.title}
            </h2>
          </div>

          {/* Star Rating Display */}
          <div className="flex justify-center gap-3 py-4 bg-[#182320]/40 border-b border-[#4E665B]/60">
            {Array.from({ length: filledStars }).map((_, i) => (
              <span
                key={`filled-${i}`}
                className="text-4xl text-[#E9C46A] drop-shadow-sm animate-bounce"
                style={{ animationDelay: `${i * 150}ms`, animationIterationCount: 2 }}
              >
                ★
              </span>
            ))}
            {Array.from({ length: emptyStars }).map((_, i) => (
              <span
                key={`empty-${i}`}
                className="text-4xl text-[#4E665B]/50"
              >
                ★
              </span>
            ))}
          </div>

          {/* Message & Praise */}
          <div className="px-6 pt-4 pb-2 text-center">
            <p className="text-[#EAF4EE] text-sm font-semibold mb-1">{STAR_MESSAGES[stars]}</p>
            <p className="text-[#C9D7CF] text-xs leading-relaxed">
              {challenge.description}
            </p>
          </div>

          {/* Detailed Metrics Breakdown */}
          <div className="mx-6 my-3 bg-[#182320] border border-[#4E665B] rounded-xl p-3.5 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-[#8DA397]">Accuracy Achieved:</span>
              <span className="text-[#6FCF97] font-bold">
                {metrics.nnAccuracy ?? metrics.accuracy ?? 100}%
              </span>
            </div>
            {metrics.hiddenSize !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-[#8DA397]">Hidden Nodes / Layers:</span>
                <span className="text-[#E9C46A] font-bold">
                  {metrics.hiddenSize} nodes × {metrics.numHiddenLayers ?? 1} layer
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-[#8DA397]">Training Steps Taken:</span>
              <span className="text-[#EAF4EE] font-bold">{metrics.stepCount}</span>
            </div>
          </div>

          {/* Rewards & Unlock Banner */}
          <div className="mx-6 mb-5 bg-[#22302B] border border-[#4E665B] rounded-xl p-3 flex items-center justify-around text-xs font-semibold text-[#EAF4EE]">
            <div className="flex items-center gap-1.5 text-[#E9C46A]">
              <span>⭐</span>
              <span>+100 XP</span>
            </div>
            <div className="w-px h-4 bg-[#4E665B]" />
            <div className="flex items-center gap-1.5 text-[#6FCF97]">
              <span>🏆</span>
              <span>Badge Unlocked</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-6 flex gap-3 justify-center">
            <button
              onClick={onRetry}
              className="bg-[#22302B] hover:bg-[#182320] text-[#C9D7CF] border border-[#4E665B] rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
            >
              Try Again ↺
            </button>
            <button
              onClick={onNext}
              className="bg-[#2C3C35] hover:bg-[#33463E] text-[#6FCF97] border border-[#6FCF97] rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm hover:scale-[1.02]"
            >
              Continue to Next Challenge →
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
