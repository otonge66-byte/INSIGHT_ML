"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { HeaderAuthButton } from "@/components/ui/HeaderAuthButton";
import { CertificateCard, RequirementStatus } from "@/components/certificates/CertificateCard";
import { fetchCertificates } from "@/lib/database/certificateService";

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

const MODULES = [
  { key: "perceptron", name: "Perceptron" },
  { key: "gradient-descent", name: "Gradient Descent" },
  { key: "neural-net", name: "Neural Network" }
];

interface ModuleState {
  eligible: boolean;
  earned: boolean;
  certId?: string;
  requirements: RequirementStatus;
}

export default function CertificatesPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const userId = user?.id;

  const [loading, setLoading] = useState(true);
  const [modulesState, setModulesState] = useState<Record<string, ModuleState>>({});

  useEffect(() => {
    async function loadCertificatesData() {
      if (!isLoaded) return;
      setLoading(true);
      
      const initialReq: RequirementStatus = {
        storyCompleted: false,
        sandboxCompleted: false,
        challengeCompleted: false,
        quizPassed: false,
        accuracyLossMet: false,
        details: "No data loaded yet"
      };

      const initialMap: Record<string, ModuleState> = {
        perceptron: { eligible: false, earned: false, requirements: initialReq },
        "gradient-descent": { eligible: false, earned: false, requirements: initialReq },
        "neural-net": { eligible: false, earned: false, requirements: initialReq }
      };

      if (!isSignedIn || !userId) {
        setModulesState(initialMap);
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch earned certificates
        const earnedList = await fetchCertificates(userId);
        
        // 2. Fetch eligibility for each module in parallel
        const states = await Promise.all(
          MODULES.map(async (mod) => {
            const res = await fetch(`/api/certificates/eligibility/${mod.key}`);
            const data = await res.json();
            const earnedRecord = earnedList.find((c) => c.module === mod.key);

            return {
              key: mod.key,
              eligible: data.eligible || false,
              earned: !!earnedRecord,
              certId: earnedRecord?.cert_id,
              requirements: data.requirements || initialReq
            };
          })
        );

        const newMap: Record<string, ModuleState> = {};
        states.forEach((s) => {
          newMap[s.key] = {
            eligible: s.eligible,
            earned: s.earned,
            certId: s.certId,
            requirements: s.requirements
          };
        });

        setModulesState(newMap);
      } catch (e) {
        console.error("[ERROR] Failed loading certificates data:", e);
      } finally {
        setLoading(false);
      }
    }

    loadCertificatesData();
  }, [isLoaded, isSignedIn, userId]);

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

          {/* Top Navbar */}
          <nav className="flex items-center justify-between border-4 px-5 py-3" style={{ background: "#0a1a0d", borderColor: "#1e4023", boxShadow: "4px 4px 0px 0px #050d07" }}>
            <div className="flex items-center gap-3">
              <Link href="/" className="font-pixel text-[10px] tracking-widest uppercase hover:text-[#7ecb8a]" style={{ color: "#7ecb8a", textDecoration: "none" }}>
                InsightML
              </Link>
            </div>
            <HeaderAuthButton />
          </nav>

          {/* Intro Panel */}
          <div className="bg-[#081209] border-4 border-[#1e4023] p-6 shadow-[6px_6px_0px_#050d07]">
            <h1 className="font-pixel text-xl sm:text-2xl font-bold text-[#7ecb8a] uppercase tracking-wider mb-2">
              🎓 Certification Registry Portal
            </h1>
            <p className="font-sans text-xs sm:text-sm text-[#8fc99a] leading-relaxed max-w-3xl">
              Validate your mathematical understanding of machine learning algorithms. Meet all learning requirements in each topic to unlock the comprehensive final exam. Earning a certificate yields double credentials.
            </p>

            {!isSignedIn && isLoaded && (
              <div className="mt-4 bg-[#3a200d] border-2 border-[#dda15e] text-[#f4c284] p-3 text-xs font-sans">
                ⚠️ You must be signed in to check eligibility, take exams, and print digital certificates.
              </div>
            )}
          </div>

          {/* Grid of Certificates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MODULES.map((mod) => {
              const state = modulesState[mod.key] || {
                eligible: false,
                earned: false,
                requirements: {
                  storyCompleted: false,
                  sandboxCompleted: false,
                  challengeCompleted: false,
                  quizPassed: false,
                  accuracyLossMet: false,
                  details: ""
                }
              };

              return (
                <CertificateCard
                  key={mod.key}
                  moduleKey={mod.key}
                  moduleName={mod.name}
                  eligible={state.eligible}
                  earned={state.earned}
                  certId={state.certId}
                  requirements={state.requirements}
                  loading={loading}
                />
              );
            })}
          </div>

          {/* Verification Warning notice */}
          <div className="bg-[#0c1510] border-2 border-[#2a5c30] p-4 text-xs font-sans text-[#8fc99a] leading-relaxed max-w-3xl mx-auto text-center mt-4">
            <p className="font-pixel text-[8px] text-[#dda15e] uppercase tracking-wider mb-1">
              🔒 CRYPTOGRAPHIC VERIFICATION
            </p>
            <p>
              Every issued certificate has a unique ID stored in our blockchain-inspired Supabase backend. Third-party employers can securely check the legitimacy of your credentials by visiting the public verification URL.
            </p>
          </div>

          {/* Footer */}
          <footer className="border-t-2 pt-4 flex items-center justify-between text-base" style={{ borderColor: "#1a3a1e", color: "#2a5232" }}>
            <span className="font-pixel text-[8px]">InsightML © 2026 — REGISTRY OFFICE</span>
            <div className="flex gap-4">
              <Link href="/progress" className="font-pixel text-[8px] text-[#2a5232] hover:text-[#7ecb8a]">
                My Progress
              </Link>
              <Link href="/videos" className="font-pixel text-[8px] text-[#2a5232] hover:text-[#7ecb8a]">
                Videos
              </Link>
            </div>
          </footer>

        </div>
      </main>
    </>
  );
}
