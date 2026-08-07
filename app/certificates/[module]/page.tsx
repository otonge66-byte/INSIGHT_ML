"use client";

import React, { useEffect, useState, useRef, use } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { HeaderAuthButton } from "@/components/ui/HeaderAuthButton";
import { EligibilityChecklist } from "@/components/certificates/EligibilityChecklist";
import { CertificateCanvas } from "@/components/certificates/CertificateCanvas";
import { CertificateDownload } from "@/components/certificates/CertificateDownload";
import { fetchCertificates } from "@/lib/database/certificateService";
import { RequirementStatus } from "@/components/certificates/CertificateCard";

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

export default function ModuleCertificatePortal({ params }: PageProps) {
  const { module } = use(params);
  const { user, isLoaded, isSignedIn } = useUser();
  const userId = user?.id;

  const moduleName = MOD_NAMES[module] || module;

  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [earned, setEarned] = useState(false);
  const [certRecord, setCertRecord] = useState<any | null>(null);
  const [requirements, setRequirements] = useState<RequirementStatus>({
    storyCompleted: false,
    sandboxCompleted: false,
    challengeCompleted: false,
    quizPassed: false,
    accuracyLossMet: false,
    details: ""
  });

  const certificateRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadModuleStatus() {
      if (!isLoaded || !isSignedIn || !userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // 1. Fetch Eligibility
        const elRes = await fetch(`/api/certificates/eligibility/${module}`);
        const elData = await elRes.json();
        setEligible(elData.eligible || false);
        setRequirements(elData.requirements);

        // 2. Fetch Earned Record
        const certList = await fetchCertificates(userId);
        const match = certList.find((c) => c.module === module);
        if (match) {
          setEarned(true);
          setCertRecord(match);
        }
      } catch (e) {
        console.error("[ERROR] Failed loading module status:", e);
      } finally {
        setLoading(false);
      }
    }
    loadModuleStatus();
  }, [module, isLoaded, isSignedIn, userId]);

  if (loading) {
    return (
      <div className="min-h-screen text-[#e8f0e0] font-vt323 flex items-center justify-center bg-[#070f09]">
        <ScanlineOverlay />
        <p className="font-pixel text-[12px] text-[#dda15e] animate-pulse">📡 DECRYPTING CERTIFICATE BLOCK...</p>
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
              <Link href="/certificates" className="font-pixel text-[9px] text-[#7ecb8a] hover:text-[#dda15e] uppercase tracking-wider">
                ◀ back to registry
              </Link>
            </div>
            <HeaderAuthButton />
          </nav>

          {earned && certRecord ? (
            /* Earned View: Display visual Certificate + Download tool */
            <div className="space-y-6">
              <div className="bg-[#081209] border-4 border-[#1e4023] p-5 shadow-[6px_6px_0px_#050d07] text-center max-w-xl mx-auto">
                <h1 className="font-pixel text-sm text-[#7ecb8a] uppercase tracking-widest mb-1.5">
                  🎉 CREDENTIAL EARNED AND SECURED
                </h1>
                <p className="font-sans text-xs text-[#8fc99a]">
                  Congratulations on completing the {moduleName} curriculum! You can print or download your verified digital certificate below.
                </p>
              </div>

              {/* Certificate layout Canvas */}
              <div className="flex justify-center py-2 overflow-x-auto">
                <CertificateCanvas
                  ref={certificateRef}
                  studentName={certRecord.student_name}
                  moduleName={moduleName}
                  certId={certRecord.cert_id}
                  issuedAt={certRecord.issued_at}
                />
              </div>

              {/* Download Buttons Panel */}
              <div className="max-w-xl mx-auto">
                <CertificateDownload
                  canvasRef={certificateRef}
                  fileName={`InsightML_${module}_Certificate`}
                />
              </div>
            </div>
          ) : (
            /* Locked / Unearned View: Show eligibility and checklist */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column Checklist */}
              <div className="lg:col-span-8 space-y-6">
                <EligibilityChecklist
                  requirements={requirements}
                  moduleName={moduleName}
                  moduleKey={module}
                />
              </div>

              {/* Right Column Action Box */}
              <div className="lg:col-span-4 bg-[#081209] border-4 border-[#1e4023] p-5 shadow-[6px_6px_0px_#050d07] text-center space-y-4">
                <h3 className="font-pixel text-[10px] text-[#dda15e] uppercase border-b border-[#2a5c30] pb-2">
                  🔒 EXAM ACCESS KEY
                </h3>
                
                {eligible ? (
                  <>
                    <p className="font-sans text-xs text-[#8fc99a] leading-relaxed">
                      All 5 learning milestones are fully complete. You have unlocked access to the final examination.
                    </p>
                    <div className="bg-[#121e17] border border-[#7ecb8a] p-3 font-sans text-xs text-[#7ecb8a] font-bold">
                      🗝️ EXAM UNLOCKED
                    </div>
                    <Link
                      href={`/certificates/${module}/exam`}
                      className="block w-full font-pixel text-[10px] bg-[#dda15e] text-[#182320] hover:bg-transparent hover:text-[#dda15e] border-2 border-[#dda15e] py-3 text-center transition-all shadow-[4px_4px_0px_#000000] active:translate-y-0.5 font-bold"
                    >
                      START FINAL EXAM
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="font-sans text-xs text-[#8fc99a] leading-relaxed">
                      You must satisfy all 5 requirements listed in the checklist to gain access to the final exam.
                    </p>
                    <div className="bg-[#2a0d0d]/30 border border-[#bc4749] p-3 font-sans text-xs text-[#bc4749]">
                      🔐 ACCESS LOCKED
                    </div>
                    <button
                      disabled
                      className="w-full font-pixel text-[9px] bg-gray-800 text-gray-500 border-2 border-gray-700 py-3 text-center opacity-50 cursor-not-allowed"
                    >
                      EXAM LOCKED
                    </button>
                  </>
                )}
              </div>

            </div>
          )}

          {/* Footer */}
          <footer className="border-t-2 pt-4 flex items-center justify-between text-base" style={{ borderColor: "#1a3a1e", color: "#2a5232" }}>
            <span className="font-pixel text-[8px]">InsightML © 2026 — REGISTRATION LOG</span>
            <div className="flex gap-4">
              <Link href="/certificates" className="font-pixel text-[8px] text-[#2a5232] hover:text-[#7ecb8a]">
                All Modules
              </Link>
            </div>
          </footer>

        </div>
      </main>
    </>
  );
}
