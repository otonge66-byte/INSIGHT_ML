import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Default public client using anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Creates a authenticated Supabase client inserting the Clerk Supabase JWT.
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
