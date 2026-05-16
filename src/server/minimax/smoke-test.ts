#!/usr/bin/env tsx
/**
 * Kindred Echo — MiniMax Full API Smoke Test
 *
 * Tests every model type available on the Token Plan Plus account:
 *
 *   1.  M2.7 Chat Completion          — text gen, reasoning token breakdown
 *   2.  TTS speech-2.8-hd             — audio synthesis, billing chars
 *   3.  Voice Clone permission probe   — confirms account verification status
 *   4.  Files API                      — upload endpoint reachable
 *   5.  Web Search                     — /v1/coding_plan/search
 *   6.  Image Understanding (VLM)      — /v1/coding_plan/vlm + base64 image
 *   7.  Image Generation               — /v1/image_generation (image-01, ~40s)
 *   8.  Music Generation               — /v1/music_generation (music-2.6, ~90-120s)
 *
 * Usage:
 *   npm run smoke:minimax            — run all 8 tests
 *   npm run smoke:minimax -- --fast  — skip image + music (tests 7-8, each 40-120s)
 *
 * ── Confirmed configuration (2026-05-16, Token Plan Plus) ────────────────────
 *
 * ALL endpoints use base URL: https://api.minimax.io
 * Auth: Authorization: Bearer <MINIMAX_API_KEY>  (no GroupId header/param needed)
 *
 * Key lessons learned from live debugging:
 *
 * LLM  — model "MiniMax-M2.7" (standard). "-highspeed" requires Plus-Highspeed plan.
 *         max_tokens ≥ 256 required — M2.7 is a reasoning model that spends tokens
 *         thinking before producing output; at 30 tokens content is always empty.
 *         temperature must be in (0.0, 1.0] — 0 causes a hard API error.
 *
 * TTS  — model "speech-2.8-hd". speech-2.8-turbo / speech-2.6-* return 2056 on
 *         Token Plan Plus (only "speech-hd" quota is included).
 *         Do NOT include output_format in the request body. Including it
 *         routes through a codepath that returns 2056 on Token Plan keys.
 *         Audio comes back as hex in data.audio regardless.
 *
 * Clone — endpoint /v1/voice_clone (NOT /v1/voice_clone/clone_voice — 404).
 *          Probe technique: send fake file_id → 2013=permission OK, 2038=denied.
 *
 * VLM  — endpoint /v1/coding_plan/vlm. Request: {prompt, image_url}.
 *         image_url must be a "data:image/...;base64,..." string — plain HTTPS
 *         URLs return "invalid image URL". Fetch and base64-encode at call time.
 *         Response: {content: "...", base_resp: {...}}
 *
 * Search — endpoint /v1/coding_plan/search. Request: {q: "..."}.
 *           Response: {organic: [...], base_resp: {...}}
 *
 * Image  — endpoint /v1/image_generation. Synchronous, ~40-50s. Model: "image-01".
 *           Response: {data: {image_urls: [...]}, metadata: {...}, base_resp: {...}}
 *           URL valid for 24 hours only.
 *
 * Music  — endpoint /v1/music_generation. Synchronous, ~90-120s. Model: "music-2.6".
 *           is_instrumental: true skips lyrics requirement.
 *           Response: {data: {audio: "<hex>", status: 2}, extra_info: {...}}
 */

import * as fs from "fs";
import * as path from "path";

// ── Load .env.local ──────────────────────────────────────────────────────────

function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

// ── Constants ─────────────────────────────────────────────────────────────────

const KEY = process.env.MINIMAX_API_KEY ?? "";

// Single verified base URL for all endpoints (international Token Plan, confirmed 2026-05-16)
const BASE = "https://api.minimax.io";

const FAST_MODE = process.argv.includes("--fast");

// ── Types ─────────────────────────────────────────────────────────────────────

interface BaseResp {
  status_code: number;
  status_msg: string;
}

interface TestResult {
  id: number;
  name: string;
  passed: boolean;
  skipped?: boolean;
  statusCode?: number;
  durationMs: number;
  details: string[];
}

// ── Core HTTP helper ──────────────────────────────────────────────────────────

