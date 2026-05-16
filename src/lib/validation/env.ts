import { z } from "zod";

/**
 * Required server/runtime configuration (Phase 1 spec).
 * Parsed lazily and memoized — first `/api/*` request validates credentials.
 */
const serverEnvSchema = z.object({
  MINIMAX_API_KEY: z.string().min(10),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(10),
  SUPABASE_DIRECT_URL: z.string().url(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  cached ??= serverEnvSchema.parse(process.env);
  return cached;
}

/** Testing only — resets memoized env between Vitest cases. */
export function __resetServerEnvCacheForTests(): void {
  cached = null;
}
