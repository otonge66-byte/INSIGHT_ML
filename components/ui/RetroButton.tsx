import React from "react";

interface RetroButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "accent" | "cozy" | "leaf";
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
    "font-sans text-xs font-semibold uppercase tracking-wider px-4 py-2.5 border rounded-xl transition-all duration-200 select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]";

  const variants = {
    primary:
      "bg-[#2C3C35] hover:bg-[#33463E] text-[#6FCF97] border-[#4E665B]",
    secondary:
      "bg-[#22302B] hover:bg-[#2C3C35] text-[#C9D7CF] border-[#4E665B]",
    danger:
      "bg-[#3F2525] hover:bg-[#4E2E2E] text-[#D96C6C] border-[#D96C6C]/40",
    accent:
      "bg-[#3F3722] hover:bg-[#4F452A] text-[#E9C46A] border-[#E9C46A]/40",
    cozy:
      "bg-[#2C3C35] hover:bg-[#33463E] text-[#A6D8B8] border-[#4E665B]",
    leaf:
      "bg-[#2C3C35] hover:bg-[#33463E] text-[#6FCF97] border-[#4E665B]",
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
