"use client";

import React, { useState } from "react";
import { DailyActivity } from "@/lib/progress/types";
import { getTodayDateString } from "@/lib/progress/progressService";

interface ContributionCalendarProps {
  dailyActivityData: Record<string, DailyActivity>;
  weeksToShow?: number;
}

export const ContributionCalendar: React.FC<ContributionCalendarProps> = ({
  dailyActivityData,
  weeksToShow = 20,
}) => {
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    dayData?: DailyActivity;
    x: number;
    y: number;
  } | null>(null);

  const todayStr = getTodayDateString();

  const days: Date[] = [];
  const today = new Date();

  const totalDays = weeksToShow * 7;
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  const formatDateKey = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getCellStyle = (dayData?: DailyActivity) => {
    if (!dayData || dayData.xp === 0) {
      return "bg-[#121e17] border-[#2a5c30]";
    }
    if ((dayData.completed_challenges || 0) > 0) {
      return "bg-[#dda15e] border-[#7a5225] shadow-[0_0_8px_rgba(221,161,94,0.4)]";
    }
    if (dayData.xp >= 100) {
      return "bg-[#56a66a] border-[#2a6832]";
    }
    if (dayData.xp >= 40) {
      return "bg-[#386641] border-[#1b3521]";
    }
    return "bg-[#1e4a24] border-[#2a5c30]";
  };

  return (
    <div className="bg-[#121e17] border-2 border-[#2a5c30] p-4 rounded-none shadow-[2px_2px_0px_#000000] relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-[#2a5c30] pb-2">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[10px] text-[#7ecb8a] uppercase tracking-wider">
            📅 LEARNING CALENDAR
          </span>
          <span className="font-pixel text-[8px] text-[#8fc99a]">
            (Past {weeksToShow} Weeks)
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-pixel text-[8px] text-[#8fc99a]">
          <span>Less</span>
          <div className="w-2.5 h-2.5 bg-[#121e17] border border-[#2a5c30]" />
          <div className="w-2.5 h-2.5 bg-[#1e4a24] border border-[#2a5c30]" />
          <div className="w-2.5 h-2.5 bg-[#386641] border border-[#1b3521]" />
          <div className="w-2.5 h-2.5 bg-[#56a66a] border border-[#2a6832]" />
          <div className="w-2.5 h-2.5 bg-[#dda15e] border border-[#7a5225]" />
          <span>More</span>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto pb-2 custom-scrollbar">
        <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 min-w-max">
          {days.map((dateObj) => {
            const dateStr = formatDateKey(dateObj);
            const dayData = dailyActivityData[dateStr];
            const isToday = dateStr === todayStr;
            const cellStyle = getCellStyle(dayData);

            return (
              <div
                key={dateStr}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredDay({
                    date: dateStr,
                    dayData,
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                  });
                }}
                onMouseLeave={() => setHoveredDay(null)}
                className={`w-3.5 h-3.5 border transition-all cursor-pointer relative rounded-none ${cellStyle} ${
                  isToday ? "outline-2 outline-[#7ecb8a] outline-offset-1 z-10" : ""
                } hover:scale-125 hover:z-20`}
              />
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 pointer-events-none bg-[#0c1510] border-2 border-[#7ecb8a] text-[#F0D6A2] p-2.5 shadow-[4px_4px_0px_#000000] text-xs font-sans -translate-x-1/2 -translate-y-full -mt-2 min-w-[170px]"
          style={{ left: hoveredDay.x, top: hoveredDay.y }}
        >
          <p className="font-pixel text-[9px] text-[#7ecb8a] border-b border-[#2a5c30] pb-1 mb-1.5 uppercase">
            {hoveredDay.date === todayStr ? "TODAY • " : ""}
            {hoveredDay.date}
          </p>
          {hoveredDay.dayData && hoveredDay.dayData.xp > 0 ? (
            <div className="space-y-1 font-vt323 text-sm">
              <p className="text-[#dda15e] font-bold">⚡ +{hoveredDay.dayData.xp} XP Earned</p>
              <p className="text-[#8fc99a]">
                ⏱️ Learning: {hoveredDay.dayData.learning_minutes || 1} mins
              </p>
              <p className="text-[#8fc99a]">
                📘 Modules: {hoveredDay.dayData.completed_modules || 0}
              </p>
              <p className="text-[#8fc99a]">
                🏆 Challenges: {hoveredDay.dayData.completed_challenges || 0}
              </p>
            </div>
          ) : (
            <p className="font-sans text-[11px] text-[#8fc99a] italic">
              No learning activity recorded
            </p>
          )}
        </div>
      )}
    </div>
  );
};
