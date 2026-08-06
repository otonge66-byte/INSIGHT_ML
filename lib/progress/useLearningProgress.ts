"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import {
  ProgressSummary,
  LearningMode,
  XP_RATES,
} from "./types";
import {
  fetchUserProgressSummary,
  recordLearningActivity,
  ensureUserProfileAndProgress,
  createInitialProgress,
} from "./progressService";

export function useLearningProgress() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const userId = user?.id || "guest_user";

  const [summary, setSummary] = useState<ProgressSummary>(() => ({
    profile: null,
    progress: createInitialProgress(userId),
    sessions: [],
    dailyActivity: {},
    moduleProgress: {},
    achievements: [],
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
        await ensureUserProfileAndProgress(user.id, {
          username: user.username || user.firstName || "Learner",
          email: user.primaryEmailAddress?.emailAddress || null,
          avatarUrl: user.imageUrl || null,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
        });
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

  // Synchronize Clerk user identity with Firebase Auth on sign-in
  useEffect(() => {
    const syncFirebase = async () => {
      if (isLoaded && isSignedIn && user?.id) {
        try {
          console.log("Clerk User:", user.id);
          console.log("Email:", user.primaryEmailAddress?.emailAddress);

          console.log(`[DEBUG] Requesting Clerk Firebase JWT token for user ${user.id}...`);
          let token: string | null = null;
          try {
            token = await getToken({ template: "integration-firebase" });
          } catch (jwtErr: any) {
            console.warn("[INFO] Clerk JWT template 'integration-firebase' not configured in Clerk Dashboard. Falling back to standard mode.");
          }

          if (token) {
            console.log("[DEBUG] Clerk token retrieved. Initializing Firebase Auth...");
            const { getAuth, signInWithCustomToken } = await import("firebase/auth");
            const { getFirebaseDb } = await import("@/lib/firebase/client");
            const db = getFirebaseDb();
            if (db) {
              const auth = getAuth(db.app);
              console.log("Firebase Auth currentUser before sync:", auth.currentUser);
              const result = await signInWithCustomToken(auth, token);
              console.log("[DEBUG] Firebase Auth successfully signed in using Clerk Custom Token.");
              console.log("firebaseUser.uid:", result.user.uid);
              console.log("Firebase Auth currentUser after sync:", auth.currentUser);
              // Trigger reload of user progress once authenticated to guarantee fresh access
              refreshProgress();
            }
          } else {
            console.info("[INFO] Standard session active without Clerk-Firebase custom token link.");
          }
        } catch (err) {
          console.error("[ERROR] Failed to synchronize Clerk Auth with Firebase Auth:", err);
        }
      }
    };
    syncFirebase();
  }, [isLoaded, isSignedIn, user?.id, getToken, refreshProgress]);

  // Synchronize Clerk user identity with Firebase Analytics on sign-in
  useEffect(() => {
    if (isLoaded && isSignedIn && user?.id) {
      import("@/lib/firebase/client").then(({ getFirebaseAnalytics }) => {
        getFirebaseAnalytics().then((analytics) => {
          if (analytics) {
            import("firebase/analytics").then(({ setUserId, logEvent }) => {
              setUserId(analytics, user.id);
              logEvent(analytics, "login", { method: "Clerk" });
            });
          }
        });
      });
    }
  }, [isLoaded, isSignedIn, user?.id]);

  // Record activity directly to Supabase
  const recordActivity = useCallback(
    async (params: {
      moduleName: string;
      mode: LearningMode;
      xpEarned: number;
      completedChallengeId?: string;
      durationMinutes?: number;
      accuracy?: number;
    }) => {
      const result = await recordLearningActivity({
        userId,
        ...params,
      });
      setSummary(result);
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
