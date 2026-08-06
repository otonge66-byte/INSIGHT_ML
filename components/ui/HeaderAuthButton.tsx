"use client";

import React from "react";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";

interface HeaderAuthButtonProps {
  fallbackUserName?: string;
  fallbackUserAvatar?: string;
}

export const HeaderAuthButton: React.FC<HeaderAuthButtonProps> = ({
  fallbackUserName = "Guest",
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

  // Retro Appearance config for Clerk Modal
  const retroModalAppearance = {
    elements: {
      modalBackdrop: "bg-[#16110D]/85 backdrop-blur-xs",
      modalContent: "bg-[#211813] border-4 border-[#6C4A33] text-[#F0D6A2] shadow-[6px_6px_0px_#000000] rounded-none p-4",
      cardBox: "bg-[#211813] shadow-none border-none",
      card: "bg-[#211813] shadow-none border-none p-0",
      headerTitle: "text-[#7ecb8a] font-pixel text-sm uppercase tracking-wider",
      headerSubtitle: "text-[#B89C76] font-sans text-xs mt-1",
      socialButtonsBlockButton: "bg-[#2B1E17] hover:bg-[#38251B] border-2 border-[#6C4A33] hover:border-[#7ecb8a] text-[#F0D6A2] rounded-none transition-colors duration-150 shadow-[2px_2px_0px_#000000]",
      socialButtonsBlockButtonText: "text-[#F0D6A2] font-pixel text-xs font-bold",
      socialButtonsBlockButtonArrow: "text-[#7ecb8a]",
      dividerRow: "hidden",
      form: "hidden", // Hide password/email authentication to enforce Google & GitHub OAuth only
      footer: "hidden",
      identityPreviewText: "text-[#F0D6A2] font-sans text-xs",
      formFieldLabel: "text-[#B89C76] font-sans text-xs",
      formFieldInput: "bg-[#16110D] border-2 border-[#6C4A33] text-[#F0D6A2] rounded-none focus:border-[#7ecb8a]",
      formButtonPrimary: "bg-[#386641] hover:bg-[#2a5232] text-[#fefae0] font-pixel text-xs rounded-none border-2 border-[#1b3521] shadow-[2px_2px_0px_#000000]",
    },
  };

  if (!isRealClerkConfigured || !isSignedIn) {
    return (
      <SignInButton mode="modal" appearance={retroModalAppearance}>
        <button className="flex items-center gap-2 bg-[#2B1E17] hover:bg-[#38251B] text-[#7ecb8a] hover:text-[#6FCF97] border-2 border-[#6C4A33] hover:border-[#7ecb8a] px-3.5 py-1.5 rounded-none shadow-[2px_2px_0px_#000000] transition-all duration-150 font-pixel text-[10px] uppercase tracking-wider cursor-pointer">
          <span className="w-2 h-2 rounded-none bg-[#5D8E58] animate-pulse shrink-0" />
          <span>Sign In</span>
        </button>
      </SignInButton>
    );
  }

  const displayName =
    user?.username || user?.firstName || user?.fullName || fallbackUserName;

  return (
    <div className="flex items-center gap-2 bg-[#2B1E17] hover:bg-[#38251B] text-[#F0D6A2] px-2.5 py-1 rounded-none border-2 border-[#6C4A33] hover:border-[#7ecb8a] shadow-[2px_2px_0px_#000000] transition-colors duration-150">
      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-6 h-6 border-2 border-[#6C4A33] rounded-none hover:border-[#7ecb8a] transition-colors",
            userButtonPopoverCard:
              "bg-[#211813] border-4 border-[#6C4A33] text-[#F0D6A2] shadow-[6px_6px_0px_#000000] rounded-none p-2 font-sans min-w-[200px]",
            userButtonPopoverActionButton:
              "hover:bg-[#2B1E17] text-[#F0D6A2] hover:text-[#7ecb8a] rounded-none px-3 py-2 transition-colors duration-150 border-b border-[#38251B]",
            userButtonPopoverActionButtonText:
              "text-[#F0D6A2] font-sans text-xs font-medium",
            userButtonPopoverActionButtonIcon: "text-[#7ecb8a]",
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
          <UserButton.Link
            label="Profile"
            labelIcon={<span className="text-xs">👤</span>}
            href="/#profile"
          />
          <UserButton.Link
            label="Settings"
            labelIcon={<span className="text-xs">⚙️</span>}
            href="/#settings"
          />
        </UserButton.MenuItems>
      </UserButton>
      <span className="font-pixel text-[9px] text-[#7ecb8a] truncate max-w-[110px] uppercase">
        {displayName}
      </span>
    </div>
  );
};

