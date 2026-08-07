"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { ProgressSummary, LearningMode, XP_RATES } from "./types";
import {
  fetchUserProgressSummary,
  recordLearningActivity,
  ensureUserProfileAndProgress,
  createInitialProgress,
} from "./progressService";

export function useLearningProgress() {
  const { user, isLoaded, isSignedIn } = useUser();
  const userId = user?.id || "guest_user";

  // Tracks which userId has been fully initialized this React session.
  // Using a Set allows re-initialization if user switches accounts.
  const initializedRef = useRef<Set<string>>(new Set());

  const [summary, setSummary] = useState<ProgressSummary>(() => ({
    profile: null,
    progress: createInitialProgress(userId),
    sessions: [],
    dailyActivity: {},
    moduleProgress: {},
    achievements: [],
    badges: [],
    totalLearningDays: 0,
    completionPercentage: 0,
    currentRank: "Novice Explorer",
    isSyncError: false,
  }));

  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Initializes user profile in Supabase and loads all progress data.
   * Safe to call on every page load — all DB operations are idempotent.
   */
  const refreshProgress = useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      if (isSignedIn && user?.id) {
        // Run ensureUserProfileAndProgress once per userId per session.
        // This records the daily login activity for streak tracking.
        if (!initializedRef.current.has(user.id)) {
          initializedRef.current.add(user.id);
          await ensureUserProfileAndProgress(user.id, {
            username: user.username || user.firstName || "Learner",
            email: user.primaryEmailAddress?.emailAddress || null,
            avatarUrl: user.imageUrl || null,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
          });
        }
      }

      const data = await fetchUserProgressSummary(userId);
      setSummary(data);
    } catch (e: any) {
      console.error("[ERROR] refreshProgress failed:", e);
      setSummary((prev) => ({
        ...prev,
        isSyncError: true,
        errorMessage: `Sync failed (${e?.code || "NETWORK"}): ${e?.message || "Check your internet connection and Supabase credentials."}`,
      }));
    } finally {
      setLoading(false);
    }
  }, [userId, isLoaded, isSignedIn, user]);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  /** Records any learning activity to Supabase and updates local state. */
  const recordActivity = useCallback(
    async (params: {
      moduleName: string;
      mode: LearningMode;
      xpEarned: number;
      completedChallengeId?: string;
      durationMinutes?: number;
      accuracy?: number;
      loss?: number;
    }) => {
      if (!userId || userId === "guest_user") {
        console.warn("[WARN] recordActivity: user not signed in, skipping.");
        return;
      }
      try {
        const result = await recordLearningActivity({ userId, ...params });
        setSummary(result);
      } catch (err: any) {
        console.error(
          `[ERROR] recordActivity failed: Module: ${params.moduleName} | Mode: ${params.mode} | Code: ${err?.code} | Message: ${err?.message}`
        );
      }
    },
    [userId]
  );

  const recordStoryCompletion = useCallback(
    (moduleName: string) =>
      recordActivity({
        moduleName,
        mode: "Story",
        xpEarned: XP_RATES.STORY_MODE,
        durationMinutes: 5,
      }),
    [recordActivity]
  );

  const recordSandboxActivity = useCallback(
    (moduleName: string, durationMinutes = 5) =>
      recordActivity({
        moduleName,
        mode: "Sandbox",
        xpEarned: XP_RATES.SANDBOX_MODE,
        durationMinutes,
      }),
    [recordActivity]
  );

  const recordChallengeCompletion = useCallback(
    (moduleName: string, challengeId: string, stars: 1 | 2 | 3 = 1, accuracy?: number) => {
      const xp = stars === 3 ? XP_RATES.PERFECT_CHALLENGE : XP_RATES.CHALLENGE;
      return recordActivity({
        moduleName,
        mode: "Challenge",
        xpEarned: xp,
        completedChallengeId: challengeId,
        durationMinutes: 3,
        accuracy,
      });
    },
    [recordActivity]
  );

  return {
    summary,
    loading,
    refreshProgress,
    recordActivity,
    recordStoryCompletion,
    recordSandboxActivity,
    recordChallengeCompletion,
    isSignedIn,
    userId,
    isSyncError: summary.isSyncError,
    errorMessage: summary.errorMessage,
  };
}
