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
import { NPCDialogueBox } from "@/components/story/NPCDialogueBox";
import { ChallengeCard } from "@/components/challenge/ChallengeCard";
import { ChallengeResultModal } from "@/components/challenge/ChallengeResultModal";
import { useStoryMode } from "@/lib/story/useStoryMode";
import { useChallengeMode } from "@/lib/challenge/useChallengeMode";
import { neuralNetWalkthrough } from "@/lib/story/walkthroughs/neuralNet";
import { neuralNetChallenge } from "@/lib/challenge/challenges";
import { NNDataPoint, LayerWeightInfo, NetworkArchitecture } from "@/modules/neural-net/types";
import type { TFType, TFModel } from "@/lib/ml/neural-net";

import { BackButton } from "@/components/ui/BackButton";

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

const OVERFIT_TRAIN: NNDataPoint[] = [
  { id: "t1",  x: -0.70, y:  0.65, label: 0 },
  { id: "t2",  x: -0.55, y:  0.80, label: 0 },
  { id: "t3",  x: -0.80, y:  0.40, label: 0 },
  { id: "t4",  x: -0.45, y:  0.55, label: 0 },
  { id: "t5",  x: -0.60, y:  0.30, label: 0 },
  { id: "t6",  x: -0.30, y:  0.70, label: 0 },
  { id: "t7",  x: -0.75, y:  0.15, label: 0 },
  { id: "t8",  x:  0.65, y: -0.70, label: 1 },
  { id: "t9",  x:  0.80, y: -0.55, label: 1 },
  { id: "t10", x:  0.40, y: -0.80, label: 1 },
  { id: "t11", x:  0.55, y: -0.45, label: 1 },
  { id: "t12", x:  0.30, y: -0.60, label: 1 },
  { id: "t13", x:  0.70, y: -0.30, label: 1 },
  { id: "t14", x:  0.15, y: -0.75, label: 1 },
  { id: "t15", x:  0.25, y:  0.55, label: 1 },
  { id: "t16", x: -0.20, y: -0.50, label: 0 },
  { id: "t17", x:  0.05, y:  0.30, label: 1 },
  { id: "t18", x: -0.10, y: -0.35, label: 0 },
  { id: "t19", x:  0.45, y:  0.10, label: 1 },
  { id: "t20", x: -0.40, y: -0.15, label: 0 },
];

const OVERFIT_TEST: NNDataPoint[] = [
  { id: "e1",  x: -0.85, y:  0.70, label: 0 },
  { id: "e2",  x: -0.50, y:  0.90, label: 0 },
  { id: "e3",  x: -0.65, y:  0.50, label: 0 },
  { id: "e4",  x: -0.40, y:  0.25, label: 0 },
  { id: "e5",  x:  0.85, y: -0.65, label: 1 },
  { id: "e6",  x:  0.60, y: -0.85, label: 1 },
  { id: "e7",  x:  0.50, y: -0.50, label: 1 },
  { id: "e8",  x:  0.20, y:  0.45, label: 0 },
  { id: "e9",  x: -0.15, y: -0.40, label: 1 },
  { id: "e10", x:  0.10, y:  0.10, label: 0 },
];

type AppMode = "select" | "story" | "sandbox" | "challenge" | "overfitting";

