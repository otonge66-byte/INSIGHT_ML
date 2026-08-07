"use client";

import React, { useEffect, useState, use } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { HeaderAuthButton } from "@/components/ui/HeaderAuthButton";
import { ExamInterface } from "@/components/certificates/ExamInterface";

// CRT scanline overlay
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

const MOD_NAMES: Record<string, string> = {
  perceptron: "Perceptron",
  "gradient-descent": "Gradient Descent",
  "neural-net": "Neural Network"
};

interface PageProps {
  params: Promise<{ module: string }>;
}

export default function ModuleExamPage({ params }: PageProps) {
  const { module } = use(params);
  const { user, isLoaded, isSignedIn } = useUser();
  const userId = user?.id;

  const moduleName = MOD_NAMES[module] || module;

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuestions() {
      if (!isLoaded || !isSignedIn || !userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Fetch questions from secure API
        const res = await fetch(`/api/certificates/exam/${module}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load exam questions");
        }
        setQuestions(data || []);
      } catch (e: any) {
        console.error("[ERROR] Failed loading exam questions:", e);
        setError(e.message || "Failed to load exam questions. Check your connection.");
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [module, isLoaded, isSignedIn, userId]);

  if (loading) {
    return (
      <div className="min-h-screen text-[#e8f0e0] font-vt323 flex items-center justify-center bg-[#070f09]">
        <ScanlineOverlay />
        <div className="text-center">
          <p className="font-pixel text-[12px] text-[#dda15e] animate-pulse">📡 INITIATING COMPREHENSIVE EXAM PROCTORING...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-[#e8f0e0] font-vt323 flex items-center justify-center bg-[#070f09] p-4">
        <ScanlineOverlay />
        <div className="bg-[#2a0d0d] border-4 border-[#bc4749] p-8 max-w-md w-full shadow-[6px_6px_0px_#000000] text-center">
          <p className="font-pixel text-[12px] text-[#e57373] mb-4">✕ EXAM ERROR</p>
          <p className="font-sans text-xs text-[#bc4749] mb-6">{error}</p>
          <Link href={`/certificates/${module}`} className="font-pixel text-[8px] bg-[#bc4749] text-[#182320] border border-[#bc4749] px-6 py-2 transition-all hover:bg-transparent hover:text-[#bc4749]">
            RETURN TO PORTAL
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScanlineOverlay />
      <style>{`
        @keyframes scanScroll {
          0%   { background-position: 0 0; }
          100% { background-position: 0 80px; }
        }
      `}</style>

      <main
        className="relative min-h-screen text-[#e8f0e0] font-vt323 overflow-x-hidden"
        style={{ background: "#070f09" }}
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-6">

          {/* Nav */}
          <nav className="flex items-center justify-between border-4 px-5 py-3" style={{ background: "#0a1a0d", borderColor: "#1e4023", boxShadow: "4px 4px 0px 0px #050d07" }}>
            <div className="flex items-center gap-3">
              <Link href={`/certificates/${module}`} className="font-pixel text-[9px] text-[#7ecb8a] hover:text-[#dda15e] uppercase tracking-wider">
                ◀ CANCEL EXAM
              </Link>
            </div>
            <HeaderAuthButton />
          </nav>

          {/* Exam component layout */}
          <ExamInterface
            moduleKey={module}
            moduleName={moduleName}
            questions={questions}
          />

          {/* Footer */}
          <footer className="border-t-2 pt-4 flex items-center justify-between text-base" style={{ borderColor: "#1a3a1e", color: "#2a5232" }}>
            <span className="font-pixel text-[8px]">InsightML © 2026 — EXAM OFFICE</span>
          </footer>

        </div>
      </main>
    </>
  );
}
