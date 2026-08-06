import { getFirebaseDb } from "@/lib/firebase/client";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
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

// ── 1. Ensure User Profile & Initial Progress in Firestore ────────────────
export async function ensureUserProfileAndProgress(
  clerkUserId: string,
  details?: { username?: string | null; email?: string | null; avatarUrl?: string | null }
): Promise<void> {
  const db = getFirebaseDb();
  if (!db || !clerkUserId) return;

  try {
    // 1. Upsert user_profiles document
    const profileRef = doc(db, "user_profiles", clerkUserId);
    await setDoc(
      profileRef,
      {
        clerk_user_id: clerkUserId,
        username: details?.username || "Learner",
        email: details?.email || null,
        avatar_url: details?.avatarUrl || null,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );

    // 2. Ensure user_progress document exists
    const progressRef = doc(db, "user_progress", clerkUserId);
    const progSnap = await getDoc(progressRef);

    if (!progSnap.exists()) {
      await setDoc(progressRef, {
        clerk_user_id: clerkUserId,
        total_xp: 0,
        current_level: 1,
        current_streak: 0,
        longest_streak: 0,
        completed_modules: [],
        completed_challenges: [],
        total_learning_minutes: 0,
        last_activity_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.warn("Firestore user initialization error:", e);
  }
}

// ── 2. Fetch Progress Summary from Firestore ──────────────────────────────
export async function fetchUserProgressSummary(
  userId: string
): Promise<ProgressSummary> {
  const db = getFirebaseDb();

  let profile: UserProfile | null = null;
  let progress: UserProgress = createInitialProgress(userId);
  let sessions: LearningSession[] = [];
  let dailyActivityMap: Record<string, DailyActivity> = {};
  let moduleProgressMap: Record<string, ModuleProgress> = {};
  let achievements: Achievement[] = [];
  let isSyncError = false;
  let errorMessage: string | undefined = undefined;

  if (!db) {
    return {
      profile: null,
      progress: createInitialProgress(userId),
      sessions: [],
      dailyActivity: {},
      moduleProgress: {},
      achievements: [],
      totalLearningDays: 0,
      completionPercentage: 0,
      currentRank: "Novice Explorer",
      isSyncError: true,
      errorMessage:
        "Firebase credentials missing in .env.local. Add NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID.",
    };
  }

  try {
    // 1. Fetch Profile
    const profileRef = doc(db, "user_profiles", userId);
    const profSnap = await getDoc(profileRef);
    if (profSnap.exists()) {
      profile = profSnap.data() as UserProfile;
    }

    // 2. Fetch Progress
    const progressRef = doc(db, "user_progress", userId);
    const progSnap = await getDoc(progressRef);
    if (progSnap.exists()) {
      progress = progSnap.data() as UserProgress;
    }

    // 3. Fetch Daily Activity Documents
    const actQuery = query(
      collection(db, "daily_activity"),
      where("clerk_user_id", "==", userId)
    );
    const actSnap = await getDocs(actQuery);
    actSnap.forEach((docSnap) => {
      const act = docSnap.data() as DailyActivity;
      if (act.activity_date) {
        dailyActivityMap[act.activity_date] = act;
      }
    });

    // 4. Fetch Module Progress
    const modQuery = query(
      collection(db, "module_progress"),
      where("clerk_user_id", "==", userId)
    );
    const modSnap = await getDocs(modQuery);
    modSnap.forEach((docSnap) => {
      const mod = docSnap.data() as ModuleProgress;
      if (mod.module_name) {
        moduleProgressMap[mod.module_name] = mod;
      }
    });

    // 5. Fetch Achievements
    const achQuery = query(
      collection(db, "achievements"),
      where("clerk_user_id", "==", userId)
    );
    const achSnap = await getDocs(achQuery);
    achSnap.forEach((docSnap) => {
      achievements.push(docSnap.data() as Achievement);
    });

    // 6. Fetch Learning Sessions
    const sessQuery = query(
      collection(db, "learning_sessions"),
      where("clerk_user_id", "==", userId)
    );
    const sessSnap = await getDocs(sessQuery);
    sessSnap.forEach((docSnap) => {
      sessions.push(docSnap.data() as LearningSession);
    });
  } catch (e) {
    isSyncError = true;
    errorMessage = "Unable to sync your progress with Firebase. Please check your connection.";
    console.warn("Firestore fetch error:", e);
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
    totalLearningDays,
    completionPercentage,
    currentRank,
    isSyncError,
    errorMessage,
  };
}

// ── 3. Record Activity & Update Firestore Database ────────────────────────
export async function recordLearningActivity(params: {
  userId: string;
  moduleName: string;
  mode: LearningMode;
  xpEarned: number;
  completedChallengeId?: string;
  durationMinutes?: number;
  accuracy?: number;
}): Promise<ProgressSummary> {
  const {
    userId,
    moduleName,
    mode,
    xpEarned,
    completedChallengeId,
    durationMinutes = 1,
    accuracy,
  } = params;

  const db = getFirebaseDb();
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  if (!db) {
    return fetchUserProgressSummary(userId);
  }

  try {
    // 1. Fetch current progress
    const progressRef = doc(db, "user_progress", userId);
    const progSnap = await getDoc(progressRef);
    const existingProgress = progSnap.exists()
      ? (progSnap.data() as UserProgress)
      : createInitialProgress(userId);

    // 2. Streak Calculation
    let newStreak = existingProgress.current_streak || 0;
    const lastActive = existingProgress.last_activity_date;

    if (!lastActive) {
      newStreak = 1;
    } else if (lastActive === todayStr) {
      newStreak = Math.max(1, existingProgress.current_streak || 1);
    } else if (lastActive === yesterdayStr) {
      newStreak = (existingProgress.current_streak || 0) + 1;
    } else {
      newStreak = 1;
    }

    const newLongestStreak = Math.max(existingProgress.longest_streak || 0, newStreak);
    const newTotalXP = (existingProgress.total_xp || 0) + xpEarned;
    const newLearningMins = (existingProgress.total_learning_minutes || 0) + durationMinutes;

    const completedModules = new Set(existingProgress.completed_modules || []);
    completedModules.add(moduleName);

    const completedChallenges = new Set(existingProgress.completed_challenges || []);
    if (completedChallengeId) {
      completedChallenges.add(completedChallengeId);
    }

    // 3. Update user_progress
    await setDoc(
      progressRef,
      {
        clerk_user_id: userId,
        total_xp: newTotalXP,
        current_level: Math.floor(newTotalXP / 200) + 1,
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        completed_modules: Array.from(completedModules),
        completed_challenges: Array.from(completedChallenges),
        total_learning_minutes: newLearningMins,
        last_activity_date: todayStr,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );

    // 4. Add learning_session document
    await addDoc(collection(db, "learning_sessions"), {
      clerk_user_id: userId,
      module_name: moduleName,
      mode,
      duration_minutes: durationMinutes,
      xp_earned: xpEarned,
      challenge_completed: Boolean(completedChallengeId),
      accuracy: accuracy || null,
      created_at: new Date().toISOString(),
    });

    // 5. Update daily_activity document (Doc ID: {userId}_{todayStr})
    const dailyRef = doc(db, "daily_activity", `${userId}_${todayStr}`);
    const dailySnap = await getDoc(dailyRef);
    const existingAct = dailySnap.exists() ? dailySnap.data() : null;

    const currentActXP = existingAct ? existingAct.xp || 0 : 0;
    const currentModsCount = existingAct ? existingAct.completed_modules || 0 : 0;
    const currentChalsCount = existingAct ? existingAct.completed_challenges || 0 : 0;
    const currentMins = existingAct ? existingAct.learning_minutes || 0 : 0;

    await setDoc(
      dailyRef,
      {
        clerk_user_id: userId,
        activity_date: todayStr,
        xp: currentActXP + xpEarned,
        completed_modules: currentModsCount + 1,
        completed_challenges: completedChallengeId ? currentChalsCount + 1 : currentChalsCount,
        learning_minutes: currentMins + durationMinutes,
        streak_counted: true,
        created_at: new Date().toISOString(),
      },
      { merge: true }
    );

    // 6. Update module_progress document (Doc ID: {userId}_{moduleName})
    const moduleRef = doc(db, "module_progress", `${userId}_${moduleName}`);
    const modSnap = await getDoc(moduleRef);
    const existingMod = modSnap.exists() ? modSnap.data() : null;

    await setDoc(
      moduleRef,
      {
        clerk_user_id: userId,
        module_name: moduleName,
        story_completed: mode === "Story" || Boolean(existingMod?.story_completed),
        sandbox_completed: mode === "Sandbox" || Boolean(existingMod?.sandbox_completed),
        challenge_completed: Boolean(completedChallengeId) || Boolean(existingMod?.challenge_completed),
        best_accuracy: accuracy ? Math.max(accuracy, existingMod?.best_accuracy || 0) : existingMod?.best_accuracy || null,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );

    // 7. Check Achievements
    if (newStreak >= 7) {
      const achRef = doc(db, "achievements", `${userId}_streak_7_days`);
      await setDoc(
        achRef,
        {
          clerk_user_id: userId,
          achievement_key: "streak_7_days",
          unlocked_at: new Date().toISOString(),
        },
        { merge: true }
      );
    }
    if (completedModules.size >= 3) {
      const achRef = doc(db, "achievements", `${userId}_all_modules_completed`);
      await setDoc(
        achRef,
        {
          clerk_user_id: userId,
          achievement_key: "all_modules_completed",
          unlocked_at: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  } catch (e) {
    console.warn("Error updating Firestore database:", e);
  }

  return fetchUserProgressSummary(userId);
}
