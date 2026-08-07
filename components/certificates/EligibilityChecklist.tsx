import React from "react";
import { RequirementStatus } from "./CertificateCard";

interface EligibilityChecklistProps {
  requirements: RequirementStatus;
  moduleName: string;
  moduleKey: string;
}

export const EligibilityChecklist: React.FC<EligibilityChecklistProps> = ({
  requirements,
  moduleName,
  moduleKey
}) => {
  const items = [
    {
      label: "Story Mode",
      desc: "Complete the interactive algorithm story mode",
      met: requirements.storyCompleted,
      actionText: "Play Story",
      actionUrl: `/playground/${moduleKey}?mode=story`
    },
    {
      label: "Sandbox Simulation",
      desc: "Build and experiment with models in sandbox mode",
      met: requirements.sandboxCompleted,
      actionText: "Open Sandbox",
      actionUrl: `/playground/${moduleKey}?mode=sandbox`
    },
    {
      label: "Simulation Challenge",
      desc: "Successfully pass the verification challenge",
      met: requirements.challengeCompleted,
      actionText: "Start Challenge",
      actionUrl: `/playground/${moduleKey}?mode=challenge`
    },
    {
      label: "Algorithm Lecture Video",
      desc: "Watch the topic video and pass the 5 MCQ quiz",
      met: requirements.quizPassed,
      actionText: "Watch Video",
      actionUrl: "/videos"
    },
    {
      label: "Minimum Accuracy / Loss",
      desc: moduleKey === "gradient-descent" 
        ? "Train model to loss <= 0.05"
        : "Train model to validation accuracy >= 96%",
      met: requirements.accuracyLossMet,
      details: requirements.details,
      actionText: "Go to Playground",
      actionUrl: `/playground/${moduleKey}`
    }
  ];

  return (
    <div className="bg-[#081209] border-4 border-[#1e4023] p-5 sm:p-6 shadow-[6px_6px_0px_#050d07]">
      <h3 className="font-pixel text-[11px] text-[#dda15e] border-b border-[#2a5c30] pb-3 mb-5 uppercase tracking-wider">
        📋 Eligibility Milestone Checklist
      </h3>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div 
            key={idx} 
            className={`border-2 p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
              item.met 
                ? "bg-[#121e17] border-[#2a5c30]" 
                : "bg-[#2a0d0d]/10 border-[#2a0d0d] hover:border-[#bc4749]"
            }`}
          >
            <div className="flex gap-3">
              <span className={`font-pixel text-xs shrink-0 mt-0.5 ${item.met ? "text-[#7ecb8a]" : "text-[#bc4749]"}`}>
                {item.met ? "✅" : "❌"}
              </span>
              <div className="space-y-0.5">
                <p className={`font-pixel text-[10px] uppercase tracking-wide ${item.met ? "text-[#7ecb8a]" : "text-[#C9D7CF]"}`}>
                  {item.label}
                </p>
                <p className="font-sans text-[11px] text-[#8fc99a]">{item.desc}</p>
                {item.details && (
                  <p className="font-mono text-[9px] text-[#dda15e] mt-1 bg-[#0c1510] px-2 py-0.5 border border-[#2a5c30]/50 inline-block">
                    {item.details}
                  </p>
                )}
              </div>
            </div>

            {!item.met && (
              <a
                href={item.actionUrl}
                className="w-full md:w-auto font-pixel text-[8px] bg-[#2a0d0d] text-[#bc4749] hover:bg-[#bc4749] hover:text-[#182320] border border-[#bc4749] px-4 py-2 text-center transition-all cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-y-0.5"
              >
                {item.actionText}
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 bg-[#121e17] border border-[#2a5c30] p-4 text-xs font-sans text-[#8fc99a] leading-relaxed">
        <p className="font-pixel text-[8px] text-[#dda15e] uppercase tracking-wider mb-2">
          💡 REAL MACHINE LEARNING INSIGHT
        </p>
        <p className="italic">
          &ldquo;In real-world machine learning, perfect accuracy is uncommon. Achieving consistent performance above 96% demonstrates strong understanding of the algorithm.&rdquo;
        </p>
      </div>
    </div>
  );
};
