"use client";

import React from "react";
import { useLearningProgress } from "@/lib/progress/useLearningProgress";
import { ContributionCalendar } from "./ContributionCalendar";

export const ProgressDashboard: React.FC = () => {
  const { summary, loading, isSyncError, errorMessage } = useLearningProgress();
  const {
    profile,
    progress,
    dailyActivity,
    achievements,
    totalLearningDays,
    completionPercentage,
    currentRank,
  } = summary;

  return (
    <section
      id="progress"
      className="w-full bg-[#081209] border-4 border-[#1e4023] p-5 sm:p-6 shadow-[6px_6px_0px_#050d07] relative overflow-hidden"
    >
      {/* Corner retro accents */}
      <div className="absolute top-0 left-0 w-3 h-3 bg-[#2a5c30]" />
      <div className="absolute top-0 right-0 w-3 h-3 bg-[#2a5c30]" />
      <div className="absolute bottom-0 left-0 w-3 h-3 bg-[#2a5c30]" />
      <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#2a5c30]" />

      {/* Sync Error Notification Banner */}
      {isSyncError && (
        <div className="mb-4 bg-[#3a0d0d] border-2 border-[#bc4749] text-[#f87171] p-3 text-sm font-sans flex items-center justify-between shadow-[2px_2px_0px_#000000]">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span>{errorMessage || "Unable to sync your progress. Please check your connection."}</span>
          </div>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#1e4023] pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-pixel text-[9px] bg-[#1e4a24] text-[#7ecb8a] px-2 py-0.5 border border-[#2a6832] uppercase">
              {profile?.username ? `@${profile.username}` : "USER LOG"}
            </span>
            <span className="font-pixel text-[8px] text-[#2a5232]">
              RANK: {currentRank.toUpperCase()}
            </span>
          </div>
          <h2 className="font-pixel text-xl sm:text-2xl font-bold text-[#7ecb8a] uppercase tracking-wider">
            MY LEARNING PROGRESS
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#121e17] border-2 border-[#2a5c30] px-3.5 py-1.5 shadow-[2px_2px_0px_#000000] text-center">
            <p className="font-pixel text-[8px] text-[#8fc99a] uppercase">TOTAL XP</p>
            <p className="font-vt323 text-2xl text-[#dda15e] font-bold leading-none mt-0.5">
              ⚡ {progress.total_xp || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Grid Row 1: Streak Card & Progress Overview Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* 🔥 STREAK CARD (Cols 1-5) */}
        <div className="lg:col-span-5 bg-[#121e17] border-2 border-[#2a5c30] p-5 shadow-[4px_4px_0px_#000000] flex flex-col justify-between relative group">
          <div className="flex items-center justify-between border-b border-[#2a5c30] pb-3 mb-4">
            <span className="font-pixel text-[10px] text-[#dda15e] uppercase tracking-wider">
              🔥 DAILY STREAK
            </span>
            <span className="font-pixel text-[8px] text-[#56a66a] animate-pulse">
              ● CLOUD SYNCED
            </span>
          </div>

          <div className="flex items-baseline gap-3 my-2">
            <span className="font-vt323 text-6xl font-bold text-[#dda15e] leading-none">
              {progress.current_streak || 0}
            </span>
            <span className="font-pixel text-sm text-[#7ecb8a] uppercase">
              DAYS IN A ROW
            </span>
          </div>

          <p className="font-sans text-xs text-[#8fc99a] leading-relaxed mb-4 italic">
            &ldquo;Keep learning today to maintain your streak and earn double XP!&rdquo;
          </p>

          <div className="bg-[#0c1510] border border-[#2a5c30] p-3 flex items-center justify-between">
            <span className="font-pixel text-[9px] text-[#8fc99a] uppercase">
              🏆 LONGEST STREAK
            </span>
            <span className="font-vt323 text-xl text-[#dda15e] font-bold">
              {progress.longest_streak || 0} Days
            </span>
          </div>
        </div>

        {/* 📊 OVERVIEW STATS (Cols 6-12) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {/* Modules Completed */}
          <div className="bg-[#121e17] border-2 border-[#2a5c30] p-3.5 shadow-[2px_2px_0px_#000000] flex flex-col justify-between">
            <span className="font-pixel text-[8px] text-[#8fc99a] uppercase">
              📘 MODULES
            </span>
            <p className="font-vt323 text-4xl text-[#7ecb8a] font-bold my-1">
              {(progress.completed_modules || []).length} / 3
            </p>
            <span className="font-sans text-[10px] text-[#56a66a]">
              Active Playgrounds
            </span>
          </div>

          {/* Challenges Completed */}
          <div className="bg-[#121e17] border-2 border-[#2a5c30] p-3.5 shadow-[2px_2px_0px_#000000] flex flex-col justify-between">
            <span className="font-pixel text-[8px] text-[#8fc99a] uppercase">
              🏆 CHALLENGES
            </span>
            <p className="font-vt323 text-4xl text-[#dda15e] font-bold my-1">
              {(progress.completed_challenges || []).length} / 3
            </p>
            <span className="font-sans text-[10px] text-[#8fc99a]">
              Mastery Quests
            </span>
          </div>

          {/* Total Learning Minutes */}
          <div className="bg-[#121e17] border-2 border-[#2a5c30] p-3.5 shadow-[2px_2px_0px_#000000] flex flex-col justify-between">
            <span className="font-pixel text-[8px] text-[#8fc99a] uppercase">
              ⏱️ TIME SPENT
            </span>
            <p className="font-vt323 text-4xl text-[#7ecb8a] font-bold my-1">
              {progress.total_learning_minutes || 0}m
            </p>
            <span className="font-sans text-[10px] text-[#8fc99a]">
              Total Minutes
            </span>
          </div>

          {/* Completion Rate */}
          <div className="bg-[#121e17] border-2 border-[#2a5c30] p-3.5 shadow-[2px_2px_0px_#000000] flex flex-col justify-between">
            <span className="font-pixel text-[8px] text-[#8fc99a] uppercase">
              🎯 PROGRESS RATE
            </span>
            <p className="font-vt323 text-4xl text-[#7ecb8a] font-bold my-1">
              {completionPercentage}%
            </p>
            <div className="w-full h-1.5 bg-[#0c1510] border border-[#2a5c30] mt-1 overflow-hidden">
              <div
                className="h-full bg-[#7ecb8a] transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Current Rank & Achievements */}
          <div className="bg-[#121e17] border-2 border-[#2a5c30] p-3.5 shadow-[2px_2px_0px_#000000] flex flex-col justify-between sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-[8px] text-[#8fc99a] uppercase">
                🎖️ CURRENT RANK
              </span>
              <span className="font-pixel text-[8px] text-[#dda15e]">
                BADGES: {(achievements || []).length}
              </span>
            </div>
            <p className="font-pixel text-sm text-[#7ecb8a] font-bold my-1 uppercase tracking-wide">
              {currentRank}
            </p>
            <span className="font-sans text-[10px] text-[#8fc99a]">
              Next rank unlocks at {progress.total_xp >= 1000 ? "MAX" : progress.total_xp >= 500 ? "1000 XP" : progress.total_xp >= 250 ? "500 XP" : progress.total_xp >= 100 ? "250 XP" : "100 XP"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Row 2: Contribution Heatmap Calendar */}
      <ContributionCalendar dailyActivityData={dailyActivity} weeksToShow={20} />
    </section>
  );
};
