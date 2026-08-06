"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CozySidebar } from "@/components/ui/CozySidebar";
import { CozyHeader } from "@/components/ui/CozyHeader";
import { RetroButton } from "@/components/ui/RetroButton";

export default function CozyIslandDashboard() {
  // ── Auth & Profile State ──
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("Explorer Alex");
  const [userAvatar, setUserAvatar] = useState<string>("🤠");
  const [loginInput, setLoginInput] = useState<string>("");
  const [selectedAvatarInput, setSelectedAvatarInput] = useState<string>("🤠");

  // ── Calendar Activity State ──
  const [selectedDay, setSelectedDay] = useState<number>(20);
  const [dayActivityMsg, setDayActivityMsg] = useState<string | null>(null);

  // Load user profile from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("insightml_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name) {
          setUserName(parsed.name);
          setUserAvatar(parsed.avatar || "🤠");
          setIsLoggedIn(true);
        }
      }
    } catch (e) {}
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = loginInput.trim() || "Explorer Alex";
    setUserName(finalName);
    setUserAvatar(selectedAvatarInput);
    setIsLoggedIn(true);
    try {
      localStorage.setItem(
        "insightml_user",
        JSON.stringify({ name: finalName, avatar: selectedAvatarInput })
      );
    } catch (e) {}
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    try {
      localStorage.removeItem("insightml_user");
    } catch (e) {}
  };

  // Mock activity logs for August 2026 calendar days
  const ACTIVITY_LOGS: Record<number, string> = {
    3: "Aug 3: Trained 12 Epochs in Perceptron Meadow!",
    6: "Aug 6: Solved XOR Pattern in Neural Forest!",
    9: "Aug 9: Navigated Bowl Loss Surface in Gradient Mountain!",
    12: "Aug 12: Reached 98% Accuracy in Perceptron Classifier!",
    15: "Aug 15: Added 4 Hidden Layer Nodes in Deep Neural Net!",
    18: "Aug 18: Completed Speed Classifier Challenge!",
    20: "Aug 20 (Today): Active session! 15 Epochs trained, 7-Day Streak active!",
    21: "Aug 21: Planned Gradient Descent session",
    24: "Aug 24: Scheduled XOR Deep Learning Review",
    27: "Aug 27: Model Hyperparameter Tuning Day",
    30: "Aug 30: End of Month Challenge Prep",
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    if (ACTIVITY_LOGS[day]) {
      setDayActivityMsg(ACTIVITY_LOGS[day]);
    } else {
      setDayActivityMsg(`Aug ${day}: Rest & theory study day`);
    }
  };

  const MODULE_ZONES = [
    {
      id: "perceptron",
      title: "Perceptron Meadow",
      icon: "⚡",
      color: "bg-[#22302B]",
      href: "/playground/perceptron",
      desc: "Single-layer classifier & linear decision boundary visualizer.",
      progress: "8/8 Tasks",
    },
    {
      id: "gradient-descent",
      title: "Gradient Mountain",
      icon: "📉",
      color: "bg-[#22302B]",
      href: "/playground/gradient-descent",
      desc: "Loss surface terrain, gradient step trajectories & learning rate tuning.",
      progress: "5/5 Tasks",
    },
    {
      id: "neural-net",
      title: "Neural Forest",
      icon: "🧠",
      color: "bg-[#22302B]",
      href: "/playground/neural-net",
      desc: "Deep learning, hidden layers, non-linear boundaries & XOR solver.",
      progress: "3/5 Tasks",
    },
  ];

  return (
    <div className="min-h-screen bg-[#182320] text-[#C9D7CF] flex flex-col md:flex-row selection:bg-[#6FCF97] selection:text-[#182320] font-sans">
      {/* Sidebar */}
      <CozySidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <CozyHeader
          title={isLoggedIn ? `Welcome back, ${userName}!` : "Welcome to InsightML!"}
          subtitle="Here is an overview of your InsightML platform and active learning modules"
          userName={isLoggedIn ? userName : "Guest"}
          userAvatar={isLoggedIn ? userAvatar : "🔒"}
        />

        {/* Main Dashboard Grid Layout */}
        <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 max-w-7xl mx-auto w-full items-start">
          
          {/* 1. OVERVIEW & LOGIN CARD (Left Side - Larger 2-Column Span) */}
          <section className="lg:col-span-2 bg-[#2C3C35] hover:bg-[#33463E] border border-[#4E665B] rounded-2xl p-6 shadow-sm hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between relative overflow-hidden min-h-[480px]">
            
            {/* LOGGED-OUT STATE WITH LOGIN FORM */}
            {!isLoggedIn ? (
              <div className="flex flex-col justify-between h-full">
                {/* Background preview muted */}
                <div className="filter blur-xs opacity-20 pointer-events-none select-none">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-pixel text-xs font-bold text-[#EAF4EE]">OVERVIEW & SESSION</h2>
                    <span className="text-xs bg-[#22302B] border border-[#4E665B] px-2 py-0.5 rounded text-[#8DA397]">Level 4</span>
                  </div>
                  <div className="p-4 bg-[#22302B] rounded-xl mb-4 text-center">
                    <p className="font-pixel text-xs text-[#6FCF97]">PLATFORM RATING 4.5</p>
                  </div>
                  <div className="h-48 bg-[#182320] rounded-xl border border-[#4E665B]" />
                </div>

                {/* Centered Login Setup Form */}
                <div className="absolute inset-0 bg-[#22302B]/95 backdrop-blur-sm p-6 sm:p-8 flex flex-col justify-center items-center text-center z-20">
                  <div className="w-12 h-12 rounded-full bg-[#2C3C35] text-[#6FCF97] flex items-center justify-center text-xl border border-[#4E665B] mb-3">
                    🔒
                  </div>
                  <h3 className="font-pixel text-xs sm:text-sm font-bold text-[#EAF4EE] uppercase mb-1">
                    Explorer Session Setup
                  </h3>
                  <p className="text-xs text-[#8DA397] mb-5 max-w-sm font-sans">
                    Login or create your explorer profile to track live daily activity & training streaks.
                  </p>

                  <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 font-sans">
                    {/* Avatar selection */}
                    <div>
                      <label className="text-xs text-[#C9D7CF] block mb-2 font-medium">
                        Choose Your Explorer Avatar
                      </label>
                      <div className="flex justify-center gap-3 mb-1">
                        {["🤠", "🦊", "🦝", "🦉", "🐻"].map((av) => (
                          <button
                            key={av}
                            type="button"
                            onClick={() => setSelectedAvatarInput(av)}
                            className={`w-9 h-9 rounded-full text-lg flex items-center justify-center border transition-all ${
                              selectedAvatarInput === av
                                ? "bg-[#2C3C35] border-[#6FCF97] scale-105 shadow-sm"
                                : "bg-[#182320] border-[#4E665B] hover:bg-[#2C3C35]"
                            }`}
                          >
                            {av}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Name input */}
                    <div>
                      <input
                        type="text"
                        placeholder="Enter Explorer Name..."
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        className="w-full bg-[#182320] border border-[#4E665B] rounded-xl px-4 py-2.5 text-sm font-sans text-[#EAF4EE] focus:outline-none focus:border-[#6FCF97] text-center"
                      />
                    </div>

                    <RetroButton variant="primary" type="submit" className="w-full py-2.5">
                      Login & Start Session
                    </RetroButton>
                  </form>
                </div>
              </div>
            ) : (
              /* LOGGED-IN EXPLORER STATE */
              <div className="flex flex-col justify-between h-full space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#4E665B]/60">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl bg-[#22302B] p-2 rounded-xl border border-[#4E665B]">{userAvatar}</span>
                    <div>
                      <h2 className="font-pixel text-xs sm:text-sm font-bold uppercase text-[#EAF4EE]">
                        {userName}
                      </h2>
                      <span className="text-xs text-[#8DA397]">Level 4 ML Scholar</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-[#22302B] text-[#E9C46A] px-3 py-1 rounded-lg border border-[#4E665B] font-medium">
                      🔥 7 Day Streak
                    </span>
                    <button
                      onClick={handleLogout}
                      className="text-xs bg-[#22302B] hover:bg-[#182320] text-[#D96C6C] px-2.5 py-1 rounded-lg border border-[#4E665B] transition-colors flex items-center gap-1 font-medium"
                      title="Logout / Switch Profile"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>

                {/* Rating & Stats bar */}
                <div className="bg-[#22302B] p-3.5 rounded-xl border border-[#4E665B] flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase text-[#8DA397] font-medium">
                      Platform Rating
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-[#E9C46A] text-xs">
                      <span>⭐️</span>
                      <span>⭐️</span>
                      <span>⭐️</span>
                      <span>⭐️</span>
                      <span className="opacity-40">⭐️</span>
                      <span className="font-semibold text-xs text-[#EAF4EE] ml-1">4.5</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase text-[#8DA397] font-medium">Total Epochs</p>
                    <p className="font-semibold text-sm text-[#6FCF97]">⚡ 142 Trained</p>
                  </div>
                </div>

                {/* Interactive Live Activity Calendar Widget */}
                <div className="bg-[#182320] p-4 rounded-xl border border-[#4E665B] flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#EAF4EE] mb-3 px-1">
                    <span>‹</span>
                    <span>August 2026 (Live Activity Calendar)</span>
                    <span>›</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-xs mb-2">
                    {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                      <span key={i} className="text-[#8DA397] text-xs font-medium py-1">
                        {d}
                      </span>
                    ))}
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                      const hasActivity = Boolean(ACTIVITY_LOGS[day]);
                      const isSelected = day === selectedDay;

                      return (
                        <button
                          key={day}
                          onClick={() => handleDayClick(day)}
                          className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center text-xs transition-all relative mx-auto ${
                            isSelected
                              ? "bg-[#2C3C35] text-[#6FCF97] font-bold border border-[#6FCF97]"
                              : hasActivity
                              ? "bg-[#2C3C35]/60 text-[#A6D8B8] hover:bg-[#2C3C35]"
                              : "hover:bg-[#22302B] text-[#8DA397]"
                          }`}
                          title={ACTIVITY_LOGS[day] || `Aug ${day}`}
                        >
                          {day}
                          {hasActivity && !isSelected && (
                            <span className="absolute bottom-0.5 w-1 h-1 bg-[#6FCF97] rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Day activity details box */}
                  {dayActivityMsg && (
                    <div className="mt-2 bg-[#22302B] p-2.5 rounded-lg border border-[#4E665B] text-xs text-[#C9D7CF] italic font-sans leading-tight text-center">
                      {dayActivityMsg}
                    </div>
                  )}
                </div>

                {/* Pro tip footer */}
                <div className="pt-2 border-t border-[#4E665B]/60 flex items-center gap-2">
                  <span className="text-sm">💡</span>
                  <p className="text-xs text-[#8DA397] leading-tight">
                    <span className="font-semibold text-[#EAF4EE]">Pro Tip:</span> Click calendar days to inspect daily training logs.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* RIGHT SIDE CONTAINER (Upper & Lower Stacked Cards) */}
          <div className="lg:col-span-1 flex flex-col gap-5 lg:gap-6">
            
            {/* 2. Main Playground Map Card (Upper Side) */}
            <section className="bg-[#2C3C35] hover:bg-[#33463E] border border-[#4E665B] rounded-2xl p-5 shadow-sm hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#4E665B]/60">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🗺️</span>
                    <h2 className="font-pixel text-xs font-bold uppercase tracking-wider text-[#EAF4EE]">
                      Main Playground
                    </h2>
                  </div>
                  <span className="text-xs text-[#8DA397]">3 Modules</span>
                </div>

                <div className="space-y-2 mb-3">
                  {MODULE_ZONES.map((zone) => (
                    <Link
                      key={zone.id}
                      href={zone.href}
                      className="flex items-center justify-between bg-[#22302B] hover:bg-[#182320] p-2.5 rounded-xl border border-[#4E665B] transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg bg-[#2C3C35] text-[#6FCF97] flex items-center justify-center text-base border border-[#4E665B]"
                        >
                          {zone.icon}
                        </div>
                        <div>
                          <h3 className="font-pixel text-[11px] font-bold text-[#EAF4EE] group-hover:text-[#6FCF97] transition-colors">
                            {zone.title}
                          </h3>
                          <p className="text-[11px] text-[#8DA397] leading-tight mt-0.5 font-sans">
                            {zone.desc}
                          </p>
                        </div>
                      </div>
                      <span className="font-sans text-[10px] font-semibold bg-[#2C3C35] text-[#6FCF97] px-2 py-1 rounded-lg border border-[#4E665B] shrink-0">
                        Launch
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-1 text-center">
                <Link href="/playground/perceptron" className="inline-block w-full">
                  <RetroButton variant="primary" className="w-full py-2">
                    Open Perceptron Visualizer
                  </RetroButton>
                </Link>
              </div>
            </section>

            {/* 3. Field Notes Card (Lower Side) */}
            <section className="bg-[#2C3C35] hover:bg-[#33463E] border border-[#4E665B] rounded-2xl p-5 shadow-sm hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#4E665B]/60">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📝</span>
                    <h2 className="font-pixel text-xs font-bold uppercase tracking-wider text-[#EAF4EE]">
                      Field Notes
                    </h2>
                  </div>
                  <span className="text-xs text-[#8DA397]">Docs</span>
                </div>

                <div className="space-y-2.5">
                  {/* Note 1 */}
                  <div className="bg-[#22302B] p-3 rounded-xl border border-[#4E665B]">
                    <p className="font-pixel text-[10px] text-[#E9C46A] font-bold uppercase mb-1">
                      Core Concepts
                    </p>
                    <ul className="text-xs text-[#C9D7CF] space-y-1 list-disc pl-3 font-sans">
                      <li>Single-layer perceptrons classify linearly separable data.</li>
                      <li>Hidden layers transform space to solve non-linear problems.</li>
                    </ul>
                  </div>

                  {/* Note 2 */}
                  <div className="bg-[#22302B] p-3 rounded-xl border border-[#4E665B]">
                    <p className="font-pixel text-[10px] text-[#6FCF97] font-bold uppercase mb-1 flex items-center justify-between">
                      <span>Model Optimization</span>
                      <span>⚡</span>
                    </p>
                    <p className="text-xs text-[#C9D7CF] font-sans">
                      Carefully select the learning rate—excessive step sizes cause divergence while tiny rates delay convergence.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#4E665B]/60 text-right">
                <span className="text-xs text-[#8DA397] font-mono">
                  InsightML Field Guide v2.4
                </span>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
