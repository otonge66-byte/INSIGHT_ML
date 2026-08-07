"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ChallengeDefinition, ChallengeMetrics } from "./types";
import { saveChallengeProgress, getSavedChallengeProgress, SavedChallengeProgress } from "./storage";
import { recordLearningActivity } from "@/lib/progress/progressService";
import { XP_RATES } from "@/lib/progress/types";
import { useUser } from "@clerk/nextjs";

export type ChallengeStatus = "idle" | "running" | "requirements_met" | "verifying" | "completed" | "saved";

export interface UseChallengeReturn {
  status: ChallengeStatus;
  isWon: boolean;
  stars: 1 | 2 | 3;
  showModal: boolean;
  lastMetrics: ChallengeMetrics;
  savedProgress: SavedChallengeProgress | null;
  update: (metrics: ChallengeMetrics) => void;
  dismissModal: () => void;
  reset: () => void;
  completeAndSave: (metrics: ChallengeMetrics) => void;
}

function areMetricsEqual(a: ChallengeMetrics, b: ChallengeMetrics): boolean {
  return (
    a.stepCount === b.stepCount &&
    a.accuracy === b.accuracy &&
    a.currentLoss === b.currentLoss &&
    a.nnLoss === b.nnLoss &&
    a.nnAccuracy === b.nnAccuracy &&
    a.hiddenSize === b.hiddenSize &&
    a.numHiddenLayers === b.numHiddenLayers
  );
}
export function useChallengeMode(challenge: ChallengeDefinition): UseChallengeReturn {
  const { user } = useUser();
  const userId = user?.id;

  const [status, setStatus] = useState<ChallengeStatus>("idle");
  const [isWon, setIsWon] = useState(false);
  const [stars, setStars] = useState<1 | 2 | 3>(1);
  const [showModal, setShowModal] = useState(false);
  const [lastMetrics, setLastMetrics] = useState<ChallengeMetrics>({ stepCount: 0 });
  const [savedProgress, setSavedProgress] = useState<SavedChallengeProgress | null>(null);

  // Single-execution lock preventing duplicate triggers
  const challengeCompletedRef = useRef(false);
  const challengeRef = useRef(challenge);
  const lastMetricsRef = useRef<ChallengeMetrics>({ stepCount: 0 });

  useEffect(() => {
    challengeRef.current = challenge;
  }, [challenge]);

  // Load existing saved progress on mount
  useEffect(() => {
    const saved = getSavedChallengeProgress(challenge.id);
    if (saved) {
      setSavedProgress(saved);
      if (saved.isCompleted) {
        console.log(`ℹ️ [useChallengeMode] Challenge "${challenge.id}" has prior saved progress:`, saved);
        setIsWon(true);
        setStars(saved.stars);
        setStatus("saved");
      }
    }
  }, [challenge.id]);

  const completeAndSave = useCallback((metrics: ChallengeMetrics) => {
    if (challengeCompletedRef.current) {
      console.log("⚠️ [completeAndSave] Already completed once; ignoring duplicate trigger.");
      return;
    }
    challengeCompletedRef.current = true;

    console.log("🎉 [Challenge Passed!] Executing completeAndSave", {
      challengeId: challengeRef.current.id,
      metrics,
    });

    setStatus("requirements_met");

    const computedStars = challengeRef.current.getStars(metrics);
    console.log("⭐ [Stars Awarded]", computedStars);

    setIsWon(true);
    setStars(computedStars);
    setLastMetrics(metrics);
    setStatus("completed");

    // Save challenge progress state
    const saved = saveChallengeProgress(challengeRef.current.id, computedStars, metrics, 100);
    if (saved) {
      setSavedProgress(saved);
      setStatus("saved");
    }

    // Automatically trigger Supabase / Progress update if signed in
    if (userId) {
      try {
        const xp = computedStars === 3 ? XP_RATES.PERFECT_CHALLENGE : XP_RATES.CHALLENGE;
        recordLearningActivity({
          userId: userId,
          moduleName: challengeRef.current.id,
          mode: "Challenge",
          xpEarned: xp,
          completedChallengeId: challengeRef.current.id,
          durationMinutes: 3,
        });
      } catch (e) {
        console.warn("Auto-progress recording notice:", e);
      }
    }
 
    console.log("Opening Popup");
    setShowModal(true);
  }, [userId]);

  const update = useCallback(
    (metrics: ChallengeMetrics) => {
      console.log("Metrics Updated", metrics);

      const metricsChanged = !areMetricsEqual(lastMetricsRef.current, metrics);

      if (metricsChanged) {
        lastMetricsRef.current = metrics;
        setLastMetrics(metrics);
      }

      if (status === "idle" && metrics.stepCount > 0) {
        setStatus("running");
      }

      console.log("Checking Challenge", {
        challengeId: challengeRef.current.id,
        completedRef: challengeCompletedRef.current,
        metrics,
      });

      // Always check win condition if not already completed
      if (!challengeCompletedRef.current) {
        const isWin = challengeRef.current.checkWin(metrics);
        console.log("Challenge Check Result:", isWin);

        if (isWin) {
          console.log("Challenge Passed");
          completeAndSave(metrics);
        }
      }
    },
    [completeAndSave, status]
  );

  const dismissModal = useCallback(() => {
    console.log("Dismissing modal");
    setShowModal(false);
  }, []);

  const reset = useCallback(() => {
    console.log(`↺ [useChallengeMode] Resetting challenge state for "${challengeRef.current.id}".`);
    challengeCompletedRef.current = false;
    setIsWon(false);
    setStars(1);
    setShowModal(false);
    setStatus("idle");
    const emptyMetrics: ChallengeMetrics = { stepCount: 0 };
    lastMetricsRef.current = emptyMetrics;
    setLastMetrics(emptyMetrics);
  }, []);

  return {
    status,
    isWon,
    stars,
    showModal,
    lastMetrics,
    savedProgress,
    update,
    dismissModal,
    reset,
    completeAndSave,
  };
}
