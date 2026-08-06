import { SupabaseClient } from "@supabase/supabase-js";
import { DailyActivity } from "../progress/types";
import { fetchDailyActivities } from "./streakService";

/**
 * Fetches the daily activity logs formatted specifically for the contribution calendar.
 */
export async function fetchCalendarData(
  client: SupabaseClient,
  clerkUserId: string
): Promise<Record<string, DailyActivity>> {
  return fetchDailyActivities(client, clerkUserId);
}
