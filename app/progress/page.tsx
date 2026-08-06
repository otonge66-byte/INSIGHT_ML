"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HeaderAuthButton } from "@/components/ui/HeaderAuthButton";
import { ProgressDashboard } from "@/components/progress/ProgressDashboard";

// ── Floating pixel particles canvas (Identical to home page) ──────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COLORS = [
      "rgba(74,124,89,",    // mid forest green
      "rgba(56,102,65,",    // dark green
      "rgba(34,74,44,",     // deep forest
      "rgba(163,177,138,",  // sage
      "rgba(103,148,92,",   // leaf green
      "rgba(221,161,94,",   // amber accent (sparse)
    ];

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      size: number; color: string;
      alpha: number; alphaDir: number;
    };

    const particles: Particle[] = Array.from({ length: 55 }, () => ({
      x: Math.random() * (canvas.width || 1200),
      y: Math.random() * (canvas.height || 800),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3 - 0.1,
      size: Math.random() < 0.5 ? 2 : 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.4 + 0.05,
      alphaDir: (Math.random() - 0.5) * 0.003,
    }));

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.alphaDir;
        if (p.alpha <= 0.02 || p.alpha >= 0.5) p.alphaDir *= -1;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.fillStyle = `${p.color}${p.alpha.toFixed(2)})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}

// ── Scanline / CRT overlay (Identical to home page) ───────────────────────────
function ScanlineOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[5]"
      aria-hidden="true"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
        animation: "scanScroll 8s linear infinite",
      }}
    />
  );
}

const MODULES = [
  {
    id: "perceptron",
    num: "01",
    title: "Perceptron",
    href: "/playground/perceptron",
  },
  {
    id: "gradient-descent",
    num: "02",
    title: "Gradient",
    href: "/playground/gradient-descent",
  },
  {
    id: "neural-net",
    num: "03",
    title: "Neural Network",
    href: "/playground/neural-net",
  },
] as const;

export default function ProgressPage() {
  return (
    <>
      {/* Global keyframe styles (Identical to home page) */}
      <style>{`
        @keyframes scanScroll {
          0%   { background-position: 0 0; }
          100% { background-position: 0 80px; }
        }
        @keyframes byteBob {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes byteGlow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(74,124,89,0.3)); }
          50%       { filter: drop-shadow(0 0 14px rgba(103,148,92,0.6)); }
        }
        @keyframes amberPulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes borderPulse {
          0%, 100% { box-shadow: 6px 6px 0px 0px #050d07, 0 0 0px 0px transparent; }
          50%       { box-shadow: 6px 6px 0px 0px #050d07, 0 0 22px 5px rgba(56,102,65,0.35); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes crtFlicker {
          0%, 98%, 100% { opacity: 1; }
          99% { opacity: 0.94; }
        }
        .home-green-panel {
          background-image:
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 3px,
              rgba(30,60,35,0.12) 3px,
              rgba(30,60,35,0.12) 4px
            );
        }
        .home-panel-fade { animation: fadeSlideUp 0.6s ease both; }
        .crt-body { animation: crtFlicker 6s ease infinite; }
      `}</style>

      {/* CRT scanline overlay */}
      <ScanlineOverlay />

      <main
        className="relative min-h-screen text-[#e8f0e0] font-vt323 overflow-x-hidden crt-body"
        style={{ background: "#070f09", animation: "crtFlicker 6s ease infinite" }}
      >
        {/* Ambient particle layer */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <ParticleCanvas />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">

          {/* ── TOP NAV BAR (Identical to home page) ─────────────────────────── */}
          <nav className="flex items-center justify-between border-4 px-5 py-3" style={{ background: "#0a1a0d", borderColor: "#1e4023", boxShadow: "4px 4px 0px 0px #050d07" }}>
            <div className="flex items-center gap-3">
              <Link href="/" className="font-pixel text-[10px] tracking-widest uppercase hover:text-[#7ecb8a]" style={{ color: "#7ecb8a", textDecoration: "none" }}>
                InsightML
              </Link>
              <span className="font-pixel text-[8px] hidden sm:inline" style={{ color: "#2a5232" }}>
                v1.0.0
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {MODULES.map((m) => (
                <Link
                  key={m.id}
                  href={m.href}
                  className="font-pixel text-[8px] sm:text-[9px] transition-colors px-2 py-1 border border-transparent hidden md:inline-block hover:text-[#7ecb8a]"
                  style={{ color: "#5a9966", textDecoration: "none" }}
                >
                  {m.num}. {m.title}
                </Link>
              ))}
              <HeaderAuthButton />
            </div>
          </nav>

          {/* ── MY PROGRESS DASHBOARD (Identical to home page) ───────────────── */}
          <div className="home-panel-fade animate-delay-[0.2s]">
            <ProgressDashboard />
          </div>

          {/* ── FOOTER (Identical to home page) ─────────────────────────────── */}
          <footer className="border-t-2 pt-4 flex items-center justify-between text-base home-panel-fade" style={{ borderColor: "#1a3a1e", color: "#2a5232", animationDelay: "0.4s" }}>
            <span className="font-pixel text-[8px]">InsightML © 2026 — HUD STATS ARE SIMULATED FLAVOR DATA</span>
            <div className="flex items-center gap-4">
              {MODULES.map((m) => (
                <Link
                  key={m.id}
                  href={m.href}
                  className="font-pixel text-[8px] transition-colors hover:text-[#7ecb8a]"
                  style={{ color: "#2a5232", textDecoration: "none" }}
                >
                  {m.title}
                </Link>
              ))}
            </div>
          </footer>

        </div>
      </main>
    </>
  );
}
