"use client";

import React from "react";
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
  const filledStars = stars;
  const emptyStars = 3 - stars;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#182320]/80 backdrop-blur-xs z-[60]"
        onClick={onDismiss}
      />

      {/* Modal panel */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-[#2C3C35] border border-[#4E665B] rounded-2xl shadow-xl font-sans overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#22302B] px-6 py-4 text-center border-b border-[#4E665B]">
            <h2 className="font-pixel text-xs font-bold text-[#EAF4EE] uppercase tracking-widest">
              Challenge Complete
            </h2>
          </div>

          {/* Stars */}
          <div className="flex justify-center gap-3 py-5">
            {Array.from({ length: filledStars }).map((_, i) => (
              <span
                key={`filled-${i}`}
                className="text-4xl text-[#E9C46A]"
              >
                ★
              </span>
            ))}
            {Array.from({ length: emptyStars }).map((_, i) => (
              <span
                key={`empty-${i}`}
                className="text-4xl text-[#4E665B]"
              >
                ★
              </span>
            ))}
          </div>

          {/* Message */}
          <div className="px-6 pb-4 text-center">
            <p className="text-[#EAF4EE] text-base font-semibold mb-1">{STAR_MESSAGES[stars]}</p>
            <p className="text-[#6FCF97] text-sm font-medium">
              &quot;{challenge.title}&quot;
            </p>
          </div>

          {/* Metrics summary */}
          <div className="mx-6 mb-4 bg-[#22302B] border border-[#4E665B] rounded-xl p-3">
            <p className="text-[#C9D7CF] text-xs font-mono text-center">
              {challenge.getProgressLabel(metrics)}
            </p>
          </div>

          {/* Star thresholds hint */}
          <div className="mx-6 mb-4 text-center text-xs text-[#8DA397]">
            {stars < 3 && (
              <p>Try again for ★★★ — can you do even better?</p>
            )}
          </div>

          {/* Buttons */}
          <div className="px-6 pb-6 flex gap-3 justify-center">
            <button
              onClick={onRetry}
              className="bg-[#22302B] hover:bg-[#182320] text-[#C9D7CF] border border-[#4E665B] rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Try Again ↺
            </button>
            <button
              onClick={onNext}
              className="bg-[#2C3C35] hover:bg-[#33463E] text-[#6FCF97] border border-[#4E665B] rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Next Challenge →
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
