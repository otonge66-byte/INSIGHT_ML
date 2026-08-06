import React from "react";

interface RetroPanelProps {
  title?: string;
  icon?: string;
  actionText?: string;
  onAction?: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: "cozy" | "retro";
  borderColor?: string;
}

export const RetroPanel: React.FC<RetroPanelProps> = ({
  title,
  icon = "🍃",
  actionText,
  onAction,
  children,
  className = "",
  borderColor = "border-[#4E665B]",
}) => {
  return (
    <div
      className={`bg-[#2C3C35] hover:bg-[#33463E] border ${borderColor} p-5 rounded-2xl shadow-sm hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200 font-sans ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#4E665B]/60">
          <div className="flex items-center gap-2">
            {icon && <span className="text-sm">{icon}</span>}
            <h2 className="font-pixel text-xs font-bold uppercase tracking-wider text-[#EAF4EE]">
              {title}
            </h2>
          </div>
          {actionText && (
            <button
              onClick={onAction}
              className="font-sans text-xs text-[#6FCF97] hover:text-[#A6D8B8] transition-colors cursor-pointer"
            >
              {actionText}
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
};
