"use client";

import React from "react";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";

interface HeaderAuthButtonProps {
  fallbackUserName?: string;
  fallbackUserAvatar?: string;
}

export const HeaderAuthButton: React.FC<HeaderAuthButtonProps> = ({
  fallbackUserName = "Guest",
  fallbackUserAvatar = "👤",
}) => {
  const isRealClerkConfigured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder")
  );

  let isSignedIn = false;
  let user: any = null;

  try {
    const clerk = useUser();
    isSignedIn = Boolean(clerk.isSignedIn);
    user = clerk.user;
  } catch (e) {
    // Graceful fallback if Clerk hooks are uninitialized during static render
  }

  if (!isRealClerkConfigured || !isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button className="flex items-center gap-2 bg-[#2C3C35] hover:bg-[#33463E] text-[#6FCF97] border border-[#4E665B] px-3.5 py-1.5 rounded-xl transition-all duration-200 font-sans text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs hover:border-[#6FCF97]">
          <span className="w-2 h-2 rounded-full bg-[#6FCF97] animate-pulse" />
          <span>Sign In</span>
        </button>
      </SignInButton>
    );
  }

  const displayName =
    user?.username || user?.firstName || user?.fullName || fallbackUserName;

  return (
    <div className="flex items-center gap-2 bg-[#2C3C35] hover:bg-[#33463E] text-[#EAF4EE] px-2.5 py-1 rounded-xl border border-[#4E665B] transition-colors duration-200">
      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-6 h-6 border border-[#4E665B] rounded-full",
            userButtonPopoverCard:
              "bg-[#22302B] border border-[#4E665B] text-[#C9D7CF] shadow-2xl rounded-2xl p-2 font-sans",
            userButtonPopoverActionButton:
              "hover:bg-[#2C3C35] text-[#C9D7CF] hover:text-[#6FCF97] rounded-xl px-3 py-2 transition-colors",
            userButtonPopoverActionButtonText:
              "text-[#C9D7CF] font-sans text-xs font-medium",
            userButtonPopoverFooter: "hidden",
          },
        }}
      >
        <UserButton.MenuItems>
          <UserButton.Link
            label="Dashboard"
            labelIcon={<span className="text-xs">🏠</span>}
            href="/"
          />
          <UserButton.Link
            label="My Progress"
            labelIcon={<span className="text-xs">🏆</span>}
            href="/#progress"
          />
        </UserButton.MenuItems>
      </UserButton>
      <span className="font-sans text-xs font-medium text-[#6FCF97] truncate max-w-[110px]">
        {displayName}
      </span>
    </div>
  );
};
