import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/validation/env";

/**
 * Server-side Supabase client (publishable key, RLS applies).
 * Service-role workflows will be added later where required.
 */
export function createServerSupabase() {
  const env = getServerEnv();

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}
