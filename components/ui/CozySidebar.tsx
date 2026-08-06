"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ByteSprite } from "@/components/sprites/ByteSprite";

const NAVIGATION_ITEMS = [
  { name: "Overview", href: "/", icon: "🏠", badge: "Dashboard" },
  { name: "Perceptron", href: "/playground/perceptron", icon: "⚡", badge: "Meadow" },
  { name: "Gradient", href: "/playground/gradient-descent", icon: "📉", badge: "Mountain" },
  { name: "Neural Net", href: "/playground/neural-net", icon: "🧠", badge: "Forest" },
  { name: "Quests", href: "/#quests", icon: "📜", badge: "3/5" },
  { name: "Badges", href: "/#badges", icon: "🏆", badge: "4/8" },
  { name: "Playground Map", href: "/#map", icon: "🗺️", badge: "Explore" },
  { name: "Field Notes", href: "/#notes", icon: "📝", badge: "ML Docs" },
];

const DAILY_TIPS = [
  "Train models with optimal learning rates for faster convergence!",
  "Perceptrons draw straight decision lines. Hidden layers bend them into complex shapes!",
  "Stuck in a local minimum? Try increasing momentum or adjusting the learning rate!",
  "XOR needs hidden layers to solve—a single linear boundary cannot separate it!",
];

export const CozySidebar: React.FC = () => {
  const pathname = usePathname();
  const [tipIndex, setTipIndex] = useState(0);

  const handleNextTip = () => {
    setTipIndex((prev) => (prev + 1) % DAILY_TIPS.length);
  };

  return (
    <aside className="w-full md:w-64 bg-[#22302B] text-[#C9D7CF] p-4 flex flex-col justify-between shrink-0 border-r border-[#4E665B] md:min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="bg-[#2C3C35] border border-[#4E665B] rounded-xl p-3 text-center mb-6 relative overflow-hidden group">
          <p className="font-sans text-[10px] uppercase tracking-widest text-[#8DA397]">
            Welcome to
          </p>
          <h1 className="font-pixel text-sm sm:text-base font-bold text-[#EAF4EE] mt-0.5">
            InsightML
          </h1>
          <p className="font-sans text-xs text-[#6FCF97] mt-0.5">Interactive Platform</p>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 font-sans text-sm">
          {NAVIGATION_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#2C3C35] text-[#EAF4EE] font-medium border-l-4 border-[#6FCF97]"
                    : "text-[#C9D7CF] hover:bg-[#2C3C35] hover:text-[#EAF4EE]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.name}</span>
                </div>
                {isActive ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6FCF97]" />
                ) : (
                  <span className="text-[10px] text-[#8DA397] bg-[#182320] px-1.5 py-0.5 rounded border border-[#4E665B]/40 font-mono">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Daily Tip Card at Bottom */}
      <div className="mt-6 pt-4 border-t border-[#4E665B]/40">
        <div
          onClick={handleNextTip}
          className="bg-[#2C3C35] border border-[#4E665B] rounded-xl p-3 cursor-pointer hover:bg-[#33463E] transition-colors relative"
          title="Click for next tip"
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 shrink-0 bg-[#22302B] rounded-full flex items-center justify-center border border-[#4E665B] overflow-hidden">
              <ByteSprite scale={2} />
            </div>
            <div>
              <p className="font-pixel text-[9px] font-bold uppercase text-[#E9C46A] leading-tight">
                Byte&apos;s Pro Tip
              </p>
              <p className="font-sans text-[11px] text-[#8DA397]">Click to refresh</p>
            </div>
          </div>
          <p className="font-sans text-xs text-[#C9D7CF] leading-relaxed italic bg-[#182320] p-2.5 rounded-lg border border-[#4E665B]/60">
            &ldquo;{DAILY_TIPS[tipIndex]}&rdquo;
          </p>
        </div>
      </div>
    </aside>
  );
};
