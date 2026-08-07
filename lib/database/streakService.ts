import { SupabaseClient } from "@supabase/supabase-js";
import { DailyActivity } from "../progress/types";

/**
 * Calculates current and longest streaks from daily_activity records.
 *
 * Rules:
 * - First ever login  → streak = 1
 * - Consecutive next-day login → streak + 1
 * - Multiple logins same day → streak does NOT increase
 * - Missing one full day → streak resets to 1
 * - All dates compared in UTC YYYY-MM-DD to avoid timezone boundary bugs
 */
export async function calculateStreaks(
  client: SupabaseClient,
  clerkUserId: string
): Promise<{ currentStreak: number; longestStreak: number }> {
  const { data, error } = await client
    .from("daily_activity")
    .select("activity_date")
    .eq("clerk_user_id", clerkUserId)
    .order("activity_date", { ascending: false });

  if (error) {
    console.error(
      `[ERROR] calculateStreaks failed: Table: daily_activity | User: ${clerkUserId} | Code: ${error.code} | Message: ${error.message}`
    );
    return { currentStreak: 0, longestStreak: 0 };
  }

  if (!data || data.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Deduplicate and sort descending (dates come from DB as strings "YYYY-MM-DD")
  const uniqueDates = Array.from(new Set(data.map((d) => d.activity_date))).sort(
    (a, b) => b.localeCompare(a)
  );

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayDate = new Date();
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

  // ── Current Streak ──────────────────────────────────────────────────────
  // Streak is only active if the most recent activity was today OR yesterday.
  let currentStreak = 0;
  const mostRecent = uniqueDates[0];

  if (mostRecent === todayStr || mostRecent === yesterdayStr) {
    currentStreak = 1;
    let prevDateStr = mostRecent;

    for (let i = 1; i < uniqueDates.length; i++) {
      const currDateStr = uniqueDates[i];
      const diffDays = daysBetween(prevDateStr, currDateStr);

      if (diffDays === 1) {
        currentStreak++;
        prevDateStr = currDateStr;
      } else {
        break; // Gap found — streak is broken
      }
    }
  }

  // ── Longest Streak ──────────────────────────────────────────────────────
  let longestStreak = 0;
  let tempStreak = 1;

  longestStreak = Math.max(longestStreak, 1); // At least 1 if we have any activity

  for (let i = 1; i < uniqueDates.length; i++) {
    const diffDays = daysBetween(uniqueDates[i - 1], uniqueDates[i]);
    if (diffDays === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return { currentStreak, longestStreak };
}

/**
 * Returns the number of calendar days between two "YYYY-MM-DD" strings.
 * Always returns a positive number.
 */
function daysBetween(laterStr: string, earlierStr: string): number {
  const later = new Date(laterStr + "T00:00:00Z").getTime();
  const earlier = new Date(earlierStr + "T00:00:00Z").getTime();
  return Math.round(Math.abs(later - earlier) / (1000 * 60 * 60 * 24));
}

export async function fetchDailyActivities(
  client: SupabaseClient,
  clerkUserId: string
): Promise<Record<string, DailyActivity>> {
  const { data, error } = await client
    .from("daily_activity")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .order("activity_date", { ascending: false });

  if (error) {
    console.error(
      `[ERROR] fetchDailyActivities failed: Table: daily_activity | User: ${clerkUserId} | Code: ${error.code} | Message: ${error.message}`
    );
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
  const payload = {
    clerk_user_id: clerkUserId,
    activity_date: activity.activity_date,
    xp: activity.xp ?? 0,
    learning_minutes: activity.learning_minutes ?? 0,
    modules_completed: activity.completed_modules ?? 0,
    challenges_completed: activity.completed_challenges ?? 0,
    streak_counted: activity.streak_counted ?? true,
  };

  const { data, error } = await client
    .from("daily_activity")
    .upsert(payload, { onConflict: "clerk_user_id,activity_date" })
    .select()
    .single();

  if (error) {
    console.error(
      `[ERROR] upsertDailyActivity failed: Table: daily_activity | User: ${clerkUserId} | Date: ${activity.activity_date} | Code: ${error.code} | Message: ${error.message}`
    );
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
