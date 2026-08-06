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

// Singleton Supabase client instance using public anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Returns a Supabase client configured with the Clerk User ID header if provided.
 * Does NOT require or request any Clerk JWT templates or Supabase Auth tokens.
 */
export function getSupabaseClient(clerkUserId?: string | null): SupabaseClient {
  if (!clerkUserId || clerkUserId === "guest_user") {
    return supabase;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        "x-clerk-user-id": clerkUserId,
      },
    },
  });
}
