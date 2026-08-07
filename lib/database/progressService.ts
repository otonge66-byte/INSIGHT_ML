import { SupabaseClient } from "@supabase/supabase-js";
import { UserProgress, ModuleProgress } from "../progress/types";

export async function fetchProgress(
  client: SupabaseClient,
  clerkUserId: string
): Promise<UserProgress | null> {
  const { data, error } = await client
    .from("user_progress")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error(`[ERROR] fetchProgress failed: Table: user_progress | User: ${clerkUserId} | Code: ${error.code} | Message: ${error.message}`);
    throw error;
  }

  return {
    clerk_user_id: data.clerk_user_id,
    total_xp: data.total_xp,
    current_level: data.current_level,
    current_streak: data.current_streak,
    longest_streak: data.longest_streak,
    completed_modules: data.completed_modules || [],
    completed_challenges: data.completed_challenges || [],
    total_learning_minutes: data.total_learning_minutes,
    last_activity_date: data.last_activity ? new Date(data.last_activity).toISOString().split('T')[0] : null,
    created_at: data.created_at,
    updated_at: data.updated_at,
  } as UserProgress;
}

export async function upsertProgress(
  client: SupabaseClient,
  progress: UserProgress
): Promise<UserProgress> {
  const now = new Date().toISOString();

  const payload = {
    clerk_user_id: progress.clerk_user_id,
    total_xp: progress.total_xp,
    current_level: progress.current_level,
    current_streak: progress.current_streak,
    longest_streak: progress.longest_streak,
    completed_modules: progress.completed_modules,
    completed_challenges: progress.completed_challenges,
    total_learning_minutes: progress.total_learning_minutes,
    last_activity: progress.last_activity_date ? new Date(progress.last_activity_date).toISOString() : null,
    updated_at: now,
  };

  const { data, error } = await client
    .from("user_progress")
    .upsert({
      ...payload,
    }, { onConflict: "clerk_user_id" })
    .select()
    .single();

  if (error) {
    console.error(`[ERROR] upsertProgress failed: Table: user_progress | User: ${progress.clerk_user_id} | Code: ${error.code} | Message: ${error.message}`);
    throw error;
  }

  return {
    clerk_user_id: data.clerk_user_id,
    total_xp: data.total_xp,
    current_level: data.current_level,
    current_streak: data.current_streak,
    longest_streak: data.longest_streak,
    completed_modules: data.completed_modules || [],
    completed_challenges: data.completed_challenges || [],
    total_learning_minutes: data.total_learning_minutes,
    last_activity_date: data.last_activity ? new Date(data.last_activity).toISOString().split('T')[0] : null,
    created_at: data.created_at,
    updated_at: data.updated_at,
  } as UserProgress;
}

export async function fetchModuleProgressList(
  client: SupabaseClient,
  clerkUserId: string
): Promise<ModuleProgress[]> {
  const { data, error } = await client
    .from("module_progress")
    .select("*")
    .eq("clerk_user_id", clerkUserId);

  if (error) {
    console.error(`[ERROR] fetchModuleProgressList failed: Table: module_progress | User: ${clerkUserId} | Code: ${error.code} | Message: ${error.message}`);
    throw error;
  }

  return (data || []).map((m) => ({
    id: m.id,
    clerk_user_id: m.clerk_user_id,
    module_name: m.module_name,
    story_completed: m.story_completed,
    sandbox_completed: m.sandbox_completed,
    challenge_completed: m.challenge_completed,
    best_accuracy: m.best_accuracy ? Number(m.best_accuracy) : null,
    best_loss: m.best_loss ? Number(m.best_loss) : null,
    updated_at: m.updated_at,
  }));
}

export async function upsertModuleProgress(
  client: SupabaseClient,
  progress: ModuleProgress
): Promise<ModuleProgress> {
  const now = new Date().toISOString();

  const payload = {
    clerk_user_id: progress.clerk_user_id,
    module_name: progress.module_name,
    story_completed: progress.story_completed,
    sandbox_completed: progress.sandbox_completed,
    challenge_completed: progress.challenge_completed,
    best_accuracy: progress.best_accuracy,
    best_loss: progress.best_loss,
    updated_at: now,
  };

  const { data, error } = await client
    .from("module_progress")
    .upsert(payload, { onConflict: "clerk_user_id,module_name" })
    .select()
    .single();

  if (error) {
    console.error(`[ERROR] upsertModuleProgress failed: Table: module_progress | User: ${progress.clerk_user_id} | Module: ${progress.module_name} | Code: ${error.code} | Message: ${error.message}`);
    throw error;
  }

  return {
    id: data.id,
    clerk_user_id: data.clerk_user_id,
    module_name: data.module_name,
    story_completed: data.story_completed,
    sandbox_completed: data.sandbox_completed,
    challenge_completed: data.challenge_completed,
    best_accuracy: data.best_accuracy ? Number(data.best_accuracy) : null,
    best_loss: data.best_loss ? Number(data.best_loss) : null,
    updated_at: data.updated_at,
  };
}
