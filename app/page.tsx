"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ByteSprite } from "@/components/sprites/ByteSprite";
import { HeaderAuthButton } from "@/components/ui/HeaderAuthButton";

import {
  PerceptronBadge,
  GradientBadge,
  NeuralNetBadge,
} from "@/components/sprites/ModuleBadges";

// ── Typewriter hook (inline, lightweight) ────────────────────────────────────
function useTypewriter(text: string, speed = 38, startDelay = 600) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const delay = setTimeout(() => {
      const iv = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(iv);
          setDone(true);
        }
      }, 1000 / speed);
      return () => clearInterval(iv);
    }, startDelay);
    return () => clearTimeout(delay);
  }, [text, speed, startDelay]);

  return { displayed, done };
}

// ── Floating pixel particles canvas ─────────────────────────────────────────
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

    // Green-dominant pixel particles (forest palette shift)
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

// ── Scanline / CRT overlay ────────────────────────────────────────────────────
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

// ── Fake live counter hook ───────────────────────────────────────────────────
function useLiveCounter(base: number, tickMs = 4200, delta = 1) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const iv = setInterval(() => setVal((v) => v + delta), tickMs);
    return () => clearInterval(iv);
  }, [tickMs, delta]);
  return val;
}


// ── Module data ───────────────────────────────────────────────────────────────
const MODULES = [
  {
    id: "perceptron",
    num: "01",
    title: "Perceptron",
    subtitle: "Visualizer",
    description:
      "Draw points, watch a single-layer neural net learn to separate them with a moving decision boundary in real time.",
    icon: "⚡",
    href: "/playground/perceptron",
    accentColor: "#386641",
    borderColor: "border-[#386641]",
    glowColor: "rgba(56,102,65,0.35)",
    tagColor: "bg-[#386641] text-[#fefae0] border-[#1b3521]",
    badge: "LINEAR CLASSIFIER",
  },
  {
    id: "gradient-descent",
    num: "02",
    title: "Gradient",
    subtitle: "Descent",
    description:
      "Ride a ball down a mathematical loss surface. See exactly how the core optimizer behind all of ML navigates terrain.",
    icon: "📉",
    href: "/playground/gradient-descent",
    accentColor: "#dda15e",
    borderColor: "border-[#dda15e]",
    glowColor: "rgba(221,161,94,0.3)",
    tagColor: "bg-[#7a5225] text-[#fefae0] border-[#4a3215]",
    badge: "OPTIMIZER ENGINE",
  },
  {
    id: "neural-net",
    num: "03",
    title: "Neural",
    subtitle: "Network",
    description:
      "Stack hidden layers and solve the XOR problem — the pattern that stumped AI for a decade — with deep learning.",
    icon: "🧠",
    href: "/playground/neural-net",
    accentColor: "#bc4749",
    borderColor: "border-[#bc4749]",
    glowColor: "rgba(188,71,73,0.3)",
    tagColor: "bg-[#6b2123] text-[#fefae0] border-[#3d1214]",
    badge: "DEEP LEARNING",
  },
] as const;

