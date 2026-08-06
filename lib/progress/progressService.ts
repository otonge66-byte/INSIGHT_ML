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

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  },
  clerkToken?: string | null
): Promise<void> {
  if (!clerkUserId || !isSupabaseConfigured) return;

  const client = getSupabaseClient(clerkToken, clerkUserId);

  try {
    console.log(`[DEBUG] ensureUserProfileAndProgress (Supabase): syncing for Clerk ID "${clerkUserId}"`);

    // 1. Check & Upsert Profile
    let profile = await fetchProfile(client, clerkUserId);
    if (!profile) {
      profile = await upsertProfile(client, clerkUserId, {
        username: details?.username || "Learner",
        email: details?.email || null,
        firstName: details?.firstName || "",
        lastName: details?.lastName || "",
        avatarUrl: details?.avatarUrl || null,
      });
      console.log("Supabase profile auto-created successfully");
    }

    // 2. Check & Upsert Progress
    const progress = await fetchProgress(client, clerkUserId);
    if (!progress) {
      const initialProgress = createInitialProgress(clerkUserId);
      await upsertProgress(client, initialProgress);
      console.log("Supabase progress row auto-created successfully");
    }
  } catch (e: any) {
    console.error(`[ERROR] ensureUserProfileAndProgress failed for ID "${clerkUserId}":`, e);
    throw e;
  }
}

// ── 2. Fetch Progress Summary from Supabase ──────────────────────────────
export async function fetchUserProgressSummary(
  userId: string,
  clerkToken?: string | null
): Promise<ProgressSummary> {
  const client = getSupabaseClient(clerkToken, userId);

  let profile: UserProfile | null = null;
  let progress: UserProgress = createInitialProgress(userId);
  let sessions: LearningSession[] = [];
  let dailyActivityMap: Record<string, DailyActivity> = {};
  let moduleProgressMap: Record<string, ModuleProgress> = {};
  let achievements: Achievement[] = [];
  let badges: any[] = [];
  let isSyncError = false;
  let errorMessage: string | undefined = undefined;

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
        "Supabase API keys missing in .env.local. Please add your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from Supabase Settings -> API.",
    };
  }

  try {
    console.log(`[DEBUG] fetchUserProgressSummary (Supabase): Fetching data for user "${userId}"`);

    // 1. Fetch Profile
    profile = await fetchProfile(client, userId);

    // 2. Fetch Progress
    const fetchedProg = await fetchProgress(client, userId);
    if (fetchedProg) {
      progress = fetchedProg;
    }

    // 3. Fetch Daily Activities
    dailyActivityMap = await fetchDailyActivities(client, userId);

    // 4. Fetch Module Progress
    const modules = await fetchModuleProgressList(client, userId);
    modules.forEach((m) => {
      moduleProgressMap[m.module_name] = m;
    });

    // 5. Fetch Achievements
    achievements = await fetchAchievements(client, userId);

    // 6. Fetch Badges
    badges = await fetchBadges(client, userId);

    // 7. Fetch Learning Sessions
    sessions = await fetchLearningSessions(client, userId);

  } catch (e: any) {
    isSyncError = true;
    errorMessage = "Unable to sync your progress with Supabase. Please check your connection.";
    console.error(`[ERROR] fetchUserProgressSummary failed for ID "${userId}":`, e);
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
  },
  clerkToken?: string | null
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

  const client = getSupabaseClient(clerkToken, userId);
  const todayStr = getTodayDateString();

  try {
    console.log(`[DEBUG] recordLearningActivity (Supabase): Recording activity for user "${userId}"`);

    // 1. Fetch current progress
    let existingProgress = await fetchProgress(client, userId);
    if (!existingProgress) {
      existingProgress = createInitialProgress(userId);
    }

    // 2. Fetch or update daily activity first to ensure accurate date logs
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

    // 3. Recalculate streaks dynamically from the database
    const { currentStreak, longestStreak } = await calculateStreaks(client, userId);

    // 4. Update the parent user_progress row
    const completedModulesSet = new Set(existingProgress.completed_modules || []);
    completedModulesSet.add(moduleName);

    const completedChallengesSet = new Set(existingProgress.completed_challenges || []);
    if (completedChallengeId) {
      completedChallengesSet.add(completedChallengeId);
    }

    const updatedProgress: UserProgress = {
      clerk_user_id: userId,
      total_xp: (existingProgress.total_xp || 0) + xpEarned,
      current_level: Math.floor(((existingProgress.total_xp || 0) + xpEarned) / 200) + 1,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      completed_modules: Array.from(completedModulesSet),
      completed_challenges: Array.from(completedChallengesSet),
      total_learning_minutes: (existingProgress.total_learning_minutes || 0) + durationMinutes,
      last_activity_date: todayStr,
    };

    await upsertProgress(client, updatedProgress);

    // 5. Log the learning session row
    await logLearningSession(client, userId, {
      moduleName,
      mode,
      durationMinutes,
      xpEarned,
      accuracy: accuracy ?? null,
      loss: loss ?? null,
    });

    // 6. Update individual moduleProgress row
    const modules = await fetchModuleProgressList(client, userId);
    const existingMod = modules.find((m) => m.module_name === moduleName);

    await upsertModuleProgress(client, {
      clerk_user_id: userId,
      module_name: moduleName,
      story_completed: mode === "Story" || Boolean(existingMod?.story_completed),
      sandbox_completed: mode === "Sandbox" || Boolean(existingMod?.sandbox_completed),
      challenge_completed: Boolean(completedChallengeId) || Boolean(existingMod?.challenge_completed),
      best_accuracy: accuracy && existingMod?.best_accuracy 
        ? Math.max(accuracy, existingMod.best_accuracy) 
        : (accuracy ?? existingMod?.best_accuracy ?? null),
      best_loss: loss && existingMod?.best_loss 
        ? Math.min(loss, existingMod.best_loss) 
        : (loss ?? existingMod?.best_loss ?? null),
    });

    // 7. Check and award achievements & badges
    if (currentStreak >= 7) {
      await unlockAchievement(client, userId, "streak_7_days");
      await awardBadge(client, userId, "streak_7_days");
    }
    if (completedModulesSet.size >= 3) {
      await unlockAchievement(client, userId, "all_modules_completed");
      await awardBadge(client, userId, "all_modules_completed");
    }
  } catch (e: any) {
    console.error(`[ERROR] recordLearningActivity failed for user "${userId}":`, e);
    throw e;
  }

  return fetchUserProgressSummary(userId, clerkToken);
}
