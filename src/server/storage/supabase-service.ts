import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/validation/env";

/**
 * Bypasses restrictive RLS for trusted server inserts (anonymous demo hackathon flow).
 * Requires SUPABASE_SERVICE_ROLE_KEY — never expose to browsers.
 */
export function createServiceSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || key.length < 20) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing or too short — add it to .env.local for room persistence."
    );
  }
  const { NEXT_PUBLIC_SUPABASE_URL } = getServerEnv();
  return createClient(NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
