"use client";

import React, { useState, useEffect } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { HeaderAuthButton } from "@/components/ui/HeaderAuthButton";

interface CozyHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  userName?: string;
  userAvatar?: string;
  onToggleSidebar?: () => void;
}

export const CozyHeader: React.FC<CozyHeaderProps> = ({
  title = "Welcome back!",
  subtitle = "Here is an overview of your InsightML platform and active learning modules",
  showBackButton = false,
  backHref = "/",
  backLabel = "Back to Dashboard",
  userName = "Guest",
  userAvatar = "👤",
  onToggleSidebar,
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
    <header className="w-full bg-[#211813] border-b-2 border-[#6C4A33] px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3.5 relative z-20">
      {/* Left Header Section: Hamburger + Back Button + Greeting */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Hamburger Menu Toggle Button (☰) */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="bg-[#2B1E17] hover:bg-[#38251B] text-[#D79A55] border-2 border-[#6C4A33] rounded-none px-3 py-1.5 transition-colors duration-150 flex items-center justify-center text-sm font-bold cursor-pointer shrink-0 shadow-[2px_2px_0px_#000000]"
            aria-label="Toggle Navigation Sidebar"
            title="Toggle Navigation Menu"
          >
            ☰
          </button>
        )}

        {showBackButton && (
          <div className="shrink-0">
            <BackButton href={backHref} label={backLabel} />
          </div>
        )}

        <div>
          <h1 className="font-pixel text-sm sm:text-base font-bold text-[#F0D6A2] tracking-wide">
            {title}
          </h1>
          {subtitle && (
            <p className="font-sans text-xs text-[#B89C76] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Widget Bar: Date, Clock, System Status (🟢 ONLINE), Auth Button */}
      <div className="flex items-center gap-2.5 font-sans text-xs text-[#F0D6A2] flex-wrap shrink-0">
        {/* Date */}
        <div className="flex items-center gap-1.5 bg-[#2B1E17] hover:bg-[#38251B] px-3 py-1.5 rounded-none border-2 border-[#6C4A33] shadow-[2px_2px_0px_#000000] transition-colors duration-150">
          <span>📅</span>
          <span className="font-medium text-[#F0D6A2]">{dateStr}</span>
        </div>

        {/* Clock */}
        <div className="flex items-center gap-1.5 bg-[#2B1E17] hover:bg-[#38251B] px-3 py-1.5 rounded-none border-2 border-[#6C4A33] shadow-[2px_2px_0px_#000000] transition-colors duration-150">
          <span>⏰</span>
          <span className="font-medium text-[#F0D6A2]">{timeStr}</span>
        </div>

        {/* System Status: ONLINE */}
        <div className="flex items-center gap-1.5 bg-[#2B1E17] hover:bg-[#38251B] px-3 py-1.5 rounded-none border-2 border-[#6C4A33] shadow-[2px_2px_0px_#000000] transition-colors duration-150">
          <span className="w-2 h-2 rounded-none bg-[#5D8E58] animate-pulse" />
          <span className="font-mono text-xs font-bold text-[#5D8E58]">ONLINE</span>
        </div>

        {/* Clerk Auth / Guest Avatar Button */}
        <HeaderAuthButton fallbackUserName={userName} fallbackUserAvatar={userAvatar} />
      </div>
    </header>
  );
};
