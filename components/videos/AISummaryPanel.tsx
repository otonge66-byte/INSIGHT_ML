import React from "react";
import { VideoAIMetadata } from "@/lib/videos/aiMetadata";

interface AISummaryPanelProps {
  metadata: VideoAIMetadata;
}

export const AISummaryPanel: React.FC<AISummaryPanelProps> = ({ metadata }) => {
  return (
    <div className="space-y-6">
      {/* 🔮 What Will You Learn */}
      <div className="bg-[#121e17] border-2 border-[#2a5c30] p-4 shadow-[2px_2px_0px_#000000]">
        <h3 className="font-pixel text-[10px] text-[#dda15e] uppercase tracking-wider mb-3.5 border-b border-[#2a5c30] pb-2">
          🔮 What Will You Learn?
        </h3>
        <ul className="space-y-2 font-sans text-xs text-[#C9D7CF]">
          {metadata.whatYouWillLearn.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#7ecb8a] font-pixel text-[8px] mt-1">▶</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 🤖 Video Summary */}
      <div className="bg-[#121e17] border-2 border-[#2a5c30] p-4 shadow-[2px_2px_0px_#000000]">
        <h3 className="font-pixel text-[10px] text-[#dda15e] uppercase tracking-wider mb-3.5 border-b border-[#2a5c30] pb-2">
          🤖 AI-Powered Lesson Summary
        </h3>
        <p className="font-sans text-xs text-[#8fc99a] leading-relaxed italic">
          &ldquo;{metadata.summary}&rdquo;
        </p>
      </div>

      {/* 🔑 Key Concepts (Chips) */}
      <div className="bg-[#121e17] border-2 border-[#2a5c30] p-4 shadow-[2px_2px_0px_#000000]">
        <h3 className="font-pixel text-[10px] text-[#dda15e] uppercase tracking-wider mb-3.5 border-b border-[#2a5c30] pb-2">
          🔑 Key Algorithm Concepts
        </h3>
        <div className="flex flex-wrap gap-2">
          {metadata.concepts.map((concept, idx) => (
            <span 
              key={idx} 
              className="font-pixel text-[8px] bg-[#0c1510] text-[#7ecb8a] border border-[#2a5c30] px-2.5 py-1 rounded-none hover:border-[#7ecb8a] transition-all cursor-default"
            >
              {concept}
            </span>
          ))}
        </div>
      </div>

      {/* 📑 Before & After Watching */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Before */}
        <div className="bg-[#121e17] border-2 border-[#2a5c30] p-4 shadow-[2px_2px_0px_#000000]">
          <h4 className="font-pixel text-[9px] text-[#dda15e] uppercase mb-3 border-b border-[#2a5c30] pb-1.5">
            📖 Prerequisite Knowledge
          </h4>
          <ul className="space-y-1.5 font-sans text-xs text-[#8fc99a]">
            {metadata.beforeWatching.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#dda15e] shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* After */}
        <div className="bg-[#121e17] border-2 border-[#2a5c30] p-4 shadow-[2px_2px_0px_#000000]">
          <h4 className="font-pixel text-[9px] text-[#7ecb8a] uppercase mb-3 border-b border-[#2a5c30] pb-1.5">
            🎯 Learning Outcomes
          </h4>
          <ul className="space-y-1.5 font-sans text-xs text-[#8fc99a]">
            {metadata.afterWatching.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#7ecb8a] shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
