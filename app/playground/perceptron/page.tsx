"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PerceptronCanvas } from "@/components/canvas/PerceptronCanvas";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroSlider } from "@/components/ui/RetroSlider";
import { RetroPanel } from "@/components/ui/RetroPanel";
import { HeaderAuthButton } from "@/components/ui/HeaderAuthButton";
import { NPCDialogueBox } from "@/components/story/NPCDialogueBox";
import { ChallengeCard } from "@/components/challenge/ChallengeCard";
import { ChallengeResultModal } from "@/components/challenge/ChallengeResultModal";
import { useStoryMode } from "@/lib/story/useStoryMode";
import { useChallengeMode } from "@/lib/challenge/useChallengeMode";
import { perceptronWalkthrough } from "@/lib/story/walkthroughs/perceptron";
import { perceptronChallenge } from "@/lib/challenge/challenges";
import {
  DataPoint,
  PerceptronWeights,
  initRandomWeights,
  trainEpoch,
  calculateAccuracy,
} from "@/lib/ml/perceptron";

type AppMode = "select" | "story" | "sandbox" | "challenge";

export default function PerceptronPlayground() {
  const router = useRouter();
  const [appMode, setAppMode] = useState<AppMode>("select");

  const [points, setPoints] = useState<DataPoint[]>([]);
  const [weights, setWeights] = useState<PerceptronWeights>(initRandomWeights());
  const [learningRate, setLearningRate] = useState<number>(0.1);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [stepCount, setStepCount] = useState<number>(0);

  const trainingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Story mode controller
  const story = useStoryMode();

  // Challenge mode controller
  const challenge = useChallengeMode(perceptronChallenge);

  // ── Point handling ───────────────────────────────────────────────────────
  const handleAddPoint = (newPoint: DataPoint) => {
    setPoints((prev) => [...prev, newPoint]);
    story.registerAction("add-point");
  };

  // ── Training ─────────────────────────────────────────────────────────────
  const handleTrainStep = useCallback(() => {
    if (points.length === 0) return;
    setWeights((prevWeights) => trainEpoch(points, prevWeights, learningRate));
    setStepCount((prev) => prev + 1);
    story.registerAction("train-step");
  }, [points, learningRate, story]);

  useEffect(() => {
    if (isTraining) {
      trainingIntervalRef.current = setInterval(() => {
        handleTrainStep();
      }, 300);
    } else if (trainingIntervalRef.current) {
      clearInterval(trainingIntervalRef.current);
      trainingIntervalRef.current = null;
    }
    return () => {
      if (trainingIntervalRef.current) clearInterval(trainingIntervalRef.current);
    };
  }, [isTraining, handleTrainStep]);

  const handleResetWeights = () => {
    setWeights(initRandomWeights());
    setStepCount(0);
  };

  const handleClearPoints = () => {
    setPoints([]);
    setStepCount(0);
    setIsTraining(false);
  };

  const loadPresetSeparable = () => {
    setIsTraining(false);
    setStepCount(0);
    setPoints([
      { id: "1", x: -0.6, y: 0.6,  label:  1 },
      { id: "2", x: -0.4, y: 0.8,  label:  1 },
      { id: "3", x: -0.7, y: 0.3,  label:  1 },
      { id: "4", x: -0.2, y: 0.5,  label:  1 },
      { id: "5", x:  0.5, y: -0.6, label: -1 },
      { id: "6", x:  0.7, y: -0.4, label: -1 },
      { id: "7", x:  0.3, y: -0.7, label: -1 },
      { id: "8", x:  0.6, y: -0.2, label: -1 },
    ]);
  };

  const currentAccuracy = calculateAccuracy(points, weights);

  // ── Mode selection handlers ───────────────────────────────────────────────
  const enterStoryMode = () => {
    setAppMode("story");
    story.start(perceptronWalkthrough);
  };

  const enterSandboxMode = () => {
    setAppMode("sandbox");
    story.skip();
  };

  const enterChallengeMode = () => {
    setAppMode("challenge");
    challenge.reset();
    setPoints([]);
    setWeights(initRandomWeights());
    setStepCount(0);
    setIsTraining(false);
  };

  // When story finishes (isActive becomes false after last step) go to sandbox
  useEffect(() => {
    if (appMode === "story" && !story.state.isActive) {
      setAppMode("sandbox");
    }
  }, [appMode, story.state.isActive]);

  // ── Challenge progress tracking ───────────────────────────────────────────
  useEffect(() => {
    if (appMode === "challenge") {
      challenge.update({ stepCount, accuracy: currentAccuracy });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appMode, stepCount, currentAccuracy]);

  const handleChallengeRetry = () => {
    challenge.reset();
    setPoints([]);
    setWeights(initRandomWeights());
    setStepCount(0);
    setIsTraining(false);
  };

  const handleNextChallenge = () => {
    router.push(perceptronChallenge.nextChallengeUrl ?? "/playground/gradient-descent");
  };

  // ── Mode Selection Screen ─────────────────────────────────────────────────
  if (appMode === "select") {
    return (
      <main className="min-h-screen bg-[#1e140e] text-[#fefae0] flex flex-col items-center justify-center p-8 font-vt323">
        {/* Module nav still accessible */}
        <nav className="fixed top-4 right-4 flex items-center gap-2 z-10">
          <Link href="/"
            className="px-3 py-1.5 bg-[#1e140e] hover:bg-[#281b12] text-[#5c3d2e] hover:text-[#a3b18a] font-pixel text-[10px] uppercase border-2 border-[#2e1e14] shadow-[2px_2px_0px_0px_#0f0a07] transition-colors">
            ← Dashboard
          </Link>
          <Link href="/playground/perceptron"
            className="px-3 py-1.5 bg-[#386641] text-[#fefae0] font-pixel text-[10px] uppercase border-2 border-[#1b3521] shadow-[2px_2px_0px_0px_#0f0a07]">
            01. Perceptron
          </Link>
          <Link href="/playground/gradient-descent"
            className="px-3 py-1.5 bg-[#3e271c] hover:bg-[#5c3d2e] text-[#a3b18a] font-pixel text-[10px] uppercase border-2 border-[#1e140e] shadow-[2px_2px_0px_0px_#0f0a07] transition-colors">
            02. Gradient Descent
          </Link>
          <Link href="/playground/neural-net"
            className="px-3 py-1.5 bg-[#3e271c] hover:bg-[#5c3d2e] text-[#a3b18a] font-pixel text-[10px] uppercase border-2 border-[#1e140e] shadow-[2px_2px_0px_0px_#0f0a07] transition-colors">
            03. Neural Net
          </Link>
        </nav>

        <div className="max-w-3xl w-full text-center flex flex-col items-center gap-8">
          {/* Title */}
          <div>
            <span className="bg-[#386641] text-[#fefae0] font-pixel text-[10px] uppercase px-2 py-1 border border-[#1b3521] inline-block mb-4">
              Module 01
            </span>
            <h1 className="text-3xl font-pixel text-[#dda15e] uppercase tracking-wider mb-2">
              Perceptron Visualizer
            </h1>
            <p className="text-[#a3b18a] text-xl">Choose your experience:</p>
          </div>

          {/* Mode cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
            {/* Story Mode card */}
            <button
              onClick={enterStoryMode}
              className="group bg-[#281b12] border-4 border-[#386641] shadow-[6px_6px_0px_0px_#0f0a07] p-6 text-left flex flex-col gap-3 hover:bg-[#2e2214] hover:-translate-y-1 transition-all active:translate-y-0 active:shadow-[2px_2px_0px_0px_#0f0a07]"
            >
              <div className="text-4xl">📖</div>
              <div>
                <h2 className="font-pixel text-[12px] text-[#dda15e] uppercase mb-2">Story Mode</h2>
                <p className="text-[#a3b18a] text-lg leading-snug">
                  Guided walkthrough with BYTE the robot professor.
                </p>
              </div>
              <span className="font-pixel text-[10px] text-[#386641] border border-[#386641] px-2 py-1 self-start">
                ▶ START TUTORIAL
              </span>
            </button>

            {/* Challenge Mode card */}
            <button
              onClick={enterChallengeMode}
              className="group bg-[#281b12] border-4 border-[#dda15e] shadow-[6px_6px_0px_0px_#0f0a07] p-6 text-left flex flex-col gap-3 hover:bg-[#2e2214] hover:-translate-y-1 transition-all active:translate-y-0 active:shadow-[2px_2px_0px_0px_#0f0a07]"
            >
              <div className="text-4xl">🏆</div>
              <div>
                <h2 className="font-pixel text-[12px] text-[#dda15e] uppercase mb-2">Challenge Mode</h2>
                <p className="text-[#a3b18a] text-lg leading-snug">
                  &quot;{perceptronChallenge.title}&quot; — {perceptronChallenge.goalSummary}
                </p>
              </div>
              <span className="font-pixel text-[10px] text-[#dda15e] border border-[#dda15e] px-2 py-1 self-start">
                ▶ START CHALLENGE
              </span>
            </button>

            {/* Sandbox Mode card */}
            <button
              onClick={enterSandboxMode}
              className="group bg-[#281b12] border-4 border-[#382219] shadow-[6px_6px_0px_0px_#0f0a07] p-6 text-left flex flex-col gap-3 hover:bg-[#2e2214] hover:-translate-y-1 transition-all active:translate-y-0 active:shadow-[2px_2px_0px_0px_#0f0a07]"
            >
              <div className="text-4xl">🔬</div>
              <div>
                <h2 className="font-pixel text-[12px] text-[#dda15e] uppercase mb-2">Sandbox Mode</h2>
                <p className="text-[#a3b18a] text-lg leading-snug">
                  Jump straight in and experiment freely.
                </p>
              </div>
              <span className="font-pixel text-[10px] text-[#a3b18a] border border-[#382219] px-2 py-1 self-start">
                ▶ FREE EXPLORE
              </span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Shared Playground UI (Story + Sandbox + Challenge all render this) ────
  return (
    <main className="min-h-screen bg-[#1e140e] text-[#fefae0] p-4 md:p-8 font-vt323 selection:bg-[#dda15e] selection:text-[#1e140e]">
      {/* Top Header Bar */}
      <header className="max-w-7xl mx-auto mb-6 bg-[#281b12] border-4 border-[#382219] p-4 sm:p-5 shadow-[6px_6px_0px_0px_#0f0a07] rounded-none">
        {/* Tier 1: Context Badges & Navigation Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b-2 border-[#382219]">
          {/* Left Context: Module Label & Active Mode Switcher */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="bg-[#386641] text-[#fefae0] font-pixel text-[10px] uppercase px-2.5 py-1 border border-[#1b3521] font-bold shadow-[2px_2px_0px_#0f0a07]">
              Module 01
            </span>
            {appMode === "story" ? (
              <span className="bg-[#dda15e] text-[#1e140e] font-pixel text-[10px] px-2.5 py-1 border border-[#7a5225]">
                STORY MODE
              </span>
            ) : appMode === "challenge" ? (
              <button
                onClick={() => { challenge.reset(); setAppMode("select"); }}
                className="text-[#bc4749] hover:text-[#dda15e] font-pixel text-[10px] border border-[#6b2123] px-2.5 py-1 transition-colors cursor-pointer"
              >
                CHALLENGE ↺
              </button>
            ) : (
              <button
                onClick={() => setAppMode("select")}
                className="text-[#a3b18a] hover:text-[#dda15e] font-pixel text-[10px] border border-[#382219] px-2.5 py-1 transition-colors cursor-pointer"
              >
                SANDBOX ↺
              </button>
            )}
          </div>

          {/* Right Navigation: Module Tabs & Profile */}
          <nav className="flex items-center gap-2 flex-wrap">
            <Link href="/"
              className="px-3 py-1.5 bg-[#1e140e] hover:bg-[#281b12] text-[#5c3d2e] hover:text-[#a3b18a] font-pixel text-[10px] uppercase border-2 border-[#2e1e14] shadow-[2px_2px_0px_0px_#0f0a07] transition-colors">
              ← Dashboard
            </Link>
            <Link href="/playground/perceptron"
              className="px-3 py-1.5 bg-[#386641] text-[#fefae0] font-pixel text-[10px] uppercase border-2 border-[#1b3521] shadow-[2px_2px_0px_0px_#0f0a07] font-bold">
              01. Perceptron
            </Link>
            <Link href="/playground/gradient-descent"
              className="px-3 py-1.5 bg-[#3e271c] hover:bg-[#5c3d2e] text-[#a3b18a] font-pixel text-[10px] uppercase border-2 border-[#1e140e] shadow-[2px_2px_0px_0px_#0f0a07] transition-colors">
              02. Gradient Descent
            </Link>
            <Link href="/playground/neural-net"
              className="px-3 py-1.5 bg-[#3e271c] hover:bg-[#5c3d2e] text-[#a3b18a] font-pixel text-[10px] uppercase border-2 border-[#1e140e] shadow-[2px_2px_0px_0px_#0f0a07] transition-colors">
              03. Neural Net
            </Link>
            <HeaderAuthButton />
          </nav>
        </div>

        {/* Tier 2: Main Title & Subtitle Banner */}
        <div className="pt-3">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-pixel text-[#dda15e] tracking-wider uppercase leading-tight">
            Perceptron Visualizer
          </h1>
          <p className="text-[#a3b18a] text-base sm:text-lg mt-1 font-vt323 tracking-wide">
            Single-Layer Neural Unit • Linear Binary Classifier • Pure TS Engine
          </p>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Canvas */}
        <div id="story-canvas-area" className="lg:col-span-7 flex flex-col items-center lg:items-start">
          <PerceptronCanvas
            points={points}
            weights={weights}
            onAddPoint={handleAddPoint}
            width={600}
            height={600}
          />
        </div>

        {/* Right Column: Controls & Live Readout */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
          {/* Challenge Card (only in challenge mode) */}
          {appMode === "challenge" && (
            <ChallengeCard
              challenge={perceptronChallenge}
              metrics={{ stepCount, accuracy: currentAccuracy }}
              isWon={challenge.isWon}
            />
          )}

          {/* Controls Panel */}
          <RetroPanel title="Hyperparameters & Training" borderColor="border-[#382219]">
            <div className="flex flex-col gap-4">
              {/* Learning Rate Slider */}
              <div id="story-lr-slider">
                <RetroSlider
                  label="Learning Rate (η)"
                  min={0.01}
                  max={1.0}
                  step={0.01}
                  value={learningRate}
                  onChange={setLearningRate}
                  displayValue={learningRate.toFixed(2)}
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <div id="story-train-step-btn">
                  <RetroButton
                    variant="primary"
                    onClick={handleTrainStep}
                    disabled={points.length === 0}
                    className="w-full"
                  >
                    Train Step
                  </RetroButton>
                </div>

                <RetroButton
                  variant={isTraining ? "danger" : "accent"}
                  onClick={() => {
                    setIsTraining((prev) => !prev);
                    story.registerAction("train-auto");
                  }}
                  disabled={points.length === 0}
                >
                  {isTraining ? "Stop Auto" : "Train Auto"}
                </RetroButton>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <RetroButton variant="secondary" onClick={handleResetWeights}>
                  Reset Weights
                </RetroButton>
                <RetroButton variant="secondary" onClick={handleClearPoints}>
                  Clear Canvas
                </RetroButton>
              </div>

              {/* Preset Dataset */}
              <div className="pt-3 border-t-2 border-[#382219]">
                <span className="font-pixel text-[10px] text-[#a3b18a] block mb-2 uppercase">
                  Presets
                </span>
                <RetroButton
                  variant="secondary"
                  className="w-full text-[10px]"
                  onClick={loadPresetSeparable}
                >
                  Load Linearly Separable Data
                </RetroButton>
              </div>
            </div>
          </RetroPanel>

          {/* Model Weights & Metrics Readout */}
          <RetroPanel
            title="Live Weight & Bias Readout"
            borderColor="border-[#b37d36]"
          >
            <div id="story-weights-panel" className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#1e140e] p-2 border-2 border-[#382219]">
                  <span className="text-[#a3b18a] block text-sm font-pixel text-[9px]">W1 (X1)</span>
                  <span className="text-[#dda15e] font-vt323 text-2xl font-bold">
                    {weights.w1 >= 0 ? `+${weights.w1.toFixed(4)}` : weights.w1.toFixed(4)}
                  </span>
                </div>
                <div className="bg-[#1e140e] p-2 border-2 border-[#382219]">
                  <span className="text-[#a3b18a] block text-sm font-pixel text-[9px]">W2 (X2)</span>
                  <span className="text-[#dda15e] font-vt323 text-2xl font-bold">
                    {weights.w2 >= 0 ? `+${weights.w2.toFixed(4)}` : weights.w2.toFixed(4)}
                  </span>
                </div>
                <div className="bg-[#1e140e] p-2 border-2 border-[#382219]">
                  <span className="text-[#a3b18a] block text-sm font-pixel text-[9px]">BIAS (b)</span>
                  <span className="text-[#fefae0] font-vt323 text-2xl font-bold">
                    {weights.bias >= 0 ? `+${weights.bias.toFixed(4)}` : weights.bias.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="bg-[#1e140e] p-3 border-2 border-[#382219] space-y-2 text-xl">
                <div className="flex justify-between items-center">
                  <span className="text-[#a3b18a]">Total Samples:</span>
                  <span className="text-[#fefae0] font-bold">{points.length} points</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#a3b18a]">Training Steps:</span>
                  <span className="text-[#dda15e] font-bold">{stepCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#a3b18a]">Accuracy:</span>
                  <span className={`font-bold ${
                    currentAccuracy === 100 ? "text-[#a3b18a]"
                    : currentAccuracy >= 75 ? "text-[#dda15e]"
                    : "text-[#bc4749]"
                  }`}>
                    {currentAccuracy}%
                  </span>
                </div>
              </div>

              {/* Formula display */}
              <div className="bg-[#1e140e] p-2.5 border-2 border-[#382219] text-lg text-[#a3b18a] leading-relaxed">
                <p className="text-[#dda15e] font-pixel text-[9px] uppercase mb-1">
                  Decision Equation:
                </p>
                <code className="font-vt323 text-xl text-[#fefae0]">
                  {weights.w1.toFixed(2)}·x₁ + {weights.w2.toFixed(2)}·x₂ + {weights.bias.toFixed(2)} = 0
                </code>
              </div>
            </div>
          </RetroPanel>
        </div>
      </div>

      {/* ── Story Mode Dialogue Overlay ───────────────────────────────────── */}
      {appMode === "story" && story.currentStep && (
        <NPCDialogueBox
          step={story.currentStep}
          script={perceptronWalkthrough}
          stepIndex={story.state.currentStepIndex}
          totalSteps={perceptronWalkthrough.steps.length}
          actionCount={story.state.actionCount}
          onNext={() => {
            if (story.state.currentStepIndex === perceptronWalkthrough.steps.length - 1) {
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

      {/* ── Challenge Result Modal ────────────────────────────────────────── */}
      {challenge.showModal && (
        <ChallengeResultModal
          challenge={perceptronChallenge}
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
