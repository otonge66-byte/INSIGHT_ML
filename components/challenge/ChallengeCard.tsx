"use client";

import React from "react";
import { ChallengeDefinition, ChallengeMetrics } from "@/lib/challenge/types";

interface ChallengeCardProps {
  challenge: ChallengeDefinition;
  metrics: ChallengeMetrics;
  isWon: boolean;
}

/**
 * Live progress card shown in the right column during Challenge Mode.
 * Displays the challenge goal, a progress bar, and current metrics.
 */
export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  metrics,
  isWon,
}) => {
  const percent = challenge.getProgressPercent(metrics);
  const label = challenge.getProgressLabel(metrics);

  return (
    <div
      className="bg-[#281b12] border-4 border-[#bc4749] shadow-[6px_6px_0px_0px_#0f0a07] overflow-hidden"
      style={{ fontFamily: "var(--font-vt323), monospace" }}
    >
      {/* Header strip */}
      <div className="bg-[#bc4749] px-4 py-2 flex items-center gap-2">
        <span className="text-xl">🏆</span>
        <span
          className="text-[#fefae0] uppercase tracking-wider"
          style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "11px" }}
        >
          Challenge: {challenge.title}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3">
        {/* Goal */}
        <p className="text-[#a3b18a] text-lg leading-snug">
          {challenge.description}
        </p>

        {/* Goal summary badge */}
        <div className="flex items-center gap-2">
          <span
            className="font-pixel text-[9px] uppercase text-[#dda15e] border border-[#7a5225] px-2 py-0.5"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            Goal
          </span>
          <span className="text-[#fefae0] text-lg">{challenge.goalSummary}</span>
        </div>

        {/* Progress bar */}
        <div className="bg-[#1e140e] border-2 border-[#382219] h-6 relative overflow-hidden">
          <div
            className="h-full transition-all duration-300 ease-out"
            style={{
              width: `${Math.min(100, Math.max(0, percent))}%`,
              background: isWon
                ? "linear-gradient(90deg, #386641, #a3b18a)"
                : percent >= 75
                ? "linear-gradient(90deg, #dda15e, #e8c468)"
                : "linear-gradient(90deg, #bc4749, #d96363)",
            }}
          />
          {/* Percentage text overlay */}
          <span
            className="absolute inset-0 flex items-center justify-center text-[#fefae0] text-sm font-bold"
            style={{ textShadow: "1px 1px 0px #0f0a07" }}
          >
            {Math.round(percent)}%
          </span>
        </div>

        {/* Metrics label */}
        <p className="text-[#dda15e] text-lg">
          {label}
        </p>

        {/* Won badge */}
        {isWon && (
          <div className="bg-[#386641] border-2 border-[#1b3521] px-3 py-1.5 text-center">
            <span
              className="text-[#fefae0] uppercase tracking-wider"
              style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "11px" }}
            >
              ✓ Challenge Complete!
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
