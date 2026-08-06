"use client";

import React, { useState, useEffect } from "react";
import { BackButton } from "@/components/ui/BackButton";

interface CozyHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  userName?: string;
  userAvatar?: string;
}

export const CozyHeader: React.FC<CozyHeaderProps> = ({
  title = "Welcome back!",
  subtitle = "Here is an overview of your InsightML platform and active learning modules",
  showBackButton = false,
  backHref = "/",
  backLabel = "Back to Dashboard",
  userName = "Explorer",
  userAvatar = "🤠",
}) => {
  const [timeStr, setTimeStr] = useState<string>("09:45");
  const [dateStr, setDateStr] = useState<string>("05 Aug 2026");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
      setDateStr(
        now.toLocaleDateString([], {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-[#22302B] border-b border-[#4E665B] px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative overflow-hidden">
      {/* Left Greeting & Optional Top-Left Back Button */}
      <div className="flex items-center gap-3.5 z-10">
        {showBackButton && (
          <div className="shrink-0">
            <BackButton href={backHref} label={backLabel} />
          </div>
        )}

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-pixel text-sm sm:text-base font-bold text-[#EAF4EE] tracking-wide">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="font-sans text-xs text-[#8DA397] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Widget Bar: Date, Season, Time, Avatar */}
      <div className="flex items-center gap-2.5 font-sans text-xs text-[#C9D7CF] z-10 flex-wrap">
        {/* Date */}
        <div className="flex items-center gap-1.5 bg-[#2C3C35] px-3 py-1.5 rounded-lg border border-[#4E665B]">
          <span>📅</span>
          <span className="font-medium text-[#EAF4EE]">{dateStr}</span>
        </div>

        {/* Season */}
        <div className="flex items-center gap-1.5 bg-[#2C3C35] px-3 py-1.5 rounded-lg border border-[#4E665B]">
          <span>🌿</span>
          <span className="font-medium text-[#EAF4EE]">Summer</span>
        </div>

        {/* Clock */}
        <div className="flex items-center gap-1.5 bg-[#2C3C35] px-3 py-1.5 rounded-lg border border-[#4E665B]">
          <span>⏰</span>
          <span className="font-medium text-[#EAF4EE]">{timeStr}</span>
        </div>

        {/* Explorer Avatar Badge */}
        <div className="flex items-center gap-2 bg-[#2C3C35] text-[#EAF4EE] px-3 py-1.5 rounded-lg border border-[#4E665B]">
          <div className="w-5 h-5 rounded-full bg-[#22302B] flex items-center justify-center text-xs border border-[#4E665B]">
            {userAvatar}
          </div>
          <span className="font-sans text-xs font-medium text-[#6FCF97] truncate max-w-[110px]">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
};