export default function NeuralNetPlayground() {
  const router = useRouter();
  const [appMode, setAppMode] = useState<AppMode>("select");

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

  // Overfitting Demo state
  const [ovNodes, setOvNodes] = useState(4);
  const [ovPredGrid, setOvPredGrid] = useState<Float32Array | null>(null);
  const [ovStepCount, setOvStepCount] = useState(0);
  const [ovIsTraining, setOvIsTraining] = useState(false);
  const [ovLossHistory, setOvLossHistory] = useState<number[]>([]);
  const ovModelRef = useRef<TFModel | null>(null);
  const ovIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const tfRef = useRef<TFType | null>(null);
  const modelRef = useRef<TFModel | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTrainingRef = useRef(false);

  const story = useStoryMode();
  const challenge = useChallengeMode(neuralNetChallenge);

  useEffect(() => { isTrainingRef.current = isTraining; }, [isTraining]);

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

  const buildNewModel = useCallback(() => {
    const tf = tfRef.current;
    if (!tf) return;
    if (modelRef.current) {
      modelRef.current.dispose();
      modelRef.current = null;
    }
    const { buildModel } = require("@/lib/ml/neural-net");
    const m = buildModel(tf, architecture, learningRate);
    modelRef.current = m;
    setLayerWeights([]);
    setPredGrid(null);
    setLossHistory([]);
    setStepCount(0);
    setIsTraining(false);
  }, [architecture, learningRate]);

  useEffect(() => {
    if (tfReady) buildNewModel();
  }, [tfReady, buildNewModel]);

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

  const handleArchChange = (newArch: Partial<NetworkArchitecture>) => {
    setIsTraining(false);
    setArchitecture((prev) => {
      const next = { ...prev, ...newArch };
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

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      modelRef.current?.dispose();
      if (ovIntervalRef.current) clearInterval(ovIntervalRef.current);
      ovModelRef.current?.dispose();
    };
  }, []);

  const buildOvModel = useCallback((nodes: number) => {
    const tf = tfRef.current;
    if (!tf) return;
    if (ovModelRef.current) { ovModelRef.current.dispose(); ovModelRef.current = null; }
    const { buildModel } = require("@/lib/ml/neural-net");
    ovModelRef.current = buildModel(tf, { hiddenSize: nodes, numHiddenLayers: 2 }, 0.05);
    setOvPredGrid(null);
    setOvStepCount(0);
    setOvLossHistory([]);
    setOvIsTraining(false);
  }, []);

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

  useEffect(() => {
    if (ovIsTraining) {
      ovIntervalRef.current = setInterval(() => { doOvTrainStep(); }, 150);
    } else {
      if (ovIntervalRef.current) clearInterval(ovIntervalRef.current);
    }
    return () => { if (ovIntervalRef.current) clearInterval(ovIntervalRef.current); };
  }, [ovIsTraining, doOvTrainStep]);

  const handleOvNodeChange = (n: number) => {
    setOvIsTraining(false);
    setOvNodes(n);
    setTimeout(() => buildOvModel(n), 50);
  };

  const enterOverfittingMode = () => {
    setAppMode("overfitting");
    setTimeout(() => buildOvModel(ovNodes), 100);
  };

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
    setIsTraining(false);
    setPoints(PRESET_POINTS);
    setArchitecture({ hiddenSize: 2, numHiddenLayers: 1 });
    setLossHistory([]);
    setPredGrid(null);
    setStepCount(0);
    setStatusMsg("Challenge: Solve XOR with 2 nodes. Train away!");
    setTimeout(() => {
      if (!tfRef.current) return;
      if (modelRef.current) modelRef.current.dispose();
      const { buildModel } = require("@/lib/ml/neural-net");
      modelRef.current = buildModel(tfRef.current, { hiddenSize: 2, numHiddenLayers: 1 }, 0.1);
      setLayerWeights([]);
    }, 0);
  };

  useEffect(() => {
    if (appMode === "story" && !story.state.isActive) {
      setAppMode("sandbox");
    }
  }, [appMode, story.state.isActive]);

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
  }, [appMode, stepCount, nnAccuracy, challenge, lossHistory, architecture]);

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
            className="px-3 py-1.5 bg-[#22302B] hover:bg-[#2C3C35] text-[#C9D7CF] font-pixel text-[10px] uppercase border border-[#4E665B] rounded-xl transition-colors">
            02. Gradient Descent
          </Link>
          <Link href="/playground/neural-net"
            className="px-3 py-1.5 bg-[#2C3C35] text-[#6FCF97] font-pixel text-[10px] uppercase border border-[#4E665B] rounded-xl">
            03. Neural Net
          </Link>
        </nav>

        <div className="max-w-3xl w-full text-center flex flex-col items-center gap-8">
          <div>
            <span className="bg-[#2C3C35] text-[#6FCF97] font-pixel text-[10px] uppercase px-3 py-1 rounded-full border border-[#4E665B] font-bold inline-block mb-4">
              Module 03
            </span>
            <h1 className="text-2xl sm:text-3xl font-pixel text-[#EAF4EE] uppercase tracking-wider mb-2">
              Neural Net Visualizer
            </h1>
            <p className="text-[#8DA397] text-sm font-sans">Choose your learning mode:</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full font-sans">
            <button
              onClick={enterStoryMode}
              className="group bg-[#2C3C35] hover:bg-[#33463E] border border-[#4E665B] rounded-2xl p-5 text-left flex flex-col gap-3 shadow-sm hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200"
            >
              <div className="text-3xl">📖</div>
              <div>
                <h2 className="font-pixel text-xs text-[#EAF4EE] uppercase mb-1.5">Story Mode</h2>
                <p className="text-[#C9D7CF] text-xs leading-relaxed">
                  Guided walkthrough with BYTE. Discover why XOR needs hidden layers.
                </p>
              </div>
              <span className="font-pixel text-[9px] text-[#6FCF97] border border-[#4E665B] bg-[#22302B] px-2 py-1 rounded-lg self-start mt-auto">
                ▶ START TUTORIAL
              </span>
            </button>

            <button
              onClick={enterChallengeMode}
              className="group bg-[#2C3C35] hover:bg-[#33463E] border border-[#4E665B] rounded-2xl p-5 text-left flex flex-col gap-3 shadow-sm hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200"
            >
              <div className="text-3xl">🏆</div>
              <div>
                <h2 className="font-pixel text-xs text-[#EAF4EE] uppercase mb-1.5">Challenge Mode</h2>
                <p className="text-[#C9D7CF] text-xs leading-relaxed">
                  &quot;{neuralNetChallenge.title}&quot; — {neuralNetChallenge.goalSummary}
                </p>
              </div>
              <span className="font-pixel text-[9px] text-[#E9C46A] border border-[#4E665B] bg-[#22302B] px-2 py-1 rounded-lg self-start mt-auto">
                ▶ START CHALLENGE
              </span>
            </button>

            <button
              onClick={enterSandboxMode}
              className="group bg-[#2C3C35] hover:bg-[#33463E] border border-[#4E665B] rounded-2xl p-5 text-left flex flex-col gap-3 shadow-sm hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200"
            >
              <div className="text-3xl">🔬</div>
              <div>
                <h2 className="font-pixel text-xs text-[#EAF4EE] uppercase mb-1.5">Sandbox Mode</h2>
                <p className="text-[#C9D7CF] text-xs leading-relaxed">
                  Adjust layers, nodes, and learning rate freely.
                </p>
              </div>
              <span className="font-pixel text-[9px] text-[#8DA397] border border-[#4E665B] bg-[#22302B] px-2 py-1 rounded-lg self-start mt-auto">
                ▶ FREE EXPLORE
              </span>
            </button>

            <button
              onClick={enterOverfittingMode}
              className="group bg-[#2C3C35] hover:bg-[#33463E] border border-[#4E665B] rounded-2xl p-5 text-left flex flex-col gap-3 shadow-sm hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200"
            >
              <div className="text-3xl">📊</div>
              <div>
                <h2 className="font-pixel text-xs text-[#EAF4EE] uppercase mb-1.5">Overfitting Demo</h2>
                <p className="text-[#C9D7CF] text-xs leading-relaxed">
                  Watch a model memorise noise vs generalization.
                </p>
              </div>
              <span className="font-pixel text-[9px] text-[#D96C6C] border border-[#4E665B] bg-[#22302B] px-2 py-1 rounded-lg self-start mt-auto">
                ▶ OVERFITTING DEMO
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

    return (
      <main className="min-h-screen bg-[#182320] text-[#C9D7CF] p-4 md:p-8 font-sans selection:bg-[#6FCF97] selection:text-[#182320]">
        <header className="max-w-7xl mx-auto mb-6 bg-[#22302B] border border-[#4E665B] p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-[#2C3C35] text-[#D96C6C] font-pixel text-[10px] uppercase px-2.5 py-1 rounded-lg border border-[#4E665B]">
                Module 03
              </span>
              <h1 className="text-lg md:text-xl font-pixel text-[#EAF4EE] tracking-wide uppercase">
                Overfitting Demo
              </h1>
              <button
                onClick={() => { setOvIsTraining(false); setAppMode("select"); }}
                className="bg-[#2C3C35] text-[#D96C6C] hover:bg-[#33463E] font-pixel text-[10px] border border-[#4E665B] px-2.5 py-1 rounded-lg transition-colors"
              >
                DEMO ↺
              </button>
            </div>
            <p className="text-[#8DA397] text-xs mt-1 font-sans">
              Training Set (●) vs Test Set (◯) • Watch accuracy diverge as model complexity grows
            </p>
          </div>
          <nav className="flex items-center gap-2 font-sans">
            <Link href="/"
              className="px-3 py-1.5 bg-[#22302B] hover:bg-[#2C3C35] text-[#C9D7CF] font-pixel text-[10px] uppercase border border-[#4E665B] rounded-xl transition-colors">
              ← Dashboard
            </Link>
            <Link href="/playground/perceptron"
              className="px-3 py-1.5 bg-[#22302B] hover:bg-[#2C3C35] text-[#C9D7CF] font-pixel text-[10px] uppercase border border-[#4E665B] rounded-xl transition-colors">
              01. Perceptron
            </Link>
            <Link href="/playground/gradient-descent"
              className="px-3 py-1.5 bg-[#22302B] hover:bg-[#2C3C35] text-[#C9D7CF] font-pixel text-[10px] uppercase border border-[#4E665B] rounded-xl transition-colors">
              02. Gradient
            </Link>
            <Link href="/playground/neural-net"
              className="px-3 py-1.5 bg-[#2C3C35] text-[#6FCF97] font-pixel text-[10px] uppercase border border-[#4E665B] rounded-xl">
              03. Neural Net
            </Link>
          </nav>
        </header>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative inline-block">
              <NeuralNetCanvas
                points={OVERFIT_TRAIN}
                predictionGrid={ovPredGrid}
                gridRes={GRID_RES}
                layerWeights={[]}
                onAddPoint={() => {}}
                width={560}
                height={560}
              />
              <svg
                className="absolute top-0 left-0 pointer-events-none"
                width={560}
                height={560}
                style={{ imageRendering: "pixelated" }}
              >
                {OVERFIT_TEST.map((p) => {
                  const cx = ((p.x + 1) / 2) * 560;
                  const cy = ((1 - p.y) / 2) * 560;
                  const strokeColor = p.label === 1 ? "#D96C6C" : "#6FCF97";
                  return (
                    <g key={p.id}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={9}
                        fill="#182320"
                        stroke={strokeColor}
                        strokeWidth={2.5}
                      />
                      <text
                        x={cx}
                        y={cy + 1}
                        fill={strokeColor}
                        fontSize="12"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {p.label === 1 ? "+" : "−"}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="flex items-center gap-6 text-xs font-sans text-[#8DA397]">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-[#D96C6C]" />
                <span>Train Class 1 (●)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-[#6FCF97]" />
                <span>Train Class 0 (●)</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" fill="none" stroke="#E9C46A" strokeWidth="2"/></svg>
                <span>Test pts (◯)</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="bg-[#2C3C35] border border-[#4E665B] p-4 rounded-2xl shadow-sm">
              <p className="font-pixel text-[9px] text-[#8DA397] uppercase mb-3 tracking-wider">Live Accuracy Comparison</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#182320] border border-[#4E665B] p-3 rounded-xl text-center">
                  <p className="font-pixel text-[8px] text-[#6FCF97] uppercase mb-1">Training Acc</p>
                  <p className="font-mono text-2xl font-bold text-[#6FCF97]">
                    {ovPredGrid === null ? "—" : `${ovTrainAcc}%`}
                  </p>
                </div>

                <div className="bg-[#182320] border border-[#4E665B] p-3 rounded-xl text-center">
                  <p className="font-pixel text-[8px] text-[#D96C6C] uppercase mb-1">Test Acc</p>
                  <p className="font-mono text-2xl font-bold text-[#D96C6C]">
                    {ovPredGrid === null ? "—" : `${ovTestAcc}%`}
                  </p>
                </div>
              </div>

              {ovPredGrid && (
                <div className="mt-3 flex items-center justify-between border-t border-[#4E665B]/60 pt-2 font-sans text-xs">
                  <span className="text-[#8DA397]">Train/Test Gap</span>
                  <span className="font-mono font-bold text-[#E9C46A]">
                    {ovGap >= 0 ? "+" : ""}{ovGap}%
                  </span>
                </div>
              )}
            </div>

            {showByteAlert && (
              <div className="bg-[#22302B] border border-[#D96C6C]/60 p-4 rounded-2xl shadow-sm">
                <div className="flex items-start gap-3 font-sans">
                  <div className="flex-shrink-0 text-2xl">🤖</div>
                  <div>
                    <p className="font-pixel text-[9px] text-[#D96C6C] uppercase mb-1">BYTE says — Overfitting Detected!</p>
                    <p className="text-[#EAF4EE] text-xs leading-relaxed">
                      Training accuracy is high but test accuracy isn&apos;t improving — this is <span className="text-[#D96C6C]">overfitting</span>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <RetroPanel title="Hidden Nodes per Layer" borderColor="border-[#4E665B]">
              <div className="flex flex-col gap-3">
                <p className="text-[#8DA397] text-xs leading-relaxed font-sans">
                  More nodes → more capacity → easier to memorise noise. Try 2 vs 16.
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 4, 8, 16].map((n) => (
                    <button key={n}
                      onClick={() => handleOvNodeChange(n)}
                      className={`font-pixel text-[10px] uppercase py-2 rounded-xl border transition-all ${
                        ovNodes === n
                          ? "bg-[#2C3C35] text-[#6FCF97] border-[#6FCF97]"
                          : "bg-[#182320] text-[#8DA397] border-[#4E665B] hover:bg-[#2C3C35]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </RetroPanel>

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

            <RetroPanel title="Training Loss" borderColor="border-[#4E665B]">
              <LossChart lossHistory={ovLossHistory} />
            </RetroPanel>
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
                Module 03
              </span>
              <h1 className="text-lg md:text-xl font-pixel text-[#EAF4EE] tracking-wide uppercase">
                Neural Forest
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
              Backprop • Hidden Layers • Non-Linear Decision Boundaries • TensorFlow.js
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-2 font-sans">
          <Link href="/playground/perceptron"
            className="px-3 py-1.5 bg-[#22302B] hover:bg-[#2C3C35] text-[#C9D7CF] font-pixel text-[10px] uppercase border border-[#4E665B] rounded-xl transition-colors">
            01. Perceptron
          </Link>
          <Link href="/playground/gradient-descent"
            className="px-3 py-1.5 bg-[#22302B] hover:bg-[#2C3C35] text-[#C9D7CF] font-pixel text-[10px] uppercase border border-[#4E665B] rounded-xl transition-colors">
            02. Gradient
          </Link>
          <Link href="/playground/neural-net"
            className="px-3 py-1.5 bg-[#2C3C35] text-[#6FCF97] font-pixel text-[10px] uppercase border border-[#4E665B] rounded-xl">
            03. Neural Net
          </Link>
        </nav>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div id="story-nn-canvas" className="lg:col-span-7 flex flex-col items-center lg:items-start">
          <NeuralNetCanvas
            points={points}
            predictionGrid={predGrid}
            gridRes={GRID_RES}
            layerWeights={layerWeights}
            onAddPoint={handleAddPoint}
            width={560}
            height={560}
          />
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
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

          <div className="bg-[#22302B] border border-[#4E665B] px-4 py-2.5 rounded-xl text-[#8DA397] text-xs font-sans flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${tfReady ? "bg-[#6FCF97]" : "bg-[#D96C6C]"}`} />
            {statusMsg}
          </div>

          <div id="story-nn-arch-panel">
            <RetroPanel title="Network Architecture" borderColor="border-[#4E665B]">
              <div className="flex flex-col gap-4">
                <div id="story-nn-nodes-panel">
                  <span className="font-pixel text-[10px] text-[#8DA397] block mb-2 uppercase">
                    Nodes per Hidden Layer:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {[2, 4, 8, 16].map((n) => (
                      <button key={n}
                        onClick={() => handleArchChange({ hiddenSize: n })}
                        className={`font-pixel text-[10px] uppercase py-2 rounded-xl border transition-all ${
                          architecture.hiddenSize === n
                            ? "bg-[#2C3C35] text-[#6FCF97] border-[#6FCF97]"
                            : "bg-[#182320] text-[#8DA397] border-[#4E665B] hover:bg-[#2C3C35]"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-pixel text-[10px] text-[#8DA397] block mb-2 uppercase">
                    Hidden Layers:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {([1, 2] as const).map((n) => (
                      <button key={n}
                        onClick={() => handleArchChange({ numHiddenLayers: n })}
                        className={`font-pixel text-[10px] uppercase py-2 rounded-xl border transition-all ${
                          architecture.numHiddenLayers === n
                            ? "bg-[#2C3C35] text-[#6FCF97] border-[#6FCF97]"
                            : "bg-[#182320] text-[#8DA397] border-[#4E665B] hover:bg-[#2C3C35]"
                        }`}
                      >
                        {n} Layer{n > 1 ? "s" : ""}
                      </button>
                    ))}
                  </div>
                </div>

                <RetroSlider
                  label="Learning Rate (η)"
                  min={0.01}
                  max={1.0}
                  step={0.01}
                  value={learningRate}
                  onChange={handleLRChange}
                  displayValue={learningRate.toFixed(2)}
                />

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

                <div className="pt-3 border-t border-[#4E665B]">
                  <span className="font-pixel text-[10px] text-[#8DA397] block mb-2 uppercase">Presets</span>
                  <div id="story-nn-xor-btn">
                    <RetroButton variant="secondary" className="w-full text-xs" onClick={handleLoadPreset}>
                      Load XOR Pattern
                    </RetroButton>
                  </div>
                </div>
              </div>
            </RetroPanel>
          </div>

          <RetroPanel title="Loss Convergence Chart" borderColor="border-[#4E665B]">
            <LossChart lossHistory={lossHistory} />
          </RetroPanel>

          <RetroPanel title="Training Readout" borderColor="border-[#4E665B]">
            <div className="space-y-3 font-sans">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#182320] p-2.5 rounded-xl border border-[#4E665B]">
                  <span className="text-[#8DA397] block font-pixel text-[9px]">POINTS</span>
                  <span className="text-[#EAF4EE] font-mono text-base font-bold">{points.length}</span>
                </div>
                <div className="bg-[#182320] p-2.5 rounded-xl border border-[#4E665B]">
                  <span className="text-[#8DA397] block font-pixel text-[9px]">STEPS</span>
                  <span className="text-[#6FCF97] font-mono text-base font-bold">{stepCount}</span>
                </div>
                <div className="bg-[#182320] p-2.5 rounded-xl border border-[#4E665B]">
                  <span className="text-[#8DA397] block font-pixel text-[9px]">LOSS</span>
                  <span className="font-mono text-base font-bold text-[#EAF4EE]">
                    {currentLoss !== null ? currentLoss.toFixed(4) : "—"}
                  </span>
                </div>
              </div>

              <div className="bg-[#182320] p-3 rounded-xl border border-[#4E665B] text-xs">
                <p className="font-pixel text-[9px] text-[#E9C46A] uppercase mb-1">Architecture:</p>
                <code className="font-mono text-xs text-[#EAF4EE]">
                  2 → {architecture.hiddenSize}{architecture.numHiddenLayers === 2 ? ` → ${architecture.hiddenSize}` : ""} → 1 (sigmoid)
                </code>
              </div>
            </div>
          </RetroPanel>

          <div className="bg-[#2C3C35] border border-[#4E665B] p-4 rounded-2xl shadow-sm text-xs text-[#C9D7CF] leading-relaxed font-sans">
            <p className="text-[#E9C46A] font-pixel text-[9px] uppercase mb-1">💡 Why Hidden Layers?</p>
            <p>
              A single-layer perceptron can only draw a <em>straight line</em>. With hidden layers and ReLU activations,
              the network learns <em>curved, non-linear</em> decision regions — enabling it to solve problems like XOR.
            </p>
          </div>
        </div>
      </div>

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
