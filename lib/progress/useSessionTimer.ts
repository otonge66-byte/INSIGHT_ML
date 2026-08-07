"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { incrementLearningTime } from "./progressService";

/**
 * Custom hook to track active screen time in real-time.
 * Increments the user's learning minutes in Supabase every 60 seconds if the tab is visible.
 */
export function useSessionTimer() {
  const { user, isLoaded, isSignedIn } = useUser();
  const userId = user?.id;
  const isTabVisible = useRef(true);
  const timeAccumulator = useRef(0); // in seconds

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;

    // Track tab visibility
    const handleVisibilityChange = () => {
      isTabVisible.current = document.visibilityState === "visible";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Timer loop (checks every second)
    const interval = setInterval(async () => {
      if (isTabVisible.current) {
        timeAccumulator.current += 1;

        // When 60 seconds accumulate, increment by 1 minute
        if (timeAccumulator.current >= 60) {
          timeAccumulator.current = 0;
          try {
            await incrementLearningTime(userId, 1);
          } catch (e) {
            console.error("[ERROR] Failed to increment session time:", e);
          }
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [userId, isLoaded, isSignedIn]);
}
