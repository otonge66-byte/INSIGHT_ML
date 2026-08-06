import React from "react";

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "accent";
  children: React.ReactNode;
}

export const RetroButton: React.FC<RetroButtonProps> = ({
  variant = "primary",
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyle =
    "font-pixel text-[11px] sm:text-xs font-bold uppercase tracking-wider px-4 py-2.5 border-4 transition-all select-none cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none rounded-none";

  const variants = {
    primary:
      "bg-[#386641] hover:bg-[#4a7c59] text-[#fefae0] border-[#1b3521] shadow-[4px_4px_0px_0px_#0f0a07]",
    secondary:
      "bg-[#5c3d2e] hover:bg-[#6e4b3b] text-[#fefae0] border-[#342118] shadow-[4px_4px_0px_0px_#0f0a07]",
    danger:
      "bg-[#bc4749] hover:bg-[#d05355] text-[#fefae0] border-[#6b2123] shadow-[4px_4px_0px_0px_#0f0a07]",
    accent:
      "bg-[#dda15e] hover:bg-[#e6b070] text-[#1e140e] border-[#7a5225] shadow-[4px_4px_0px_0px_#0f0a07]",
  };

  return (
    <button
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
