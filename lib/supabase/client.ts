import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project") &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("your-supabase-anon-key") &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
);

// Default public client using anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Creates an authenticated Supabase client inserting the Clerk Supabase JWT.
 * Fills in 'x-clerk-user-id' custom header as a fallback for Row Level Security verification.
 */
export function getSupabaseClient(clerkToken?: string | null, clerkUserId?: string | null) {
  if (!clerkToken) {
    return supabase;
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${clerkToken}`,
  };

  if (clerkUserId) {
    headers["x-clerk-user-id"] = clerkUserId;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers,
    },
  });
}
