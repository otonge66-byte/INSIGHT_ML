"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  const pointsRef = useRef(points);
  const learningRateRef = useRef(learningRate);
  const weightsRef = useRef(weights);

  useEffect(() => { pointsRef.current = points; }, [points]);
  useEffect(() => { learningRateRef.current = learningRate; }, [learningRate]);
  useEffect(() => { weightsRef.current = weights; }, [weights]);

  // Story mode controller
  const story = useStoryMode();
  const storyRef = useRef(story);
  useEffect(() => { storyRef.current = story; }, [story]);

  // Challenge mode controller
  const challenge = useChallengeMode(perceptronChallenge);

  // ── Point handling ───────────────────────────────────────────────────────
  const handleAddPoint = useCallback((newPoint: DataPoint) => {
    setPoints((prev) => [...prev, newPoint]);
    storyRef.current.registerAction("add-point");
  }, []);

  // ── Training ─────────────────────────────────────────────────────────────
  const handleTrainStep = useCallback(() => {
    if (pointsRef.current.length === 0) return;
    const nextWeights = trainEpoch(pointsRef.current, weightsRef.current, learningRateRef.current);
    setWeights(nextWeights);
    setStepCount((prev) => prev + 1);
    storyRef.current.registerAction("train-step");
  }, []);

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
      if (trainingIntervalRef.current) {
        clearInterval(trainingIntervalRef.current);
        trainingIntervalRef.current = null;
      }
    };
  }, [isTraining, handleTrainStep]);

  const handleResetWeights = useCallback(() => {
    setWeights(initRandomWeights());
    setStepCount(0);
  }, []);

  const handleClearPoints = useCallback(() => {
    setPoints([]);
    setStepCount(0);
    setIsTraining(false);
  }, []);

  const loadPresetSeparable = useCallback(() => {
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
  }, []);

  // Memoize accuracy calculation
  const currentAccuracy = useMemo(() => {
    return calculateAccuracy(points, weights);
  }, [points, weights]);

  // ── Mode selection handlers ───────────────────────────────────────────────
  const enterStoryMode = useCallback(() => {
    setAppMode("story");
    story.start(perceptronWalkthrough);
  }, [story]);

  const enterSandboxMode = useCallback(() => {
    setAppMode("sandbox");
    story.skip();
  }, [story]);

  const enterChallengeMode = useCallback(() => {
    setAppMode("challenge");
    challenge.reset();
    setPoints([]);
    setWeights(initRandomWeights());
    setStepCount(0);
    setIsTraining(false);
  }, [challenge]);

  // When story finishes go to sandbox
  useEffect(() => {
    if (appMode === "story" && !story.state.isActive) {
      setAppMode("sandbox");
    }
  }, [appMode, story.state.isActive]);

  // Stop training automatically when challenge is won
  useEffect(() => {
    if (appMode === "challenge" && (challenge.isWon || challenge.showModal)) {
      console.log("🏆 [Perceptron Challenge Solved!] Stopping auto-training.");
      setIsTraining(false);
      if (trainingIntervalRef.current) {
        clearInterval(trainingIntervalRef.current);
        trainingIntervalRef.current = null;
      }
    }
  }, [appMode, challenge.isWon, challenge.showModal]);

  // ── Challenge progress tracking ───────────────────────────────────────────
  useEffect(() => {
    if (appMode === "challenge") {
      challenge.update({ stepCount, accuracy: currentAccuracy });
    }
  }, [appMode, stepCount, currentAccuracy, challenge]);

  const handleChallengeRetry = useCallback(() => {
    challenge.reset();
    setPoints([]);
    setWeights(initRandomWeights());
    setStepCount(0);
    setIsTraining(false);
  }, [challenge]);

  const handleNextChallenge = useCallback(() => {
    router.push(perceptronChallenge.nextChallengeUrl ?? "/playground/gradient-descent");
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
          <div>
            <span className="bg-[#2C3C35] text-[#6FCF97] font-pixel text-[10px] uppercase px-3 py-1 border border-[#4E665B] rounded-full inline-block mb-4">
              Module 01
            </span>
            <h1 className="text-2xl sm:text-3xl font-pixel text-[#EAF4EE] uppercase tracking-wider mb-2">
              Perceptron Visualizer
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
                  Guided walkthrough with BYTE the robot professor.
                </p>
              </div>
              <span className="font-pixel text-[10px] text-[#6FCF97] border border-[#4E665B] bg-[#22302B] px-2.5 py-1 rounded-lg self-start mt-auto">
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
                  &quot;{perceptronChallenge.title}&quot; — {perceptronChallenge.goalSummary}
                </p>
              </div>
              <span className="font-pixel text-[10px] text-[#E9C46A] border border-[#4E665B] bg-[#22302B] px-2.5 py-1 rounded-lg self-start mt-auto">
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

  // ── Shared Playground UI ──────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#182320] text-[#C9D7CF] p-4 md:p-8 font-sans selection:bg-[#6FCF97] selection:text-[#182320]">
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
              Single-layer binary classifier • Linear decision boundary tuning
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-2 font-sans">
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

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Canvas + Live Math Formula Panel */}
        <div id="story-perceptron-canvas" className="lg:col-span-7 flex flex-col items-center lg:items-start">
          <PerceptronCanvas
            points={points}
            weights={weights}
            onAddPoint={handleAddPoint}
            width={600}
            height={600}
          />

          {/* TASK 1: Retro Live Math Formula Panel */}
          <div className="w-[600px] max-w-full mt-4 bg-[#22302B] border border-[#4E665B] rounded-2xl p-4 font-mono text-xs text-[#C9D7CF] shadow-sm">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#4E665B]/60">
              <span className="font-pixel text-[9px] uppercase text-[#6FCF97] tracking-wider">
                📐 Live Decision Boundary Equation
              </span>
              <span className="text-[10px] text-[#8DA397]">w₁·x₁ + w₂·x₂ + b = 0</span>
            </div>
            <div className="bg-[#182320] border border-[#4E665B] p-3 rounded-xl text-center font-mono text-sm font-bold text-[#EAF4EE]">
              <span className="text-[#6FCF97]">{weights.w1 >= 0 ? `+${weights.w1.toFixed(2)}` : weights.w1.toFixed(2)}</span> · x₁ +{" "}
              <span className="text-[#6FCF97]">{weights.w2 >= 0 ? `+${weights.w2.toFixed(2)}` : weights.w2.toFixed(2)}</span> · x₂ +{" "}
              <span className="text-[#E9C46A]">{weights.bias >= 0 ? `+${weights.bias.toFixed(2)}` : weights.bias.toFixed(2)}</span> = 0
            </div>
          </div>
        </div>

        {/* Right Column: Controls, Readout & Challenge Card */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full font-sans">
          {appMode === "challenge" && (
            <ChallengeCard
              challenge={perceptronChallenge}
              metrics={{ stepCount, accuracy: currentAccuracy }}
              isWon={challenge.isWon}
            />
          )}

          <div id="story-perceptron-controls">
            <RetroPanel title="Perceptron Controls" borderColor="border-[#4E665B]">
              <div className="flex flex-col gap-4">
                <div id="story-perceptron-lr-slider">
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

                <div className="grid grid-cols-2 gap-3">
                  <div id="story-perceptron-train-btn">
                    <RetroButton
                      variant="primary"
                      onClick={handleTrainStep}
                      disabled={points.length === 0 || challenge.isWon}
                      className="w-full"
                    >
                      Step Epoch (1x)
                    </RetroButton>
                  </div>

                  <RetroButton
                    variant={isTraining ? "danger" : "accent"}
                    onClick={() => setIsTraining((prev) => !prev)}
                    disabled={points.length === 0 || challenge.isWon}
                  >
                    {isTraining ? "Stop Auto" : "Run Auto"}
                  </RetroButton>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <RetroButton variant="secondary" onClick={handleResetWeights}>
                    Reset Weights
                  </RetroButton>
                  <RetroButton variant="secondary" onClick={handleClearPoints}>
                    Clear Points
                  </RetroButton>
                </div>

                <div className="pt-3 border-t border-[#4E665B]">
                  <span className="font-pixel text-[10px] text-[#8DA397] block mb-2 uppercase">Presets</span>
                  <div id="story-perceptron-preset-btn">
                    <RetroButton variant="secondary" className="w-full text-xs" onClick={loadPresetSeparable}>
                      Load Separable Dataset
                    </RetroButton>
                  </div>
                </div>
              </div>
            </RetroPanel>
          </div>

          <RetroPanel title="Weight Vector & Accuracy" borderColor="border-[#4E665B]">
            <div className="space-y-3 font-sans">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#182320] p-2.5 rounded-xl border border-[#4E665B]">
                  <span className="text-[#8DA397] block font-pixel text-[9px]">W1</span>
                  <span className="text-[#6FCF97] font-mono text-base font-bold">{weights.w1.toFixed(2)}</span>
                </div>
                <div className="bg-[#182320] p-2.5 rounded-xl border border-[#4E665B]">
                  <span className="text-[#8DA397] block font-pixel text-[9px]">W2</span>
                  <span className="text-[#6FCF97] font-mono text-base font-bold">{weights.w2.toFixed(2)}</span>
                </div>
                <div className="bg-[#182320] p-2.5 rounded-xl border border-[#4E665B]">
                  <span className="text-[#8DA397] block font-pixel text-[9px]">BIAS (b)</span>
                  <span className="text-[#E9C46A] font-mono text-base font-bold">{weights.bias.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-[#182320] p-3 rounded-xl border border-[#4E665B] flex justify-between items-center text-xs">
                <span className="text-[#8DA397]">Classification Accuracy:</span>
                <span
                  className={`font-mono text-sm font-bold ${
                    currentAccuracy === 100
                      ? "text-[#6FCF97]"
                      : currentAccuracy >= 75
                      ? "text-[#E9C46A]"
                      : "text-[#D96C6C]"
                  }`}
                >
                  {points.length === 0 ? "—" : `${currentAccuracy}%`}
                </span>
              </div>

              <div className="bg-[#182320] p-3 rounded-xl border border-[#4E665B] flex justify-between items-center text-xs">
                <span className="text-[#8DA397]">Epochs Trained:</span>
                <span className="text-[#6FCF97] font-mono font-bold">{stepCount}</span>
              </div>
            </div>
          </RetroPanel>
        </div>
      </div>

      {/* Story Mode Overlay */}
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

      {/* Challenge Result Modal */}
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
