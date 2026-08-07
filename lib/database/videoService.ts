import { getSupabaseClient } from "@/lib/supabase/client";

export interface VideoProgress {
  id?: string;
  clerk_user_id: string;
  video_id: string;
  topic: string;
  watched: boolean;
  watch_percentage: number;
  quiz_completed: boolean;
  quiz_score?: number | null;
  completed_at?: string | null;
  created_at?: string;
}

export interface VideoQuizResult {
  id?: string;
  clerk_user_id: string;
  video_id: string;
  score: number;
  total_questions: number;
  answers: any;
  passed: boolean;
  attempted_at?: string;
}

export async function fetchUserVideoProgressList(clerkUserId: string): Promise<VideoProgress[]> {
  const client = getSupabaseClient(clerkUserId);
  const { data, error } = await client
    .from("video_progress")
    .select("*")
    .eq("clerk_user_id", clerkUserId);

  if (error) {
    console.error(`[ERROR] fetchUserVideoProgressList failed: Table: video_progress | User: ${clerkUserId} | Code: ${error.code} | Message: ${error.message}`);
    throw error;
  }
  return data || [];
}

export async function upsertVideoProgress(
  clerkUserId: string,
  progress: Omit<VideoProgress, "clerk_user_id">
): Promise<VideoProgress> {
  const client = getSupabaseClient(clerkUserId);
  const payload = {
    clerk_user_id: clerkUserId,
    video_id: progress.video_id,
    topic: progress.topic,
    watched: progress.watched,
    watch_percentage: progress.watch_percentage,
    quiz_completed: progress.quiz_completed,
    quiz_score: progress.quiz_score ?? null,
    completed_at: progress.completed_at ?? null,
  };

  const { data, error } = await client
    .from("video_progress")
    .upsert(payload, { onConflict: "clerk_user_id,video_id" })
    .select()
    .single();

  if (error) {
    console.error(`[ERROR] upsertVideoProgress failed: Table: video_progress | User: ${clerkUserId} | Code: ${error.code} | Message: ${error.message}`);
    throw error;
  }
  return data;
}

export async function saveVideoQuizResult(
  clerkUserId: string,
  result: Omit<VideoQuizResult, "clerk_user_id">
): Promise<VideoQuizResult> {
  const client = getSupabaseClient(clerkUserId);
  const payload = {
    clerk_user_id: clerkUserId,
    video_id: result.video_id,
    score: result.score,
    total_questions: result.total_questions,
    answers: result.answers,
    passed: result.passed,
  };

  const { data, error } = await client
    .from("video_quiz_results")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error(`[ERROR] saveVideoQuizResult failed: Table: video_quiz_results | User: ${clerkUserId} | Code: ${error.code} | Message: ${error.message}`);
    throw error;
  }
  return data;
}
