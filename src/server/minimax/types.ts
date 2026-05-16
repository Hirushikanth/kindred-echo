/**
 * MiniMax API — Complete TypeScript Types
 *
 * All types verified against live API responses (2026-05-16, Token Plan Plus).
 * Account: ArqByte (UID 511929836918784005)
 * Base URL: https://api.minimax.io  (all endpoints)
 * Auth:     Authorization: Bearer <MINIMAX_API_KEY>  (no GroupId header needed)
 *
 * MANDATORY: Every response must be checked for base_resp.status_code === 0.
 * HTTP 200 does NOT guarantee success. Always unwrap base_resp first.
 */

// ────────────────────────────────────────────────────────────────────────────
// Common
// ────────────────────────────────────────────────────────────────────────────

export interface BaseResp {
  /** 0 = success. Non-zero = error. See MiniMaxErrorCode for known values. */
  status_code: number;
  /** "" on success, human-readable error message on failure. */
  status_msg: string;
}

/** Check this before reading any response fields. HTTP 200 ≠ success. */
export function isSuccess(resp: { base_resp?: BaseResp }): boolean {
  return resp.base_resp?.status_code === 0;
}

// ────────────────────────────────────────────────────────────────────────────
// 1. Text Generation — POST /v1/text/chatcompletion_v2
// ────────────────────────────────────────────────────────────────────────────

export interface M27MessageInput {
  role: "user" | "assistant" | "system";
  /** Message text content. */
  content: string;
  /** Optional display name for the participant. */
  name?: string;
}

export interface M27Request {
  /** MUST be "MiniMax-M2.7" — "-highspeed" variant requires a different plan. */
  model: "MiniMax-M2.7";
  messages: M27MessageInput[];
  /**
   * REQUIRED. Must be in (0.0, 1.0] — exactly 0.0 causes a hard API error.
   * Recommended: 1.0 (default for reasoning models).
   */
  temperature: number;
  /**
   * REQUIRED. Must be >= 256.
   * M2.7 is a reasoning model — it spends tokens on internal thinking before
   * producing visible output. At max_tokens=30 the output is always empty
   * because all tokens are consumed by reasoning_content.
   */
  max_tokens: number;
  /** Default: false. For streaming, handle SSE chunks separately. */
  stream?: boolean;
  /** Nucleus sampling. Default: 0.95. */
  top_p?: number;
  /**
   * n > 1 is silently ignored — always returns 1 choice.
   * Omit or set to 1.
   */
  n?: 1;
}

export interface M27ReasoningDetail {
  /** Always "reasoning.text" in current API version. */
  type: "reasoning.text";
  /** e.g. "reasoning-text-1" */
  id: string;
  /** Always "MiniMax-response-v1" */
  format: "MiniMax-response-v1";
  /** Always 0 (first and only detail block) */
  index: number;
  /** Full reasoning text — same content as reasoning_content. */
  text: string;
}

export interface M27ResponseMessage {
  /** The visible assistant reply. Empty string if all max_tokens were consumed by reasoning. */
  content: string;
  role: "assistant";
  /** Always "MiniMax AI" */
  name: string;
  /** Audio content if audio mode was requested. Always "" in text-only mode. */
  audio_content: string;
  /** Full internal reasoning/thinking text. May be hundreds of tokens long. */
  reasoning_content: string;
  /**
   * Structured breakdown of reasoning. Typically 1 item.
   * Same text as reasoning_content but with metadata (type, id, format, index).
   */
  reasoning_details: M27ReasoningDetail[];
}

export interface M27Choice {
  finish_reason: "stop" | "length" | "content_filter";
  index: number;
  message: M27ResponseMessage;
}

export interface M27CompletionTokenDetails {
  /** Tokens spent on reasoning (internal thinking). Not billed separately. */
  reasoning_tokens: number;
}

