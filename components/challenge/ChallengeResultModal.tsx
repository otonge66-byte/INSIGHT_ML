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

/**
 * Full-screen modal shown when a challenge is won.
 * Displays a star rating, congratulatory message, and retry/next buttons.
 */
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
        className="fixed inset-0 bg-black/60 z-[60]"
        onClick={onDismiss}
      />

      {/* Modal panel */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-[#1e140e] border-4 border-[#dda15e] shadow-[8px_8px_0px_0px_#0f0a07]"
          style={{
            fontFamily: "var(--font-vt323), monospace",
            animation: "challenge-modal-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#dda15e] px-6 py-3 text-center">
            <h2
              className="text-[#1e140e] uppercase tracking-widest"
              style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "14px" }}
            >
              Challenge Complete!
            </h2>
          </div>

          {/* Stars */}
          <div className="flex justify-center gap-3 py-6">
            {Array.from({ length: filledStars }).map((_, i) => (
              <span
                key={`filled-${i}`}
                className="text-5xl"
                style={{
                  color: "#dda15e",
                  filter: "drop-shadow(0 0 8px rgba(221,161,94,0.7))",
                  animation: `challenge-star-pop 0.5s ${0.15 * (i + 1)}s both cubic-bezier(0.34, 1.56, 0.64, 1)`,
                }}
              >
                ★
              </span>
            ))}
            {Array.from({ length: emptyStars }).map((_, i) => (
              <span
                key={`empty-${i}`}
                className="text-5xl"
                style={{
                  color: "#382219",
                  animation: `challenge-star-pop 0.5s ${0.15 * (filledStars + i + 1)}s both cubic-bezier(0.34, 1.56, 0.64, 1)`,
                }}
              >
                ★
              </span>
            ))}
          </div>

          {/* Message */}
          <div className="px-6 pb-4 text-center">
            <p className="text-[#fefae0] text-2xl mb-1">{STAR_MESSAGES[stars]}</p>
            <p className="text-[#dda15e] text-xl">
              &quot;{challenge.title}&quot;
            </p>
          </div>

          {/* Metrics summary */}
          <div className="mx-6 mb-4 bg-[#281b12] border-2 border-[#382219] p-3">
            <p className="text-[#a3b18a] text-lg text-center">
              {challenge.getProgressLabel(metrics)}
            </p>
          </div>

          {/* Star thresholds hint */}
          <div className="mx-6 mb-4 text-center text-lg text-[#5c3d2e]">
            {stars < 3 && (
              <p>Try again for ★★★ — can you do even better?</p>
            )}
          </div>

          {/* Buttons */}
          <div className="px-6 pb-6 flex gap-3 justify-center">
            <button
              onClick={onRetry}
              className="bg-[#281b12] hover:bg-[#3e271c] text-[#a3b18a] border-4 border-[#382219] shadow-[4px_4px_0px_0px_#0f0a07] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all px-5 py-2.5"
              style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "11px" }}
            >
              Try Again ↺
            </button>
            <button
              onClick={onNext}
              className="bg-[#386641] hover:bg-[#4a7c59] text-[#fefae0] border-4 border-[#1b3521] shadow-[4px_4px_0px_0px_#0f0a07] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all px-5 py-2.5"
              style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "11px" }}
            >
              Next Challenge →
            </button>
          </div>
        </div>
      </div>

      {/* Inline keyframes for the modal and star animations */}
      <style jsx global>{`
        @keyframes challenge-modal-pop {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes challenge-star-pop {
          0% {
            opacity: 0;
            transform: scale(0) rotate(-30deg);
          }
          70% {
            transform: scale(1.25) rotate(5deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
      `}</style>
    </>
  );
};