// ── Amber HUD radar sweep ────────────────────────────────────────────────────
function RadarSweep() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 120;
    canvas.height = 120;

    const cx = 60, cy = 60, r = 52;
    const blips: { a: number; dist: number; alpha: number }[] = [
      { a: 0.8, dist: 28, alpha: 1 },
      { a: 2.1, dist: 40, alpha: 0.8 },
      { a: 4.5, dist: 20, alpha: 0.9 },
      { a: 5.3, dist: 38, alpha: 0.7 },
    ];

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, 120, 120);

      // Background circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(10,6,3,0.9)";
      ctx.fill();
      ctx.strokeStyle = "#b37d36";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Grid rings
      for (const frac of [0.33, 0.66, 1]) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * frac, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(179,125,54,0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Cross hairs
      ctx.strokeStyle = "rgba(179,125,54,0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();

      // Sweep gradient
      angleRef.current += 0.03;
      const a = angleRef.current;

      // Draw sweep as a filled arc sector
      ctx.save();
      ctx.clip(); // clip to circle (already set)
      const sweep = 0.55; // sweep arc width in radians
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a - sweep, a, false);
      ctx.closePath();
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grd.addColorStop(0, "rgba(221,161,94,0.0)");
      grd.addColorStop(0.7, "rgba(221,161,94,0.12)");
      grd.addColorStop(1, "rgba(221,161,94,0.35)");
      ctx.fillStyle = grd;
      ctx.fill();
      ctx.restore();

      // Sweep leading edge line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.strokeStyle = "rgba(221,161,94,0.85)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Blips — fade in when sweep passes
      for (const b of blips) {
        const diff = ((a - b.a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const age = diff < Math.PI ? diff / Math.PI : 1;
        const alpha = (1 - age) * b.alpha;
        if (alpha > 0.02) {
          const bx = cx + Math.cos(b.a) * b.dist;
          const by = cy + Math.sin(b.a) * b.dist;
          ctx.beginPath();
          ctx.arc(bx, by, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(221,161,94,${alpha.toFixed(2)})`;
          ctx.fill();
          // glow
          ctx.beginPath();
          ctx.arc(bx, by, 6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(221,161,94,${(alpha * 0.2).toFixed(2)})`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={120}
      className="opacity-90"
      style={{ imageRendering: "pixelated" }}
      aria-hidden="true"
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOME PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function HomePage() {
  const tagline = "Watch machine learning happen, right in your browser.";
  const { displayed: taglineText, done: taglineDone } = useTypewriter(tagline, 38, 900);

  const modelsCount = useLiveCounter(1247, 4200, 1);
  const sessionsCount = useLiveCounter(382, 6800, 1);
  const [uptime, setUptime] = useState("99.97%");
  const [pingMs, setPingMs] = useState(4);
  const [flashPing, setFlashPing] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      const ms = Math.floor(Math.random() * 6) + 2;
      setPingMs(ms);
      setFlashPing(true);
      setTimeout(() => setFlashPing(false), 300);
    }, 3500);
    return () => clearInterval(iv);
  }, []);

  return (
    <>
      {/* Global keyframe styles */}
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
        /* Green palette: dithered pixel-border texture on panels */
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
        .module-card {
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }
        .module-card:hover {
          transform: translateY(-4px) scale(1.02);
        }
        /* Green backdrop — card glows tuned for deep green bg */
        .module-card-perceptron:hover  { box-shadow: 6px 6px 0px 0px #050d07, 0 0 24px 6px rgba(56,102,65,0.55); }
        .module-card-gradient:hover    { box-shadow: 6px 6px 0px 0px #050d07, 0 0 24px 6px rgba(221,161,94,0.45); }
        .module-card-neural:hover      { box-shadow: 6px 6px 0px 0px #050d07, 0 0 24px 6px rgba(188,71,73,0.45); }
        .ping-flash { animation: amberPulse 0.3s ease; }
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

          {/* ── TOP NAV BAR ──────────────────────────────────────────────────── */}
          <nav className="flex items-center justify-between border-4 px-5 py-3" style={{ background: "#0a1a0d", borderColor: "#1e4023", boxShadow: "4px 4px 0px 0px #050d07" }}>
            <div className="flex items-center gap-3">
              <span className="font-pixel text-[10px] tracking-widest uppercase" style={{ color: "#7ecb8a" }}>
                InsightML
              </span>
              <span className="font-pixel text-[8px] hidden sm:inline" style={{ color: "#2a5232" }}>
                v1.0.0
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {MODULES.map((m) => (
                <Link
                  key={m.id}
                  href={m.href}
                  className="font-pixel text-[8px] sm:text-[9px] transition-colors px-2 py-1 border border-transparent hidden md:inline-block"
                  style={{ color: "#5a9966"}}
                >
                  {m.num}. {m.title}
                </Link>
              ))}
              <HeaderAuthButton />
            </div>
          </nav>

          {/* ── HERO + STATUS ROW ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 home-panel-fade" style={{ animationDelay: "0.1s" }}>

            {/* Hero Panel */}
            <div
              className="home-green-panel border-4 p-6 flex flex-col gap-5 relative overflow-hidden"
              style={{ background: "#091409", borderColor: "#2a5c30", boxShadow: "6px 6px 0px 0px #050d07", animation: "borderPulse 5s ease-in-out infinite" }}
            >
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-4 h-4" style={{ background: "#2a5c30" }} />
              <div className="absolute top-0 right-0 w-4 h-4" style={{ background: "#2a5c30" }} />
              <div className="absolute bottom-0 left-0 w-4 h-4" style={{ background: "#2a5c30" }} />
              <div className="absolute bottom-0 right-0 w-4 h-4" style={{ background: "#2a5c30" }} />

              <div className="flex items-start gap-5">
                {/* BYTE pixel sprite with idle bob */}
                <div style={{ animation: "byteGlow 4s ease-in-out infinite" }} className="flex-shrink-0">
                  <ByteSprite scale={4} />
                </div>

                {/* Title block */}
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-pixel text-[9px] px-2 py-1 border uppercase tracking-wider" style={{ background: "#1e4a24", color: "#a8e6b4", borderColor: "#2a6832" }}>
                      CASE FILE
                    </span>
                    <span className="font-pixel text-[8px]" style={{ color: "#2a5232" }}>
                      ██ DECRYPTED ██
                    </span>
                  </div>
                  <h1 className="font-pixel text-xl sm:text-2xl md:text-3xl uppercase tracking-widest leading-tight mt-1" style={{ color: "#7ecb8a" }}>
                    InsightML
                  </h1>
                  <div className="h-10 sm:h-8">
                    <p className="text-lg sm:text-xl leading-snug" style={{ color: "#8fc99a" }}>
                      {taglineText}
                      {!taglineDone && (
                        <span className="inline-block w-2.5 h-5 ml-0.5 align-middle" style={{ background: "#56a66a", animation: "amberPulse 0.8s ease-in-out infinite" }} />
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* BYTE speech bubble */}
              {taglineDone && (
                <div
                  className="ml-0 sm:ml-28 border-2 p-3 text-lg relative"
                  style={{ background: "#0d200f", borderColor: "#2a5c30", color: "#b8dfc0", animation: "fadeSlideUp 0.5s ease both" }}
                >
                  <div className="absolute -top-3 left-8 w-0 h-0" style={{ borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderBottom: "12px solid #2a5c30" }} />
                  <div className="absolute -top-2 left-9 w-0 h-0" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: "10px solid #0d200f" }} />
                  Hi! I&apos;m BYTE — I&apos;ll guide you through each module in Story Mode. No coding required. Just click &amp; explore!
                </div>
              )}
            </div>

            {/* System Status / HUD Panel — amber deliberately kept as high-contrast accent on green bg */}
            <div className="border-4 p-4 flex flex-col gap-4 home-panel-fade" style={{ background: "#0d0800", borderColor: "#b37d36", boxShadow: "6px 6px 0px 0px #050d07", animationDelay: "0.25s" }}>
              {/* Header */}
              <div className="flex flex-col gap-0.5 border-b-2 pb-2" style={{ borderColor: "#3a2800" }}>
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-[9px] text-[#dda15e] uppercase tracking-wider">SIGNAL MONITOR</span>
                  <span className="font-pixel text-[8px] text-[#386641]" style={{ animation: "amberPulse 2s ease-in-out infinite" }}>● ONLINE</span>
                </div>
                {/* Task 1: explicit flavor label */}
                <span className="font-pixel text-[7px] tracking-widest" style={{ color: "#5a3800" }}>SIMULATED ACTIVITY LOG</span>
              </div>

              {/* Radar */}
              <div className="flex items-center justify-center py-2">
                <RadarSweep />
              </div>

              {/* Stats — prefixed with ~ to signal simulated/flavor data */}
              <div className="flex flex-col gap-2 text-base">
                <div className="flex justify-between items-center border-b pb-1" style={{ borderColor: "#2a1a00" }}>
                  <span className="font-pixel text-[8px]" style={{ color: "#b37d36" }}>~ACTIVE MODULES</span>
                  <span className="font-vt323 text-xl" style={{ color: "#dda15e" }}>3 / 3</span>
                </div>
                <div className="flex justify-between items-center border-b pb-1" style={{ borderColor: "#2a1a00" }}>
                  <span className="font-pixel text-[8px]" style={{ color: "#b37d36" }}>~MODELS TRAINED</span>
                  <span className="font-vt323 text-xl" style={{ color: "#dda15e" }}>{modelsCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-1" style={{ borderColor: "#2a1a00" }}>
                  <span className="font-pixel text-[8px]" style={{ color: "#b37d36" }}>~SESSIONS</span>
                  <span className="font-vt323 text-xl" style={{ color: "#dda15e" }}>{sessionsCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-1" style={{ borderColor: "#2a1a00" }}>
                  <span className="font-pixel text-[8px]" style={{ color: "#b37d36" }}>~UPTIME</span>
                  <span className="font-vt323 text-xl" style={{ color: "#a3b18a" }}>{uptime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-pixel text-[8px]" style={{ color: "#b37d36" }}>~PING</span>
                  <span
                    className="font-vt323 text-xl"
                    style={{ color: flashPing ? "#dda15e" : "#386641", transition: "color 0.2s" }}
                  >
                    {pingMs}ms
                  </span>
                </div>
              </div>

              <div className="font-pixel text-[7px] text-center mt-auto" style={{ color: "#3a2800" }}>
                ◄ FLAVOR DATA — NOT REAL ANALYTICS ►
              </div>
            </div>
          </div>



          {/* ── MODULE CARDS ──────────────────────────────────────────────────── */}
          <section
            className="home-panel-fade"
            style={{ animationDelay: "0.3s" }}
            aria-label="Learning modules"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-0.5 w-6" style={{ background: "#1e4023" }} />
              <span className="font-pixel text-[9px] uppercase tracking-widest" style={{ color: "#2a6832" }}>Select Module</span>
              <div className="h-0.5 flex-1" style={{ background: "#152e18" }} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MODULES.map((m, i) => (
                <Link
                  key={m.id}
                  href={m.href}
                  className={`module-card module-card-${m.id === "gradient-descent" ? "gradient" : m.id === "neural-net" ? "neural" : "perceptron"} home-green-panel block border-4 ${m.borderColor} p-5 flex flex-col gap-4 group home-panel-fade`}
                  style={{ background: "#081209", boxShadow: "6px 6px 0px 0px #050d07", animationDelay: `${0.4 + i * 0.1}s`, textDecoration: "none" }}
                  aria-label={`Enter ${m.title} ${m.subtitle} module`}
                >
                  {/* Module header */}
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <span className={`font-pixel text-[8px] px-2 py-0.5 border self-start ${m.tagColor}`}>
                        {m.badge}
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="font-pixel text-[9px] text-[#5c3d2e]">{m.num}</span>
                        <h2 className="font-pixel text-base text-[#fefae0] uppercase leading-tight">
                          {m.title}
                          <br />
                          {m.subtitle}
                        </h2>
                      </div>
                    </div>
                    {/* Pixel-art badge sprite — one per module */}
                    <div
                      className="p-1.5 border-2 border-[#1e4023] bg-[#0d1e10] flex items-center justify-center group-hover:scale-110 group-hover:border-[#386641] transition-all duration-200 shadow-[2px_2px_0px_0px_#050d07]"
                      style={{ imageRendering: "pixelated" }}
                    >
                      {m.id === "perceptron" && <PerceptronBadge scale={3} />}
                      {m.id === "gradient-descent" && <GradientBadge scale={3} />}
                      {m.id === "neural-net" && <NeuralNetBadge scale={3} />}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[#a3b18a] text-lg leading-snug flex-1">
                    {m.description}
                  </p>

                  {/* Enter button row */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t-2 border-[#2a1800]">
                    <span
                      className="font-pixel text-[9px] uppercase px-3 py-2 border-2 transition-all duration-150"
                      style={{
                        color: m.accentColor,
                        borderColor: m.accentColor,
                        background: "transparent",
                      }}
                    >
                      ▶ Enter Module
                    </span>
                    <span className="font-pixel text-[8px] transition-colors" style={{ color: "#2a5232" }}>
                      STORY / SANDBOX / CHALLENGE
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ── HOW IT WORKS + SDG PANEL ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 home-panel-fade" style={{ animationDelay: "0.55s" }}>

            {/* How it works */}
            <div className="home-green-panel border-4 p-5" style={{ background: "#0b1c0d", borderColor: "#1e4023", boxShadow: "6px 6px 0px 0px #050d07" }}>
              <div className="border-2 px-3 py-1.5 mb-4 flex items-center justify-between" style={{ background: "#122815", borderColor: "#0a180c" }}>
                <h2 className="font-pixel text-[10px] uppercase tracking-wider" style={{ color: "#7ecb8a" }}>HOW IT WORKS</h2>
                <span className="inline-block w-2.5 h-2.5 border" style={{ background: "#4a7c59", borderColor: "#0a180c" }} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    step: "01",
                    icon: "📖",
                    title: "Story Mode",
                    desc: "BYTE walks you step-by-step through the theory with interactive checkpoints. No textbook needed.",
                  },
                  {
                    step: "02",
                    icon: "🔬",
                    title: "Sandbox Mode",
                    desc: "Experiment freely. Tweak sliders, place points, and observe how the model responds in real time.",
                  },
                  {
                    step: "03",
                    icon: "🏆",
                    title: "Challenge Mode",
                    desc: "Prove your understanding with scored objectives. Earn up to three stars per module.",
                  },
                ].map(({ step, icon, title, desc }) => (
                  <div key={step} className="flex flex-col gap-2 p-3 border-2" style={{ background: "#070f09", borderColor: "#1a3a1e" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl" role="img" aria-hidden="true">{icon}</span>
                      <span className="font-pixel text-[8px]" style={{ color: "#2a5232" }}>STEP {step}</span>
                    </div>
                    <h3 className="font-pixel text-[10px]" style={{ color: "#7ecb8a" }}>{title}</h3>
                    <p className="text-base leading-snug" style={{ color: "#6aaa7a" }}>{desc}</p>
                  </div>
                ))}
              </div>

              <p className="text-base mt-4" style={{ color: "#2a5232" }}>
                Zero setup · No coding · No account required · Runs entirely in your browser
              </p>
            </div>

            {/* SDG 4 panel */}
            <div className="border-4 p-5 flex flex-col gap-3" style={{ background: "#091409", borderColor: "#1e4a24", boxShadow: "6px 6px 0px 0px #050d07" }}>
              <div className="border-2 px-3 py-1.5 flex items-center justify-between" style={{ background: "#122815", borderColor: "#0a1a0d" }}>
                <span className="font-pixel text-[9px] uppercase" style={{ color: "#6aaa7a" }}>SDG ALIGNMENT</span>
                <span className="inline-block w-2.5 h-2.5 border" style={{ background: "#386641", borderColor: "#1e4a24" }} />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-14 h-14 border-4 flex items-center justify-center flex-shrink-0" style={{ background: "#122815", borderColor: "#386641", boxShadow: "2px 2px 0px 0px #050d07" }}>
                  <span className="font-pixel text-xl" style={{ color: "#7ecb8a" }}>4</span>
                </div>
                <div>
                  <p className="font-pixel text-[9px] uppercase" style={{ color: "#6aaa7a" }}>UN Goal 4</p>
                  <p className="font-pixel text-[10px] leading-tight mt-0.5" style={{ color: "#c8ecd0" }}>Quality Education</p>
                </div>
              </div>

              <p className="text-base leading-snug" style={{ color: "#6aaa7a" }}>
                InsightML makes machine learning education universally accessible — no expensive courses, no prerequisites, no setup friction.
              </p>

              <div className="flex flex-col gap-1.5 mt-1">
                {[
                  "Runs on any browser",
                  "Free & open access",
                  "Visual-first, jargon-light",
                  "Self-paced with instant feedback",
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-base" style={{ color: "#6aaa7a" }}>
                    <span style={{ color: "#386641" }}>▸</span>
                    {feat}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── FOOTER ───────────────────────────────────────────────────────── */}
          <footer className="border-t-2 pt-4 flex items-center justify-between text-base home-panel-fade" style={{ borderColor: "#1a3a1e", color: "#2a5232", animationDelay: "0.65s" }}>
            <span className="font-pixel text-[8px]">InsightML © 2026 — HUD STATS ARE SIMULATED FLAVOR DATA</span>
            <div className="flex items-center gap-4">
              {MODULES.map((m) => (
                <Link
                  key={m.id}
                  href={m.href}
                  className="font-pixel text-[8px] transition-colors"
                  style={{ color: "#2a5232" }}
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
