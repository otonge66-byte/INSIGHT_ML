import React from "react";

interface RetroPanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  borderColor?: string;
}

export const RetroPanel: React.FC<RetroPanelProps> = ({
  title,
  children,
  className = "",
  borderColor = "border-[#382219]",
}) => {
  return (
    <div
      className={`bg-[#281b12] border-4 ${borderColor} p-4 shadow-[6px_6px_0px_0px_#0f0a07] font-vt323 rounded-none ${className}`}
    >
      {title && (
        <div className="bg-[#3e271c] border-2 border-[#1e140e] px-3 py-1.5 mb-4 flex items-center justify-between shadow-[2px_2px_0px_0px_#0f0a07]">
          <h2 className="font-pixel text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#dda15e]">
            {title}
          </h2>
          <span className="inline-block w-2.5 h-2.5 bg-[#a3b18a] border border-[#1e140e]" />
        </div>
      )}
      {children}
    </div>
  );
};
