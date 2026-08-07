import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchProfile, upsertProfile } from "../database/profileService";
import {
  fetchProgress,
  upsertProgress,
  fetchModuleProgressList,
  upsertModuleProgress,
} from "../database/progressService";
import {
  calculateStreaks,
  fetchDailyActivities,
  upsertDailyActivity,
} from "../database/streakService";
import { fetchAchievements, unlockAchievement } from "../database/achievementService";
import { fetchLearningSessions, logLearningSession } from "../database/sessionService";
import { fetchBadges, awardBadge } from "../database/badgeService";
import { fetchUserVideoProgressList } from "../database/videoService";
import { fetchCertificates } from "../database/certificateService";
import {
  UserProfile,
  UserProgress,
  LearningSession,
  DailyActivity,
  ModuleProgress,
  Achievement,
  ProgressSummary,
  LearningMode,
} from "./types";

/**
 * Returns today's date string in YYYY-MM-DD using UTC to avoid
 * timezone-boundary bugs where midnight local time crosses a date boundary.
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Returns yesterday's date string in YYYY-MM-DD using UTC.
 */
export function getYesterdayDateString(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split("T")[0];
}

export function calculateRank(totalXP: number): string {
  if (totalXP >= 1000) return "Neural Architect";
  if (totalXP >= 500) return "ML Master";
  if (totalXP >= 250) return "Journeyman";
  if (totalXP >= 100) return "Apprentice";
  return "Novice Explorer";
}

export function calculateCompletionRate(
  completedModules: string[],
  completedChallenges: string[]
): number {
  const totalModules = 3;
  const totalChallenges = 3;
  const modScore = Math.min((completedModules || []).length, totalModules);
  const chalScore = Math.min((completedChallenges || []).length, totalChallenges);
  const totalCompleted = modScore + chalScore;
  const totalAvailable = totalModules + totalChallenges;
  return Math.min(100, Math.round((totalCompleted / totalAvailable) * 100));
}

export function createInitialProgress(userId: string): UserProgress {
  return {
    clerk_user_id: userId,
    total_xp: 0,
    current_level: 1,
    current_streak: 0,
    longest_streak: 0,
    completed_modules: [],
    completed_challenges: [],
    total_learning_minutes: 0,
    last_activity_date: null,
  };
}

// ── 1. Ensure User Profile & Initial Progress in Supabase ────────────────
export async function ensureUserProfileAndProgress(
  clerkUserId: string,
  details?: {
    username?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }
): Promise<void> {
  if (!clerkUserId || !isSupabaseConfigured) return;

  const client = getSupabaseClient(clerkUserId);

  try {
    console.log(`[DEBUG] ensureUserProfileAndProgress: syncing for Clerk ID "${clerkUserId}"`);

    // 1. Upsert Profile — idempotent, safe to call multiple times
    await upsertProfile(client, clerkUserId, {
      username: details?.username || "Learner",
      email: details?.email || null,
      firstName: details?.firstName || "",
      lastName: details?.lastName || "",
      avatarUrl: details?.avatarUrl || null,
    });

    // 2. Upsert initial Progress — only inserts if missing (upsert with onConflict)
    const existing = await fetchProgress(client, clerkUserId);
    if (!existing) {
      const initialProgress = createInitialProgress(clerkUserId);
      await upsertProgress(client, initialProgress);
      console.log("[DEBUG] ensureUserProfileAndProgress: initial progress row created");
    }

    // 3. Record today's login activity for streak tracking
    const todayStr = getTodayDateString();
    const activityMap = await fetchDailyActivities(client, clerkUserId);
    if (!activityMap[todayStr]) {
      await upsertDailyActivity(client, clerkUserId, {
        activity_date: todayStr,
        xp: 0,
        learning_minutes: 0,
        completed_modules: 0,
        completed_challenges: 0,
        streak_counted: true,
      });
      console.log(`[DEBUG] ensureUserProfileAndProgress: daily activity recorded for ${todayStr}`);
    }

    // 4. Recalculate and update streak based purely on database records
    const { currentStreak, longestStreak } = await calculateStreaks(client, clerkUserId);
    const existingProgress = await fetchProgress(client, clerkUserId);
    if (existingProgress) {
      const newLongest = Math.max(longestStreak, existingProgress.longest_streak ?? 0);
      await upsertProgress(client, {
        ...existingProgress,
        current_streak: currentStreak,
        longest_streak: newLongest,
        last_activity_date: todayStr,
      });
    }

    console.log(`[DEBUG] ensureUserProfileAndProgress: complete. Streak = ${currentStreak}`);
  } catch (e: any) {
    console.error(
      `[ERROR] ensureUserProfileAndProgress failed for ID "${clerkUserId}":`,
      `Table: profiles/user_progress | Code: ${e?.code} | Message: ${e?.message}`
    );
    throw e;
  }
}

