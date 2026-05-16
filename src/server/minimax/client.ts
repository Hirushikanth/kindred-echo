import type { BaseResp } from "./types";
import { getServerEnv } from "@/lib/validation/env";

const BASE = "https://api.minimax.io";

export class MiniMaxError extends Error {
  constructor(
    public code: number,
    public msg: string
  ) {
    super(`MiniMax ${code}: ${msg}`);
    this.name = "MiniMaxError";
  }
}

export async function minimaxPost<T>(
  path: string,
  body: unknown,
  timeoutMs = 30_000
): Promise<T> {
  const key = getServerEnv().MINIMAX_API_KEY;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = (await res.json()) as T & { base_resp?: BaseResp };
    if (data.base_resp && data.base_resp.status_code !== 0) {
      throw new MiniMaxError(
        data.base_resp.status_code,
        data.base_resp.status_msg
      );
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}
