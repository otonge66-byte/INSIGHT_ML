"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CozySidebar } from "@/components/ui/CozySidebar";
import { CozyHeader } from "@/components/ui/CozyHeader";
import { RetroButton } from "@/components/ui/RetroButton";
import { ByteSprite } from "@/components/sprites/ByteSprite";

const TERMINAL_MESSAGES = [
  "Initializing Neural Network...",
  "Loading Dataset...",
  "Building Decision Boundary...",
  "Training Model...",
  "Ready.",
];

export default function CozyIslandDashboard() {
  // ── Terminal typewriter state ──
  const [msgIndex, setMsgIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentFullMsg = TERMINAL_MESSAGES[msgIndex];
    let timer: NodeJS.Timeout;

    if (!isDeleting && charIndex < currentFullMsg.length) {
      timer = setTimeout(() => setCharIndex((prev) => prev + 1), 60);
    } else if (!isDeleting && charIndex === currentFullMsg.length) {
      timer = setTimeout(() => setIsDeleting(true), 1600);
    } else if (isDeleting && charIndex > 0) {
      timer = setTimeout(() => setCharIndex((prev) => prev - 1), 30);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setMsgIndex((prev) => (prev + 1) % TERMINAL_MESSAGES.length);
    }

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, msgIndex]);

  const currentTypedText = TERMINAL_MESSAGES[msgIndex].substring(0, charIndex);

  const MODULE_ZONES = [
    {
      id: "perceptron",
      title: "Perceptron Visualizer",
      icon: "⚡",
      color: "#6FCF97",
      href: "/playground/perceptron",
      desc: "Learn how a single-layer perceptron separates data using a moving decision boundary.",
    },
    {
      id: "gradient-descent",
      title: "Gradient Descent",
      icon: "📉",
      color: "#E9C46A",
      href: "/playground/gradient-descent",
      desc: "Visualize optimization on a loss surface and understand how models learn.",
    },
    {
      id: "neural-net",
      title: "Neural Network",
      icon: "🧠",
      color: "#D96C6C",
      href: "/playground/neural-net",
      desc: "Build hidden layers and explore nonlinear decision boundaries interactively.",
    },
  ];

  const HOW_IT_WORKS = [
    {
      title: "Story Mode",
      icon: "📖",
      desc: "Guided walkthrough with BYTE the AI professor explaining core concepts step by step.",
    },
    {
      title: "Sandbox Mode",
      icon: "🔬",
      desc: "Full parameter control to experiment freely, adjust learning rates, and load custom datasets.",
    },
    {
      title: "Challenge Mode",
      icon: "🏆",
      desc: "Solve targeted ML puzzles, reach accuracy goals, and earn star ratings by meeting target metrics.",
    },
  ];

  const PLATFORM_GOALS = [
    { label: "Visual Learning", desc: "Intuitive geometric representations of ML algorithms" },
    { label: "Interactive Simulations", desc: "Real-time feedback with instant canvas updates" },
    { label: "No Coding Required", desc: "Pure browser-based exploration with zero setup" },
    { label: "Beginner Friendly", desc: "Step-by-step guidance tailored for all skill levels" },
    { label: "Real-Time Visualization", desc: "Watch weights, gradients, and loss surfaces change live" },
    { label: "Progress Tracking", desc: "Track completed modules, accuracy milestones, and streaks" },
  ];

  return (
    <div className="min-h-screen bg-[#182320] text-[#C9D7CF] flex flex-col md:flex-row selection:bg-[#6FCF97] selection:text-[#182320] font-sans">
      {/* Sidebar */}
      <CozySidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <CozyHeader
          title="InsightML Control Center"
          subtitle="Interactive Control Center for Machine Learning Visualizations"
          userName="Guest"
          userAvatar="🤖"
        />

        {/* Dashboard Content Container */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">

          {/* ── SECTION 1: TWO-COLUMN HERO SECTION ───────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">

            {/* LEFT SIDE (70% - HERO TERMINAL CONSOLE) */}
            <section className="lg:col-span-8 bg-[#2C3C35] hover:bg-[#33463E] border border-[#4E665B] rounded-2xl p-6 shadow-sm relative overflow-hidden transition-all duration-200 flex flex-col justify-between">
              
              {/* Soft CRT scanlines overlay */}
              <div
                className="absolute inset-0 pointer-events-none rounded-2xl opacity-10"
                style={{
                  backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%)",
                  backgroundSize: "100% 4px",
                }}
              />

              <div>
                {/* Header Row: Mascot & Title */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-[#22302B] border border-[#4E665B] flex items-center justify-center shrink-0 p-1">
                    <ByteSprite scale={3} />
                  </div>
                  <div>
                    <h1 className="font-pixel text-xl sm:text-2xl font-bold text-[#EAF4EE] tracking-wider uppercase">
                      INSIGHTML
                    </h1>
                    <p className="font-sans text-xs sm:text-sm font-semibold text-[#6FCF97] mt-0.5">
                      Learn Machine Learning Visually
                    </p>
                  </div>
                </div>

                {/* Welcome Message */}
                <div className="bg-[#22302B] border border-[#4E665B] p-4 rounded-xl mb-4 font-sans text-xs sm:text-sm text-[#C9D7CF] leading-relaxed">
                  <p className="text-[#EAF4EE] font-medium mb-1">Welcome Explorer,</p>
                  <p>
                    Visualize Machine Learning algorithms step by step. Choose a module below to begin your journey.
                  </p>
                </div>
              </div>

              {/* Animated Terminal Area */}
              <div className="bg-[#182320] border border-[#4E665B] rounded-xl p-4 font-mono text-xs text-[#6FCF97] shadow-inner relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#4E665B]/60 pb-2 mb-2">
                  <span className="font-pixel text-[9px] text-[#8DA397] uppercase">
                    TERMINAL CONSOLE // SYSTEM LOG
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#6FCF97] animate-pulse" />
                    <span className="text-[10px] text-[#8DA397]">ACTIVE</span>
                  </div>
                </div>
                <div className="space-y-1 font-mono text-xs">
                  <p className="text-[#8DA397]">&gt; SYSTEM_INIT: Ready.</p>
                  <p className="text-[#6FCF97] flex items-center">
                    &gt; {currentTypedText}
                    <span className="inline-block w-2 h-4 bg-[#6FCF97] ml-1 animate-pulse" />
                  </p>
                </div>
              </div>
            </section>

            {/* RIGHT SIDE (30% - SYSTEM STATUS PANEL WITH RADAR) */}
            <section className="lg:col-span-4 bg-[#2C3C35] hover:bg-[#33463E] border border-[#4E665B] rounded-2xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#4E665B]/60 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🖥️</span>
                    <h2 className="font-pixel text-xs font-bold text-[#EAF4EE] uppercase tracking-wider">
                      System Status
                    </h2>
                  </div>
                  <span className="bg-[#182320] text-[#6FCF97] border border-[#4E665B] px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                    ONLINE
                  </span>
                </div>

                {/* Animated SVG Radar */}
                <div className="relative w-28 h-28 mx-auto my-2 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#4E665B" strokeWidth="1" opacity="0.4" />
                    <circle cx="50" cy="50" r="30" fill="none" stroke="#4E665B" strokeWidth="1" opacity="0.4" />
                    <circle cx="50" cy="50" r="15" fill="none" stroke="#4E665B" strokeWidth="1" opacity="0.4" />
                    <line x1="50" y1="5" x2="50" y2="95" stroke="#4E665B" strokeWidth="1" opacity="0.3" />
                    <line x1="5" y1="50" x2="95" y2="50" stroke="#4E665B" strokeWidth="1" opacity="0.3" />
                    <circle cx="50" cy="50" r="3" fill="#6FCF97" />
                    <circle cx="65" cy="35" r="2.5" fill="#6FCF97" className="animate-ping" />
                    <circle cx="65" cy="35" r="2" fill="#6FCF97" />
                    <circle cx="32" cy="62" r="2" fill="#E9C46A" />
                    <g className="origin-center animate-[spin_4s_linear_infinite]">
                      <line x1="50" y1="50" x2="50" y2="5" stroke="#6FCF97" strokeWidth="1.5" />
                      <polygon points="50,50 50,5 85,20" fill="url(#radar-sweep)" opacity="0.35" />
                    </g>
                    <defs>
                      <radialGradient id="radar-sweep" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#6FCF97" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#6FCF97" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* Status List */}
              <div className="bg-[#182320] border border-[#4E665B] rounded-xl p-3.5 space-y-2 text-xs font-sans mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#8DA397]">Modules</span>
                  <span className="font-mono text-[#EAF4EE] font-bold">3 / 3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8DA397]">Current User</span>
                  <span className="font-mono text-[#6FCF97] font-bold">Guest</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8DA397]">Learning Progress</span>
                  <span className="font-mono text-[#E9C46A] font-bold">0%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8DA397]">Completed Lessons</span>
                  <span className="font-mono text-[#EAF4EE] font-bold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8DA397]">Current Track</span>
                  <span className="font-mono text-[#6FCF97] font-bold">Visual ML</span>
                </div>
                <div className="flex justify-between items-center border-t border-[#4E665B]/60 pt-1.5 mt-1.5">
                  <span className="text-[#8DA397]">System Status</span>
                  <span className="font-mono text-[#6FCF97] font-bold">Ready</span>
                </div>
              </div>
            </section>

          </div>

          {/* ── SECTION 2: THREE EQUAL MODULE CARDS ──────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {MODULE_ZONES.map((zone) => (
              <section
                key={zone.id}
                className="bg-[#2C3C35] hover:bg-[#33463E] border border-[#4E665B] rounded-2xl p-6 shadow-sm hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#4E665B]/60">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl bg-[#22302B] text-lg flex items-center justify-center border border-[#4E665B]"
                      >
                        {zone.icon}
                      </div>
                      <h3 className="font-pixel text-xs font-bold text-[#EAF4EE]">
                        {zone.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-[#C9D7CF] leading-relaxed font-sans mb-6">
                    {zone.desc}
                  </p>
                </div>

                <div>
                  <Link href={zone.href} className="inline-block w-full">
                    <RetroButton variant="primary" className="w-full py-2.5">
                      Launch Module ▶
                    </RetroButton>
                  </Link>
                </div>
              </section>
            ))}
          </div>

          {/* ── SECTION 3: TWO COLUMNS (HOW IT WORKS & PLATFORM GOALS) ──── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-stretch">

            {/* LEFT: How InsightML Works */}
            <div className="space-y-3">
              <h2 className="font-pixel text-xs font-bold text-[#EAF4EE] uppercase tracking-wider flex items-center gap-2 px-1">
                <span>⚙️</span> How InsightML Works
              </h2>

              <div className="space-y-3">
                {HOW_IT_WORKS.map((item, i) => (
                  <div
                    key={i}
                    className="bg-[#2C3C35] hover:bg-[#33463E] border border-[#4E665B] rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-start gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#22302B] flex items-center justify-center text-base border border-[#4E665B] shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-pixel text-xs font-bold text-[#EAF4EE] mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#C9D7CF] leading-relaxed font-sans">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Platform Goals */}
            <div className="space-y-3">
              <h2 className="font-pixel text-xs font-bold text-[#EAF4EE] uppercase tracking-wider flex items-center gap-2 px-1">
                <span>🎯</span> Platform Goals
              </h2>

              <div className="bg-[#2C3C35] hover:bg-[#33463E] border border-[#4E665B] rounded-2xl p-5 shadow-sm transition-all duration-200 h-calc flex flex-col justify-between">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PLATFORM_GOALS.map((goal, i) => (
                    <div
                      key={i}
                      className="bg-[#22302B] border border-[#4E665B] rounded-xl p-3 flex flex-col gap-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#6FCF97] font-bold text-xs">✦</span>
                        <h4 className="font-sans text-xs font-semibold text-[#EAF4EE]">
                          {goal.label}
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#8DA397] leading-tight font-sans">
                        {goal.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
