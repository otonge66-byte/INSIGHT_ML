import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("https://") &&
    !supabaseUrl.includes("your-project") &&
    !supabaseUrl.includes("placeholder")
);

/**
 * SINGLETON browser Supabase client.
 * Supabase Auth is disabled — authentication is handled 100% by Clerk.
 * We pass the Clerk User ID via custom request headers to satisfy Row Level Security (RLS) policies.
 */
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : (null as unknown as SupabaseClient);

/**
 * Returns the singleton browser Supabase client with the Clerk User ID header injected dynamically.
 * Eliminates duplicate GoTrueClient instances and ensures proper RLS policy evaluation.
 */
export function getSupabaseClient(clerkUserId?: string | null): SupabaseClient {
  if (supabase) {
    const restClient = (supabase as any).rest;
    if (restClient && restClient.headers) {
      if (clerkUserId && clerkUserId !== "guest_user") {
        restClient.headers.set("x-clerk-user-id", clerkUserId);
      } else {
        restClient.headers.delete("x-clerk-user-id");
      }
    }
  }
  return supabase;
}
