"use client";

import React, { useState, useEffect } from "react";
import { CozySidebar } from "@/components/ui/CozySidebar";
import { useSessionTimer } from "@/lib/progress/useSessionTimer";

export const GlobalNavigation: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Mount session timer hook globally
  useSessionTimer();

  // Prevent background scrolling when sidebar drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* ── Fixed Top-Left Hamburger Menu Button (z-30 so backdrop z-40 covers it when open) ── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed top-5 left-4 sm:left-6 md:left-8 z-30 bg-[#121e17] border-2 border-[#2a5c30] text-[#7ecb8a] hover:bg-[#1c2d23] hover:border-[#7ecb8a] px-3 py-2 shadow-[2px_2px_0px_#000000] font-pixel text-xs flex items-center gap-2 cursor-pointer transition-all duration-150 rounded-none group active:translate-y-0.5"
        aria-label="Toggle Navigation Drawer"
        title="Toggle Menu"
      >
        <span className="text-sm leading-none group-hover:scale-110 transition-transform">
          ☰
        </span>
        <span className="hidden sm:inline tracking-wider uppercase">Menu</span>
      </button>

      {/* ── Sidebar Drawer (Backdrop z-40, Drawer z-50) ── */}
      <CozySidebar
        isMobileOpen={isOpen}
        onCloseMobile={() => setIsOpen(false)}
      />

      {/* Main Page Content */}
      {children}
    </>
  );
};

