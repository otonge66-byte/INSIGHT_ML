import React, { ForwardedRef, forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";

interface CertificateCanvasProps {
  studentName: string;
  moduleName: string;
  certId: string;
  issuedAt: string;
}

export const CertificateCanvas = forwardRef(
  (
    { studentName, moduleName, certId, issuedAt }: CertificateCanvasProps,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const formattedDate = new Date(issuedAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const verificationUrl = typeof window !== "undefined"
      ? `${window.location.origin}/verify/${certId}`
      : `https://insightml.dev/verify/${certId}`;

    return (
      <div className="p-1 bg-[#1e4023] border-4 border-[#2a5c30] shadow-[8px_8px_0px_#000000] max-w-4xl mx-auto overflow-hidden">
        {/* Certificate Boundary */}
        <div
          ref={ref}
          id="certificate-print-node"
          className="relative w-[800px] h-[580px] bg-[#070f09] text-[#e8f0e0] font-vt323 p-10 flex flex-col justify-between overflow-hidden border-8 border-double border-[#2a5c30] select-none"
          style={{ boxSizing: "border-box" }}
        >
          {/* Subtle Retro Grid Lines Background */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#7ecb8a 1.5px, transparent 1.5px)",
              backgroundSize: "24px 24px"
            }}
          />

          {/* Corner Pixel Accents */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t-4 border-l-4 border-[#7ecb8a]" />
          <div className="absolute top-3 right-3 w-4 h-4 border-t-4 border-r-4 border-[#7ecb8a]" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-4 border-l-4 border-[#7ecb8a]" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-4 border-r-4 border-[#7ecb8a]" />

          {/* Header section */}
          <div className="text-center relative z-10">
            <span className="font-pixel text-[9px] tracking-widest text-[#dda15e] uppercase">
              INSIGHTML ALGORITHM ACADEMY
            </span>
            <h1 className="font-pixel text-2xl font-bold text-[#7ecb8a] uppercase tracking-wider mt-2.5">
              CERTIFICATE OF COMPLETION
            </h1>
            <div className="h-1 w-40 bg-[#2a5c30] mx-auto mt-3 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[#dda15e] border-2 border-[#070f09]" />
            </div>
          </div>

          {/* Body Section */}
          <div className="text-center space-y-3.5 relative z-10">
            <p className="font-sans text-[12px] tracking-wide text-[#8fc99a] uppercase">
              This certificate is proudly awarded to
            </p>
            <h2 className="font-pixel text-xl sm:text-2xl font-bold text-[#e8f0e0] border-b-2 border-[#1e4023] inline-block px-10 pb-2.5 uppercase tracking-wide">
              {studentName}
            </h2>
            <p className="font-sans text-[12px] text-[#8fc99a] max-w-xl mx-auto leading-relaxed">
              for successfully completing all rigorous training simulations, sandbox experiments, challenge quests, and passing the final examinations demonstrating academic proficiency in the algorithm
            </p>
            <h3 className="font-pixel text-md sm:text-lg text-[#dda15e] uppercase tracking-widest">
              {moduleName} Specialist
            </h3>
          </div>

          {/* Footer Section (Signatures & Verification QR) */}
          <div className="grid grid-cols-3 items-end gap-4 relative z-10 border-t border-[#1e4023]/60 pt-6">
            
            {/* Left Column: Date & ID */}
            <div className="space-y-1 text-left">
              <p className="font-pixel text-[8px] text-[#56a66a] uppercase">DATE OF ISSUANCE</p>
              <p className="font-sans text-xs text-[#e8f0e0]">{formattedDate}</p>
              <p className="font-pixel text-[8px] text-[#56a66a] uppercase mt-2">CERTIFICATE ID</p>
              <p className="font-mono text-[10px] text-[#dda15e] select-all">{certId}</p>
            </div>

            {/* Middle Column: QR Code verification */}
            <div className="flex flex-col items-center justify-center">
              <div className="p-1.5 bg-white border border-[#2a5c30] inline-block shadow-[3px_3px_0px_#000000]">
                <QRCodeSVG value={verificationUrl} size={64} level="M" includeMargin={false} />
              </div>
              <span className="font-pixel text-[7px] text-[#56a66a] uppercase mt-2.5 tracking-wider">
                SCAN TO VERIFY
              </span>
            </div>

            {/* Right Column: Signature */}
            <div className="space-y-1 text-right flex flex-col items-end">
              <p className="font-pixel text-[8px] text-[#56a66a] uppercase">AUTHORIZED MENTOR</p>
              
              {/* Handwritten-looking pixel signature */}
              <div className="font-pixel text-xs text-[#7ecb8a] italic line-through py-1 select-none pr-2">
                Byte AI Mentor
              </div>
              
              <div className="w-36 h-0.5 bg-[#2a5c30]" />
              <p className="font-sans text-[10px] text-[#8fc99a] pr-1">Byte AI Academy Director</p>
            </div>

          </div>

        </div>
      </div>
    );
  }
);

CertificateCanvas.displayName = "CertificateCanvas";