// ── 2. Fetch Progress Summary from Supabase ──────────────────────────────
export async function fetchUserProgressSummary(
  userId: string
): Promise<ProgressSummary> {
  const client = getSupabaseClient(userId);

  let profile: UserProfile | null = null;
  let progress: UserProgress = createInitialProgress(userId);
  let sessions: LearningSession[] = [];
  let dailyActivityMap: Record<string, DailyActivity> = {};
  let moduleProgressMap: Record<string, ModuleProgress> = {};
  let achievements: Achievement[] = [];
  let badges: any[] = [];
  let isSyncError = false;
  let errorMessage: string | undefined = undefined;
  let completedVideosCount = 0;
  let earnedCertificatesCount = 0;

  if (!isSupabaseConfigured) {
    console.warn("[WARNING] fetchUserProgressSummary: Supabase credentials missing in .env.local");
    return {
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
      isSyncError: true,
      errorMessage:
        "Supabase API keys missing in .env.local. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from Supabase Settings → API.",
    };
  }

  try {
    console.log(`[DEBUG] fetchUserProgressSummary: fetching data for user "${userId}"`);

    [profile, , dailyActivityMap, , achievements, badges, sessions] = await Promise.all([
      fetchProfile(client, userId),
      fetchProgress(client, userId).then((p) => { if (p) progress = p; }),
      fetchDailyActivities(client, userId),
      fetchModuleProgressList(client, userId).then((mods) => {
        mods.forEach((m) => { moduleProgressMap[m.module_name] = m; });
      }),
      fetchAchievements(client, userId),
      fetchBadges(client, userId),
      fetchLearningSessions(client, userId),
      fetchUserVideoProgressList(userId).then((vids) => {
        completedVideosCount = vids.filter((v) => v.quiz_completed).length;
      }),
      fetchCertificates(userId).then((certs) => {
        earnedCertificatesCount = certs.length;
      }),
    ]);
  } catch (e: any) {
    isSyncError = true;
    errorMessage = `Sync failed (${e?.code || "UNKNOWN"}): ${e?.message || "Unable to connect to database."}`;
    console.error(
      `[ERROR] fetchUserProgressSummary failed for ID "${userId}":`,
      `Code: ${e?.code} | Message: ${e?.message}`
    );
  }

  const totalLearningDays = Object.keys(dailyActivityMap).length;
  const completionPercentage = calculateCompletionRate(
    progress.completed_modules || [],
    progress.completed_challenges || []
  );
  const currentRank = calculateRank(progress.total_xp || 0);

  return {
    profile,
    progress,
    sessions,
    dailyActivity: dailyActivityMap,
    moduleProgress: moduleProgressMap,
    achievements,
    badges,
    totalLearningDays,
    completionPercentage,
    currentRank,
    isSyncError,
    errorMessage,
    completedVideosCount,
    earnedCertificatesCount,
  };
}