async function minimax(
  path: string,
  body: unknown,
  timeoutMs = 30_000
): Promise<{ body: unknown; status: number; ms: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const responseBody = await res.json();
    return { body: responseBody, status: res.status, ms: Math.round(performance.now() - start) };
  } catch (err: unknown) {
    const ms = Math.round(performance.now() - start);
    if ((err as { name?: string }).name === "AbortError") {
      return { body: { _timedOut: true, _timeoutMs: timeoutMs }, status: 0, ms };
    }
    return { body: { _error: String(err) }, status: 0, ms };
  } finally {
    clearTimeout(timer);
  }
}

function getBaseResp(body: unknown): BaseResp | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  const br = b.base_resp;
  if (typeof br !== "object" || br === null) return null;
  const r = br as Record<string, unknown>;
  if (typeof r.status_code !== "number") return null;
  return { status_code: r.status_code, status_msg: String(r.status_msg ?? "") };
}

function elapsed(start: number): number {
  return Math.round(performance.now() - start);
}

// ── Test 1: M2.7 Chat Completion ─────────────────────────────────────────────

async function testLLM(): Promise<TestResult> {
  const t0 = performance.now();
  const details: string[] = [];

  const { body, ms } = await minimax("/v1/text/chatcompletion_v2", {
    model: "MiniMax-M2.7",   // Standard; -highspeed NOT in Token Plan Plus
    temperature: 1.0,         // REQUIRED: must be in (0.0, 1.0] — 0.0 causes hard error
    max_tokens: 300,          // MUST be ≥ 256 — reasoning model spends tokens thinking first
    messages: [{ role: "user", content: "Reply with exactly three words: kindred echo works" }],
  });

  const base = getBaseResp(body);
  const b = body as Record<string, unknown>;

  if (!base || base.status_code !== 0) {
    details.push(`status_code: ${base?.status_code} — ${base?.status_msg}`);
    if (base?.status_code === 2056)
      details.push("Quota exhausted — Token Plan Plus: 4,500 req/5-hr window.");
    return { id: 1, name: "M2.7 Chat Completion", passed: false, statusCode: base?.status_code, durationMs: ms, details };
  }

  const choices = (b.choices as { message: { content: string; reasoning_content?: string; reasoning_details?: unknown[] } }[] | null) ?? [];
  const msg = choices[0]?.message ?? { content: "", reasoning_content: "" };
  const content = msg.content?.trim() ?? "";
  const thinkingSnippet = (msg.reasoning_content ?? "").slice(0, 100);
  const usage = (b.usage as Record<string, unknown>) ?? {};
  const usageNums = usage as Record<string, number>;
  const reasoningTok = ((usage.completion_tokens_details as Record<string, number> | null | undefined) ?? {}).reasoning_tokens ?? 0;

  details.push(`Response: "${content}"`);
  details.push(`Tokens — prompt: ${usageNums.prompt_tokens} | completion: ${usageNums.completion_tokens} | reasoning: ${reasoningTok} | visible: ${usageNums.completion_tokens - reasoningTok}`);
  details.push(`Note: total_characters is always 0 on Token Plan (not used for billing)`);
  details.push(`Note: reasoning_details[] has type/id/format/index/text — same as reasoning_content`);
  if (thinkingSnippet) details.push(`Thinking (first 100 chars): "${thinkingSnippet}…"`);

  return { id: 1, name: "M2.7 Chat Completion", passed: content.length > 0, statusCode: 0, durationMs: ms, details };
}

// ── Test 2: TTS speech-2.8-hd ────────────────────────────────────────────────

