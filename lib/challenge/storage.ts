import { ChallengeMetrics } from "./types";

export interface SavedChallengeProgress {
  challengeId: string;
  isCompleted: boolean;
  stars: 1 | 2 | 3;
  xpEarned: number;
  completedAt: string;
  metrics: ChallengeMetrics;
}

// In-memory runtime state container (No localStorage)
const inMemoryChallengeStore: Record<string, SavedChallengeProgress> = {};

export function saveChallengeProgress(
  challengeId: string,
  stars: 1 | 2 | 3,
  metrics: ChallengeMetrics,
  xp: number = 100
): SavedChallengeProgress {
  const prevStars = inMemoryChallengeStore[challengeId]?.stars || 1;
  const finalStars = Math.max(stars, prevStars) as 1 | 2 | 3;

  const record: SavedChallengeProgress = {
    challengeId,
    isCompleted: true,
    stars: finalStars,
    xpEarned: xp,
    completedAt: new Date().toISOString(),
    metrics,
  };

  inMemoryChallengeStore[challengeId] = record;
  return record;
}

export function getSavedChallengeProgress(challengeId: string): SavedChallengeProgress | null {
  return inMemoryChallengeStore[challengeId] || null;
}
