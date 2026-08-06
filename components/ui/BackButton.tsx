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
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-none bg-[#2B1E17] hover:bg-[#38251B] text-[#D79A55] border-2 border-[#6C4A33] shadow-[2px_2px_0px_#000000] font-sans text-xs font-semibold uppercase tracking-wider transition-all duration-150 select-none ${className}`}
      title="Return to Dashboard (Press ESC)"
    >
      <span className="text-sm">←</span>
      <span>{label}</span>
      <span className="hidden sm:inline-block text-[10px] text-[#B89C76] bg-[#16110D] px-1.5 py-0.5 rounded-none border border-[#6C4A33] font-mono font-normal">
        ESC
      </span>
    </Link>
  );
};
