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
  const initializedRef = useRef<string | null>(null);

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

  // Initialize profile & fetch database summary on load
  const refreshProgress = useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      if (isSignedIn && user?.id) {
        if (initializedRef.current !== user.id) {
          initializedRef.current = user.id;
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
    } catch (e) {
      console.warn("Error fetching user progress:", e);
      setSummary((prev) => ({
        ...prev,
        isSyncError: true,
        errorMessage: "Unable to sync your progress. Please check your connection.",
      }));
    } finally {
      setLoading(false);
    }
  }, [userId, isLoaded, isSignedIn, user]);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  // Record activity directly to Supabase
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
      try {
        const result = await recordLearningActivity({
          userId,
          ...params,
        });
        setSummary(result);
      } catch (err) {
        console.error("Failed to record learning activity in Supabase:", err);
      }
    },
    [userId]
  );

  const recordStoryCompletion = useCallback(
    (moduleName: string) => {
      return recordActivity({
        moduleName,
        mode: "Story",
        xpEarned: XP_RATES.STORY_MODE,
        durationMinutes: 5,
      });
    },
    [recordActivity]
  );

  const recordSandboxActivity = useCallback(
    (moduleName: string, durationMinutes = 5) => {
      return recordActivity({
        moduleName,
        mode: "Sandbox",
        xpEarned: XP_RATES.SANDBOX_MODE,
        durationMinutes,
      });
    },
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
