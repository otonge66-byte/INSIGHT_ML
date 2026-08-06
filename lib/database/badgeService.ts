import { SupabaseClient } from "@supabase/supabase-js";

export interface UserBadge {
  id?: string;
  clerk_user_id: string;
  badge_key: string;
  earned_at?: string;
}

export async function fetchBadges(
  client: SupabaseClient,
  clerkUserId: string
): Promise<UserBadge[]> {
  const { data, error } = await client
    .from("badges")
    .select("*")
    .eq("clerk_user_id", clerkUserId);

  if (error) {
    console.error("fetchBadges failed:", error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    clerk_user_id: row.clerk_user_id,
    badge_key: row.badge_key,
    earned_at: row.earned_at,
  }));
}

export async function awardBadge(
  client: SupabaseClient,
  clerkUserId: string,
  badgeKey: string
): Promise<UserBadge> {
  const now = new Date().toISOString();

  const { data, error } = await client
    .from("badges")
    .upsert({
      clerk_user_id: clerkUserId,
      badge_key: badgeKey,
      earned_at: now,
    }, { onConflict: "clerk_user_id,badge_key" })
    .select()
    .single();

  if (error) {
    console.error("awardBadge failed:", error);
    throw error;
  }

  return {
    id: data.id,
    clerk_user_id: data.clerk_user_id,
    badge_key: data.badge_key,
    earned_at: data.earned_at,
  };
}
