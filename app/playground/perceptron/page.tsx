"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PerceptronCanvas } from "@/components/canvas/PerceptronCanvas";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroSlider } from "@/components/ui/RetroSlider";
import { RetroPanel } from "@/components/ui/RetroPanel";
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

import { BackButton } from "@/components/ui/BackButton";

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
      <main className="min-h-screen bg-[#182320] text-[#C9D7CF] flex flex-col items-center justify-center p-6 md:p-8 font-sans relative">
        {/* Top-Left Back Button */}
        <div className="fixed top-4 left-4 z-30">
          <BackButton href="/" label="Back to Dashboard" />
        </div>

        {/* Module nav right */}
        <nav className="fixed top-4 right-4 flex items-center gap-2 z-10 font-sans">
          <Link href="/playground/perceptron"
            className="px-3 py-1.5 bg-[#2C3C35] text-[#6FCF97] font-pixel text-[10px] uppercase border border-[#4E665B] rounded-xl">
            01. Perceptron
          </Link>
          <Link href="/playground/gradient-descent"
            className="px-3 py-1.5 bg-[#22302B] hover:bg-[#2C3C35] text-[#C9D7CF] font-pixel text-[10px] uppercase border border-[#4E665B] rounded-xl transition-colors">
            02. Gradient Descent
          </Link>
          <Link href="/playground/neural-net"
            className="px-3 py-1.5 bg-[#22302B] hover:bg-[#2C3C35] text-[#C9D7CF] font-pixel text-[10px] uppercase border border-[#4E665B] rounded-xl transition-colors">
            03. Neural Net
          </Link>
        </nav>

        <div className="max-w-3xl w-full text-center flex flex-col items-center gap-8">
          {/* Title */}
          <div>
            <span className="bg-[#2C3C35] text-[#6FCF97] font-pixel text-[10px] uppercase px-3 py-1 border border-[#4E665B] rounded-full inline-block mb-4">
              Module 01
            </span>
            <h1 className="text-2xl sm:text-3xl font-pixel text-[#EAF4EE] uppercase tracking-wider mb-2">
              Perceptron Visualizer
            </h1>
            <p className="text-[#8DA397] text-sm">Choose your learning mode:</p>
          </div>

          {/* Mode cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full">
            {/* Story Mode card */}
            <button
              onClick={enterStoryMode}
              className="group bg-[#2C3C35] hover:bg-[#33463E] border border-[#4E665B] rounded-2xl p-6 text-left flex flex-col gap-3 shadow-sm hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200"
            >
              <div className="text-3xl">📖</div>
              <div>
                <h2 className="font-pixel text-xs text-[#EAF4EE] uppercase mb-2">Story Mode</h2>
                <p className="text-[#C9D7CF] text-xs leading-relaxed font-sans">
                  Guided walkthrough with BYTE the robot professor.
                </p>
              </div>
              <span className="font-pixel text-[10px] text-[#6FCF97] border border-[#4E665B] bg-[#22302B] px-2.5 py-1 rounded-lg self-start mt-auto">
                ▶ START TUTORIAL
              </span>
            </button>

            {/* Challenge Mode card */}
            <button
              onClick={enterChallengeMode}
              className="group bg-[#2C3C35] hover:bg-[#33463E] border border-[#4E665B] rounded-2xl p-6 text-left flex flex-col gap-3 shadow-sm hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200"
            >
              <div className="text-3xl">🏆</div>
              <div>
                <h2 className="font-pixel text-xs text-[#EAF4EE] uppercase mb-2">Challenge Mode</h2>
                <p className="text-[#C9D7CF] text-xs leading-relaxed font-sans">
                  &quot;{perceptronChallenge.title}&quot; — {perceptronChallenge.goalSummary}
                </p>
              </div>
              <span className="font-pixel text-[10px] text-[#E9C46A] border border-[#4E665B] bg-[#22302B] px-2.5 py-1 rounded-lg self-start mt-auto">
                ▶ START CHALLENGE
              </span>
            </button>

            {/* Sandbox Mode card */}
            <button
              onClick={enterSandboxMode}
              className="group bg-[#2C3C35] hover:bg-[#33463E] border border-[#4E665B] rounded-2xl p-6 text-left flex flex-col gap-3 shadow-sm hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200"
            >
              <div className="text-3xl">🔬</div>
              <div>
                <h2 className="font-pixel text-xs text-[#EAF4EE] uppercase mb-2">Sandbox Mode</h2>
                <p className="text-[#C9D7CF] text-xs leading-relaxed font-sans">
                  Jump straight in and experiment freely.
                </p>
              </div>
              <span className="font-pixel text-[10px] text-[#8DA397] border border-[#4E665B] bg-[#22302B] px-2.5 py-1 rounded-lg self-start mt-auto">
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
    <main className="min-h-screen bg-[#182320] text-[#C9D7CF] p-4 md:p-8 font-sans selection:bg-[#6FCF97] selection:text-[#182320]">
      {/* Top Header Bar */}
      <header className="max-w-7xl mx-auto mb-6 bg-[#22302B] border border-[#4E665B] p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton href="/" label="Back to Dashboard" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#2C3C35] text-[#6FCF97] font-pixel text-[10px] uppercase px-2.5 py-1 rounded-lg border border-[#4E665B]">
                Module 01
              </span>
              <h1 className="text-lg md:text-xl font-pixel text-[#EAF4EE] tracking-wide uppercase">
                Perceptron Meadow
              </h1>
              {/* Mode badge */}
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
              Single-Layer Neural Unit • Linear Binary Classifier • Pure TS Engine
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Link href="/playground/perceptron"
            className="px-3 py-1.5 bg-[#2C3C35] text-[#6FCF97] font-pixel text-[10px] uppercase border border-[#4E665B] rounded-xl">
            01. Perceptron
          </Link>
          <Link href="/playground/gradient-descent"
            className="px-3 py-1.5 bg-[#22302B] hover:bg-[#2C3C35] text-[#C9D7CF] font-pixel text-[10px] uppercase border border-[#4E665B] rounded-xl transition-colors">
            02. Gradient
          </Link>
          <Link href="/playground/neural-net"
            className="px-3 py-1.5 bg-[#22302B] hover:bg-[#2C3C35] text-[#C9D7CF] font-pixel text-[10px] uppercase border border-[#4E665B] rounded-xl transition-colors">
            03. Neural Net
          </Link>
        </nav>
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
          <RetroPanel title="Hyperparameters & Training" borderColor="border-[#4E665B]">
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
              <div className="pt-3 border-t border-[#4E665B]">
                <span className="font-pixel text-[10px] text-[#8DA397] block mb-2 uppercase">
                  Presets
                </span>
                <RetroButton
                  variant="secondary"
                  className="w-full text-xs"
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
            borderColor="border-[#4E665B]"
          >
            <div id="story-weights-panel" className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#182320] p-2.5 rounded-xl border border-[#4E665B]">
                  <span className="text-[#8DA397] block text-[9px] font-pixel">W1 (X1)</span>
                  <span className="text-[#6FCF97] font-mono text-base font-bold">
                    {weights.w1 >= 0 ? `+${weights.w1.toFixed(4)}` : weights.w1.toFixed(4)}
                  </span>
                </div>
                <div className="bg-[#182320] p-2.5 rounded-xl border border-[#4E665B]">
                  <span className="text-[#8DA397] block text-[9px] font-pixel">W2 (X2)</span>
                  <span className="text-[#6FCF97] font-mono text-base font-bold">
                    {weights.w2 >= 0 ? `+${weights.w2.toFixed(4)}` : weights.w2.toFixed(4)}
                  </span>
                </div>
                <div className="bg-[#182320] p-2.5 rounded-xl border border-[#4E665B]">
                  <span className="text-[#8DA397] block text-[9px] font-pixel">BIAS (b)</span>
                  <span className="text-[#EAF4EE] font-mono text-base font-bold">
                    {weights.bias >= 0 ? `+${weights.bias.toFixed(4)}` : weights.bias.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="bg-[#182320] p-3 rounded-xl border border-[#4E665B] space-y-2 text-xs font-sans">
                <div className="flex justify-between items-center">
                  <span className="text-[#8DA397]">Total Samples:</span>
                  <span className="text-[#EAF4EE] font-medium">{points.length} points</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8DA397]">Training Steps:</span>
                  <span className="text-[#6FCF97] font-mono font-medium">{stepCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8DA397]">Accuracy:</span>
                  <span className={`font-mono font-bold ${
                    currentAccuracy === 100 ? "text-[#6FCF97]"
                    : currentAccuracy >= 75 ? "text-[#E9C46A]"
                    : "text-[#D96C6C]"
                  }`}>
                    {currentAccuracy}%
                  </span>
                </div>
              </div>

              {/* Formula display */}
              <div className="bg-[#182320] p-3 rounded-xl border border-[#4E665B] text-xs text-[#8DA397] leading-relaxed">
                <p className="text-[#E9C46A] font-pixel text-[9px] uppercase mb-1">
                  Decision Equation:
                </p>
                <code className="font-mono text-xs text-[#EAF4EE]">
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
