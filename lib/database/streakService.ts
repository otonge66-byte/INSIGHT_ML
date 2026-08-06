import { SupabaseClient } from "@supabase/supabase-js";
import { DailyActivity } from "../progress/types";

/**
 * Calculates current and longest streaks from the daily_activity table.
 */
export async function calculateStreaks(
  client: SupabaseClient,
  clerkUserId: string
): Promise<{ currentStreak: number; longestStreak: number }> {
  // Query all daily activities sorted by activity_date descending
  const { data, error } = await client
    .from("daily_activity")
    .select("activity_date")
    .eq("clerk_user_id", clerkUserId)
    .order("activity_date", { ascending: false });

  if (error) {
    console.error("calculateStreaks failed:", error);
    return { currentStreak: 0, longestStreak: 0 };
  }

  if (!data || data.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const dates = data.map((d) => d.activity_date);
  
  // 1. Calculate Current Streak
  let currentStreak = 0;
  let expectedDateStr = dates[0];

  // The streak is active only if the most recent activity was today or yesterday
  if (expectedDateStr === todayStr || expectedDateStr === yesterdayStr) {
    currentStreak = 1;
    let prevDate = new Date(expectedDateStr);

    for (let i = 1; i < dates.length; i++) {
      const currentDate = new Date(dates[i]);
      const diffTime = Math.abs(prevDate.getTime() - currentDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
        prevDate = currentDate;
      } else if (diffDays === 0) {
        // Skip duplicate date entries if any
        continue;
      } else {
        break; // Streak broken
      }
    }
  }

  // 2. Calculate Longest Streak
  let longestStreak = 0;
  if (dates.length > 0) {
    let tempStreak = 1;
    let prevDate = new Date(dates[0]);

    longestStreak = Math.max(longestStreak, tempStreak);

    for (let i = 1; i < dates.length; i++) {
      const currentDate = new Date(dates[i]);
      const diffTime = Math.abs(prevDate.getTime() - currentDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
        prevDate = currentDate;
      } else if (diffDays === 0) {
        continue;
      } else {
        tempStreak = 1;
        longestStreak = Math.max(longestStreak, tempStreak);
        prevDate = currentDate;
      }
    }
  }

  return { currentStreak, longestStreak };
}

export async function fetchDailyActivities(
  client: SupabaseClient,
  clerkUserId: string
): Promise<Record<string, DailyActivity>> {
  const { data, error } = await client
    .from("daily_activity")
    .select("*")
    .eq("clerk_user_id", clerkUserId);

  if (error) {
    console.error("fetchDailyActivities failed:", error);
    throw error;
  }

  const map: Record<string, DailyActivity> = {};
  (data || []).forEach((row) => {
    map[row.activity_date] = {
      id: row.id,
      clerk_user_id: row.clerk_user_id,
      activity_date: row.activity_date,
      xp: row.xp,
      completed_modules: row.modules_completed,
      completed_challenges: row.challenges_completed,
      learning_minutes: row.learning_minutes,
      streak_counted: row.streak_counted,
      created_at: row.created_at,
    };
  });

  return map;
}

export async function upsertDailyActivity(
  client: SupabaseClient,
  clerkUserId: string,
  activity: Partial<DailyActivity> & { activity_date: string }
): Promise<DailyActivity> {
  const now = new Date().toISOString();

  const payload = {
    clerk_user_id: clerkUserId,
    activity_date: activity.activity_date,
    xp: activity.xp ?? 0,
    learning_minutes: activity.learning_minutes ?? 0,
    modules_completed: activity.completed_modules ?? 0,
    challenges_completed: activity.completed_challenges ?? 0,
    streak_counted: activity.streak_counted ?? true,
    created_at: now,
  };

  const { data, error } = await client
    .from("daily_activity")
    .upsert(payload, { onConflict: "clerk_user_id,activity_date" })
    .select()
    .single();

  if (error) {
    console.error("upsertDailyActivity failed:", error);
    throw error;
  }

  return {
    id: data.id,
    clerk_user_id: data.clerk_user_id,
    activity_date: data.activity_date,
    xp: data.xp,
    completed_modules: data.modules_completed,
    completed_challenges: data.challenges_completed,
    learning_minutes: data.learning_minutes,
    streak_counted: data.streak_counted,
    created_at: data.created_at,
  };
}