export interface M27Usage {
  total_tokens: number;
  /**
   * Always 0 on Token Plan (characters are not the billing unit for LLM).
   * Token Plan bills by request count, not characters.
   */
  total_characters: number;
  prompt_tokens: number;
  /**
   * Total completion tokens = reasoning_tokens + visible_output_tokens.
   * visible_output_tokens = completion_tokens - completion_tokens_details.reasoning_tokens
   */
  completion_tokens: number;
  completion_tokens_details: M27CompletionTokenDetails;
}

export interface M27Response {
  /** Unique trace ID for this completion. */
  id: string;
  /** Always length 1 (n > 1 is silently ignored). */
  choices: M27Choice[];
  /** Unix timestamp of when the completion was created. */
  created: number;
  model: string;
  object: "chat.completion";
  usage: M27Usage;
  /** true if the prompt triggered MiniMax content safety filter. */
  input_sensitive: boolean;
  /** true if the output triggered MiniMax content safety filter. */
  output_sensitive: boolean;
  /** 0 = no issue. */
  input_sensitive_type: number;
  /** 0 = no issue. */
  output_sensitive_type: number;
  /** 0 = no issue. */
  output_sensitive_int: number;
  base_resp: BaseResp;
}

// ────────────────────────────────────────────────────────────────────────────
// 2. Text-to-Speech — POST /v1/t2a_v2
// ────────────────────────────────────────────────────────────────────────────

export interface VoiceSetting {
  /**
   * Built-in voice ID or a previously cloned voice_id.
   * Confirmed working built-in (international): "English_expressive_narrator"
   */
  voice_id: string;
  /** Speech speed. Range: 0.5–2.0. Default: 1.0. */
  speed: number;
  /** Volume. Range: 0.1–10.0. Default: 1.0. */
  vol: number;
  /** Pitch shift in semitones. Range: -12 to 12. Default: 0. */
  pitch: number;
}

export interface TTSAudioSetting {
  sample_rate: 8000 | 16000 | 22050 | 24000 | 32000 | 44100;
  bitrate: 32000 | 64000 | 128000 | 256000;
  format: "mp3" | "pcm" | "flac";
  channel: 1 | 2;
}

export interface TTSRequest {
  /**
   * MUST be "speech-2.8-hd".
   * "speech-2.8-turbo" and "speech-2.6-*" are NOT in Token Plan Plus TTS quota.
   */
  model: "speech-2.8-hd";
  /** 1–10,000 characters. Billed by usage_characters count. */
  text: string;
  /** Default: false. */
  stream?: boolean;
  /**
   * Language hint. Default: "auto".
   * Other options: "en", "zh", "ja", "ko", etc.
   */
  language_boost?: string;
  voice_setting: VoiceSetting;
  audio_setting?: TTSAudioSetting;
  /**
   * ⚠️ DO NOT include this field.
   * Including output_format routes through a different code path that returns
   * status_code 2056 on Token Plan keys — even though audio comes back as hex regardless.
   * Omit entirely. Audio is always in data.audio as hex.
   */
  // output_format?: never;
}

export interface TTSData {
  /**
   * Hex-encoded audio bytes. Decode with: Buffer.from(audio, "hex")
   * Format matches audio_setting.format (default mp3).
   */
  audio: string;
  /** Always 2 (completed) for non-streaming responses. */
  status: 2;
  /** Internal field. Always "". Safe to ignore. */
  ced: string;
}

export interface TTSExtraInfo {
  /** Audio duration in milliseconds. */
  audio_length: number;
  /** e.g. 32000 */
  audio_sample_rate: number;
  /** Actual size of audio data in bytes. */
  audio_size: number;
  /** e.g. 128000 */
  bitrate: number;
  /** Number of characters processed (confusingly named — this is chars, not words). */
  word_count: number;
  /** Ratio of invisible/control characters. 0 = none. */
  invisible_character_ratio: number;
  /**
   * Billed characters. This counts against the 4,000 chars/day daily quota.
   * Invisible characters (spaces, punctuation) may not be billed.
   */
  usage_characters: number;
  /** e.g. "mp3" */
  audio_format: string;
  /** 1 = mono, 2 = stereo */
  audio_channel: number;
}

