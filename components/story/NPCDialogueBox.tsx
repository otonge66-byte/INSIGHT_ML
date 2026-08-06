"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useTypewriter } from "@/lib/story/useTypewriter";
import { StoryStep, WalkthroughScript } from "@/lib/story/types";
import { ByteSprite } from "@/components/sprites/ByteSprite";
import { GLOSSARY_TERMS } from "@/lib/story/glossary";

interface NPCDialogueBoxProps {
  step: StoryStep;
  script: WalkthroughScript;
  stepIndex: number;
  totalSteps: number;
  actionCount: number;
  onNext: () => void;
  onSkip: () => void;
}

export const NPCDialogueBox: React.FC<NPCDialogueBoxProps> = ({
  step,
  script,
  stepIndex,
  totalSteps,
  actionCount,
  onNext,
  onSkip,
}) => {
  const { displayedText, isDone, skipToEnd } = useTypewriter({
    text: step.dialogue,
    speed: 38,
  });

  const textRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (textRef.current) textRef.current.scrollTop = 0;
  }, [step.id]);

  const requiredAction = step.requiredAction ?? "click-next";
  const minNeeded = step.minActionCount ?? 1;
  const actionsDone = actionCount >= minNeeded;

  const canAdvanceWithButton = requiredAction === "click-next" && isDone;

  const actionHints: Record<string, string> = {
    "add-point": `Place points on the canvas (${actionCount}/${minNeeded})`,
    "train-step": "Click the Train Step button",
    "train-auto": "Toggle Train Auto on",
  };

  const HighlightPortal =
    step.highlightElementId
      ? <ElementHighlight elementId={step.highlightElementId} />
      : null;

  return (
    <>
      <div className="fixed inset-0 bg-[#182320]/60 z-40 pointer-events-none" />

      {HighlightPortal}

      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-4xl bg-[#2C3C35] border border-[#4E665B] rounded-2xl shadow-xl overflow-hidden font-sans">
          {/* Top bar */}
          <div className="flex items-center justify-between bg-[#22302B] border-b border-[#4E665B] px-4 py-2">
            <div className="flex items-center gap-3">
              <span className="bg-[#182320] text-[#6FCF97] px-2.5 py-0.5 border border-[#4E665B] rounded text-xs font-pixel">
                STORY MODE
              </span>
              <span className="text-[#C9D7CF] text-xs font-medium">
                {script.moduleTitle}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[#8DA397] text-xs">
                Step {stepIndex + 1} / {totalSteps}
              </span>
              <button
                onClick={onSkip}
                className="text-[#8DA397] hover:text-[#D96C6C] text-xs transition-colors underline cursor-pointer"
              >
                Skip Tour
              </button>
            </div>
          </div>

          {/* Main content row */}
          <div className="flex gap-0">
            {/* Portrait column */}
            <div className="flex-shrink-0 w-28 bg-[#22302B] border-r border-[#4E665B] flex flex-col items-center justify-center py-4 px-3 gap-2">
              <div className="w-16 h-16 rounded-xl border border-[#4E665B] bg-[#182320] overflow-hidden flex items-center justify-center relative">
                {script.npcPortrait?.includes("npc-portrait") ? (
                  <>
                    <Image
                      src={script.npcPortrait}
                      alt={script.npcName}
                      width={64}
                      height={64}
                      className="object-cover"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <div
                      className="absolute bottom-0 right-0 border-t border-l border-[#4E665B] bg-[#182320]"
                      style={{ lineHeight: 0 }}
                    >
                      <ByteSprite scale={1.5} />
                    </div>
                  </>
                ) : script.npcPortrait ? (
                  <Image
                    src={script.npcPortrait}
                    alt={script.npcName}
                    width={64}
                    height={64}
                    className="object-cover"
                    style={{ imageRendering: "pixelated" }}
                  />
                ) : (
                  <ByteSprite scale={1.5} />
                )}
              </div>
              <span className="text-[#E9C46A] text-center font-pixel text-[9px] leading-tight">
                {script.npcName}
              </span>
            </div>

            {/* Text + buttons column */}
            <div className="flex-1 flex flex-col min-h-[130px]">
              {/* Dialogue text with inline Glossary term tooltips */}
              <div
                ref={textRef}
                className="flex-1 p-4 text-[#EAF4EE] leading-relaxed overflow-y-auto font-sans text-sm"
                style={{ minHeight: "90px", maxHeight: "160px" }}
              >
                <GlossaryFormattedText text={displayedText} />
                {!isDone && (
                  <span className="inline-block w-2 h-4 bg-[#6FCF97] ml-0.5 align-middle animate-pulse" />
                )}
              </div>

              {/* Action bar */}
              <div className="border-t border-[#4E665B] px-4 py-2.5 flex items-center justify-between bg-[#22302B]">
                <div className="text-xs">
                  {requiredAction !== "click-next" && isDone && (
                    <span className={actionsDone ? "text-[#6FCF97]" : "text-[#E9C46A]"}>
                      {actionsDone ? "✓ Done!" : `⟳ ${actionHints[requiredAction] ?? "Perform the action..."}`}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {!isDone && (
                    <button
                      onClick={skipToEnd}
                      className="text-[#8DA397] hover:text-[#C9D7CF] text-xs transition-colors cursor-pointer"
                    >
                      Skip Text
                    </button>
                  )}

                  {canAdvanceWithButton && (
                    <button
                      onClick={onNext}
                      className="bg-[#2C3C35] hover:bg-[#33463E] text-[#6FCF97] border border-[#4E665B] px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      {step.nextButtonLabel ?? "Next ▶"}
                    </button>
                  )}

                  {requiredAction !== "click-next" && isDone && !actionsDone && (
                    <span className="text-[#8DA397] border border-[#4E665B] px-4 py-1.5 rounded-lg text-xs cursor-not-allowed opacity-50">
                      Next ▶
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ── Formatted Text with Interactive Glossary Spans ──
const GlossaryFormattedText: React.FC<{ text: string }> = ({ text }) => {
  const parsedElements = useMemo(() => {
    const keys = Object.keys(GLOSSARY_TERMS).sort((a, b) => b.length - a.length);
    if (keys.length === 0 || !text) return [text];

    const escapedKeys = keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`\\b(${escapedKeys.join("|")})\\b`, "gi");

    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const matchStart = match.index;
      const matchedStr = match[0];

      if (matchStart > lastIdx) {
        parts.push(text.substring(lastIdx, matchStart));
      }

      const termKey = matchedStr.toLowerCase();
      parts.push(
        <GlossaryTermTooltip
          key={`${termKey}-${matchStart}`}
          termKey={termKey}
          displayText={matchedStr}
        />
      );

      lastIdx = matchStart + matchedStr.length;
    }

    if (lastIdx < text.length) {
      parts.push(text.substring(lastIdx));
    }

    return parts;
  }, [text]);

  return <>{parsedElements}</>;
};

// ── Portal-based Interactive Glossary Popover Component ──
const GlossaryTermTooltip: React.FC<{ termKey: string; displayText: string }> = ({
  termKey,
  displayText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeBelow: boolean } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const termObj = GLOSSARY_TERMS[termKey];

  // Calculate viewport position with collision detection
  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 270;
    const popoverHeight = 170; // estimated max height

    // Default above trigger
    let top = rect.top - popoverHeight - 8;
    let placeBelow = false;

    // Flip below if not enough room above
    if (top < 12) {
      top = rect.bottom + 8;
      placeBelow = true;
    }

    // Horizontal centering + viewport clamping
    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    const padding = 12;
    if (left < padding) {
      left = padding;
    } else if (left + popoverWidth > window.innerWidth - padding) {
      left = window.innerWidth - popoverWidth - padding;
    }

    setCoords({ top, left, placeBelow });
  }, []);

  const handleOpen = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    updateCoords();
    setIsOpen(true);
  }, [updateCoords]);

  const handleScheduleClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 180);
  }, []);

  // Update coords on window resize/scroll
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen, updateCoords]);

  // Keyboard Escape listener & Outside click for mobile tap support
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  if (!termObj) return <>{displayText}</>;

  const tooltipId = `tooltip-${termKey}`;

  // Portal Popover rendered directly into document.body (z-[9999])
  const portalContent =
    isOpen && coords && typeof window !== "undefined"
      ? createPortal(
          <div
            ref={popoverRef}
            id={tooltipId}
            role="tooltip"
            onMouseEnter={handleOpen}
            onMouseLeave={handleScheduleClose}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: "270px",
              zIndex: 9999,
            }}
            className="bg-[#182320] border border-[#6FCF97] p-3.5 rounded-xl shadow-2xl font-sans text-xs text-[#EAF4EE] transition-all duration-150 ease-out animate-fade-in"
          >
            <div className="flex items-center gap-1.5 mb-2 pb-1 border-b border-[#4E665B]">
              <span className="text-sm">🤖</span>
              <span className="font-pixel text-[9px] uppercase text-[#6FCF97] tracking-wider font-bold">
                BYTE GLOSSARY: {termObj.term}
              </span>
            </div>
            <p className="text-[#C9D7CF] text-xs leading-relaxed mb-2.5">
              {termObj.definition}
            </p>
            {termObj.analogy && (
              <div className="bg-[#22302B] p-2.5 rounded-lg border border-[#4E665B] text-[11px] text-[#E9C46A] leading-relaxed">
                <span className="font-bold block mb-0.5">💡 Analogy:</span>
                <span className="italic">&quot;{termObj.analogy}&quot;</span>
              </div>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <span
        ref={triggerRef}
        tabIndex={0}
        aria-describedby={isOpen ? tooltipId : undefined}
        className="inline-block cursor-help font-semibold text-[#6FCF97] underline decoration-dotted underline-offset-4 hover:bg-[#182320] px-1 rounded transition-colors"
        onMouseEnter={handleOpen}
        onMouseLeave={handleScheduleClose}
        onClick={() => setIsOpen((prev) => !prev)}
        onFocus={handleOpen}
        onBlur={handleScheduleClose}
      >
        {displayText}
      </span>
      {portalContent}
    </>
  );
};

const ElementHighlight: React.FC<{ elementId: string }> = ({ elementId }) => {
  const [rect, setRect] = React.useState<DOMRect | null>(null);

  useEffect(() => {
    const update = () => {
      const el = document.getElementById(elementId);
      if (el) {
        setRect(el.getBoundingClientRect());
      }
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const t = setTimeout(update, 200);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      clearTimeout(t);
    };
  }, [elementId]);

  if (!rect) return null;

  const pad = 6;
  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
        outline: "2px solid #6FCF97",
        borderRadius: "8px",
        boxShadow: "0 0 12px 2px rgba(111,207,151,0.3)",
      }}
    />
  );
};