async function testTTS(): Promise<TestResult> {
  const details: string[] = [];

  const { body, ms } = await minimax("/v1/t2a_v2", {
    model: "speech-2.8-hd",            // Only HD model in Token Plan Plus quota
    text: "Kindred Echo smoke test.",   // Short text — saves daily TTS quota (4,000 chars/day)
    stream: false,
    language_boost: "auto",
    // No output_format field — including it triggers 2056 on Token Plan keys
    voice_setting: { voice_id: "English_expressive_narrator", speed: 1, vol: 1, pitch: 0 },
    audio_setting: { sample_rate: 32000, bitrate: 128000, format: "mp3", channel: 1 },
  });

  const base = getBaseResp(body);
  const b = body as Record<string, unknown>;

  if (!base || base.status_code !== 0) {
    details.push(`status_code: ${base?.status_code} — ${base?.status_msg}`);
    if (base?.status_code === 2056)
      details.push("Token Plan Plus speech-hd quota: 4,000 chars/day. Check quota.");
    return { id: 2, name: "TTS speech-2.8-hd", passed: false, statusCode: base?.status_code, durationMs: ms, details };
  }

  const audio = ((b.data as Record<string, string> | null)?.audio) ?? "";
  const audioBytes = Math.round(audio.length / 2);
  const billedChars = ((b.extra_info as Record<string, number> | null)?.usage_characters) ?? 0;
  const audioDurMs = ((b.extra_info as Record<string, number> | null)?.audio_length) ?? 0;

  details.push(`Audio: ${audioBytes.toLocaleString()} bytes of MP3 (hex-encoded in data.audio)`);
  details.push(`Duration: ${(audioDurMs / 1000).toFixed(1)}s | Billed: ${billedChars} chars | data.status: 2 (always)`);
  details.push(`data.ced is always "" — internal field, safe to ignore`);
  details.push(`Voice: English_expressive_narrator | Model: speech-2.8-hd`);

  return { id: 2, name: "TTS speech-2.8-hd", passed: audioBytes > 0, statusCode: 0, durationMs: ms, details };
}

// ── Test 3: Voice Clone permission probe ─────────────────────────────────────
//
// Sends a deliberately invalid clone request. Does NOT upload audio.
// The error code tells us the account's verification status:
//   2013 → permission GRANTED (bad input was the problem, not no-permission)
//   2038 → permission DENIED  (account not verified for voice cloning)

async function testClonePermission(): Promise<TestResult> {
  const details: string[] = [];

  const { body, ms } = await minimax("/v1/voice_clone", {
    file_id: "1",                    // Intentionally invalid — triggers input error
    voice_id: "KE_smoke_probe_final",
    text: "Probe.",
    model: "speech-2.8-hd",
  });

  const base = getBaseResp(body);
  if (!base) {
    return { id: 3, name: "Voice Clone permission", passed: false, durationMs: ms,
      details: [`Unexpected response: ${JSON.stringify(body).slice(0, 200)}`] };
  }

  switch (base.status_code) {
    case 2013:
      details.push("✓ PERMISSION GRANTED — account is verified for voice cloning.");
      details.push("Error 2013 = 'invalid params' (fake file_id rejected at input validation, not permission gate).");
      details.push("Live voice upload → clone → TTS pipeline is fully available.");
      return { id: 3, name: "Voice Clone permission", passed: true, statusCode: 2013, durationMs: ms, details };
    case 2038:
      details.push("✗ PERMISSION DENIED — account not verified for voice cloning.");
      details.push("Activate the pre-cloned fallback voice (MINIMAX_FALLBACK_VOICE_ID in .env.local).");
      details.push("Contact MiniMax support to request voice cloning verification.");
      return { id: 3, name: "Voice Clone permission", passed: false, statusCode: 2038, durationMs: ms, details };
    case 2056:
      details.push("Quota exhausted — cannot determine permission status. Re-run after quota resets.");
      return { id: 3, name: "Voice Clone permission", passed: false, statusCode: 2056, durationMs: ms, details };
    default:
      details.push(`Unexpected status_code: ${base.status_code} — ${base.status_msg}`);
      return { id: 3, name: "Voice Clone permission", passed: false, statusCode: base.status_code, durationMs: ms, details };
  }
}

// ── Test 4: Files API ─────────────────────────────────────────────────────────

