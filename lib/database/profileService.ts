import { SupabaseClient } from "@supabase/supabase-js";
import { UserProfile } from "../progress/types";

export async function fetchProfile(
  client: SupabaseClient,
  clerkUserId: string
): Promise<UserProfile | null> {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    console.error(`[ERROR] fetchProfile failed: Table: profiles | User: ${clerkUserId} | Code: ${error.code} | Message: ${error.message}`);
    throw error;
  }

  return {
    clerkUserId: data.clerk_user_id,
    clerk_user_id: data.clerk_user_id,
    username: data.username,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    avatar: data.avatar_url,
    avatar_url: data.avatar_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } as UserProfile;
}

export async function upsertProfile(
  client: SupabaseClient,
  clerkUserId: string,
  details: {
    username: string;
    email: string | null;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  }
): Promise<UserProfile> {
  const now = new Date().toISOString();
  
  const payload = {
    clerk_user_id: clerkUserId,
    username: details.username,
    email: details.email,
    first_name: details.firstName,
    last_name: details.lastName,
    avatar_url: details.avatarUrl,
    updated_at: now,
  };

  const { data, error } = await client
    .from("profiles")
    .upsert({
      ...payload,
      created_at: now, // Will be overridden or used if new insert
    }, { onConflict: "clerk_user_id" })
    .select()
    .single();

  if (error) {
    console.error(`[ERROR] upsertProfile failed: Table: profiles | User: ${clerkUserId} | Code: ${error.code} | Message: ${error.message}`);
    throw error;
  }

  return {
    clerkUserId: data.clerk_user_id,
    clerk_user_id: data.clerk_user_id,
    username: data.username,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    avatar: data.avatar_url,
    avatar_url: data.avatar_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } as UserProfile;
}
