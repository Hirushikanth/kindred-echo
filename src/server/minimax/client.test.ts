import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MiniMaxError,
  minimaxPost,
} from "@/server/minimax/client";
import { __resetServerEnvCacheForTests } from "@/lib/validation/env";

function seedPhase1Env(): void {
  process.env.MINIMAX_API_KEY = `sk-${"x".repeat(18)}`;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abcd.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = `sb_publishable_${"y".repeat(10)}`;
  process.env.SUPABASE_DIRECT_URL =
    "postgresql://postgres:postgres@localhost:5432/postgres";
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  __resetServerEnvCacheForTests();
});

describe("minimaxPost", () => {
  it("throws MiniMaxError on non-zero base_resp.status_code", async () => {
    seedPhase1Env();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          base_resp: {
            status_code: 4099,
            status_msg: "synthetic fixture",
          },
        }),
      }) as typeof fetch
    );

    await expect(minimaxPost("/v1/mock", {})).rejects.toBeInstanceOf(MiniMaxError);
  });
});
