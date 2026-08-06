import { SupabaseClient } from "@supabase/supabase-js";
import { LearningSession } from "../progress/types";

export async function fetchLearningSessions(
  client: SupabaseClient,
  clerkUserId: string
): Promise<LearningSession[]> {
  const { data, error } = await client
    .from("learning_sessions")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchLearningSessions failed:", error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    clerk_user_id: row.clerk_user_id,
    module_name: row.module,
    mode: row.mode,
    duration_minutes: row.duration,
    xp_earned: row.xp,
    challenge_completed: row.accuracy !== null || row.loss !== null,
    accuracy: row.accuracy ? Number(row.accuracy) : null,
    created_at: row.created_at,
  }));
}

export async function logLearningSession(
  client: SupabaseClient,
  clerkUserId: string,
  session: {
    moduleName: string;
    mode: string;
    durationMinutes: number;
    xpEarned: number;
    accuracy?: number | null;
    loss?: number | null;
  }
): Promise<LearningSession> {
  const now = new Date().toISOString();

  const { data, error } = await client
    .from("learning_sessions")
    .insert({
      clerk_user_id: clerkUserId,
      module: session.moduleName,
      mode: session.mode,
      duration: session.durationMinutes,
      xp: session.xpEarned,
      accuracy: session.accuracy ?? null,
      loss: session.loss ?? null,
      created_at: now,
    })
    .select()
    .single();

  if (error) {
    console.error("logLearningSession failed:", error);
    throw error;
  }

  return {
    id: data.id,
    clerk_user_id: data.clerk_user_id,
    module_name: data.module,
    mode: data.mode,
    duration_minutes: data.duration,
    xp_earned: data.xp,
    challenge_completed: data.accuracy !== null || data.loss !== null,
    accuracy: data.accuracy ? Number(data.accuracy) : null,
    created_at: data.created_at,
  };
}
