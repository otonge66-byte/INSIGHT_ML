import React from "react";
import Link from "next/link";

export interface RequirementStatus {
  storyCompleted: boolean;
  sandboxCompleted: boolean;
  challengeCompleted: boolean;
  quizPassed: boolean;
  accuracyLossMet: boolean;
  details: string;
}

interface CertificateCardProps {
  moduleKey: string;
  moduleName: string;
  eligible: boolean;
  earned: boolean;
  certId?: string;
  requirements: RequirementStatus;
  loading?: boolean;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  moduleKey,
  moduleName,
  eligible,
  earned,
  certId,
  requirements,
  loading = false
}) => {
  const reqList = [
    requirements.storyCompleted,
    requirements.sandboxCompleted,
    requirements.challengeCompleted,
    requirements.quizPassed,
    requirements.accuracyLossMet
  ];
  const completedCount = reqList.filter(Boolean).length;

  return (
    <div className="bg-[#0c1510] border-4 border-[#1e4023] p-5 shadow-[4px_4px_0px_#000000] flex flex-col justify-between h-full group hover:border-[#7ecb8a] transition-all">
      <div>
        <div className="flex justify-between items-start mb-4 border-b border-[#2a5c30] pb-3">
          <span className="font-pixel text-[8px] text-[#dda15e] uppercase tracking-wider">
            🏅 Certification Module
          </span>
          <span className={`font-pixel text-[8px] px-2 py-0.5 border ${
            earned 
              ? "bg-[#1e4a24] text-[#7ecb8a] border-[#7ecb8a]" 
              : eligible 
              ? "bg-[#2e1d0c] text-[#dda15e] border-[#dda15e] animate-pulse" 
              : "bg-[#2a0d0d] text-[#bc4749] border-[#bc4749]"
          }`}>
            {earned ? "EARNED" : eligible ? "UNLOCKED" : "LOCKED"}
          </span>
        </div>

        <h3 className="font-pixel text-sm text-[#7ecb8a] uppercase tracking-wider mb-2">
          {moduleName} Specialist
        </h3>

        <p className="font-sans text-xs text-[#8fc99a] mb-5 leading-relaxed">
          Prove your mastery of {moduleName} algorithms. Complete the learning milestones, pass the simulation challenge, and clear the comprehensive exam.
        </p>

        {/* Milestone checklist indicators */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-center text-[10px] font-pixel text-[#56a66a]">
            <span>MILESTONES COMPLETE</span>
            <span>{completedCount}/5</span>
          </div>
          <div className="w-full h-2 bg-[#081209] border border-[#2a5c30]">
            <div 
              className={`h-full transition-all duration-500 ${earned ? 'bg-[#7ecb8a]' : 'bg-[#dda15e]'}`}
              style={{ width: `${(completedCount / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-[#2a5c30]/50">
        {loading ? (
          <div className="w-full text-center font-pixel text-[8px] text-[#dda15e] animate-pulse py-2">
            CHECKING SECURITY CREDENTIALS...
          </div>
        ) : earned && certId ? (
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/certificates/${moduleKey}`}
              className="font-pixel text-[8px] bg-[#1e4a24] text-[#7ecb8a] hover:bg-[#7ecb8a] hover:text-[#182320] border-2 border-[#2a5c30] hover:border-[#7ecb8a] py-2 text-center transition-all shadow-[2px_2px_0px_#000000]"
            >
              VIEW PORTAL
            </Link>
            <Link
              href={`/verify/${certId}`}
              className="font-pixel text-[8px] bg-[#0c1510] text-[#dda15e] hover:bg-[#dda15e] hover:text-[#182320] border-2 border-[#dda15e] py-2 text-center transition-all shadow-[2px_2px_0px_#000000]"
            >
              VERIFY ONLINE
            </Link>
          </div>
        ) : eligible ? (
          <Link
            href={`/certificates/${moduleKey}/exam`}
            className="block w-full font-pixel text-[9px] bg-[#dda15e] text-[#182320] border-2 border-[#dda15e] hover:bg-transparent hover:text-[#dda15e] py-2.5 text-center transition-all shadow-[3px_3px_0px_#000000] active:translate-y-0.5 font-bold"
          >
            START FINAL EXAM
          </Link>
        ) : (
          <Link
            href={`/certificates/${moduleKey}`}
            className="block w-full font-pixel text-[9px] bg-[#2a0d0d] text-[#bc4749] hover:bg-transparent hover:text-[#bc4749] border-2 border-[#bc4749] py-2.5 text-center transition-all shadow-[3px_3px_0px_#000000] active:translate-y-0.5"
          >
            CHECK ELIGIBILITY
          </Link>
        )}
      </div>
    </div>
  );
};
