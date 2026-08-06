import { getFirebaseDb } from "@/lib/firebase/client";
import { getAuth } from "firebase/auth";
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
  details?: {
    username?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }
): Promise<void> {
  const db = getFirebaseDb();
  if (!db || !clerkUserId) {
    console.warn("[WARNING] ensureUserProfileAndProgress: db or clerkUserId is null/undefined", { db: !!db, clerkUserId });
    return;
  }

  const auth = getAuth(db.app);
  console.log("Firestore Write Check - Firebase Auth User:", auth.currentUser);
  if (!auth.currentUser) {
    console.warn("[WARNING] auth.currentUser == null. Firestore security rules will reject writes unless unauthenticated access is allowed.");
  }

  try {
    const now = new Date().toISOString();
    console.log(`[DEBUG] ensureUserProfileAndProgress: starting sync for Clerk ID "${clerkUserId}"`);

    // 1. parent users/{clerkUserId} document
    const userDocRef = doc(db, "users", clerkUserId);
    const userDocSnap = await getDoc(userDocRef);

    const userProfilePayload = {
      clerkUserId,
      email: details?.email || null,
      username: details?.username || "Learner",
      firstName: details?.firstName || "",
      lastName: details?.lastName || "",
      avatar: details?.avatarUrl || null,
      updatedAt: now,
      lastLogin: now,
    };

    console.log("About to write Firestore document");
    console.log("Collection:", "users");
    console.log("Document:", clerkUserId);
    console.log("Payload:", userProfilePayload);

    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {
        ...userProfilePayload,
        createdAt: now,
      });
    } else {
      await setDoc(
        userDocRef,
        {
          updatedAt: now,
          lastLogin: now,
        },
        { merge: true }
      );
    }
    console.log("Firestore write successful");

    // 2. profile sub-document users/{clerkUserId}/profile/main
    const profileRef = doc(db, "users", clerkUserId, "profile", "main");
    const profileSnap = await getDoc(profileRef);
    const createdAtVal = profileSnap.exists() ? (profileSnap.data()?.createdAt || now) : now;

    console.log("About to write Firestore document");
    console.log("Collection:", `users/${clerkUserId}/profile`);
    console.log("Document:", "main");
    console.log("Payload:", { ...userProfilePayload, createdAt: createdAtVal });

    await setDoc(
      profileRef,
      {
        ...userProfilePayload,
        createdAt: createdAtVal,
      },
      { merge: true }
    );
    console.log("Firestore write successful");

    // 3. progress sub-document users/{clerkUserId}/progress/main
    const progressRef = doc(db, "users", clerkUserId, "progress", "main");
    const progSnap = await getDoc(progressRef);

    if (!progSnap.exists()) {
      const initialProgressPayload = {
        clerk_user_id: clerkUserId,
        total_xp: 0,
        current_level: 1,
        current_streak: 0,
        longest_streak: 0,
        completed_modules: [],
        completed_challenges: [],
        total_learning_minutes: 0,
        last_activity_date: null,
        created_at: now,
        updated_at: now,
      };

      console.log("About to write Firestore document");
      console.log("Collection:", `users/${clerkUserId}/progress`);
      console.log("Document:", "main");
      console.log("Payload:", initialProgressPayload);

      await setDoc(progressRef, initialProgressPayload);
      console.log("Firestore write successful");
    }

    // 4. streak sub-document users/{clerkUserId}/streak/main
    const streakRef = doc(db, "users", clerkUserId, "streak", "main");
    const streakSnap = await getDoc(streakRef);
    if (!streakSnap.exists()) {
      const initialStreakPayload = {
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
        created_at: now,
        updated_at: now,
      };

      console.log("About to write Firestore document");
      console.log("Collection:", `users/${clerkUserId}/streak`);
      console.log("Document:", "main");
      console.log("Payload:", initialStreakPayload);

      await setDoc(streakRef, initialStreakPayload);
      console.log("Firestore write successful");
    }
  } catch (e: any) {
    console.error(`[ERROR] ensureUserProfileAndProgress failed for ID "${clerkUserId}":`, e);
    throw e;
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
    console.warn("[WARNING] fetchUserProgressSummary: Firestore DB instance is null");
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
    console.log(`[DEBUG] fetchUserProgressSummary: Fetching data for user "${userId}"`);

    // 1. Fetch Profile
    const profileRef = doc(db, "users", userId, "profile", "main");
    const profSnap = await getDoc(profileRef);
    if (profSnap.exists()) {
      const data = profSnap.data();
      profile = {
        clerkUserId: data.clerkUserId,
        clerk_user_id: data.clerkUserId,
        email: data.email,
        username: data.username,
        avatar: data.avatar,
        avatar_url: data.avatar,
        firstName: data.firstName,
        lastName: data.lastName,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        lastLogin: data.lastLogin,
      } as UserProfile;
      console.log(`[DEBUG] Profile read success for user "${userId}"`);
    } else {
      // Fallback: Check parent document directly
      const userParentRef = doc(db, "users", userId);
      const parentSnap = await getDoc(userParentRef);
      if (parentSnap.exists()) {
        const data = parentSnap.data();
        profile = {
          clerkUserId: data.clerkUserId,
          clerk_user_id: data.clerkUserId,
          email: data.email,
          username: data.username,
          avatar: data.avatar,
          avatar_url: data.avatar,
          firstName: data.firstName,
          lastName: data.lastName,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          lastLogin: data.lastLogin,
        } as UserProfile;
        console.log(`[DEBUG] Profile read fallback success for user "${userId}"`);
      } else {
        console.log(`[DEBUG] No profile document exists for user "${userId}"`);
      }
    }

    // 2. Fetch Progress
    const progressRef = doc(db, "users", userId, "progress", "main");
    const progSnap = await getDoc(progressRef);
    if (progSnap.exists()) {
      progress = progSnap.data() as UserProgress;
      console.log(`[DEBUG] Progress read success for user "${userId}". XP: ${progress.total_xp}`);
    } else {
      console.log(`[DEBUG] No progress document exists for user "${userId}", using defaults.`);
    }

    // 3. Fetch Daily Activity Documents (Subcollection)
    const actQuery = collection(db, "users", userId, "dailyActivity");
    const actSnap = await getDocs(actQuery);
    actSnap.forEach((docSnap) => {
      const act = docSnap.data() as DailyActivity;
      if (act.activity_date) {
        dailyActivityMap[act.activity_date] = act;
      }
    });
    console.log(`[DEBUG] Read ${actSnap.size} dailyActivity documents for user "${userId}"`);

    // 4. Fetch Module Progress (Subcollection)
    const modQuery = collection(db, "users", userId, "moduleProgress");
    const modSnap = await getDocs(modQuery);
    modSnap.forEach((docSnap) => {
      const mod = docSnap.data() as ModuleProgress;
      if (mod.module_name) {
        moduleProgressMap[mod.module_name] = mod;
      }
    });
    console.log(`[DEBUG] Read ${modSnap.size} moduleProgress documents for user "${userId}"`);

    // 5. Fetch Achievements (Subcollection)
    const achQuery = collection(db, "users", userId, "achievements");
    const achSnap = await getDocs(achQuery);
    achSnap.forEach((docSnap) => {
      achievements.push(docSnap.data() as Achievement);
    });
    console.log(`[DEBUG] Read ${achSnap.size} achievements for user "${userId}"`);

    // 6. Fetch Learning Sessions (Subcollection)
    const sessQuery = collection(db, "users", userId, "learningSessions");
    const sessSnap = await getDocs(sessQuery);
    sessSnap.forEach((docSnap) => {
      sessions.push(docSnap.data() as LearningSession);
    });
    console.log(`[DEBUG] Read ${sessSnap.size} learningSessions for user "${userId}"`);

  } catch (e: any) {
    isSyncError = true;
    errorMessage = "Unable to sync your progress with Firebase. Please check your connection.";
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
    console.warn("[WARNING] recordLearningActivity: DB is null, skipping write.");
    return fetchUserProgressSummary(userId);
  }

  const auth = getAuth(db.app);
  console.log("Firestore Write Check - Firebase Auth User:", auth.currentUser);
  if (!auth.currentUser) {
    console.warn("[WARNING] auth.currentUser == null. Firestore security rules will reject writes unless unauthenticated access is allowed.");
  }

  try {
    console.log(`[DEBUG] recordLearningActivity: Recording act for user "${userId}" in module "${moduleName}"`);

    // 1. Fetch current progress
    const progressRef = doc(db, "users", userId, "progress", "main");
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

    // 3. Update progress document users/{userId}/progress/main
    const progressPayload = {
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
    };

    console.log("About to write Firestore document");
    console.log("Collection:", `users/${userId}/progress`);
    console.log("Document:", "main");
    console.log("Payload:", progressPayload);

    await setDoc(progressRef, progressPayload, { merge: true });
    console.log("Firestore write successful");

    // 4. Update streak document users/{userId}/streak/main
    const streakRef = doc(db, "users", userId, "streak", "main");
    const streakPayload = {
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_activity_date: todayStr,
      updated_at: new Date().toISOString(),
    };

    console.log("About to write Firestore document");
    console.log("Collection:", `users/${userId}/streak`);
    console.log("Document:", "main");
    console.log("Payload:", streakPayload);

    await setDoc(streakRef, streakPayload, { merge: true });
    console.log("Firestore write successful");

    // 5. Add learningSession subcollection doc
    const sessionsCollRef = collection(db, "users", userId, "learningSessions");
    const sessionPayload = {
      clerk_user_id: userId,
      module_name: moduleName,
      mode,
      duration_minutes: durationMinutes,
      xp_earned: xpEarned,
      challenge_completed: Boolean(completedChallengeId),
      accuracy: accuracy || null,
      created_at: new Date().toISOString(),
    };

    console.log("About to write Firestore document");
    console.log("Collection:", `users/${userId}/learningSessions`);
    console.log("Document:", "(auto-generated)");
    console.log("Payload:", sessionPayload);

    const sessionDocRef = await addDoc(sessionsCollRef, sessionPayload);
    console.log("Firestore write successful");
    console.log(`Added session doc id: ${sessionDocRef.id}`);

    // 6. Update dailyActivity subcollection doc (Doc ID: {todayStr})
    const dailyRef = doc(db, "users", userId, "dailyActivity", todayStr);
    const dailySnap = await getDoc(dailyRef);
    const existingAct = dailySnap.exists() ? dailySnap.data() : null;

    const currentActXP = existingAct ? existingAct.xp || 0 : 0;
    const currentModsCount = existingAct ? existingAct.completed_modules || 0 : 0;
    const currentChalsCount = existingAct ? existingAct.completed_challenges || 0 : 0;
    const currentMins = existingAct ? existingAct.learning_minutes || 0 : 0;

    const dailyPayload = {
      clerk_user_id: userId,
      activity_date: todayStr,
      xp: currentActXP + xpEarned,
      completed_modules: currentModsCount + 1,
      completed_challenges: completedChallengeId ? currentChalsCount + 1 : currentChalsCount,
      learning_minutes: currentMins + durationMinutes,
      streak_counted: true,
      created_at: new Date().toISOString(),
    };

    console.log("About to write Firestore document");
    console.log("Collection:", `users/${userId}/dailyActivity`);
    console.log("Document:", todayStr);
    console.log("Payload:", dailyPayload);

    await setDoc(dailyRef, dailyPayload, { merge: true });
    console.log("Firestore write successful");

    // 7. Update moduleProgress subcollection doc (Doc ID: {moduleName})
    const moduleRef = doc(db, "users", userId, "moduleProgress", moduleName);
    const modSnap = await getDoc(moduleRef);
    const existingMod = modSnap.exists() ? modSnap.data() : null;

    const modulePayload = {
      clerk_user_id: userId,
      module_name: moduleName,
      story_completed: mode === "Story" || Boolean(existingMod?.story_completed),
      sandbox_completed: mode === "Sandbox" || Boolean(existingMod?.sandbox_completed),
      challenge_completed: Boolean(completedChallengeId) || Boolean(existingMod?.challenge_completed),
      best_accuracy: accuracy ? Math.max(accuracy, existingMod?.best_accuracy || 0) : existingMod?.best_accuracy || null,
      updated_at: new Date().toISOString(),
    };

    console.log("About to write Firestore document");
    console.log("Collection:", `users/${userId}/moduleProgress`);
    console.log("Document:", moduleName);
    console.log("Payload:", modulePayload);

    await setDoc(moduleRef, modulePayload, { merge: true });
    console.log("Firestore write successful");

    // 8. Update achievements subcollection documents
    if (newStreak >= 7) {
      const achRef = doc(db, "users", userId, "achievements", "streak_7_days");
      const achPayload = {
        clerk_user_id: userId,
        achievement_key: "streak_7_days",
        unlocked_at: new Date().toISOString(),
      };

      console.log("About to write Firestore document");
      console.log("Collection:", `users/${userId}/achievements`);
      console.log("Document:", "streak_7_days");
      console.log("Payload:", achPayload);

      await setDoc(achRef, achPayload, { merge: true });
      console.log("Firestore write successful");
    }
    if (completedModules.size >= 3) {
      const achRef = doc(db, "users", userId, "achievements", "all_modules_completed");
      const achPayload = {
        clerk_user_id: userId,
        achievement_key: "all_modules_completed",
        unlocked_at: new Date().toISOString(),
      };

      console.log("About to write Firestore document");
      console.log("Collection:", `users/${userId}/achievements`);
      console.log("Document:", "all_modules_completed");
      console.log("Payload:", achPayload);

      await setDoc(achRef, achPayload, { merge: true });
      console.log("Firestore write successful");
    }
  } catch (e: any) {
    console.error(`[ERROR] recordLearningActivity failed for user "${userId}":`, e);
    throw e;
  }

  return fetchUserProgressSummary(userId);
}

