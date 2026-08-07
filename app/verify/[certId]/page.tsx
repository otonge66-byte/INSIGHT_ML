"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";

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
  params: Promise<{ certId: string }>;
}

export default function VerificationPage({ params }: PageProps) {
  const { certId } = use(params);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyCertificate() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/certificates/verify/${certId}`);
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || "Certificate verification query failed");
        }
        setData(result);
      } catch (e: any) {
        console.error("[ERROR] Verification API failed:", e);
        setError(e.message || "Invalid certificate ID or system error.");
      } finally {
        setLoading(false);
      }
    }
    verifyCertificate();
  }, [certId]);

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
        className="relative min-h-screen text-[#e8f0e0] font-vt323 overflow-x-hidden flex flex-col justify-between"
        style={{ background: "#070f09" }}
      >
        {/* Nav header */}
        <div className="relative z-10 max-w-3xl mx-auto w-full px-4 pt-10">
          <nav className="flex items-center justify-between border-4 px-5 py-3" style={{ background: "#0a1a0d", borderColor: "#1e4023", boxShadow: "4px 4px 0px 0px #050d07" }}>
            <div className="flex items-center gap-3">
              <Link href="/" className="font-pixel text-[10px] tracking-widest uppercase hover:text-[#7ecb8a]" style={{ color: "#7ecb8a", textDecoration: "none" }}>
                InsightML
              </Link>
            </div>
            <span className="font-pixel text-[8px] text-[#56a66a]">SECURE SHIELD VERIFY</span>
          </nav>
        </div>

        {/* Verification Board */}
        <div className="relative z-10 max-w-lg mx-auto w-full px-4 py-8 my-auto">
          {loading ? (
            <div className="bg-[#081209] border-4 border-[#1e4023] p-10 text-center shadow-[6px_6px_0px_#050d07]">
              <p className="font-pixel text-[12px] text-[#dda15e] animate-pulse">📡 DECRYPTING DIGEST KEY...</p>
            </div>
          ) : error || !data ? (
            <div className="bg-[#2a0d0d]/40 border-4 border-[#bc4749] p-8 shadow-[6px_6px_0px_#050d07] text-center space-y-4">
              <p className="font-pixel text-[14px] text-[#e57373] uppercase tracking-wide">
                ⚠️ INVALID CREDENTIAL KEY
              </p>
              <p className="font-sans text-xs text-[#bc4749]">
                The certificate ID &ldquo;{certId}&rdquo; was not found in the official registry database. This could indicate a falsified certificate or typographical error.
              </p>
              <Link
                href="/"
                className="inline-block font-pixel text-[8px] bg-[#bc4749] text-[#182320] border border-[#bc4749] px-6 py-2.5 transition-all hover:bg-transparent hover:text-[#bc4749]"
              >
                BACK TO PLATFORM
              </Link>
            </div>
          ) : (
            <div className="bg-[#081209] border-4 border-[#1e4023] p-6 sm:p-8 shadow-[6px_6px_0px_#050d07] space-y-6">
              
              {/* Seal */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#1e4a24] border-4 border-[#7ecb8a] flex items-center justify-center mx-auto mb-3 animate-pulse shadow-[0_0_12px_#7ecb8a]/20">
                  <span className="text-2xl">🛡️</span>
                </div>
                <span className="font-pixel text-[8px] text-[#dda15e] tracking-widest uppercase">
                  VERIFICATION REGISTRY SERVICE
                </span>
                <h2 className="font-pixel text-[14px] text-[#7ecb8a] uppercase mt-1">
                  CREDENTIAL STATUS: {data.status}
                </h2>
              </div>

              {/* Data Table */}
              <div className="border-2 border-[#1e4023] bg-[#0c1510] p-4 font-sans text-xs text-[#8fc99a] space-y-3.5">
                
                <div className="flex justify-between items-center border-b border-[#1e4023]/60 pb-2">
                  <span className="font-pixel text-[8px] text-[#56a66a]">GRADUATE NAME</span>
                  <span className="font-bold text-[#e8f0e0] uppercase">{data.studentName}</span>
                </div>

                <div className="flex justify-between items-center border-b border-[#1e4023]/60 pb-2">
                  <span className="font-pixel text-[8px] text-[#56a66a]">COURSE MODULE</span>
                  <span className="font-bold text-[#dda15e] uppercase">
                    {MOD_NAMES[data.module] || data.module}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-[#1e4023]/60 pb-2">
                  <span className="font-pixel text-[8px] text-[#56a66a]">DATE ISSUED</span>
                  <span className="text-[#e8f0e0]">
                    {new Date(data.completionDate).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-1">
                  <span className="font-pixel text-[8px] text-[#56a66a]">CERTIFICATE ID</span>
                  <span className="font-mono text-[#dda15e]">{data.certId}</span>
                </div>

              </div>

              {/* Status Note */}
              <div className="bg-[#121e17] border border-[#2a5c30] p-4 text-xs font-sans text-[#8fc99a] text-center leading-relaxed">
                <p className="font-bold text-[#7ecb8a] mb-1">✓ SECURE & VALID</p>
                <p>
                  This student has completed all required coursework and examinations proctored by InsightML Academy.
                </p>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10 max-w-3xl mx-auto w-full px-4 pb-10">
          <footer className="border-t-2 pt-4 flex items-center justify-between text-base" style={{ borderColor: "#1a3a1e", color: "#2a5232" }}>
            <span className="font-pixel text-[8px]">InsightML © 2026 — CRYPTO SHELF</span>
          </footer>
        </div>

      </main>
    </>
  );
}