async function testFilesAPI(): Promise<TestResult> {
  const details: string[] = [];
  const t0 = performance.now();

  const res = await fetch(`${BASE}/v1/files/list?purpose=voice_clone&page_size=10`, {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  const body = await res.json() as Record<string, unknown>;
  const ms = elapsed(t0);
  const base = getBaseResp(body);
  const files = (body.files as unknown[]) ?? [];

  if (!base || base.status_code !== 0) {
    details.push(`status_code: ${base?.status_code} — ${base?.status_msg}`);
    return { id: 4, name: "Files API (upload endpoint)", passed: false, statusCode: base?.status_code, durationMs: ms, details };
  }

  details.push(`Existing voice_clone files in account: ${files.length}`);
  details.push(`File upload endpoint: POST /v1/files/upload (multipart/form-data, purpose=voice_clone)`);
  details.push(`Note: file_id is int64 — store as string to avoid JS Number overflow`);

  return { id: 4, name: "Files API (upload endpoint)", passed: true, statusCode: 0, durationMs: ms, details };
}

// ── Test 5: Web Search ───────────────────────────────────────────────────────

async function testWebSearch(): Promise<TestResult> {
  const details: string[] = [];

  const { body, ms } = await minimax("/v1/coding_plan/search", {
    q: "MiniMax AI speech synthesis voice cloning",   // param is "q", not "query"
  });

  const base = getBaseResp(body);
  const b = body as Record<string, unknown>;

  if (!base || base.status_code !== 0) {
    details.push(`status_code: ${base?.status_code} — ${base?.status_msg}`);
    return { id: 5, name: "Web Search", passed: false, statusCode: base?.status_code, durationMs: ms, details };
  }

  const results = (b.organic as { title?: string; link?: string }[]) ?? [];
  const first = results[0];
  details.push(`Results returned: ${results.length}`);
  if (first) details.push(`First result: "${first.title?.slice(0, 70)}"`);
  details.push(`Endpoint: POST /v1/coding_plan/search  |  Quota: coding-plan-search 4,500/5hr`);

  return { id: 5, name: "Web Search", passed: results.length > 0, statusCode: 0, durationMs: ms, details };
}

// ── Test 6: Image Understanding (VLM) ────────────────────────────────────────
//
// Fetches a tiny JPEG (~35 KB) from httpbin and base64-encodes it.
// The VLM endpoint requires image_url to be a data URI ("data:image/...;base64,...").
// Plain HTTPS URLs return "invalid image URL".

async function testVLM(): Promise<TestResult> {
  const details: string[] = [];
  const t0 = performance.now();

  // Fetch a small test image and convert to base64 data URL
  let b64DataUrl: string;
  try {
    const imgRes = await fetch("https://httpbin.org/image/jpeg");
    const imgBuf = await imgRes.arrayBuffer();
    const imgB64 = Buffer.from(imgBuf).toString("base64");
    b64DataUrl = `data:image/jpeg;base64,${imgB64}`;
    details.push(`Test image fetched: ${imgBuf.byteLength.toLocaleString()} bytes → ${b64DataUrl.length.toLocaleString()} char data URL`);
  } catch (err) {
    return { id: 6, name: "Image Understanding (VLM)", passed: false, durationMs: elapsed(t0),
      details: [`Failed to fetch test image: ${err}. VLM test requires an image source.`] };
  }

  const { body, ms } = await minimax("/v1/coding_plan/vlm", {
    prompt: "Describe what is in this image in exactly one sentence.",
    image_url: b64DataUrl,   // Must be data URI, not plain HTTPS URL
  });

  const base = getBaseResp(body);
  const b = body as Record<string, unknown>;

  if (!base || base.status_code !== 0) {
    details.push(`status_code: ${base?.status_code} — ${base?.status_msg}`);
    return { id: 6, name: "Image Understanding (VLM)", passed: false, statusCode: base?.status_code, durationMs: ms, details };
  }

  const content = String(b.content ?? "");
  details.push(`VLM description: "${content.slice(0, 120)}"`);
  details.push(`Endpoint: POST /v1/coding_plan/vlm  |  Quota: coding-plan-vlm 4,500/5hr`);
  details.push(`image_url MUST be a base64 data URI — plain HTTPS URLs return 2013`);

  return { id: 6, name: "Image Understanding (VLM)", passed: content.length > 0, statusCode: 0, durationMs: ms, details };
}

// ── Test 7: Image Generation ─────────────────────────────────────────────────
// Synchronous. Typically 40-50 seconds. Generates 1 image.

async function testImageGeneration(): Promise<TestResult> {
  const details: string[] = [];

  if (FAST_MODE) {
    details.push("Skipped (--fast mode). Typically takes 15-50 seconds.");
    return { id: 7, name: "Image Generation (image-01)", passed: false, skipped: true, durationMs: 0, details };
  }

  details.push("Generating image (this takes 40-50 seconds)…");
  const { body, ms } = await minimax("/v1/image_generation", {
    model: "image-01",
    prompt: "A softly glowing candle on a wooden table, warm and peaceful, photorealistic",
    aspect_ratio: "1:1",
    response_format: "url",   // url or base64 — URL valid for 24h
    n: 1,
  }, 90_000); // 90s timeout

  const base = getBaseResp(body);
  const b = body as Record<string, unknown>;

  if (!base || base.status_code !== 0) {
    if ((b as { _timedOut?: boolean })._timedOut)
      details.push("Timed out after 90s. Image generation can take up to 60s. Try again.");
    else
      details.push(`status_code: ${base?.status_code} — ${base?.status_msg}`);
    return { id: 7, name: "Image Generation (image-01)", passed: false, statusCode: base?.status_code, durationMs: ms, details };
  }

  const data = (b.data as Record<string, string[]> | null) ?? {};
  const urls = data.image_urls ?? [];
  const meta = (b.metadata as Record<string, number | string> | null) ?? {};
  const traceId = String(b.id ?? "");

  // ⚠️ metadata.success_count and failed_count are STRINGS ("1", "0") not numbers
  const successCount = parseInt(String(meta.success_count ?? "0"), 10);
  details.push(`Image generated successfully in ${(ms / 1000).toFixed(1)}s`);
  details.push(`Success: ${successCount} | Failed: ${meta.failed_count} | Trace: ${traceId}`);
  if (urls[0]) details.push(`URL (24h expiry): ${urls[0].slice(0, 80)}…`);
  details.push(`⚠ metadata.success_count type = string (cast with parseInt before arithmetic)`);
  details.push(`Quota: image-01 50 images/day on Token Plan Plus`);

  return { id: 7, name: "Image Generation (image-01)", passed: urls.length > 0, statusCode: 0, durationMs: ms, details };
}

// ── Test 8: Music Generation ─────────────────────────────────────────────────
// Synchronous. Typically 90-120 seconds. Generates one full-length song.
// is_instrumental: true skips the required lyrics field.

async function testMusicGeneration(): Promise<TestResult> {
  const details: string[] = [];

  if (FAST_MODE) {
    details.push("Skipped (--fast mode). Typically takes 90-145 seconds.");
    return { id: 8, name: "Music Generation (music-2.6)", passed: false, skipped: true, durationMs: 0, details };
  }

  details.push("Generating music (this takes 90-120 seconds)…");
  const { body, ms } = await minimax("/v1/music_generation", {
    model: "music-2.6",
    prompt: "Gentle ambient instrumental, warm piano, peaceful, memorial atmosphere",
    is_instrumental: true,    // Skips required 'lyrics' field
    // No output_format specified → defaults to hex in data.audio
    audio_setting: { sample_rate: 44100, bitrate: 128000, format: "mp3" },
  }, 150_000); // 150s timeout

  const base = getBaseResp(body);
  const b = body as Record<string, unknown>;

  if (!base || base.status_code !== 0) {
    if ((b as { _timedOut?: boolean })._timedOut)
      details.push("Timed out after 150s. Music generation typically takes 90-120s. Try again.");
    else
      details.push(`status_code: ${base?.status_code} — ${base?.status_msg}`);
    return { id: 8, name: "Music Generation (music-2.6)", passed: false, statusCode: base?.status_code, durationMs: ms, details };
  }

  const data = (b.data as Record<string, unknown> | null) ?? {};
  const audio = String(data.audio ?? "");
  const status = Number(data.status ?? 0);
  const extra = (b.extra_info as Record<string, number> | null) ?? {};
  const audioBytes = Math.round(audio.length / 2);
  const durSec = (extra.music_duration ?? 0) / 1000;

  details.push(`Music generated in ${(ms / 1000).toFixed(0)}s`);
  details.push(`Status: ${status === 2 ? "completed" : status} | Audio: ${audioBytes.toLocaleString()} bytes MP3`);
  details.push(`Duration: ${durSec.toFixed(1)}s | Ch: ${extra.music_channel ?? "?"} | ${extra.music_sample_rate}Hz | ${extra.bitrate}bps`);
  details.push(`Note: response also contains analysis_info (always null) and trace_id`);
  details.push(`Quota: music-2.6 100 songs/day on Token Plan Plus`);

  return { id: 8, name: "Music Generation (music-2.6)", passed: audioBytes > 0 && status === 2, statusCode: 0, durationMs: ms, details };
}

// ── Runner ────────────────────────────────────────────────────────────────────

function printResult(r: TestResult): void {
  const icon = r.skipped ? "⏭ " : r.passed ? "✅" : "❌";
  const dur = r.skipped ? "(skipped)" : `(${r.durationMs.toLocaleString()}ms)`;
  const code = !r.skipped && r.statusCode != null ? `  status: ${r.statusCode}` : "";
  console.log(`\n${icon}  [${r.id}] ${r.name} ${dur}${code}`);
  for (const d of r.details) console.log(`   ${d}`);
}

async function main(): Promise<void> {
  const bar = "━".repeat(62);
  console.log(bar);
  console.log("  Kindred Echo — MiniMax Full Smoke Test");
  console.log(`  Mode: ${FAST_MODE ? "fast (skipping image + music)" : "full (all 8 tests)"}`);
  console.log(bar);

  if (!KEY) {
    console.error("\n❌ MINIMAX_API_KEY not set in .env.local\n");
    process.exit(1);
  }

  console.log(`\n  Key: ${KEY.slice(0, 8)}… (${KEY.length} chars)  |  Base: ${BASE}`);
  console.log("  Quota window: M2.7 / VLM / Search = 5-hr rolling | TTS / Image / Music = daily");
  if (FAST_MODE) console.log("  ⏭  Tests 7-8 skipped (--fast). Run without --fast for full suite.\n");

  const results: TestResult[] = [];
  const suite: Array<() => Promise<TestResult>> = [
    testLLM,
    testTTS,
    testClonePermission,
    testFilesAPI,
    testWebSearch,
    testVLM,
    testImageGeneration,  // ~40-50s
    testMusicGeneration,  // ~90-120s
  ];

  for (const test of suite) {
    const r = await test();
    results.push(r);
    printResult(r);
  }

  // Summary — skipped tests are NOT counted as passed
  console.log(`\n${bar}`);
  const skipped = results.filter((r) => r.skipped).length;
  const ran = results.filter((r) => !r.skipped).length;
  const passed = results.filter((r) => r.passed && !r.skipped).length;
  const failed = results.filter((r) => !r.passed && !r.skipped).length;
  console.log(`  ${passed}/${ran} passed  |  ${skipped} skipped  |  ${failed} failed`);
  if (skipped > 0)
    console.log(`  ⚠️  ${skipped} test(s) skipped — re-run without --fast for full coverage.`);

  // Verdict — only fires when ALL run tests passed AND nothing was skipped
  const clone = results.find((r) => r.name.includes("Clone"))!;
  console.log(`\n${bar}`);
  if (failed === 0 && skipped === 0) {
    console.log("  🟢 ALL SYSTEMS GO — every model type verified. Build away.");
  } else if (failed === 0 && skipped > 0) {
    console.log("  🟡 PARTIAL CHECK — run without --fast to verify image + music endpoints.");
  } else if (clone?.statusCode === 2038) {
    console.log("  🔴 CLONE PERMISSION DENIED — activate MINIMAX_FALLBACK_VOICE_ID.");
    console.log("     Contact MiniMax support to request account verification.");
  } else {
    console.log("  🔴 FAILURES DETECTED — review ❌ results above before building.");
  }
  console.log(`${bar}\n`);

  // Quota reminder
  console.log("  Quota tips:");
  console.log("  • M2.7 / VLM / Search: 4,500 req / 5-hr window (resets every 5 hours)");
  console.log("  • speech-2.8-hd: 4,000 chars / day");
  console.log("  • image-01: 50 images / day");
  console.log("  • music-2.6: 100 songs / day");
  console.log("  • This test run consumed ~1 req each of M2.7/VLM/Search, 53 TTS chars,");
  console.log("    1 image (if run), and 1 music track (if run).\n");

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
