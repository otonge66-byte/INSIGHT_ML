"use client";

import React from "react";
import { ChallengeDefinition, ChallengeMetrics } from "@/lib/challenge/types";

interface ChallengeCardProps {
  challenge: ChallengeDefinition;
  metrics: ChallengeMetrics;
  isWon: boolean;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  metrics,
  isWon,
}) => {
  const percent = challenge.getProgressPercent(metrics);
  const label = challenge.getProgressLabel(metrics);

  return (
    <div className="bg-[#2C3C35] border border-[#4E665B] rounded-2xl p-5 shadow-sm font-sans flex flex-col gap-3">
      {/* Header strip */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#4E665B]/60">
        <div className="flex items-center gap-2">
          <span className="text-base">🏆</span>
          <span className="font-pixel text-xs font-bold text-[#EAF4EE] uppercase tracking-wider">
            Challenge: {challenge.title}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3">
        {/* Goal */}
        <p className="text-[#C9D7CF] text-xs leading-relaxed">
          {challenge.description}
        </p>

        {/* Goal summary badge */}
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[9px] uppercase text-[#E9C46A] bg-[#22302B] border border-[#4E665B] px-2 py-0.5 rounded">
            Goal
          </span>
          <span className="text-[#EAF4EE] text-xs font-medium">{challenge.goalSummary}</span>
        </div>

        {/* Progress bar */}
        <div className="bg-[#182320] border border-[#4E665B] h-5 rounded-lg relative overflow-hidden">
          <div
            className="h-full transition-all duration-300 ease-out"
            style={{
              width: `${Math.min(100, Math.max(0, percent))}%`,
              background: isWon
                ? "linear-gradient(90deg, #2C3C35, #6FCF97)"
                : percent >= 75
                ? "linear-gradient(90deg, #2C3C35, #E9C46A)"
                : "linear-gradient(90deg, #2C3C35, #A6D8B8)",
            }}
          />
          {/* Percentage text overlay */}
          <span className="absolute inset-0 flex items-center justify-center text-[#EAF4EE] text-xs font-mono font-bold">
            {Math.round(percent)}%
          </span>
        </div>

        {/* Metrics label */}
        <p className="text-[#E9C46A] text-xs font-mono">
          {label}
        </p>

        {/* Won badge */}
        {isWon && (
          <div className="bg-[#22302B] border border-[#6FCF97] px-3 py-2 rounded-xl text-center">
            <span className="font-pixel text-xs text-[#6FCF97] uppercase tracking-wider">
              ✓ Challenge Complete!
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
