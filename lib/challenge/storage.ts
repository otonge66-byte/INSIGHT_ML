import { ChallengeMetrics } from "./types";

export interface SavedChallengeProgress {
  challengeId: string;
  isCompleted: boolean;
  stars: 1 | 2 | 3;
  xpEarned: number;
  completedAt: string;
  metrics: ChallengeMetrics;
}

const STORAGE_KEY = "insightml_challenges_progress";

export function saveChallengeProgress(
  challengeId: string,
  stars: 1 | 2 | 3,
  metrics: ChallengeMetrics,
  xp: number = 100
): SavedChallengeProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const existingRaw = localStorage.getItem(STORAGE_KEY);
    const existing: Record<string, SavedChallengeProgress> = existingRaw
      ? JSON.parse(existingRaw)
      : {};

    const prevStars = existing[challengeId]?.stars || 1;
    const finalStars = (Math.max(stars, prevStars) as 1 | 2 | 3);

    const record: SavedChallengeProgress = {
      challengeId,
      isCompleted: true,
      stars: finalStars,
      xpEarned: xp,
      completedAt: new Date().toISOString(),
      metrics,
    };

    existing[challengeId] = record;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return record;
  } catch (e) {
    console.error("Failed to save challenge progress to localStorage:", e);
    return null;
  }
}

export function getSavedChallengeProgress(challengeId: string): SavedChallengeProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const existingRaw = localStorage.getItem(STORAGE_KEY);
    if (!existingRaw) return null;
    const existing: Record<string, SavedChallengeProgress> = JSON.parse(existingRaw);
    return existing[challengeId] || null;
  } catch (e) {
    return null;
  }
}
