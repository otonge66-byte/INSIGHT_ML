"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  href = "/",
  label = "Back to Dashboard",
  className = "",
}) => {
  const router = useRouter();

  // Listen for Escape key to trigger quick back navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (href === "/") {
          router.push("/");
        } else {
          router.back();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [href, router]);

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#2C3C35] hover:bg-[#33463E] text-[#6FCF97] border border-[#4E665B] font-sans text-xs font-semibold uppercase tracking-wider transition-all duration-200 select-none ${className}`}
      title="Return to Dashboard (Press ESC)"
    >
      <span className="text-sm">←</span>
      <span>{label}</span>
      <span className="hidden sm:inline-block text-[10px] text-[#8DA397] bg-[#182320] px-1.5 py-0.5 rounded border border-[#4E665B]/60 font-mono font-normal">
        ESC
      </span>
    </Link>
  );
};
