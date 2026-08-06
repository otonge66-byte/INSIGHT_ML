import { SupabaseClient } from "@supabase/supabase-js";
import { Achievement } from "../progress/types";

export async function fetchAchievements(
  client: SupabaseClient,
  clerkUserId: string
): Promise<Achievement[]> {
  const { data, error } = await client
    .from("achievements")
    .select("*")
    .eq("clerk_user_id", clerkUserId);

  if (error) {
    console.error("fetchAchievements failed:", error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    clerk_user_id: row.clerk_user_id,
    achievement_key: row.achievement_key,
    unlocked_at: row.unlocked_at,
  }));
}

export async function unlockAchievement(
  client: SupabaseClient,
  clerkUserId: string,
  achievementKey: string
): Promise<Achievement> {
  const now = new Date().toISOString();

  const { data, error } = await client
    .from("achievements")
    .upsert({
      clerk_user_id: clerkUserId,
      achievement_key: achievementKey,
      unlocked_at: now,
    }, { onConflict: "clerk_user_id,achievement_key" })
    .select()
    .single();

  if (error) {
    console.error("unlockAchievement failed:", error);
    throw error;
  }

  return {
    id: data.id,
    clerk_user_id: data.clerk_user_id,
    achievement_key: data.achievement_key,
    unlocked_at: data.unlocked_at,
  };
}
