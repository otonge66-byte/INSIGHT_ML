"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const NAVIGATION_ITEMS = [
  { name: "Overview", href: "/", icon: "🏠", badge: "Dashboard" },
  { name: "Perceptron", href: "/playground/perceptron", icon: "⚡", badge: "Meadow" },
  { name: "Gradient", href: "/playground/gradient-descent", icon: "📉", badge: "Mountain" },
  { name: "Neural Net", href: "/playground/neural-net", icon: "🧠", badge: "Forest" },
  { name: "My Progress", href: "/progress", icon: "📊", badge: "Stats" },
  { name: "Quests", href: "/#quests", icon: "📜", badge: "3/5" },
  { name: "Badges", href: "/#badges", icon: "🏆", badge: "4/8" },
  { name: "Applied Projects", href: "/playground/perceptron?mode=project", icon: "🛠️", badge: "3 Applied" },
];

interface CozySidebarProps {
  isCollapsed?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const CozySidebar: React.FC<CozySidebarProps> = ({
  isCollapsed = false,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  let userName = "OM";
  let isAuthenticated = true;

  try {
    const { user, isSignedIn } = useUser();
    if (isSignedIn && user) {
      userName = user.username || user.firstName || user.fullName || "OM";
      isAuthenticated = true;
    }
  } catch (e) {
    // Fallback if Clerk isn't initialized in static mode
  }

  // Close drawer on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  // Sidebar navigation content
  const sidebarContent = (
    <div className="flex flex-col justify-between h-full min-h-[520px]">
      <div>
        {/* Header Card */}
        <div className="bg-[#121e17] border-2 border-[#2a5c30] rounded-none p-3.5 mb-5 relative overflow-hidden shadow-[2px_2px_0px_#000000]">
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="absolute top-2.5 right-2.5 text-[#8fc99a] hover:text-[#7ecb8a] border border-[#2a5c30] hover:border-[#7ecb8a] w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer bg-[#0c1510]"
              aria-label="Close menu"
              title="Close Menu (Esc)"
            >
              ✕
            </button>
          )}
          <p className="font-sans text-[10px] uppercase tracking-widest text-[#8fc99a] font-bold">
            WELCOME TO
          </p>
          <h1 className="font-pixel text-sm sm:text-base font-bold text-[#7ecb8a] mt-0.5 uppercase tracking-wider">
            INSIGHTML
          </h1>
          <p className="font-sans text-xs text-[#56a66a] mt-0.5">Interactive Platform</p>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 font-sans text-sm">
          {NAVIGATION_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-none transition-colors ${
                  isActive
                    ? "bg-[#1c2d23] text-[#7ecb8a] font-medium border-l-4 border-[#7ecb8a] shadow-[2px_2px_0px_#000000]"
                    : "text-[#C9D7CF] hover:bg-[#1c2d23] hover:text-[#7ecb8a]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{item.icon}</span>
                  <span className="whitespace-nowrap font-pixel text-[11px] tracking-wide">
                    {item.name}
                  </span>
                </div>
                {isActive ? (
                  <span className="w-1.5 h-1.5 rounded-none bg-[#7ecb8a] shrink-0" />
                ) : (
                  <span className="text-[9px] text-[#8fc99a] bg-[#0c1510] px-1.5 py-0.5 rounded-none border border-[#2a5c30] font-mono shrink-0">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile Container */}
      <div className="mt-6 pt-4 border-t border-[#2a5c30]">
        <div className="bg-[#121e17] border-2 border-[#2a5c30] rounded-none p-3 shadow-[2px_2px_0px_#000000] flex items-center gap-3">
          {/* Avatar N Logo Box */}
          <div className="w-8 h-8 shrink-0 bg-[#0c1510] border-2 border-[#2a5c30] text-[#7ecb8a] font-pixel text-sm flex items-center justify-center font-bold shadow-[1px_1px_0px_#000000]">
            N
          </div>
          <div className="flex flex-col min-w-0">
            <p className="font-pixel text-xs text-[#7ecb8a] font-bold uppercase truncate">
              {userName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-none bg-[#56a66a] animate-pulse shrink-0" />
              <span className="font-sans text-[10px] text-[#8fc99a] tracking-wider uppercase font-medium">
                {isAuthenticated ? "Authenticated" : "Guest Mode"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── OVERLAY BACKDROP ── */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-[#070f09]/80 backdrop-blur-xs z-40 transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* ── FIXED SLIDE-OUT SIDEBAR DRAWER ── */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] bg-[#121e17] border-r-2 border-[#2a5c30] p-4 transition-transform duration-300 ease-in-out shadow-2xl overflow-y-auto ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

