"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { useTypewriter } from "@/lib/story/useTypewriter";
import { StoryStep, WalkthroughScript } from "@/lib/story/types";
import { ByteSprite } from "@/components/sprites/ByteSprite";

interface NPCDialogueBoxProps {
  step: StoryStep;
  script: WalkthroughScript;
  stepIndex: number;
  totalSteps: number;
  actionCount: number;
  onNext: () => void;
  onSkip: () => void;
}

/**
 * Fixed-position Stardew Valley-style NPC dialogue box.
 * Sits at the bottom of the viewport over the page content.
 * - Left side: NPC portrait + name
 * - Right side: typewriter text area
 * - Bottom: Next button (or action-pending indicator) + skip link
 */
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

  // When text changes (new step), scroll textarea back to top
  const textRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (textRef.current) textRef.current.scrollTop = 0;
  }, [step.id]);

  const requiredAction = step.requiredAction ?? "click-next";
  const minNeeded = step.minActionCount ?? 1;
  const actionsDone = actionCount >= minNeeded;

  const canAdvanceWithButton = requiredAction === "click-next" && isDone;

  // Action-waiting label shown when user must do something
  const actionHints: Record<string, string> = {
    "add-point": `Place points on the canvas (${actionCount}/${minNeeded})`,
    "train-step": "Click the Train Step button",
    "train-auto": "Toggle Train Auto on",
  };

  // Highlight box around a target element
  const HighlightPortal =
    step.highlightElementId
      ? <ElementHighlight elementId={step.highlightElementId} />
      : null;

  return (
    <>
      {/* Dimmed backdrop — semi-transparent so canvas stays visible */}
      <div className="fixed inset-0 bg-black/30 z-40 pointer-events-none" />

      {/* Highlight ring around target element */}
      {HighlightPortal}

      {/* Dialogue Box — fixed at bottom, full width, max-w constrained */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-full max-w-4xl bg-[#1e140e] border-4 border-[#5c3d2e] shadow-[0px_-4px_0px_0px_#0f0a07,4px_0px_0px_0px_#0f0a07,-4px_0px_0px_0px_#0f0a07] rounded-none"
          style={{ fontFamily: "var(--font-vt323), monospace" }}
        >
          {/* ── Top bar: module + step counter + skip ─────────────── */}
          <div className="flex items-center justify-between bg-[#281b12] border-b-4 border-[#382219] px-4 py-2">
            <div className="flex items-center gap-3">
              <span className="bg-[#386641] text-[#fefae0] px-2 py-0.5 border border-[#1b3521]"
                style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "10px" }}>
                STORY MODE
              </span>
              <span className="text-[#a3b18a] text-sm">
                {script.moduleTitle}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[#a3b18a] text-sm">
                Step {stepIndex + 1} / {totalSteps}
              </span>
              <button
                onClick={onSkip}
                className="text-[#5c3d2e] hover:text-[#bc4749] text-sm transition-colors underline"
                style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "10px" }}
              >
                [Skip Tour]
              </button>
            </div>
          </div>

          {/* ── Main content row ──────────────────────────────────── */}
          <div className="flex gap-0">
            {/* Portrait column */}
            <div className="flex-shrink-0 w-28 bg-[#18110b] border-r-4 border-[#382219] flex flex-col items-center justify-center py-4 px-3 gap-2">
              <div className="w-20 h-20 border-4 border-[#5c3d2e] bg-[#1e140e] overflow-hidden flex items-center justify-center shadow-[2px_2px_0px_0px_#0f0a07] relative">
                {/* Render ByteSprite for BYTE's portrait; Image for any other NPC; robot emoji as fallback */}
                {script.npcPortrait?.includes("npc-portrait") ? (
                  <>
                    <Image
                      src={script.npcPortrait}
                      alt={script.npcName}
                      width={80}
                      height={80}
                      className="object-cover"
                      style={{ imageRendering: "pixelated" }}
                    />
                    {/* ByteSprite overlay badge in bottom-right corner */}
                    <div
                      className="absolute bottom-0 right-0 border-t border-l border-[#5c3d2e] bg-[#1e140e]"
                      style={{ lineHeight: 0 }}
                    >
                      <ByteSprite scale={2} />
                    </div>
                  </>
                ) : script.npcPortrait ? (
                  <Image
                    src={script.npcPortrait}
                    alt={script.npcName}
                    width={80}
                    height={80}
                    className="object-cover"
                    style={{ imageRendering: "pixelated" }}
                  />
                ) : (
                  /* No portrait set — show ByteSprite as the main character icon */
                  <ByteSprite scale={2} />
                )}
              </div>
              <span
                className="text-[#dda15e] text-center leading-tight"
                style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "9px" }}
              >
                {script.npcName}
              </span>
            </div>

            {/* Text + buttons column */}
            <div className="flex-1 flex flex-col min-h-[140px]">
              {/* Dialogue text */}
              <div
                ref={textRef}
                className="flex-1 p-4 text-[#fefae0] leading-relaxed overflow-y-auto whitespace-pre-wrap"
                style={{ fontSize: "22px", minHeight: "100px", maxHeight: "180px" }}
              >
                {displayedText}
                {/* Blinking cursor while typing */}
                {!isDone && (
                  <span className="inline-block w-3 h-5 bg-[#dda15e] ml-0.5 align-middle animate-pulse" />
                )}
              </div>

              {/* Action bar */}
              <div className="border-t-2 border-[#382219] px-4 py-3 flex items-center justify-between bg-[#18110b]">
                {/* Left: action hint or empty */}
                <div className="text-[#a3b18a]" style={{ fontSize: "18px" }}>
                  {requiredAction !== "click-next" && isDone && (
                    <span className={actionsDone ? "text-[#a3b18a]" : "text-[#dda15e] animate-pulse"}>
                      {actionsDone ? "✓ Done!" : `⟳ ${actionHints[requiredAction] ?? "Perform the action..."}`}
                    </span>
                  )}
                </div>

                {/* Right: buttons */}
                <div className="flex items-center gap-3">
                  {/* Click-anywhere-to-skip-typewriter hint */}
                  {!isDone && (
                    <button
                      onClick={skipToEnd}
                      className="text-[#5c3d2e] hover:text-[#a3b18a] transition-colors"
                      style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "10px" }}
                    >
                      [Skip Text]
                    </button>
                  )}

                  {/* Next button — only when click-next action & text done */}
                  {canAdvanceWithButton && (
                    <button
                      onClick={onNext}
                      className="bg-[#386641] hover:bg-[#4a7c59] text-[#fefae0] border-4 border-[#1b3521] shadow-[4px_4px_0px_0px_#0f0a07] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all px-5 py-2"
                      style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "11px" }}
                    >
                      {step.nextButtonLabel ?? "Next ▶"}
                    </button>
                  )}

                  {/* For action steps: show "Next" grayed out if action not done yet */}
                  {requiredAction !== "click-next" && isDone && !actionsDone && (
                    <span
                      className="text-[#3e271c] border-4 border-[#2c1e15] px-5 py-2 cursor-not-allowed"
                      style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "11px" }}
                    >
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

// ── Element Highlight overlay ─────────────────────────────────────────────────
// Finds the target element by ID and renders an animated ring around its bounds.

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
    // Poll for a few frames in case layout shifts
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
        outline: "4px solid #dda15e",
        boxShadow: "0 0 0 2px #1e140e, 0 0 16px 4px rgba(221,161,94,0.5)",
        animation: "pulse-ring 1.5s ease-in-out infinite",
      }}
    />
  );
};