// ── 3. Record Activity & Update Supabase Database ────────────────────────
export async function recordLearningActivity(
  params: {
    userId: string;
    moduleName: string;
    mode: LearningMode;
    xpEarned: number;
    completedChallengeId?: string;
    durationMinutes?: number;
    accuracy?: number;
    loss?: number;
  }
): Promise<ProgressSummary> {
  const {
    userId,
    moduleName,
    mode,
    xpEarned,
    completedChallengeId,
    durationMinutes = 1,
    accuracy,
    loss,
  } = params;

  const client = getSupabaseClient(userId);
  const todayStr = getTodayDateString();

  try {
    console.log(`[DEBUG] recordLearningActivity: recording activity for user "${userId}"`);

    // 1. Fetch current progress
    let existingProgress = await fetchProgress(client, userId);
    if (!existingProgress) {
      existingProgress = createInitialProgress(userId);
    }

    // 2. Upsert daily activity (accumulates within same day)
    const existingDailyActivities = await fetchDailyActivities(client, userId);
    const existingTodayAct = existingDailyActivities[todayStr];

    await upsertDailyActivity(client, userId, {
      activity_date: todayStr,
      xp: (existingTodayAct?.xp || 0) + xpEarned,
      learning_minutes: (existingTodayAct?.learning_minutes || 0) + durationMinutes,
      completed_modules: (existingTodayAct?.completed_modules || 0) + 1,
      completed_challenges: completedChallengeId
        ? (existingTodayAct?.completed_challenges || 0) + 1
        : (existingTodayAct?.completed_challenges || 0),
      streak_counted: true,
    });

    // 3. Recalculate streaks from database (source of truth)
    const { currentStreak, longestStreak } = await calculateStreaks(client, userId);

    // 4. Update user_progress
    const completedModulesSet = new Set(existingProgress.completed_modules || []);
    completedModulesSet.add(moduleName);

    const completedChallengesSet = new Set(existingProgress.completed_challenges || []);
    if (completedChallengeId) {
      completedChallengesSet.add(completedChallengeId);
    }

    const newTotalXP = (existingProgress.total_xp || 0) + xpEarned;
    const newLevel = Math.floor(newTotalXP / 200) + 1;

    const updatedProgress: UserProgress = {
      clerk_user_id: userId,
      total_xp: newTotalXP,
      current_level: newLevel,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      completed_modules: Array.from(completedModulesSet),
      completed_challenges: Array.from(completedChallengesSet),
      total_learning_minutes: (existingProgress.total_learning_minutes || 0) + durationMinutes,
      last_activity_date: todayStr,
    };

    await upsertProgress(client, updatedProgress);

    // 5. Log learning session
    await logLearningSession(client, userId, {
      moduleName,
      mode,
      durationMinutes,
      xpEarned,
      accuracy: accuracy ?? null,
      loss: loss ?? null,
    });

    // 6. Update module-level progress
    const modules = await fetchModuleProgressList(client, userId);
    const existingMod = modules.find((m) => m.module_name === moduleName);

    await upsertModuleProgress(client, {
      clerk_user_id: userId,
      module_name: moduleName,
      story_completed: mode === "Story" || Boolean(existingMod?.story_completed),
      sandbox_completed: mode === "Sandbox" || Boolean(existingMod?.sandbox_completed),
      challenge_completed: Boolean(completedChallengeId) || Boolean(existingMod?.challenge_completed),
      best_accuracy:
        accuracy && existingMod?.best_accuracy
          ? Math.max(accuracy, existingMod.best_accuracy)
          : (accuracy ?? existingMod?.best_accuracy ?? null),
      best_loss:
        loss && existingMod?.best_loss
          ? Math.min(loss, existingMod.best_loss)
          : (loss ?? existingMod?.best_loss ?? null),
    });

    // 7. Auto-unlock achievements & badges
    if (currentStreak >= 7) {
      await unlockAchievement(client, userId, "streak_7_days");
      await awardBadge(client, userId, "streak_7_days");
    }
    if (completedModulesSet.size >= 3) {
      await unlockAchievement(client, userId, "all_modules_completed");
      await awardBadge(client, userId, "all_modules_completed");
    }
    if (newTotalXP >= 100) {
      await unlockAchievement(client, userId, "xp_100");
    }
  } catch (e: any) {
    console.error(
      `[ERROR] recordLearningActivity failed for user "${userId}":`,
      `Module: ${moduleName} | Mode: ${mode} | Code: ${e?.code} | Message: ${e?.message}`
    );
    throw e;
  }

  return fetchUserProgressSummary(userId);
}

/** Increments total learning minutes and daily activity minutes in real-time. */
export async function incrementLearningTime(
  clerkUserId: string,
  durationMinutes: number
): Promise<void> {
  if (!clerkUserId || clerkUserId === "guest_user" || !isSupabaseConfigured) return;
  const client = getSupabaseClient(clerkUserId);
  const todayStr = getTodayDateString();

  try {
    // 1. Fetch current progress and increment total_learning_minutes
    const progress = await fetchProgress(client, clerkUserId);
    if (progress) {
      await upsertProgress(client, {
        ...progress,
        total_learning_minutes: (progress.total_learning_minutes || 0) + durationMinutes,
        last_activity_date: todayStr,
      });
    }

    // 2. Fetch daily activities and increment learning_minutes for today
    const dailyActivities = await fetchDailyActivities(client, clerkUserId);
    const todayAct = dailyActivities[todayStr];
    await upsertDailyActivity(client, clerkUserId, {
      activity_date: todayStr,
      xp: todayAct?.xp ?? 0,
      learning_minutes: (todayAct?.learning_minutes ?? 0) + durationMinutes,
      completed_modules: todayAct?.completed_modules ?? 0,
      completed_challenges: todayAct?.completed_challenges ?? 0,
      streak_counted: todayAct?.streak_counted ?? true,
    });
    console.log(`[DEBUG] incrementLearningTime: Incremented ${durationMinutes} min for ${clerkUserId}`);
  } catch (err: any) {
    console.error(
      `[ERROR] incrementLearningTime failed for user "${clerkUserId}": Code: ${err?.code} | Message: ${err?.message}`
    );
  }
}