export interface TTSResponse {
  data: TTSData;
  extra_info: TTSExtraInfo;
  /** Unique trace ID. */
  trace_id: string;
  base_resp: BaseResp;
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Voice Clone — POST /v1/voice_clone
// ────────────────────────────────────────────────────────────────────────────

export interface VoiceCloneRequest {
  /**
   * File ID of the uploaded audio (from Files API).
   * ⚠️ Store as string — the API returns int64 JSON numbers which exceed
   * JS Number.MAX_SAFE_INTEGER in theory. Stringify immediately on receipt.
   * Pass back to this endpoint as a string — the API accepts string-format numbers.
   */
  file_id: string;
  /**
   * The ID you want to assign to this cloned voice.
   * ⚠️ GLOBAL namespace — voice_ids are shared across all MiniMax accounts.
   * Use a unique prefix to avoid collisions: e.g. "KE_<userId>_<uuid>"
   */
  voice_id: string;
  /**
   * Optional: TTS model to use for generating a demo audio clip after cloning.
   * If omitted, demo_audio in the response will be "".
   */
  model?: "speech-2.8-hd";
  /**
   * Optional: text to synthesize with the newly cloned voice for preview.
   * Requires model to also be set.
   */
  text?: string;
  /** Optional: apply noise reduction to the uploaded audio before cloning. */
  need_noise_reduction?: boolean;
  /** Optional: normalize volume of the uploaded audio before cloning. */
  need_volume_normalization?: boolean;
}

export interface VoiceCloneResponse {
  /** Whether the input audio triggered content safety filter. */
  input_sensitive: boolean;
  /** 0 = no issue. */
  input_sensitive_type: number;
  /**
   * Hex audio of the cloned voice saying the text field (if text was provided).
   * "" if no text was provided or cloning failed.
   */
  demo_audio: string;
  /**
   * base_resp.status_code meanings for this endpoint:
   *   0    → clone successful
   *   2013 → "invalid params" — bad file_id or voice_id format, but PERMISSION IS OK
   *           (used as the permission probe signal — 2013 means account CAN clone)
   *   2038 → permission DENIED — account not verified for voice cloning
   *   2054 → voice_id already exists in global namespace — choose a different ID
   *   2056 → quota exhausted
   */
  base_resp: BaseResp;
}

// ────────────────────────────────────────────────────────────────────────────
// 4. Files API
// ────────────────────────────────────────────────────────────────────────────

/**
 * Upload: POST /v1/files/upload
 * Body: multipart/form-data
 * Fields:
 *   purpose: "voice_clone"
 *   file: <binary audio data>  (Content-Type: audio/mpeg or appropriate MIME)
 * Requirements:
 *   - Audio duration: 10 seconds to 5 minutes
 *   - Supported formats: mp3, m4a, wav, aac, ogg, flac
 *   - Recommended: clear speech with minimal background noise
 */

export interface FileObject {
  /**
   * ⚠️ This is a JSON number (int64). May be up to 18 digits.
   * In JS: immediately convert to string with String(file_id) to avoid precision loss.
   * Example live value: 398806737117468 (15 digits — currently within JS safe range,
   * but don't rely on this — always stringify.)
   */
  file_id: number;
  /** File size in bytes. */
  bytes: number;
  /** Unix timestamp of upload time. */
  created_at: number;
  /** Original filename provided during upload. */
  filename: string;
  /** Always "voice_clone" for Kindred Echo usage. */
  purpose: "voice_clone";
}

export interface FileUploadResponse {
  file: FileObject;
  base_resp: BaseResp;
}

/**
 * List: GET /v1/files/list?purpose=voice_clone&page_size=<n>
 * No request body. Query params only.
 */
export interface FileListResponse {
  files: FileObject[];
  base_resp: BaseResp;
}

/**
 * Delete: POST /v1/files/delete
 * Body: { file_id: number }
 */
export interface FileDeleteRequest {
  file_id: number;
}

export interface FileDeleteResponse {
  /** The file_id of the deleted file (same value as the request). */
  file_id: number;
  base_resp: BaseResp;
}

/**
 * Get file info: GET /v1/files/{file_id}
 * Returns FileObject directly (no wrapper).
 */

// ────────────────────────────────────────────────────────────────────────────
// 5. Web Search — POST /v1/coding_plan/search
// ────────────────────────────────────────────────────────────────────────────

export interface WebSearchRequest {
  /**
   * Search query string.
   * ⚠️ Field name is "q" — NOT "query". Using "query" silently fails.
   */
  q: string;
}

export interface SearchOrganicResult {
  title: string;
  link: string;
  snippet: string;
  /** ISO date string or "" when date is unavailable. */
  date: string;
}

export interface SearchRelatedQuery {
  query: string;
}

export interface WebSearchResponse {
  /** Up to 10 organic search results. */
  organic: SearchOrganicResult[];
  /** Up to 8 related search suggestions. */
  related_searches: SearchRelatedQuery[];
  base_resp: BaseResp;
}

// ────────────────────────────────────────────────────────────────────────────
// 6. Image Understanding (VLM) — POST /v1/coding_plan/vlm
// ────────────────────────────────────────────────────────────────────────────

export interface VLMRequest {
  prompt: string;
  /**
   * ⚠️ MUST be a base64 data URI — plain HTTPS URLs return status_code 2013.
   * Format: "data:image/jpeg;base64,<base64-encoded-image-bytes>"
   * Procedure: fetch image → arrayBuffer → Buffer.from(buf).toString("base64") → prepend data URI prefix
   */
  image_url: string;
}

export interface VLMResponse {
  /** The model's description / answer to the prompt. */
  content: string;
  base_resp: BaseResp;
}

// ────────────────────────────────────────────────────────────────────────────
// 7. Image Generation — POST /v1/image_generation
// ────────────────────────────────────────────────────────────────────────────

export interface ImageGenRequest {
  model: "image-01";
  prompt: string;
  /**
   * Aspect ratio of the generated image.
   * Default: "1:1"
   */
  aspect_ratio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "2:3" | "3:2";
  /**
   * "url"    → response contains image_urls (expire in 24 hours — store promptly)
   * "base64" → response contains base64-encoded image data
   * Default: "url"
   */
  response_format?: "url" | "base64";
  /** Number of images to generate. Range: 1–4. Default: 1. */
  n?: number;
}

export interface ImageGenData {
  /**
   * Array of image URLs (if response_format="url") or base64 strings (if "base64").
   * URLs are hosted on Aliyun OSS and expire after 24 hours.
   */
  image_urls: string[];
}

export interface ImageGenMetadata {
  /**
   * ⚠️ These are STRING values, NOT numbers — e.g. "1", "0".
   * Use parseInt(metadata.success_count, 10) for arithmetic.
   */
  success_count: string;
  failed_count: string;
}

export interface ImageGenResponse {
  /** Unique trace ID for this generation. */
  id: string;
  data: ImageGenData;
  metadata: ImageGenMetadata;
  base_resp: BaseResp;
}

// ────────────────────────────────────────────────────────────────────────────
// 8. Music Generation — POST /v1/music_generation
// ────────────────────────────────────────────────────────────────────────────

export interface MusicAudioSetting {
  sample_rate?: 16000 | 32000 | 44100;
  bitrate?: 64000 | 128000 | 256000;
  format?: "mp3" | "pcm" | "flac";
}

export interface MusicGenRequest {
  model: "music-2.6";
  /** Style, mood, and instrumentation description for the generated track. */
  prompt: string;
  /**
   * Set to true to generate instrumental music without lyrics.
   * When false or omitted, lyrics field becomes required.
   */
  is_instrumental?: boolean;
  /**
   * Lyrics for the generated song.
   * Required when is_instrumental is false or omitted.
   * Ignored when is_instrumental is true.
   */
  lyrics?: string;
  audio_setting?: MusicAudioSetting;
}

export interface MusicGenData {
  /**
   * Hex-encoded audio bytes.
   * Decode: Buffer.from(audio, "hex")
   * Typical size: 2–3 MB for a full-length track (~140 seconds).
   */
  audio: string;
  /** Always 2 (completed) for synchronous responses. */
  status: 2;
}

export interface MusicGenExtraInfo {
  /** Track duration in milliseconds. e.g. 139755 = ~140 seconds */
  music_duration: number;
  /** e.g. 44100 */
  music_sample_rate: number;
  /** 2 = stereo (always stereo for music-2.6) */
  music_channel: number;
  /** e.g. 128000 */
  bitrate: number;
  /** Actual bytes of audio data. */
  music_size: number;
}

export interface MusicGenResponse {
  data: MusicGenData;
  /** Unique trace ID. */
  trace_id: string;
  extra_info: MusicGenExtraInfo;
  /**
   * Reserved field. Always null in current API version.
   * Do not attempt to read properties from this value.
   */
  analysis_info: null;
  base_resp: BaseResp;
}

// ────────────────────────────────────────────────────────────────────────────
// Error Codes
// ────────────────────────────────────────────────────────────────────────────

export const MINIMAX_ERROR = {
  SUCCESS: 0,
  /** Rate limit exceeded. Retry after the quota window resets. */
  RATE_LIMIT: 1002,
  /**
   * Token/Group mismatch. Caused by sending GroupId in the Authorization
   * header or request body when not required. Remove GroupId entirely.
   */
  TOKEN_GROUP_MISMATCH: 1004,
  /**
   * Invalid params / invalid API key.
   * For voice clone: status 2013 = input validation failed BUT permission IS granted.
   * Use as the "permission OK" signal in the clone probe.
   */
  INVALID_PARAMS: 2013,
  /** Voice clone permission denied. Account not verified for voice cloning. */
  CLONE_PERMISSION_DENIED: 2038,
  /** Invalid API key or key does not exist. */
  INVALID_API_KEY: 2049,
  /** Voice ID not found. The voice_id used in TTS does not exist. */
  VOICE_NOT_FOUND: 2054,
  /**
   * Quota exhausted.
   * - "0/0 used" display is a known MiniMax dashboard bug — the limit IS enforced.
   * - For TTS: do not include output_format field — it triggers 2056 on Token Plan keys.
   * - Resets on schedule: 5-hr window for LLM/VLM/Search, daily for TTS/Image/Music.
   */
  QUOTA_EXHAUSTED: 2056,
} as const;

// ────────────────────────────────────────────────────────────────────────────
// Quota Reference (Token Plan Plus, verified 2026-05-16)
// ────────────────────────────────────────────────────────────────────────────

export const TOKEN_PLAN_QUOTA = {
  /** Text generation, VLM, web search — shared 5-hour rolling window. */
  LLM_VLM_SEARCH: { limit: 4500, window: "5hr" },
  /** TTS speech-2.8-hd — daily reset. */
  TTS: { limit: 4000, unit: "chars", window: "daily" },
  /** Image generation — daily reset. */
  IMAGE: { limit: 50, unit: "images", window: "daily" },
  /** Music generation — daily reset. */
  MUSIC: { limit: 100, unit: "songs", window: "daily" },
  /** Music cover — daily reset. */
  MUSIC_COVER: { limit: 100, unit: "songs", window: "daily" },
  /** Lyrics generation — daily reset. */
  LYRICS: { limit: 100, unit: "requests", window: "daily" },
} as const;

// ────────────────────────────────────────────────────────────────────────────
// Built-in Voice IDs (international platform, confirmed working)
// ────────────────────────────────────────────────────────────────────────────

export const BUILTIN_VOICES = {
  /**
   * Confirmed working on api.minimax.io with Token Plan Plus.
   * Primary recommended voice for Kindred Echo.
   */
  ENGLISH_EXPRESSIVE_NARRATOR: "English_expressive_narrator",
} as const;
