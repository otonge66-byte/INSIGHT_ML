"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GradientDescentCanvas } from "@/components/canvas/GradientDescentCanvas";
import { LossChart } from "@/components/charts/LossChart";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroSlider } from "@/components/ui/RetroSlider";
import { RetroPanel } from "@/components/ui/RetroPanel";
import { NPCDialogueBox } from "@/components/story/NPCDialogueBox";
import { ChallengeCard } from "@/components/challenge/ChallengeCard";
import { ChallengeResultModal } from "@/components/challenge/ChallengeResultModal";
import { useStoryMode } from "@/lib/story/useStoryMode";
import { useChallengeMode } from "@/lib/challenge/useChallengeMode";
import { gradientDescentWalkthrough } from "@/lib/story/walkthroughs/gradientDescent";
import { gradientDescentChallenge } from "@/lib/challenge/challenges";
import { LossPreset, Point2D } from "@/modules/gradient-descent/types";
import {
  PRESETS,
  computeLoss,
  computeGradient,
  gradientDescentStep,
} from "@/lib/ml/gradientDescent";

import { BackButton } from "@/components/ui/BackButton";

const DEFAULT_START: Point2D = { x: -3.5, y: 3.5 };

type AppMode = "select" | "story" | "sandbox" | "challenge";

export default function GradientDescentPlayground() {
  const router = useRouter();
  const [appMode, setAppMode] = useState<AppMode>("select");

  const [preset, setPreset] = useState<LossPreset>("bowl");
  const [startPoint, setStartPoint] = useState<Point2D>(DEFAULT_START);
  const [path, setPath] = useState<Point2D[]>([DEFAULT_START]);
  const [lossHistory, setLossHistory] = useState<number[]>([
    computeLoss(DEFAULT_START.x, DEFAULT_START.y, "bowl"),
  ]);
  const [learningRate, setLearningRate] = useState<number>(0.1);
  const [isAutoStepping, setIsAutoStepping] = useState<boolean>(false);

  const autoStepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mutable refs to prevent interval tear-downs and render loops
  const learningRateRef = useRef(learningRate);
  const presetRef = useRef(preset);
  const pathRef = useRef(path);

  useEffect(() => { learningRateRef.current = learningRate; }, [learningRate]);
  useEffect(() => { presetRef.current = preset; }, [preset]);
  useEffect(() => { pathRef.current = path; }, [path]);

  // Story mode controller
  const story = useStoryMode();
  const storyRef = useRef(story);
  useEffect(() => { storyRef.current = story; }, [story]);

  // Challenge mode controller
  const challenge = useChallengeMode(gradientDescentChallenge);

  // Execute ONE gradient descent step
  const handleStep = useCallback(() => {
    setPath((prevPath) => {
      if (prevPath.length === 0) return prevPath;
      const currentPos = prevPath[prevPath.length - 1];
      const stepRes = gradientDescentStep(currentPos, learningRateRef.current, presetRef.current);
      setLossHistory((prevLosses) => [...prevLosses, stepRes.loss]);
      return [...prevPath, stepRes.nextPos];
    });
    storyRef.current.registerAction("gd-step");
  }, []);

  // Handle continuous auto-stepping loop
  useEffect(() => {
    if (isAutoStepping) {
      autoStepIntervalRef.current = setInterval(() => {
        handleStep();
      }, 200);
    } else if (autoStepIntervalRef.current) {
      clearInterval(autoStepIntervalRef.current);
      autoStepIntervalRef.current = null;
    }

    return () => {
      if (autoStepIntervalRef.current) {
        clearInterval(autoStepIntervalRef.current);
        autoStepIntervalRef.current = null;
      }
    };
  }, [isAutoStepping, handleStep]);

  // Stop auto-stepping automatically when challenge is won
  useEffect(() => {
    if (appMode === "challenge" && (challenge.isWon || challenge.showModal)) {
      console.log("🏆 [Gradient Descent Challenge Solved!] Stopping auto-stepping.");
      setIsAutoStepping(false);
      if (autoStepIntervalRef.current) {
        clearInterval(autoStepIntervalRef.current);
        autoStepIntervalRef.current = null;
      }
    }
  }, [appMode, challenge.isWon, challenge.showModal]);

  // Reset trajectory path
  const handleResetPath = useCallback(() => {
    setIsAutoStepping(false);
    setPath([startPoint]);
    setLossHistory([computeLoss(startPoint.x, startPoint.y, preset)]);
  }, [startPoint, preset]);

  // Change Starting Point via Canvas click or Randomizer
  const handleSetStartPoint = useCallback((newStart: Point2D) => {
    setIsAutoStepping(false);
    setStartPoint(newStart);
    setPath([newStart]);
    setLossHistory([computeLoss(newStart.x, newStart.y, presetRef.current)]);
  }, []);

  // Randomize Start Point
  const handleRandomizeStart = useCallback(() => {
    const rx = Number(((Math.random() - 0.5) * 8).toFixed(2));
    const ry = Number(((Math.random() - 0.5) * 8).toFixed(2));
    handleSetStartPoint({ x: rx, y: ry });
  }, [handleSetStartPoint]);

  // Change Preset Surface
  const handlePresetChange = useCallback((newPreset: LossPreset) => {
    setIsAutoStepping(false);
    setPreset(newPreset);
    setLearningRate(PRESETS[newPreset].defaultLr);
    setPath([startPoint]);
    setLossHistory([computeLoss(startPoint.x, startPoint.y, newPreset)]);
  }, [startPoint]);

  // Derived status values
  const currentPos = path[path.length - 1] || startPoint;
  const currentLoss = useMemo(() => computeLoss(currentPos.x, currentPos.y, preset), [currentPos, preset]);
  const currentGrad = useMemo(() => computeGradient(currentPos.x, currentPos.y, preset), [currentPos, preset]);
  const gradNorm = useMemo(() => Math.sqrt(currentGrad.gx * currentGrad.gx + currentGrad.gy * currentGrad.gy), [currentGrad]);
  const stepCount = path.length - 1;

  // Detect status: Converged / Minimizing / Diverging
  const isDiverging = useMemo(() => {
    return (
      stepCount > 0 &&
      (currentLoss > lossHistory[0] * 1.1 ||
        currentLoss >= 45 ||
        !isFinite(currentLoss) ||
        Math.abs(currentPos.x) >= 4.8 ||
        Math.abs(currentPos.y) >= 4.8 ||
        (lossHistory.length >= 2 && lossHistory[lossHistory.length - 1] > lossHistory[lossHistory.length - 2]))
    );
  }, [stepCount, currentLoss, lossHistory, currentPos]);

  const isConverged = useMemo(() => {
    return !isDiverging && (gradNorm < 0.02 || (stepCount > 0 && Math.abs(currentLoss) < 0.001));
  }, [isDiverging, gradNorm, stepCount, currentLoss]);

  // ── Mode selection handlers ───────────────────────────────────────────────
  const enterStoryMode = useCallback(() => {
    setAppMode("story");
    story.start(gradientDescentWalkthrough);
  }, [story]);

  const enterSandboxMode = useCallback(() => {
    setAppMode("sandbox");
    story.skip();
  }, [story]);

  const enterChallengeMode = useCallback(() => {
    setAppMode("challenge");
    challenge.reset();
    setIsAutoStepping(false);
    setPreset("bowl");
    setLearningRate(PRESETS["bowl"].defaultLr);
    setPath([DEFAULT_START]);
    setLossHistory([computeLoss(DEFAULT_START.x, DEFAULT_START.y, "bowl")]);
  }, [challenge]);

  // When story finishes go to sandbox
  useEffect(() => {
    if (appMode === "story" && !story.state.isActive) {
      setAppMode("sandbox");
    }
  }, [appMode, story.state.isActive]);

  // ── Challenge progress tracking ───────────────────────────────────────────
  useEffect(() => {
    if (appMode === "challenge") {
      challenge.update({ stepCount, currentLoss, lossHistory });
    }
  }, [appMode, stepCount, currentLoss, lossHistory, challenge]);

  const handleChallengeRetry = useCallback(() => {
    challenge.reset();
    setIsAutoStepping(false);
    setPreset("bowl");
    setLearningRate(PRESETS["bowl"].defaultLr);
    setPath([DEFAULT_START]);
    setLossHistory([computeLoss(DEFAULT_START.x, DEFAULT_START.y, "bowl")]);
  }, [challenge]);

  const handleNextChallenge = useCallback(() => {
    router.push(gradientDescentChallenge.nextChallengeUrl ?? "/playground/neural-net");
  }, [router]);

  // ── Mode Selection Screen ─────────────────────────────────────────────────
  if (appMode === "select") {
    return (
      <main className="min-h-screen bg-[#182320] text-[#C9D7CF] flex flex-col items-center justify-center p-6 md:p-8 font-sans relative">
        <div className="fixed top-4 left-4 z-30">
          <BackButton href="/" label="Back to Dashboard" />
        </div>

        <nav className="fixed top-4 right-4 flex items-center gap-2 z-10 font-sans">
          <Link href="/playground/perceptron"
            className="px-3 py-1.5 bg-[#22302B] hover:bg-[#2C3C35] text-[#C9D7CF] font-pixel text-[10px] uppercase border border-[#4E665B] rounded-xl transition-colors">
            01. Perceptron
          </Link>
          <Link href="/playground/gradient-descent"
            className="px-3 py-1.5 bg-[#2C3C35] text-[#6FCF97] font-pixel text-[10px] uppercase border border-[#4E665B] rounded-xl">
            02. Gradient Descent
          </Link>
          <Link href="/playground/neural-net"
            className="px-3 py-1.5 bg-[#22302B] hover:bg-[#2C3C35] text-[#C9D7CF] font-pixel text-[10px] uppercase border border-[#4E665B] rounded-xl transition-colors">
            03. Neural Net
          </Link>
        </nav>

        <div className="max-w-3xl w-full text-center flex flex-col items-center gap-8">
          <div>
            <span className="bg-[#2C3C35] text-[#6FCF97] font-pixel text-[10px] uppercase px-3 py-1 rounded-full border border-[#4E665B] font-bold inline-block mb-4">
              Module 02
            </span>
            <h1 className="text-2xl sm:text-3xl font-pixel text-[#EAF4EE] uppercase tracking-wider mb-2">
              Gradient Mountain Visualizer
            </h1>
            <p className="text-[#8DA397] text-sm">Choose your learning mode:</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full">
            <button
              onClick={enterStoryMode}
              className="group bg-[#2C3C35] hover:bg-[#33463E] border border-[#4E665B] rounded-2xl p-6 text-left flex flex-col gap-3 shadow-sm hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200"
            >
              <div className="text-3xl">📖</div>
              <div>
                <h2 className="font-pixel text-xs text-[#EAF4EE] uppercase mb-2">Story Mode</h2>
                <p className="text-[#C9D7CF] text-xs leading-relaxed font-sans">
                  Guided walkthrough with BYTE. Learn loss surfaces and learning rate dynamics.
                </p>
              </div>
              <span className="font-pixel text-[10px] bg-[#22302B] text-[#6FCF97] border border-[#4E665B] px-2.5 py-1 rounded-lg self-start mt-auto">
                ▶ START TUTORIAL
              </span>
            </button>

            <button
              onClick={enterChallengeMode}
              className="group bg-[#2C3C35] hover:bg-[#33463E] border border-[#4E665B] rounded-2xl p-6 text-left flex flex-col gap-3 shadow-sm hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200"
            >
              <div className="text-3xl">🏆</div>
              <div>
                <h2 className="font-pixel text-xs text-[#EAF4EE] uppercase mb-2">Challenge Mode</h2>
                <p className="text-[#C9D7CF] text-xs leading-relaxed font-sans">
                  &quot;{gradientDescentChallenge.title}&quot; — {gradientDescentChallenge.goalSummary}
                </p>
              </div>
              <span className="font-pixel text-[10px] bg-[#22302B] text-[#E9C46A] border border-[#4E665B] px-2.5 py-1 rounded-lg self-start mt-auto">
                ▶ START CHALLENGE
              </span>
            </button>

            <button
              onClick={enterSandboxMode}
              className="group bg-[#2C3C35] hover:bg-[#33463E] border border-[#4E665B] rounded-2xl p-6 text-left flex flex-col gap-3 shadow-sm hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200"
            >
              <div className="text-3xl">🔬</div>
              <div>
                <h2 className="font-pixel text-xs text-[#EAF4EE] uppercase mb-2">Sandbox Mode</h2>
                <p className="text-[#C9D7CF] text-xs leading-relaxed font-sans">
                  Jump straight in. Experiment with surfaces, learning rates, and start points.
                </p>
              </div>
              <span className="font-pixel text-[10px] bg-[#22302B] text-[#8DA397] border border-[#4E665B] px-2.5 py-1 rounded-lg self-start mt-auto">
                ▶ FREE EXPLORE
              </span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Shared Playground UI ──────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#182320] text-[#C9D7CF] p-4 md:p-8 font-sans selection:bg-[#6FCF97] selection:text-[#182320]">
      <header className="max-w-7xl mx-auto mb-6 bg-[#22302B] border border-[#4E665B] p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton href="/" label="Back to Dashboard" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#2C3C35] text-[#6FCF97] font-pixel text-[10px] uppercase px-2.5 py-1 rounded-lg border border-[#4E665B]">
                Module 02
              </span>
              <h1 className="text-lg md:text-xl font-pixel text-[#EAF4EE] tracking-wide uppercase">
                Gradient Mountain
              </h1>
              {appMode === "story" ? (
                <button
                  onClick={() => { story.skip(); setAppMode("select"); }}
                  className="bg-[#2C3C35] text-[#E9C46A] hover:bg-[#33463E] font-pixel text-[10px] px-2.5 py-1 rounded-lg border border-[#4E665B] transition-colors cursor-pointer"
                >
                  STORY MODE ↺
                </button>
              ) : appMode === "challenge" ? (
                <button
                  onClick={() => { challenge.reset(); setAppMode("select"); }}
                  className="bg-[#2C3C35] text-[#D96C6C] hover:bg-[#33463E] font-pixel text-[10px] border border-[#4E665B] px-2.5 py-1 rounded-lg transition-colors"
                >
                  CHALLENGE ↺
                </button>
              ) : (
                <button
                  onClick={() => setAppMode("select")}
                  className="bg-[#2C3C35] text-[#8DA397] hover:bg-[#33463E] font-pixel text-[10px] border border-[#4E665B] px-2.5 py-1 rounded-lg transition-colors"
                >
                  SANDBOX ↺
                </button>
              )}
            </div>
            <p className="text-[#8DA397] text-xs mt-1 font-sans">
              Optimization surface navigation • Loss gradient computation
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-2 font-sans">
          <Link href="/playground/perceptron"
            className="px-3 py-1.5 bg-[#22302B] hover:bg-[#2C3C35] text-[#C9D7CF] font-pixel text-[10px] uppercase border border-[#4E665B] rounded-xl transition-colors">
            01. Perceptron
          </Link>
          <Link href="/playground/gradient-descent"
            className="px-3 py-1.5 bg-[#2C3C35] text-[#6FCF97] font-pixel text-[10px] uppercase border border-[#4E665B] rounded-xl">
            02. Gradient
          </Link>
          <Link href="/playground/neural-net"
            className="px-3 py-1.5 bg-[#22302B] hover:bg-[#2C3C35] text-[#C9D7CF] font-pixel text-[10px] uppercase border border-[#4E665B] rounded-xl transition-colors">
            03. Neural Net
          </Link>
        </nav>
      </header>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 2D Contour Canvas + Live Math Formula Panel */}
        <div id="story-gd-canvas" className="lg:col-span-7 flex flex-col items-center lg:items-start">
          <GradientDescentCanvas
            path={path}
            preset={preset}
            onSetStartPoint={handleSetStartPoint}
            width={600}
            height={600}
            range={5}
          />

          {/* TASK 1: Retro Live Math Formula Panel */}
          <div className="w-[600px] max-w-full mt-4 bg-[#22302B] border border-[#4E665B] rounded-2xl p-4 font-mono text-xs text-[#C9D7CF] shadow-sm">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#4E665B]/60">
              <span className="font-pixel text-[9px] uppercase text-[#6FCF97] tracking-wider">
                📐 Live Gradient Update Rule
              </span>
              <span className="text-[10px] text-[#8DA397]">w⁽ᵗ⁺¹⁾ = w⁽ᵗ⁾ - η · ∇L(w)</span>
            </div>
            <div className="bg-[#182320] border border-[#4E665B] p-3 rounded-xl text-center font-mono text-sm font-bold text-[#EAF4EE]">
              w⁽ᵗ⁺¹⁾ = w⁽ᵗ⁾ - <span className="text-[#E9C46A]">{learningRate.toFixed(3)}</span> · (
              <span className="text-[#6FCF97]">{currentGrad.gx >= 0 ? `+${currentGrad.gx.toFixed(2)}` : currentGrad.gx.toFixed(2)}</span>,{" "}
              <span className="text-[#6FCF97]">{currentGrad.gy >= 0 ? `+${currentGrad.gy.toFixed(2)}` : currentGrad.gy.toFixed(2)}</span>)
            </div>
          </div>
        </div>

        {/* Right Column: Controls, Chart, & Readout */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
          {appMode === "challenge" && (
            <ChallengeCard
              challenge={gradientDescentChallenge}
              metrics={{ stepCount, currentLoss, lossHistory }}
              isWon={challenge.isWon}
            />
          )}

          <div id="story-gd-controls">
            <RetroPanel title="Optimizer & Surface Setup" borderColor="border-[#4E665B]">
              <div className="flex flex-col gap-4">
                <div>
                  <span className="font-pixel text-[10px] text-[#8DA397] block mb-2 uppercase">
                    Loss Surface:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(PRESETS) as LossPreset[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => handlePresetChange(key)}
                        className={`font-pixel text-[9px] uppercase p-2 rounded-xl border transition-all ${
                          preset === key
                            ? "bg-[#2C3C35] text-[#6FCF97] border-[#6FCF97]"
                            : "bg-[#182320] text-[#8DA397] border-[#4E665B] hover:bg-[#2C3C35]"
                        }`}
                      >
                        {PRESETS[key].name}
                      </button>
                    ))}
                  </div>
                </div>

                <div id="story-gd-lr-slider">
                  <RetroSlider
                    label="Learning Rate (η)"
                    min={0.001}
                    max={1.0}
                    step={0.005}
                    value={learningRate}
                    onChange={setLearningRate}
                    displayValue={learningRate.toFixed(3)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div id="story-gd-step-btn">
                    <RetroButton variant="primary" onClick={handleStep} disabled={challenge.isWon} className="w-full">
                      Step (1x)
                    </RetroButton>
                  </div>

                  <RetroButton
                    variant={isAutoStepping ? "danger" : "accent"}
                    onClick={() => setIsAutoStepping((prev) => !prev)}
                    disabled={challenge.isWon}
                  >
                    {isAutoStepping ? "Stop Auto" : "Run Auto"}
                  </RetroButton>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <RetroButton variant="secondary" onClick={handleResetPath}>
                    Reset Path
                  </RetroButton>
                  <RetroButton variant="secondary" onClick={handleRandomizeStart}>
                    Random Start
                  </RetroButton>
                </div>
              </div>
            </RetroPanel>
          </div>

          <RetroPanel title="Loss Convergence Chart" borderColor="border-[#4E665B]">
            <LossChart lossHistory={lossHistory} />
          </RetroPanel>

          <RetroPanel title="Optimizer Readout" borderColor="border-[#4E665B]">
            <div className="space-y-3 font-sans">
              <div className="flex justify-between items-center bg-[#182320] p-3 rounded-xl border border-[#4E665B]">
                <span className="text-[#8DA397] text-xs">Status:</span>
                <span
                  className={`font-pixel text-[10px] uppercase px-2.5 py-1 rounded-lg border ${
                    isDiverging
                      ? "bg-[#2C3C35] text-[#D96C6C] border-[#D96C6C]/40"
                      : isConverged
                      ? "bg-[#2C3C35] text-[#6FCF97] border-[#6FCF97]"
                      : "bg-[#2C3C35] text-[#E9C46A] border-[#E9C46A]/40"
                  }`}
                >
                  {isDiverging ? "⚠️ DIVERGING (η too high!)" : isConverged ? "✓ CONVERGED AT MINIMUM" : "⚡ MINIMIZING"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#182320] p-2.5 rounded-xl border border-[#4E665B]">
                  <span className="text-[#8DA397] block font-pixel text-[9px]">POS (x, y)</span>
                  <span className="text-[#6FCF97] font-mono text-sm font-bold">
                    ({currentPos.x.toFixed(2)}, {currentPos.y.toFixed(2)})
                  </span>
                </div>
                <div className="bg-[#182320] p-2.5 rounded-xl border border-[#4E665B]">
                  <span className="text-[#8DA397] block font-pixel text-[9px]">LOSS f(x,y)</span>
                  <span className="text-[#EAF4EE] font-mono text-sm font-bold">
                    {isFinite(currentLoss) ? currentLoss.toFixed(4) : "∞"}
                  </span>
                </div>
                <div className="bg-[#182320] p-2.5 rounded-xl border border-[#4E665B]">
                  <span className="text-[#8DA397] block font-pixel text-[9px]">GRAD ||∇f||</span>
                  <span className="text-[#E9C46A] font-mono text-sm font-bold">
                    {gradNorm.toFixed(4)}
                  </span>
                </div>
              </div>

              <div className="bg-[#182320] p-3 rounded-xl border border-[#4E665B] flex justify-between items-center text-xs">
                <span className="text-[#8DA397]">Total Steps Taken:</span>
                <span className="text-[#6FCF97] font-mono font-bold">{stepCount}</span>
              </div>
            </div>
          </RetroPanel>
        </div>
      </div>

      {/* Story Mode Dialogue Overlay */}
      {appMode === "story" && story.currentStep && (
        <NPCDialogueBox
          step={story.currentStep}
          script={gradientDescentWalkthrough}
          stepIndex={story.state.currentStepIndex}
          totalSteps={gradientDescentWalkthrough.steps.length}
          actionCount={story.state.actionCount}
          onNext={() => {
            if (story.state.currentStepIndex === gradientDescentWalkthrough.steps.length - 1) {
              story.skip();
              enterChallengeMode();
            } else {
              story.advance();
            }
          }}
          onSkip={() => {
            story.skip();
            setAppMode("sandbox");
          }}
        />
      )}

      {/* Challenge Result Modal */}
      {challenge.showModal && (
        <ChallengeResultModal
          challenge={gradientDescentChallenge}
          stars={challenge.stars}
          metrics={challenge.lastMetrics}
          onRetry={handleChallengeRetry}
          onNext={handleNextChallenge}
          onDismiss={challenge.dismissModal}
        />
      )}
    </main>
  );
}
