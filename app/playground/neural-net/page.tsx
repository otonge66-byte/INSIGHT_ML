"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NeuralNetCanvas } from "@/components/canvas/NeuralNetCanvas";
import { LossChart } from "@/components/charts/LossChart";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroSlider } from "@/components/ui/RetroSlider";
import { RetroPanel } from "@/components/ui/RetroPanel";
import { HeaderAuthButton } from "@/components/ui/HeaderAuthButton";
import { NPCDialogueBox } from "@/components/story/NPCDialogueBox";
import { ChallengeCard } from "@/components/challenge/ChallengeCard";
import { ChallengeResultModal } from "@/components/challenge/ChallengeResultModal";
import { useStoryMode } from "@/lib/story/useStoryMode";
import { useChallengeMode } from "@/lib/challenge/useChallengeMode";
import { neuralNetWalkthrough } from "@/lib/story/walkthroughs/neuralNet";
import { neuralNetChallenge } from "@/lib/challenge/challenges";
import { MathFormulaPanel } from "@/components/ui/MathFormulaPanel";
import { NeuralDigitProject } from "@/components/projects/NeuralDigitProject";
import { NNDataPoint, LayerWeightInfo, NetworkArchitecture } from "@/modules/neural-net/types";
import type { TFType, TFModel } from "@/lib/ml/neural-net";

const GRID_RES = 40;
const DEFAULT_ARCH: NetworkArchitecture = { hiddenSize: 4, numHiddenLayers: 1 };

const PRESET_POINTS: NNDataPoint[] = [
  // XOR-like pattern — not linearly separable, so it shows off hidden layers
  { id: "p1", x: -0.6, y: -0.6, label: 1 },
  { id: "p2", x: -0.5, y: -0.7, label: 1 },
  { id: "p3", x:  0.6, y:  0.6, label: 1 },
  { id: "p4", x:  0.7, y:  0.5, label: 1 },
  { id: "p5", x: -0.6, y:  0.6, label: 0 },
  { id: "p6", x: -0.5, y:  0.7, label: 0 },
  { id: "p7", x:  0.6, y: -0.6, label: 0 },
  { id: "p8", x:  0.7, y: -0.5, label: 0 },
];

/**
 * Compute classification accuracy (0–100) by checking each data point
 * against the nearest cell in the model's prediction grid.
 * Grid covers [-1, 1] × [-1, 1] with `res × res` cells.
 */
function computeNNAccuracy(
  pts: NNDataPoint[],
  grid: Float32Array | null,
  res: number,
): number {
  if (!grid || pts.length === 0) return 0;
  let correct = 0;
  for (const p of pts) {
    const col = Math.min(res - 1, Math.max(0, Math.round((p.x + 1) / 2 * (res - 1))));
    const row = Math.min(res - 1, Math.max(0, Math.round((1 - p.y) / 2 * (res - 1))));
    const idx = row * res + col;
    if (idx >= 0 && idx < grid.length) {
      const predicted = grid[idx] >= 0.5 ? 1 : 0;
      if (predicted === p.label) correct++;
    }
  }
  return Math.round((correct / pts.length) * 100);
}

// ── Overfitting Demo Dataset — fixed, noisy, 70/30 split ────────────────────
// 20 training points: mostly separable (class 0 = top-left, class 1 = bottom-right)
// with 4 deliberate outliers mixed in to create noise for the model to memorize.
const OVERFIT_TRAIN: NNDataPoint[] = [
  // clean class 0 (top-left region)
  { id: "t1",  x: -0.70, y:  0.65, label: 0 },
  { id: "t2",  x: -0.55, y:  0.80, label: 0 },
  { id: "t3",  x: -0.80, y:  0.40, label: 0 },
  { id: "t4",  x: -0.45, y:  0.55, label: 0 },
  { id: "t5",  x: -0.60, y:  0.30, label: 0 },
  { id: "t6",  x: -0.30, y:  0.70, label: 0 },
  { id: "t7",  x: -0.75, y:  0.15, label: 0 },
  // clean class 1 (bottom-right region)
  { id: "t8",  x:  0.65, y: -0.70, label: 1 },
  { id: "t9",  x:  0.80, y: -0.55, label: 1 },
  { id: "t10", x:  0.40, y: -0.80, label: 1 },
  { id: "t11", x:  0.55, y: -0.45, label: 1 },
  { id: "t12", x:  0.30, y: -0.60, label: 1 },
  { id: "t13", x:  0.70, y: -0.30, label: 1 },
  { id: "t14", x:  0.15, y: -0.75, label: 1 },
  // outlier / noise points — wrong side of the natural boundary
  { id: "t15", x:  0.25, y:  0.55, label: 1 }, // noise: class 1 in class-0 zone
  { id: "t16", x: -0.20, y: -0.50, label: 0 }, // noise: class 0 in class-1 zone
  { id: "t17", x:  0.05, y:  0.30, label: 1 }, // noise: near decision boundary, wrong
  { id: "t18", x: -0.10, y: -0.35, label: 0 }, // noise: near boundary, wrong
  { id: "t19", x:  0.45, y:  0.10, label: 1 }, // borderline noisy class 1
  { id: "t20", x: -0.40, y: -0.15, label: 0 }, // borderline noisy class 0
];

// 10 held-out test points — same general pattern but NOT seen during training.
// These assess whether the model generalised or just memorised.
const OVERFIT_TEST: NNDataPoint[] = [
  { id: "e1",  x: -0.85, y:  0.70, label: 0 },
  { id: "e2",  x: -0.50, y:  0.90, label: 0 },
  { id: "e3",  x: -0.65, y:  0.50, label: 0 },
  { id: "e4",  x: -0.40, y:  0.25, label: 0 },
  { id: "e5",  x:  0.85, y: -0.65, label: 1 },
  { id: "e6",  x:  0.60, y: -0.85, label: 1 },
  { id: "e7",  x:  0.50, y: -0.50, label: 1 },
  { id: "e8",  x:  0.20, y:  0.45, label: 0 }, // generalisation test (should be 0)
  { id: "e9",  x: -0.15, y: -0.40, label: 1 }, // generalisation test (should be 1)
  { id: "e10", x:  0.10, y:  0.10, label: 0 }, // centre
];

