import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project") &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("your-supabase-anon-key") &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
);

/**
 * SINGLETON Supabase browser client instance.
 * Disabling session persistence avoids duplicate GoTrueClient instances in browser context.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

/**
 * Returns the exact SINGLETON browser client instance.
 * Dynamically injects the Clerk User ID header on the singleton client.
 */
export function getSupabaseClient(clerkUserId?: string | null): SupabaseClient {
  if (clerkUserId && clerkUserId !== "guest_user") {
    (supabase as any).rest.headers["x-clerk-user-id"] = clerkUserId;
  } else {
    delete (supabase as any).rest.headers["x-clerk-user-id"];
  }
  return supabase;
}
