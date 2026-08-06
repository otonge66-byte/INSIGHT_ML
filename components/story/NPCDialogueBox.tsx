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
                className="text-[#8DA397] hover:text-[#D96C6C] text-xs transition-colors underline"
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
              {/* Dialogue text */}
              <div
                ref={textRef}
                className="flex-1 p-4 text-[#EAF4EE] leading-relaxed overflow-y-auto whitespace-pre-wrap font-sans text-sm"
                style={{ minHeight: "90px", maxHeight: "160px" }}
              >
                {displayedText}
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
                      className="text-[#8DA397] hover:text-[#C9D7CF] text-xs transition-colors"
                    >
                      Skip Text
                    </button>
                  )}

                  {canAdvanceWithButton && (
                    <button
                      onClick={onNext}
                      className="bg-[#2C3C35] hover:bg-[#33463E] text-[#6FCF97] border border-[#4E665B] px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
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