type AppMode = "select" | "story" | "sandbox" | "challenge" | "overfitting" | "project";

export default function NeuralNetPlayground() {
  const router = useRouter();
  const [appMode, setAppMode] = useState<AppMode>("select");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("mode") === "project") {
        setAppMode("project");
      }
    }
  }, []);

  const [points, setPoints] = useState<NNDataPoint[]>([]);
  const [lossHistory, setLossHistory] = useState<number[]>([]);
  const [stepCount, setStepCount] = useState(0);
  const [learningRate, setLearningRate] = useState(0.1);
  const [architecture, setArchitecture] = useState<NetworkArchitecture>(DEFAULT_ARCH);
  const [isTraining, setIsTraining] = useState(false);
  const [predGrid, setPredGrid] = useState<Float32Array | null>(null);
  const [layerWeights, setLayerWeights] = useState<LayerWeightInfo[]>([]);
  const [tfReady, setTfReady] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Loading TF.js...");

  // ── Overfitting Demo state ─────────────────────────────────────────────────
  const [ovNodes, setOvNodes] = useState(4); // nodes per hidden layer for overfit demo
  const [ovPredGrid, setOvPredGrid] = useState<Float32Array | null>(null);
  const [ovStepCount, setOvStepCount] = useState(0);
  const [ovIsTraining, setOvIsTraining] = useState(false);
  const [ovLossHistory, setOvLossHistory] = useState<number[]>([]);
  const ovModelRef = useRef<TFModel | null>(null);
  const ovIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for mutable TF objects — never stored in React state to avoid serialisation
  const tfRef = useRef<TFType | null>(null);
  const modelRef = useRef<TFModel | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTrainingRef = useRef(false);

  // Story mode controller
  const story = useStoryMode();

  // Challenge mode controller
  const challenge = useChallengeMode(neuralNetChallenge);

  // Keep isTrainingRef in sync
  useEffect(() => { isTrainingRef.current = isTraining; }, [isTraining]);

  // ── Load TF.js dynamically (client only) ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tf = await import("@tensorflow/tfjs");
        if (cancelled) return;
        tfRef.current = tf;
        setTfReady(true);
        setStatusMsg("Ready. Add points & train.");
      } catch (e) {
        setStatusMsg("TF.js failed to load: " + String(e));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Build / rebuild model ─────────────────────────────────────────────────
  const buildNewModel = useCallback(() => {
    const tf = tfRef.current;
    if (!tf) return;
    // Dispose old model
    if (modelRef.current) {
      modelRef.current.dispose();
      modelRef.current = null;
    }
    // Import synchronously — already loaded at this point
    const { buildModel } = require("@/lib/ml/neural-net");
    const m = buildModel(tf, architecture, learningRate);
    modelRef.current = m;
    setLayerWeights([]);
    setPredGrid(null);
    setLossHistory([]);
    setStepCount(0);
    setIsTraining(false);
  }, [architecture, learningRate]);

  // Build initial model when TF is ready
  useEffect(() => {
    if (tfReady) buildNewModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tfReady]);

  // ── Single train step ─────────────────────────────────────────────────────
  const doTrainStep = useCallback(async () => {
    const tf = tfRef.current;
    const model = modelRef.current;
    if (!tf || !model || points.length === 0) return;

    const { trainStep, getPredictionGrid, getLayerWeights } = await import("@/lib/ml/neural-net");

    const loss = await trainStep(tf, model, points);
    const grid = await getPredictionGrid(tf, model, GRID_RES);
    const weights = getLayerWeights(model);

    setLossHistory((prev) => [...prev, loss]);
    setPredGrid(grid);
    setLayerWeights(weights);
    setStepCount((s) => s + 1);
    setStatusMsg(`Step ${stepCount + 1} — Loss: ${loss.toFixed(4)}`);
    story.registerAction("nn-train");
  }, [points, stepCount, story]);

  // ── Continuous training interval ──────────────────────────────────────────
  useEffect(() => {
    if (isTraining) {
      intervalRef.current = setInterval(() => {
        doTrainStep();
      }, 250);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isTraining, doTrainStep]);

  // ── Add / remove points ───────────────────────────────────────────────────
  const handleAddPoint = (p: NNDataPoint) => setPoints((prev) => [...prev, p]);

  const handleClear = () => {
    setIsTraining(false);
    setPoints([]);
    setLossHistory([]);
    setPredGrid(null);
    setStepCount(0);
    setStatusMsg("Canvas cleared.");
    buildNewModel();
  };

  const handleLoadPreset = () => {
    setIsTraining(false);
    setPoints(PRESET_POINTS);
    setLossHistory([]);
    setPredGrid(null);
    setStepCount(0);
    setStatusMsg("XOR preset loaded. Click Train to start.");
    buildNewModel();
    story.registerAction("nn-load-preset");
  };

  // ── Arch change — rebuild model ───────────────────────────────────────────
  const handleArchChange = (newArch: Partial<NetworkArchitecture>) => {
    setIsTraining(false);
    setArchitecture((prev) => {
      const next = { ...prev, ...newArch };
      // schedule model rebuild after state settles
      setTimeout(() => {
        if (!tfRef.current) return;
        if (modelRef.current) modelRef.current.dispose();
        const { buildModel } = require("@/lib/ml/neural-net");
        modelRef.current = buildModel(tfRef.current, next, learningRate);
        setLayerWeights([]);
        setPredGrid(null);
        setLossHistory([]);
        setStepCount(0);
      }, 0);
      return next;
    });
  };

  // ── LR change — recompile ─────────────────────────────────────────────────
  const handleLRChange = (lr: number) => {
    setLearningRate(lr);
    const tf = tfRef.current;
    const model = modelRef.current;
    if (!tf || !model) return;
    model.compile({
      optimizer: tf.train.adam(lr),
      loss: "binaryCrossentropy",
    });
  };

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      modelRef.current?.dispose();
      if (ovIntervalRef.current) clearInterval(ovIntervalRef.current);
      ovModelRef.current?.dispose();
    };
  }, []);

  // ── Overfitting Demo — build model ───────────────────────────────────────
  const buildOvModel = useCallback((nodes: number) => {
    const tf = tfRef.current;
    if (!tf) return;
    if (ovModelRef.current) { ovModelRef.current.dispose(); ovModelRef.current = null; }
    const { buildModel } = require("@/lib/ml/neural-net");
    // Use 2 hidden layers to allow more overfitting at high node counts
    ovModelRef.current = buildModel(tf, { hiddenSize: nodes, numHiddenLayers: 2 }, 0.05);
    setOvPredGrid(null);
    setOvStepCount(0);
    setOvLossHistory([]);
    setOvIsTraining(false);
  }, []);

  // ── Overfitting Demo — single train step ─────────────────────────────────
  const doOvTrainStep = useCallback(async () => {
    const tf = tfRef.current;
    const model = ovModelRef.current;
    if (!tf || !model) return;
    const { trainStep, getPredictionGrid } = await import("@/lib/ml/neural-net");
    const loss = await trainStep(tf, model, OVERFIT_TRAIN);
    const grid = await getPredictionGrid(tf, model, GRID_RES);
    setOvPredGrid(grid);
    setOvLossHistory((prev) => [...prev, loss]);
    setOvStepCount((s) => s + 1);
  }, []);

  // ── Overfitting Demo — auto-train loop ───────────────────────────────────
  useEffect(() => {
    if (ovIsTraining) {
      ovIntervalRef.current = setInterval(() => { doOvTrainStep(); }, 150);
    } else {
      if (ovIntervalRef.current) clearInterval(ovIntervalRef.current);
    }
    return () => { if (ovIntervalRef.current) clearInterval(ovIntervalRef.current); };
  }, [ovIsTraining, doOvTrainStep]);

  // ── Overfitting Demo — node count change ─────────────────────────────────
  const handleOvNodeChange = (n: number) => {
    setOvIsTraining(false);
    setOvNodes(n);
    // Small delay to let stop propagate before rebuilding
    setTimeout(() => buildOvModel(n), 50);
  };

  // ── Overfitting Demo — enter mode ────────────────────────────────────────
  const enterOverfittingMode = () => {
    setAppMode("overfitting");
    // Ensure TF model is built when entering
    setTimeout(() => buildOvModel(ovNodes), 100);
  };

  // ── Mode selection handlers ───────────────────────────────────────────────
  const enterStoryMode = () => {
    setAppMode("story");
    story.start(neuralNetWalkthrough);
  };

  const enterSandboxMode = () => {
    setAppMode("sandbox");
    story.skip();
  };

  const enterChallengeMode = () => {
    setAppMode("challenge");
    challenge.reset();
    // Set architecture to 2 nodes / 1 layer for the challenge
    setIsTraining(false);
    setPoints(PRESET_POINTS);
    setArchitecture({ hiddenSize: 2, numHiddenLayers: 1 });
    setLossHistory([]);
    setPredGrid(null);
    setStepCount(0);
    setStatusMsg("Challenge: Solve XOR with 2 nodes. Train away!");
    // Rebuild model with the challenge architecture after state settles
    setTimeout(() => {
      if (!tfRef.current) return;
      if (modelRef.current) modelRef.current.dispose();
      const { buildModel } = require("@/lib/ml/neural-net");
      modelRef.current = buildModel(tfRef.current, { hiddenSize: 2, numHiddenLayers: 1 }, 0.1);
      setLayerWeights([]);
    }, 0);
  };

  // When story finishes go to sandbox
  useEffect(() => {
    if (appMode === "story" && !story.state.isActive) {
      setAppMode("sandbox");
    }
  }, [appMode, story.state.isActive]);

  // ── Challenge progress tracking ───────────────────────────────────────────
  const nnAccuracy = computeNNAccuracy(points, predGrid, GRID_RES);

  useEffect(() => {
    if (appMode === "challenge") {
      challenge.update({
        stepCount,
        nnLoss: lossHistory.length > 0 ? lossHistory[lossHistory.length - 1] : null,
        nnAccuracy,
        hiddenSize: architecture.hiddenSize,
        numHiddenLayers: architecture.numHiddenLayers,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appMode, stepCount, nnAccuracy]);

  const handleChallengeRetry = () => {
    challenge.reset();
    setIsTraining(false);
    setPoints(PRESET_POINTS);
    setArchitecture({ hiddenSize: 2, numHiddenLayers: 1 });
    setLossHistory([]);
    setPredGrid(null);
    setStepCount(0);
    setStatusMsg("Retrying! Train with 2 nodes.");
    setTimeout(() => {
      if (!tfRef.current) return;
      if (modelRef.current) modelRef.current.dispose();
      const { buildModel } = require("@/lib/ml/neural-net");
      modelRef.current = buildModel(tfRef.current, { hiddenSize: 2, numHiddenLayers: 1 }, learningRate);
      setLayerWeights([]);
    }, 0);
  };

  const handleNextChallenge = () => {
    router.push(neuralNetChallenge.nextChallengeUrl ?? "/playground/perceptron");
  };

  const currentLoss = lossHistory.length > 0 ? lossHistory[lossHistory.length - 1] : null;

  // ── Mode Selection Screen ─────────────────────────────────────────────────
  if (appMode === "select") {
    return (
      <main className="min-h-screen bg-[#1e140e] text-[#fefae0] flex flex-col items-center justify-center p-8 font-vt323">
        <nav className="fixed top-4 right-4 flex items-center gap-2 z-10 flex-wrap">
          <Link href="/"
            className="px-3 py-1.5 bg-[#1e140e] hover:bg-[#281b12] text-[#5c3d2e] hover:text-[#a3b18a] font-pixel text-[10px] uppercase border-2 border-[#2e1e14] shadow-[2px_2px_0px_0px_#0f0a07] transition-colors">
            ← Dashboard
          </Link>
          <Link href="/playground/perceptron"
            className="px-3 py-1.5 bg-[#3e271c] hover:bg-[#5c3d2e] text-[#a3b18a] font-pixel text-[10px] uppercase border-2 border-[#1e140e] shadow-[2px_2px_0px_0px_#0f0a07] transition-colors">
            01. Perceptron
          </Link>
          <Link href="/playground/gradient-descent"
            className="px-3 py-1.5 bg-[#3e271c] hover:bg-[#5c3d2e] text-[#a3b18a] font-pixel text-[10px] uppercase border-2 border-[#1e140e] shadow-[2px_2px_0px_0px_#0f0a07] transition-colors">
            02. Gradient Descent
          </Link>
          <Link href="/playground/neural-net"
            className="px-3 py-1.5 bg-[#386641] text-[#fefae0] font-pixel text-[10px] uppercase border-2 border-[#1b3521] shadow-[2px_2px_0px_0px_#0f0a07]">
            03. Neural Net
          </Link>
          <HeaderAuthButton />
        </nav>

        <div className="max-w-3xl w-full text-center flex flex-col items-center gap-8">
          <div>
            <span className="bg-[#bc4749] text-[#fefae0] font-pixel text-[10px] uppercase px-2 py-1 border border-[#6b2123] inline-block mb-4">
              Module 03
            </span>
            <h1 className="text-3xl font-pixel text-[#dda15e] uppercase tracking-wider mb-2">
              Neural Net Visualizer
            </h1>
            <p className="text-[#a3b18a] text-xl">Choose your experience:</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {/* Story Mode card */}
            <button
              onClick={enterStoryMode}
              className="group bg-[#281b12] border-4 border-[#386641] shadow-[6px_6px_0px_0px_#0f0a07] p-5 text-left flex flex-col gap-3 hover:bg-[#2e2214] hover:-translate-y-1 transition-all active:translate-y-0 active:shadow-[2px_2px_0px_0px_#0f0a07]"
            >
              <div className="text-4xl">📖</div>
              <div>
                <h2 className="font-pixel text-[12px] text-[#dda15e] uppercase mb-1">Story Mode</h2>
                <p className="text-[#a3b18a] text-base leading-snug">
                  Guided walkthrough with BYTE. Discover why XOR needs hidden layers.
                </p>
              </div>
              <span className="font-pixel text-[9px] text-[#386641] border border-[#386641] px-2 py-1 self-start mt-auto">
                ▶ START TUTORIAL
              </span>
            </button>

            {/* Challenge Mode card */}
            <button
              onClick={enterChallengeMode}
              className="group bg-[#281b12] border-4 border-[#dda15e] shadow-[6px_6px_0px_0px_#0f0a07] p-5 text-left flex flex-col gap-3 hover:bg-[#2e2214] hover:-translate-y-1 transition-all active:translate-y-0 active:shadow-[2px_2px_0px_0px_#0f0a07]"
            >
              <div className="text-4xl">🏆</div>
              <div>
                <h2 className="font-pixel text-[12px] text-[#dda15e] uppercase mb-1">Challenge Mode</h2>
                <p className="text-[#a3b18a] text-base leading-snug">
                  &quot;{neuralNetChallenge.title}&quot; — {neuralNetChallenge.goalSummary}
                </p>
              </div>
              <span className="font-pixel text-[9px] text-[#dda15e] border border-[#dda15e] px-2 py-1 self-start mt-auto">
                ▶ START CHALLENGE
              </span>
            </button>

            {/* Sandbox Mode card */}
            <button
              onClick={enterSandboxMode}
              className="group bg-[#281b12] border-4 border-[#382219] shadow-[6px_6px_0px_0px_#0f0a07] p-5 text-left flex flex-col gap-3 hover:bg-[#2e2214] hover:-translate-y-1 transition-all active:translate-y-0 active:shadow-[2px_2px_0px_0px_#0f0a07]"
            >
              <div className="text-4xl">🔬</div>
              <div>
                <h2 className="font-pixel text-[12px] text-[#dda15e] uppercase mb-1">Sandbox Mode</h2>
                <p className="text-[#a3b18a] text-base leading-snug">
                  Jump straight in and experiment freely with neurons, rates, and layers.
                </p>
              </div>
              <span className="font-pixel text-[9px] text-[#a3b18a] border border-[#382219] px-2 py-1 self-start mt-auto">
                ▶ FREE EXPLORE
              </span>
            </button>

            {/* Applied Project Mode card */}
            <button
              onClick={() => setAppMode("project")}
              className="group bg-[#281b12] border-4 border-[#bc4749] shadow-[6px_6px_0px_0px_#0f0a07] p-5 text-left flex flex-col gap-3 hover:bg-[#2e1a14] hover:-translate-y-1 transition-all active:translate-y-0 active:shadow-[2px_2px_0px_0px_#0f0a07]"
            >
              <div className="text-4xl">🛠️</div>
              <div>
                <h2 className="font-pixel text-[12px] text-[#bc4749] uppercase mb-1">Applied Project</h2>
                <p className="text-[#a3b18a] text-base leading-snug">
                  16×16 Hand-Drawn Digit &amp; Shape Recognizer Blueprint.
                </p>
              </div>
              <span className="font-pixel text-[9px] text-[#bc4749] border border-[#6b2123] px-2 py-1 self-start mt-auto">
                ▶ BUILD CAPSTONE
              </span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Overfitting Demo UI ───────────────────────────────────────────────────
  if (appMode === "overfitting") {
    const ovTrainAcc = computeNNAccuracy(OVERFIT_TRAIN, ovPredGrid, GRID_RES);
    const ovTestAcc  = computeNNAccuracy(OVERFIT_TEST,  ovPredGrid, GRID_RES);
    const ovGap      = ovTrainAcc - ovTestAcc;
    const showByteAlert = ovStepCount > 30 && ovGap >= 15;

    // Combined point list for NeuralNetCanvas (train = solid, test overlaid with SVG hollow circles)
    const allOvPoints: NNDataPoint[] = [...OVERFIT_TRAIN, ...OVERFIT_TEST];

    return (
      <main className="min-h-screen bg-[#1e140e] text-[#fefae0] p-4 md:p-8 font-vt323 selection:bg-[#dda15e] selection:text-[#1e140e]">
        {/* Header */}
        <header className="max-w-7xl mx-auto mb-6 bg-[#281b12] border-4 border-[#382219] p-4 shadow-[6px_6px_0px_0px_#0f0a07] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-[#bc4749] text-[#fefae0] font-pixel text-[10px] uppercase px-2 py-1 border border-[#6b2123]">
                Module 03
              </span>
              <h1 className="text-2xl md:text-3xl font-pixel text-[#dda15e] tracking-wider uppercase">
                Overfitting Demo
              </h1>
              <button
                onClick={() => { setOvIsTraining(false); setAppMode("select"); }}
                className="text-[#bc4749] hover:text-[#dda15e] font-pixel text-[10px] border border-[#6b2123] px-2 py-1 transition-colors"
              >
                DEMO ↺
              </button>
            </div>
            <p className="text-[#a3b18a] text-lg mt-1 font-vt323">
              Training Set (●) vs Test Set (◯) • Watch accuracy diverge as model complexity grows
            </p>
          </div>
          <nav className="flex items-center gap-2 flex-wrap">
            <Link href="/"
              className="px-3 py-1.5 bg-[#1e140e] hover:bg-[#281b12] text-[#5c3d2e] hover:text-[#a3b18a] font-pixel text-[10px] uppercase border-2 border-[#2e1e14] shadow-[2px_2px_0px_0px_#0f0a07] transition-colors">
              ← Dashboard
            </Link>
            <Link href="/playground/perceptron"
              className="px-3 py-1.5 bg-[#3e271c] hover:bg-[#5c3d2e] text-[#a3b18a] font-pixel text-[10px] uppercase border-2 border-[#1e140e] shadow-[2px_2px_0px_0px_#0f0a07] transition-colors">
              01. Perceptron
            </Link>
            <Link href="/playground/gradient-descent"
              className="px-3 py-1.5 bg-[#3e271c] hover:bg-[#5c3d2e] text-[#a3b18a] font-pixel text-[10px] uppercase border-2 border-[#1e140e] shadow-[2px_2px_0px_0px_#0f0a07] transition-colors">
              02. Gradient Descent
            </Link>
            <Link href="/playground/neural-net"
              className="px-3 py-1.5 bg-[#386641] text-[#fefae0] font-pixel text-[10px] uppercase border-2 border-[#1b3521] shadow-[2px_2px_0px_0px_#0f0a07]">
              03. Neural Net
            </Link>
            <HeaderAuthButton />
          </nav>
        </header>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left: Canvas with train (●) and test (◯) overlay */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative inline-block">
              <NeuralNetCanvas
                points={OVERFIT_TRAIN}
                predictionGrid={ovPredGrid}
                gridRes={GRID_RES}
                layerWeights={[]}
                onAddPoint={() => {}} // read-only in demo mode
                width={560}
                height={560}
              />
              {/* SVG overlay: test points rendered as distinct hollow circles */}
              <svg
                width={560}
                height={560}
                className="absolute top-0 left-0 pointer-events-none"
              >
                {OVERFIT_TEST.map((pt) => {
                  const cx = ((pt.x + 1) / 2) * 560;
                  const cy = ((1 - pt.y) / 2) * 560;
                  const strokeColor = pt.label === 1 ? "#dda15e" : "#bc4749";
                  return (
                    <g key={pt.id}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={9}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={3}
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={3}
                        fill={strokeColor}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-lg font-vt323">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-[#dda15e]" />
                <span className="text-[#a3b18a]">Train Class 1 (●)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-[#a3b18a]" />
                <span className="text-[#a3b18a]">Train Class 0 (●)</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" fill="none" stroke="#dda15e" strokeWidth="2"/></svg>
                <span className="text-[#a3b18a]">Test pts (◯)</span>
              </div>
            </div>
          </div>

          {/* Right: Controls + Dual Accuracy + BYTE alert */}
          <div className="lg:col-span-5 flex flex-col gap-5">

            {/* Accuracy Comparison Card */}
            <div className="bg-[#281b12] border-4 border-[#bc4749] p-4 shadow-[6px_6px_0px_0px_#0f0a07]">
              <h2 className="font-pixel text-[10px] text-[#dda15e] uppercase mb-3">Live Accuracy Metrics</h2>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-[#1e140e] p-3 border-2 border-[#382219] text-center">
                  <span className="font-pixel text-[8px] text-[#dda15e] uppercase block mb-1">TRAINING SET (●)</span>
                  <span className="font-vt323 text-3xl font-bold text-[#fefae0]">{ovTrainAcc}%</span>
                </div>
                <div className="bg-[#1e140e] p-3 border-2 border-[#6b2123] text-center">
                  <span className="font-pixel text-[8px] text-[#bc4749] uppercase block mb-1">TEST SET (◯)</span>
                  <span className="font-vt323 text-3xl font-bold text-[#bc4749]">{ovTestAcc}%</span>
                </div>
              </div>
              <div className="bg-[#1e140e] p-2 border border-[#382219] text-center">
                <span className="text-[#a3b18a] text-lg">Generalisation Gap: </span>
                <span className={`font-bold text-xl ${ovGap >= 15 ? "text-[#bc4749]" : "text-[#a3b18a]"}`}>
                  {ovGap}%
                </span>
              </div>
            </div>

            {/* ── BYTE Alert: overfitting detected ── */}
            {showByteAlert && (
              <div className="bg-[#1e140e] border-4 border-[#bc4749] p-4 shadow-[4px_4px_0px_0px_#0f0a07] animate-pulse-once">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 text-3xl">🤖</div>
                  <div>
                    <p className="font-pixel text-[9px] text-[#bc4749] uppercase mb-1">BYTE says — Overfitting Detected!</p>
                    <p className="text-[#fefae0] text-lg leading-snug">
                      Training accuracy is high but test accuracy isn&apos;t improving — this is <span className="text-[#bc4749]">overfitting</span>.
                    </p>
                    <p className="text-[#a3b18a] text-base mt-1 leading-snug">
                      The model is memorising the noisy training points instead of learning the general pattern. Try fewer nodes to see the gap shrink!
                    </p>
                    <p className="font-pixel text-[8px] text-[#5c3d2e] mt-2 uppercase">Gap: +{ovGap}% • Nodes: {ovNodes} • Steps: {ovStepCount}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Node Count Control ── */}
            <RetroPanel title="Model Capacity (Hidden Nodes)" borderColor="border-[#382219]">
              <div className="space-y-2">
                <p className="text-[#5c3d2e] text-base leading-snug">
                  More nodes → more capacity → easier to memorise noise. Try 2 vs 16.
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 4, 8, 16].map((n) => (
                    <button key={n}
                      onClick={() => handleOvNodeChange(n)}
                      className={`font-pixel text-[10px] uppercase py-2 border-2 transition-all ${
                        ovNodes === n
                          ? "bg-[#bc4749] text-[#fefae0] border-[#6b2123] shadow-[2px_2px_0px_0px_#0f0a07]"
                          : "bg-[#1e140e] text-[#a3b18a] border-[#382219] hover:bg-[#281b12]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="font-pixel text-[8px] text-[#3e271c] uppercase">2 hidden layers • Adam 0.05 lr</p>
              </div>
            </RetroPanel>

            {/* ── Train Controls ── */}
            <div className="grid grid-cols-3 gap-3">
              <RetroButton variant="primary" onClick={doOvTrainStep} disabled={!tfReady}>
                Step
              </RetroButton>
              <RetroButton
                variant={ovIsTraining ? "danger" : "accent"}
                onClick={() => setOvIsTraining((p) => !p)}
                disabled={!tfReady}
              >
                {ovIsTraining ? "Stop" : "Auto"}
              </RetroButton>
              <RetroButton variant="secondary" onClick={() => { setOvIsTraining(false); setTimeout(() => buildOvModel(ovNodes), 50); }}>
                Reset
              </RetroButton>
            </div>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#1e140e] p-2 border-2 border-[#382219]">
                <span className="text-[#a3b18a] block font-pixel text-[8px]">STEPS</span>
                <span className="text-[#dda15e] font-vt323 text-2xl">{ovStepCount}</span>
              </div>
              <div className="bg-[#1e140e] p-2 border-2 border-[#382219]">
                <span className="text-[#a3b18a] block font-pixel text-[8px]">TRAIN PTS</span>
                <span className="text-[#fefae0] font-vt323 text-2xl">20</span>
              </div>
              <div className="bg-[#1e140e] p-2 border-2 border-[#382219]">
                <span className="text-[#a3b18a] block font-pixel text-[8px]">TEST PTS</span>
                <span className="text-[#fefae0] font-vt323 text-2xl">9</span>
              </div>
            </div>

            {/* Loss Chart */}
            <RetroPanel title="Training Loss" borderColor="border-[#382219]">
              <LossChart lossHistory={ovLossHistory} />
            </RetroPanel>

          </div>
        </div>
      </main>
    );
  }

  // ── Shared Playground UI ──────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#1e140e] text-[#fefae0] p-4 md:p-8 font-vt323 selection:bg-[#dda15e] selection:text-[#1e140e]">
      {/* -- Header & Module Tabs -- */}
      <header className="max-w-7xl mx-auto mb-6 bg-[#281b12] border-4 border-[#382219] p-4 sm:p-5 shadow-[6px_6px_0px_0px_#0f0a07] rounded-none">
        {/* Tier 1: Context Badges & Navigation Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b-2 border-[#382219]">
          {/* Left Context: Module Label & Active Mode Switcher */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="bg-[#bc4749] text-[#fefae0] font-pixel text-[10px] uppercase px-2.5 py-1 border border-[#6b2123] font-bold shadow-[2px_2px_0px_#0f0a07]">
              Module 03
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
            ) : appMode === "project" ? (
              <button
                onClick={() => setAppMode("select")}
                className="text-[#bc4749] hover:text-[#dda15e] font-pixel text-[10px] border border-[#6b2123] px-2.5 py-1 transition-colors cursor-pointer"
              >
                PROJECT ↺
              </button>
            ) : (
              <button
                onClick={() => setAppMode("select")}
                className="text-[#a3b18a] hover:text-[#dda15e] font-pixel text-[10px] border border-[#382219] px-2.5 py-1 transition-colors cursor-pointer"
              >
                SANDBOX ↺
              </button>
            )}

            {/* Mode selector quick tabs */}
            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={enterSandboxMode}
                className={`px-2 py-1 font-pixel text-[9px] uppercase border ${
                  appMode === "sandbox" ? "bg-[#382219] text-[#dda15e] border-[#dda15e]" : "text-[#a3b18a] border-[#382219]"
                }`}
              >
                🔬 Sandbox
              </button>
              <button
                onClick={enterStoryMode}
                className={`px-2 py-1 font-pixel text-[9px] uppercase border ${
                  appMode === "story" ? "bg-[#1b2a22] text-[#7ecb8a] border-[#386641]" : "text-[#a3b18a] border-[#382219]"
                }`}
              >
                📖 Story
              </button>
              <button
                onClick={enterChallengeMode}
                className={`px-2 py-1 font-pixel text-[9px] uppercase border ${
                  appMode === "challenge" ? "bg-[#351515] text-[#ff6b6b] border-[#bc4749]" : "text-[#a3b18a] border-[#382219]"
                }`}
              >
                🏆 Challenge
              </button>
              <button
                onClick={() => setAppMode("project")}
                className={`px-2 py-1 font-pixel text-[9px] uppercase border ${
                  appMode === "project" ? "bg-[#386641] text-[#fefae0] border-[#7ecb8a]" : "text-[#7ecb8a] border-[#386641]"
                }`}
              >
                🛠️ Applied Project
              </button>
            </div>
          </div>

          {/* Right Navigation: Module Tabs & Profile */}
          <nav className="flex items-center gap-2 flex-wrap">
            <Link href="/"
              className="px-3 py-1.5 bg-[#1e140e] hover:bg-[#281b12] text-[#5c3d2e] hover:text-[#a3b18a] font-pixel text-[10px] uppercase border-2 border-[#2e1e14] shadow-[2px_2px_0px_0px_#0f0a07] transition-colors">
              ← Dashboard
            </Link>
            <Link href="/playground/perceptron"
              className="px-3 py-1.5 bg-[#3e271c] hover:bg-[#5c3d2e] text-[#a3b18a] font-pixel text-[10px] uppercase border-2 border-[#1e140e] shadow-[2px_2px_0px_0px_#0f0a07] transition-colors">
              01. Perceptron
            </Link>
            <Link href="/playground/gradient-descent"
              className="px-3 py-1.5 bg-[#3e271c] hover:bg-[#5c3d2e] text-[#a3b18a] font-pixel text-[10px] uppercase border-2 border-[#1e140e] shadow-[2px_2px_0px_0px_#0f0a07] transition-colors">
              02. Gradient Descent
            </Link>
            <Link href="/playground/neural-net"
              className="px-3 py-1.5 bg-[#bc4749] text-[#fefae0] font-pixel text-[10px] uppercase border-2 border-[#6b2123] shadow-[2px_2px_0px_0px_#0f0a07] font-bold">
              03. Neural Net
            </Link>
            <HeaderAuthButton />
          </nav>
        </div>

        {/* Tier 2: Main Title & Subtitle Banner */}
        <div className="pt-3">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-pixel text-[#dda15e] tracking-wider uppercase leading-tight">
            Neural Net Visualizer
          </h1>
          <p className="text-[#a3b18a] text-base sm:text-lg mt-1 font-vt323 tracking-wide">
            Backprop • Hidden Layers • Non-Linear Decision Boundaries • TensorFlow.js
          </p>
        </div>
      </header>
      {/* Applied Project View OR Interactive Canvas Grid */}
      {appMode === "project" ? (
        <div className="max-w-7xl mx-auto">
          <NeuralDigitProject />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Canvas + Node Diagram + Math Formula Panel */}
          <div id="story-nn-canvas" className="lg:col-span-7 flex flex-col items-center lg:items-start w-full">
            <NeuralNetCanvas
              points={points}
              predictionGrid={predGrid}
              gridRes={GRID_RES}
              layerWeights={layerWeights}
              onAddPoint={handleAddPoint}
              width={560}
              height={560}
            />
            {/* Math Formula Panel below Canvas */}
            <MathFormulaPanel type="neural-net" />
          </div>

        {/* Right: Controls + Chart + Readout */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">

          {/* Challenge Card (only in challenge mode) */}
          {appMode === "challenge" && (
            <ChallengeCard
              challenge={neuralNetChallenge}
              metrics={{
                stepCount,
                nnLoss: currentLoss,
                nnAccuracy,
                hiddenSize: architecture.hiddenSize,
                numHiddenLayers: architecture.numHiddenLayers,
              }}
              isWon={challenge.isWon}
            />
          )}

          {/* Status bar */}
          <div className="bg-[#281b12] border-4 border-[#382219] px-4 py-2 shadow-[4px_4px_0px_0px_#0f0a07] text-[#a3b18a] text-lg font-vt323 flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 border border-[#1e140e] ${tfReady ? "bg-[#a3b18a]" : "bg-[#bc4749]"} animate-pulse`} />
            {statusMsg}
          </div>

          {/* Architecture Controls */}
          <div id="story-nn-arch-panel">
            <RetroPanel title="Network Architecture" borderColor="border-[#382219]">
              <div className="flex flex-col gap-4">
                {/* Hidden nodes */}
                <div id="story-nn-nodes-panel">
                  <span className="font-pixel text-[10px] text-[#a3b18a] block mb-2 uppercase">
                    Nodes per Hidden Layer:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {[2, 4, 8, 16].map((n) => (
                      <button key={n}
                        onClick={() => handleArchChange({ hiddenSize: n })}
                        className={`font-pixel text-[10px] uppercase py-2 border-2 transition-all ${
                          architecture.hiddenSize === n
                            ? "bg-[#dda15e] text-[#1e140e] border-[#7a5225] shadow-[2px_2px_0px_0px_#0f0a07]"
                            : "bg-[#1e140e] text-[#a3b18a] border-[#382219] hover:bg-[#281b12]"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Num hidden layers */}
                <div>
                  <span className="font-pixel text-[10px] text-[#a3b18a] block mb-2 uppercase">
                    Hidden Layers:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {([1, 2] as const).map((n) => (
                      <button key={n}
                        onClick={() => handleArchChange({ numHiddenLayers: n })}
                        className={`font-pixel text-[10px] uppercase py-2 border-2 transition-all ${
                          architecture.numHiddenLayers === n
                            ? "bg-[#dda15e] text-[#1e140e] border-[#7a5225] shadow-[2px_2px_0px_0px_#0f0a07]"
                            : "bg-[#1e140e] text-[#a3b18a] border-[#382219] hover:bg-[#281b12]"
                        }`}
                      >
                        {n} Layer{n > 1 ? "s" : ""}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Learning rate */}
                <RetroSlider
                  label="Learning Rate (η)"
                  min={0.01}
                  max={1.0}
                  step={0.01}
                  value={learningRate}
                  onChange={handleLRChange}
                  displayValue={learningRate.toFixed(2)}
                />

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <RetroButton variant="primary" onClick={doTrainStep} disabled={!tfReady || points.length === 0}>
                    Train Step
                  </RetroButton>
                  <RetroButton
                    variant={isTraining ? "danger" : "accent"}
                    onClick={() => setIsTraining((p) => !p)}
                    disabled={!tfReady || points.length === 0}
                  >
                    {isTraining ? "Stop Auto" : "Train Auto"}
                  </RetroButton>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <RetroButton variant="secondary" onClick={buildNewModel} disabled={!tfReady}>
                    Reset Model
                  </RetroButton>
                  <RetroButton variant="secondary" onClick={handleClear}>
                    Clear Canvas
                  </RetroButton>
                </div>

                <div className="pt-3 border-t-2 border-[#382219]">
                  <span className="font-pixel text-[10px] text-[#a3b18a] block mb-2 uppercase">Presets</span>
                  <div id="story-nn-xor-btn">
                    <RetroButton variant="secondary" className="w-full" onClick={handleLoadPreset}>
                      Load XOR Pattern
                    </RetroButton>
                  </div>
                </div>
              </div>
            </RetroPanel>
          </div>

          {/* Loss Chart */}
          <RetroPanel title="Loss Convergence Chart" borderColor="border-[#382219]">
            <LossChart lossHistory={lossHistory} />
          </RetroPanel>

          {/* Live Readout */}
          <RetroPanel title="Training Readout" borderColor="border-[#b37d36]">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#1e140e] p-2 border-2 border-[#382219]">
                  <span className="text-[#a3b18a] block font-pixel text-[9px]">POINTS</span>
                  <span className="text-[#fefae0] font-vt323 text-2xl">{points.length}</span>
                </div>
                <div className="bg-[#1e140e] p-2 border-2 border-[#382219]">
                  <span className="text-[#a3b18a] block font-pixel text-[9px]">STEPS</span>
                  <span className="text-[#dda15e] font-vt323 text-2xl">{stepCount}</span>
                </div>
                <div className="bg-[#1e140e] p-2 border-2 border-[#382219]">
                  <span className="text-[#a3b18a] block font-pixel text-[9px]">LOSS</span>
                  <span
                    className={`font-vt323 text-2xl ${
                      currentLoss === null ? "text-[#a3b18a]" :
                      currentLoss < 0.1 ? "text-[#a3b18a]" :
                      currentLoss < 0.4 ? "text-[#dda15e]" : "text-[#bc4749]"
                    }`}
                  >
                    {currentLoss !== null ? currentLoss.toFixed(4) : "—"}
                  </span>
                </div>
              </div>

              <div className="bg-[#1e140e] p-2.5 border-2 border-[#382219] text-lg leading-relaxed">
                <p className="font-pixel text-[9px] text-[#dda15e] uppercase mb-1">Architecture:</p>
                <code className="font-vt323 text-xl text-[#fefae0]">
                  2 → {architecture.hiddenSize}{architecture.numHiddenLayers === 2 ? ` → ${architecture.hiddenSize}` : ""} → 1 (sigmoid)
                </code>
              </div>
            </div>
          </RetroPanel>

          {/* Concept note */}
          <div className="bg-[#281b12] border-4 border-[#382219] p-3 shadow-[4px_4px_0px_0px_#0f0a07] text-lg text-[#a3b18a] leading-relaxed">
            <p className="text-[#dda15e] font-pixel text-[9px] uppercase mb-1">💡 Why Hidden Layers?</p>
            <p>
              A single-layer perceptron can only draw a <em>straight line</em>. With hidden layers and ReLU activations,
              the network learns <em>curved, non-linear</em> decision regions — enabling it to solve problems like XOR that
              are impossible for a linear classifier.
            </p>
          </div>
        </div>
      </div>
    )}

      {/* Story Mode Dialogue Overlay */}
      {appMode === "story" && story.currentStep && (
        <NPCDialogueBox
          step={story.currentStep}
          script={neuralNetWalkthrough}
          stepIndex={story.state.currentStepIndex}
          totalSteps={neuralNetWalkthrough.steps.length}
          actionCount={story.state.actionCount}
          onNext={() => {
            if (story.state.currentStepIndex === neuralNetWalkthrough.steps.length - 1) {
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
          challenge={neuralNetChallenge}
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
