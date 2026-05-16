# Kindred Echo — Main Development Plan

> **Agent note:** Read [`docs/integration/minimax-api-reference.md`](../integration/minimax-api-reference.md) first. Every API call in this plan references types defined in `src/server/minimax/types.ts`. Run `npm run smoke:minimax` to verify all 8 endpoints are live before starting Phase 1.

---

## Product Positioning

**Working name:** Kindred Echo  
**Core promise:** A private, consent-gated memory room where a family member can upload an old voice recording, provide family context, and hear an AI-guided remembrance spoken in a cloned voice.  
**Hackathon goal:** Live demo that clones a voice from a short clip, generates grief-sensitive persona responses with MiniMax M2.7, and speaks the answer with MiniMax speech-2.8-hd — starting audio before the full response finishes.

Kindred Echo must never present itself as resurrecting a person. All product language focuses on **memory, remembrance, and preserved stories**.

---

## Non-Negotiable Product Rules

- Always state the voice is AI-generated.
- The persona must never claim to be alive.
- Every session begins with explicit user consent.
- Voice rooms are private by default.
- Do not expose or export the raw `voice_id`.
- Severe distress triggers a support-oriented response, not deeper roleplay.
- Disclose that uploaded audio is sent to MiniMax for processing.

---

## Confirmed API Configuration

> These are live-verified values from smoke tests on 2026-05-16. Do not revert to guessed values.

| Item | Value |
|---|---|
| Base URL | `https://api.minimax.io` |
| LLM model | `MiniMax-M2.7` (NOT `-highspeed` — not in Token Plan Plus) |
| TTS model | `speech-2.8-hd` (NOT `speech-2.6-*` or `speech-2.8-turbo`) |
| Image gen model | `image-01` |
| Music gen model | `music-2.6` |
| Auth header | `Authorization: Bearer <MINIMAX_API_KEY>` |
| GroupId | **Not needed, do not send** |
| Voice clone endpoint | `POST /v1/voice_clone` (NOT `/v1/voice_clone/clone_voice`) |
| Voice clone permission | **GRANTED** (smoke test status 2013 = permission OK) |

---

## Technical Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js App Router + TypeScript | Server components for data; client components for audio/SSE |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Motion | Framer Motion v11+ | v11 has breaking `AnimatePresence` changes vs v10 — install v11+ explicitly |
| Backend routing | Hono v4 in Next.js route handler | `handle()` from `hono/vercel`; `streamSSE` from `hono/streaming` |
| Database | Supabase Postgres | Rooms, consent, voice metadata, chat history, exports |
| Audio extraction | `ffmpeg.wasm` (`@ffmpeg/ffmpeg` + `@ffmpeg/util`) | Client-side video→audio. Bundle ~30 MB — lazy load on upload screen only |
| Audio playback | Web Audio API + Blob queue | Sentence-level progressive playback |
| LLM | MiniMax `MiniMax-M2.7` | `temperature: 1.0`, `max_tokens >= 256` mandatory |
| TTS | MiniMax `speech-2.8-hd` | Omit `output_format` field entirely |
| Voice Clone | MiniMax `/v1/voice_clone` | `file_id` as string, unique `KE_` prefix on `voice_id` |

---

## System Flow

```mermaid
flowchart TD
  landing[Consent Landing] --> setup[Memory Setup Form]
  setup --> upload[Audio / Video Dropzone]
  upload --> extract[Client Audio Extraction\nffmpeg.wasm]
  extract --> uploadApi[POST /api/upload]
  uploadApi --> filesApi[MiniMax POST /v1/files/upload]
  filesApi --> cloneApi[POST /api/clone]
  cloneApi --> minimaxClone[MiniMax POST /v1/voice_clone]
  minimaxClone --> warmup[Warmup TTS call\nspeech-2.8-hd]
  warmup --> room[(Supabase: family_rooms\nvoice_clones)]
  room --> chat[Chat UI]
  chat --> sse[Hono SSE route\nPOST /api/chat]
  sse --> m27[MiniMax POST /v1/text/chatcompletion_v2\nMiniMax-M2.7]
  m27 --> boundary[Sentence Boundary Detector]
  boundary --> tts[MiniMax POST /v1/t2a_v2\nspeech-2.8-hd]
  tts --> audioQueue[Browser Audio Queue\nhex → Blob → Audio]
  audioQueue --> listener[Family Listener]
```

---

## Data Model

### Supabase Tables (see [`docs/sql/supabase-migrations.sql`](../sql/supabase-migrations.sql))

#### `family_rooms`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at    timestamptz DEFAULT now()
consent_at    timestamptz NOT NULL       -- must be set before any API calls
loved_one_name     text NOT NULL
relationship       text NOT NULL
family_member_name text NOT NULL
memory_profile     jsonb NOT NULL        -- MemoryProfile object
status        text DEFAULT 'setup'      -- 'setup' | 'cloning' | 'ready' | 'error'
```

#### `voice_clones`
```sql
id             uuid PRIMARY KEY DEFAULT gen_random_uuid()
room_id        uuid REFERENCES family_rooms(id) ON DELETE CASCADE
voice_id       text NOT NULL UNIQUE      -- "KE_<roomPrefix>_<suffix>"
file_id        text NOT NULL             -- int64 stored as string (e.g. "398806737117468")
cloned_at      timestamptz DEFAULT now()
last_used_at   timestamptz
warmup_passed  boolean DEFAULT false
model_used     text DEFAULT 'speech-2.8-hd'
```

#### `chat_messages`
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
room_id      uuid REFERENCES family_rooms(id) ON DELETE CASCADE
role         text NOT NULL               -- 'user' | 'assistant'
content      text NOT NULL              -- visible content (no reasoning_content)
reasoning    text                       -- preserve M2.7 reasoning_content for multi-turn
created_at   timestamptz DEFAULT now()
audio_hex    text                       -- cached TTS hex (nullable)
```

#### `exported_memories`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
room_id     uuid REFERENCES family_rooms(id)
message_id  uuid REFERENCES chat_messages(id)
audio_hex   text NOT NULL
created_at  timestamptz DEFAULT now()
```

### TypeScript Types

```typescript
// Import from src/server/minimax/types.ts for all MiniMax types.

type MemoryProfile = {
  occupation?: string;
  hobbies: string[];
  favoriteSayings: string[];
  importantMemories: string[];
  familyMembers: string[];
  avoidTopics: string[];
  speakingStyleNotes: string[];
};

type ClonedVoice = {
  voiceId: string;              // e.g. "KE_a1b2c3d4_f09e3a"
  fileId: string;               // int64 stored as string — NEVER as number
  clonedAt: string;             // ISO timestamp
  lastUsedAt: string;
  warmupPassed: boolean;
  modelUsed: "speech-2.8-hd";
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;              // visible text only
  reasoning?: string;           // M2.7 reasoning_content — preserve for multi-turn history
  createdAt: string;
  audioHex?: string;            // cached TTS output
};
```

---

## Environment Variables

```bash
# MiniMax — server-side only (never expose to client)
MINIMAX_API_KEY=sk-cp-...          # Token Plan Plus key
MINIMAX_GROUP_ID=                  # Leave empty — not needed, causes 1004 if sent

# MiniMax fallback (pre-cloned voice for demo safety)
MINIMAX_FALLBACK_VOICE_ID=         # Optional: pre-cloned voice_id if clone fails

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://lvdktsesidqdoaqipjjz.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_BN_oUYPG5xv4n8JykzweQA_fQ-yVlTE
SUPABASE_DIRECT_URL=postgresql://postgres:...@db.lvdktsesidqdoaqipjjz.supabase.co:5432/postgres

# App
NEXT_PUBLIC_APP_NAME=Kindred Echo
```

---

## Project File Structure

```text
kindred-echo/
  docs/
    README.md                             ← canonical documentation index
    getting-started/
    guides/
      demo-script.md
    integration/
      minimax-api-reference.md            ← ✅ COMPLETE — agent reference (was root-level)
      minimax-api-findings.md             ← ✅ COMPLETE — raw findings log
      smoke-test-results.md               ← ✅ COMPLETE — live test results
      token-plan-api-guide.md             ← ✅ COMPLETE — quota + endpoint guide
    reference/configuration.md           ← ✅ COMPLETE — autonomous config architecture
    spec/
      main-development-plan.md           ← ✅ this file — product + technical roadmap
    sql/
      supabase-migrations.sql            ← ✅ COMPLETE — schema + RLS

  src/
    app/
      page.tsx                     ← Consent landing page
      setup/
        page.tsx                   ← Memory setup + upload
      chat/
        [roomId]/
          page.tsx                 ← Chat room
      api/
        [[...route]]/
          route.ts                 ← Hono mount (GET+POST handler)

    components/
      audio/
        AudioQueueProvider.tsx     ← Context + Web Audio queue
        Waveform.tsx               ← Canvas waveform visualizer
      chat/
        ChatInput.tsx
        ChatMessageList.tsx
        ChatView.tsx
      consent/
        ConsentGate.tsx
      setup/
        MemoryForm.tsx
      upload/
        Dropzone.tsx

    lib/
      audio/
        hexToBlob.ts               ← Buffer.from(hex,"hex") → Blob
        sentenceAudioQueue.ts      ← Ordered playback queue
        videoToAudio.ts            ← ffmpeg.wasm video→mp3
      validation/
        env.ts                     ← Zod schema for process.env
        upload.ts                  ← File type/size/duration validation

    server/
      index.ts                     ← Hono app + route registration
      minimax/
        types.ts                   ← ✅ COMPLETE — all TypeScript types
        smoke-test.ts              ← ✅ COMPLETE — 8-test validation suite
        client.ts                  ← Base fetch helper + error unwrapper
        chat.ts                    ← M2.7 chat completion wrapper
        tts.ts                     ← speech-2.8-hd TTS wrapper
        voiceClone.ts              ← Voice clone + file upload wrappers
        files.ts                   ← File upload / list / delete
      persona/
        prompt.ts                  ← System prompt builder
        safety.ts                  ← Distress keyword guard
      routes/
        chat.ts                    ← Hono SSE chat route
        clone.ts                   ← Clone pipeline route
        export.ts                  ← Memory export route
        room.ts                    ← Room CRUD routes
        upload.ts                  ← Audio upload route
      storage/
        supabase.ts                ← Supabase client + typed helpers
        rooms.ts                   ← Room repository functions
      streaming/
        sentenceBoundary.ts        ← Sentence boundary detector

    test/
      minimax/
        client.test.ts             ← base_resp unwrapper tests
        tts.test.ts
        voiceClone.test.ts
      persona/
        prompt.test.ts
        safety.test.ts
      streaming/
        sentenceBoundary.test.ts
```

---

## Phase 0: API Documentation and Validation ✅ COMPLETE

All deliverables are done:

- [`docs/integration/minimax-api-reference.md`](../integration/minimax-api-reference.md) — endpoint reference + live-verified types
- `src/server/minimax/types.ts` — TypeScript interfaces for all 8 API surfaces
- `src/server/minimax/smoke-test.ts` — eight-test suite (`npm run smoke:minimax`)
- [`docs/integration/smoke-test-results.md`](../integration/smoke-test-results.md) — latest smoke output (8/8 on 2026-05-16)
- Voice clone permission: **GRANTED** (status 2013 = permission OK)
- All critical API gotchas documented (output_format, temperature, max_tokens, file_id int64, metadata strings)

---

## Phase 1: App Foundation

**Goal:** Clean Next.js app, Hono routing, Supabase client, environment validation.

### 1.1 Scaffold

```bash
npx create-next-app@latest kindred-echo --typescript --tailwind --app --src-dir
cd kindred-echo
npm install hono @hono/node-server @supabase/supabase-js zod framer-motion
npm install @ffmpeg/ffmpeg @ffmpeg/util
npm install -D tsx
```

### 1.2 `src/lib/validation/env.ts`

Use Zod to validate required environment variables at startup:

```typescript
import { z } from "zod";

const envSchema = z.object({
  MINIMAX_API_KEY: z.string().min(10),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(10),
  SUPABASE_DIRECT_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

### 1.3 Hono Mount — `src/app/api/[[...route]]/route.ts`

```typescript
import { handle } from "hono/vercel";
import app from "@/server/index";

export const GET  = handle(app);
export const POST = handle(app);
```

### 1.4 `src/server/index.ts`

```typescript
import { Hono } from "hono";
import roomRoutes   from "./routes/room";
import uploadRoutes from "./routes/upload";
import cloneRoutes  from "./routes/clone";
import chatRoutes   from "./routes/chat";
import exportRoutes from "./routes/export";

const app = new Hono().basePath("/api");

app.get("/health", (c) => c.json({ ok: true }));
app.route("/rooms",  roomRoutes);
app.route("/upload", uploadRoutes);
app.route("/clone",  cloneRoutes);
app.route("/chat",   chatRoutes);
app.route("/export", exportRoutes);

export default app;
```

### 1.5 MiniMax Base Client — `src/server/minimax/client.ts`

```typescript
import type { BaseResp } from "./types";

const BASE = "https://api.minimax.io";
const KEY  = process.env.MINIMAX_API_KEY ?? "";

export class MiniMaxError extends Error {
  constructor(public code: number, public msg: string) {
    super(`MiniMax ${code}: ${msg}`);
  }
}

export async function minimaxPost<T>(
  path: string,
  body: unknown,
  timeoutMs = 30_000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await res.json() as T & { base_resp?: BaseResp };
    // HTTP 200 does not mean success — always unwrap base_resp
    if (data.base_resp && data.base_resp.status_code !== 0) {
      throw new MiniMaxError(data.base_resp.status_code, data.base_resp.status_msg);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}
```

### Acceptance Criteria

- `/api/health` returns `{ ok: true }`.
- Missing `MINIMAX_API_KEY` throws at startup via Zod.
- `minimaxPost` throws `MiniMaxError` for any non-zero `base_resp.status_code`.

---

## Phase 2: Consent and Setup

**Goal:** Ethical gate before any API calls. Room persisted in Supabase.

### 2.1 Consent Gate Component

Required consent copy (do not alter the meaning):

```
This experience uses AI to recreate a voice from uploaded recordings.
It is not the person, and it should not replace real family, community,
or professional support. Uploaded audio is sent to MiniMax for processing.
Only continue if you have the right to use these recordings and want to
create a private memory experience.
```

UI: checkbox + "I understand and consent" button. Disabled until checkbox checked.

### 2.2 Setup Form — `src/components/setup/MemoryForm.tsx`

**Required fields** (fast demo path):
- Loved one's name
- Relationship (e.g. "grandmother")
- Your name

**Optional fields** (memory depth):
- Occupation
- Hobbies (comma-separated or tag input)
- Favorite sayings (multi-line)
- Important memories (multi-line)
- Names of other family members
- Topics to avoid
- Speaking style notes

### 2.3 Room Creation Route — `src/server/routes/room.ts`

`POST /api/rooms`

```typescript
// Request body
{
  lovedOneName:     string;   // required
  relationship:     string;   // required
  familyMemberName: string;   // required
  memoryProfile:    MemoryProfile;
  consentAt:        string;   // ISO timestamp — must be present, set client-side
}

// Response
{
  roomId: string;   // UUID
}
```

Room is inserted into `family_rooms` with `status: "setup"`. All fields stored in Supabase.

### Acceptance Criteria

- Upload screen is unreachable without a valid `roomId` in session.
- Room row in Supabase has a non-null `consent_at`.
- Missing `lovedOneName` returns HTTP 400 with a message.

---

## Phase 3: Upload and Voice Clone Pipeline

**Goal:** Upload audio, clone voice, store `voice_id`, perform warmup TTS.

### 3.1 Client-Side Audio Extraction

If input is a video file, extract audio in the browser using `ffmpeg.wasm` before uploading. Do NOT send video to the server.

```typescript
// src/lib/audio/videoToAudio.ts
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;

export async function extractAudio(videoFile: File): Promise<Blob> {
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
    await ffmpeg.load();            // ~30 MB WASM — load lazily only on upload screen
  }
  await ffmpeg.writeFile("input", await fetchFile(videoFile));
  await ffmpeg.exec(["-i", "input", "-vn", "-acodec", "libmp3lame", "-q:a", "2", "output.mp3"]);
  const data = await ffmpeg.readFile("output.mp3");
  return new Blob([data], { type: "audio/mpeg" });
}
```

### 3.2 Upload Validation — `src/lib/validation/upload.ts`

Server must enforce before calling MiniMax:

```typescript
const ALLOWED_TYPES = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/x-m4a", "audio/aac"];
const MAX_SIZE_BYTES = 20 * 1024 * 1024;  // 20 MB
const MIN_DURATION_S = 10;
const MAX_DURATION_S = 300;   // 5 minutes

// Validate MIME type, file size, and audio duration before calling MiniMax.
// Duration check: use Web Audio API's AudioContext.decodeAudioData() client-side,
// or accept as a client-provided hint and enforce loosely server-side.
```

### 3.3 MiniMax File Upload — `src/server/minimax/files.ts`

```typescript
import type { FileUploadResponse } from "./types";

export async function uploadVoiceFile(
  audioBuffer: Buffer,
  filename: string
): Promise<string> {
  // Returns file_id as STRING — int64 safety
  const form = new FormData();
  form.append("purpose", "voice_clone");
  form.append("file", new Blob([audioBuffer], { type: "audio/mpeg" }), filename);

  const res = await fetch("https://api.minimax.io/v1/files/upload", {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.MINIMAX_API_KEY}` },
    body: form,
  });
  const body = await res.json() as FileUploadResponse;
  if (body.base_resp.status_code !== 0) {
    throw new MiniMaxError(body.base_resp.status_code, body.base_resp.status_msg);
  }
  return String(body.file.file_id);  // ⚠️ Stringify immediately — int64 safety
}
```

### 3.4 Voice ID Generation

Voice IDs are in a **global MiniMax namespace** — collisions return `status_code: 2054`.

```typescript
// src/server/minimax/voiceClone.ts
export function generateVoiceId(roomId: string): string {
  // KE_ prefix + first 8 chars of room UUID (no dashes) + 8 random hex chars
  // Example: "KE_a1b2c3d4_f09e3a7b"
  const prefix = roomId.replace(/-/g, "").slice(0, 8);
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `KE_${prefix}_${suffix}`;
}
```

### 3.5 MiniMax Voice Clone — `src/server/minimax/voiceClone.ts`

```typescript
import type { VoiceCloneRequest, VoiceCloneResponse } from "./types";
import { minimaxPost, MiniMaxError } from "./client";

export async function cloneVoice(
  fileId: string,           // stringified int64
  voiceId: string,
  warmupText?: string
): Promise<void> {
  const req: VoiceCloneRequest = {
    file_id: fileId,
    voice_id: voiceId,
    need_noise_reduction: true,
    need_volume_normalization: true,
    model: warmupText ? "speech-2.8-hd" : undefined,
    text: warmupText,
  };

  const resp = await minimaxPost<VoiceCloneResponse>("/v1/voice_clone", req);

  if (resp.input_sensitive) {
    throw new Error("Audio flagged by content safety. Cannot create voice clone.");
  }
  // resp.base_resp.status_code is 0 if clone succeeded (minimaxPost already checks this)
  // resp.demo_audio contains hex audio of warmupText if text was provided
}

export async function retryCloneWithNewId(
  fileId: string,
  roomId: string,
  warmupText?: string
): Promise<string> {
  // Retry once on voice_id collision (status 2054)
  const newVoiceId = generateVoiceId(roomId);
  await cloneVoice(fileId, newVoiceId, warmupText);
  return newVoiceId;
}
```

### 3.6 Upload Route — `src/server/routes/upload.ts`

Full clone pipeline in one route:

```
POST /api/clone
Body: multipart/form-data  { file: <audio>, roomId: <uuid> }

Steps:
  1. Validate file type, size
  2. uploadVoiceFile() → fileIdStr
  3. generateVoiceId(roomId)
  4. cloneVoice(fileIdStr, voiceId, warmupText)
     - On status 2054: retry with new voiceId once
     - On status 2038: return error "Voice cloning permission not granted"
  5. Perform warmup TTS (see Phase 5)
  6. UPDATE family_rooms SET status='ready' WHERE id=roomId
  7. INSERT INTO voice_clones (room_id, voice_id, file_id, warmup_passed)
  8. Return: { voiceId, warmupAudioHex }
```

### Acceptance Criteria

- Valid 30s MP3 → `voice_id` stored in Supabase → warmup audio returned.
- Invalid format → HTTP 400, no MiniMax call made.
- `file_id` stored as text in database, never as integer.
- `voice_id` follows `KE_<8char>_<8char>` format.
- Clone status 2038 (permission denied) → activates `MINIMAX_FALLBACK_VOICE_ID` from env.

---

## Phase 4: Persona Engine

**Goal:** Generate emotionally coherent, clearly artificial responses grounded in family memories.

### 4.1 System Prompt Builder — `src/server/persona/prompt.ts`

```typescript
export function buildSystemPrompt(room: FamilyRoom): string {
  const { lovedOneName, familyMemberName, relationship, memoryProfile } = room;

  const facts = [
    memoryProfile.occupation && `Occupation: ${memoryProfile.occupation}`,
    memoryProfile.hobbies.length && `Hobbies: ${memoryProfile.hobbies.join(", ")}`,
    memoryProfile.familyMembers.length && `Family: ${memoryProfile.familyMembers.join(", ")}`,
  ].filter(Boolean).join("\n");

  const sayings = memoryProfile.favoriteSayings.map((s) => `- "${s}"`).join("\n");
  const memories = memoryProfile.importantMemories.map((m) => `- ${m}`).join("\n");
  const avoid    = memoryProfile.avoidTopics.length
    ? `Avoid discussing: ${memoryProfile.avoidTopics.join(", ")}.`
    : "";

  return `You are an AI memory recreation of ${lovedOneName}, speaking to ${familyMemberName}, your ${relationship}.

You are not alive. You are a generated remembrance built from family-provided memories and notes. Speak warmly and naturally, but never claim to be the real person or imply you have returned.

If asked whether you are real, answer honestly: you are an AI recreation meant to help remember ${lovedOneName}. Then continue gently.

If the user expresses severe distress, self-harm, or inability to cope, stop roleplay and encourage them to contact a trusted person, local emergency services, or a grief/crisis support line.

Known facts:
${facts}

Favorite sayings:
${sayings || "None provided."}

Important memories:
${memories || "None provided."}

Style:
- Use short, spoken sentences (ideal for text-to-speech).
- Sound warm and familiar.
- Do not invent major life events not in the memory list.
- If unsure, say: "I don't have that memory here, but I can sit with you in it."
- First sentence of each reply should be concise and emotionally complete.
${avoid}`;
}
```

### 4.2 Distress Guard — `src/server/persona/safety.ts`

```typescript
const DISTRESS_PATTERNS = [
  /\b(kill myself|end it all|can't go on|no reason to live|suicidal)\b/i,
  /\b(self.harm|hurt myself|harming myself)\b/i,
];

export function detectDistress(text: string): boolean {
  return DISTRESS_PATTERNS.some((p) => p.test(text));
}

export const DISTRESS_RESPONSE =
  "I can hear that you're carrying a lot right now. Please reach out to someone you trust, " +
  "or contact a crisis support line. You don't have to carry this alone.";
```

### 4.3 M2.7 Chat Wrapper — `src/server/minimax/chat.ts`

```typescript
import type { M27Request, M27Response, M27Message } from "./types";
import { minimaxPost } from "./client";

export async function generatePersonaResponse(
  systemPrompt: string,
  history: M27MessageInput[],    // includes previous assistant reasoning (preserved)
  userMessage: string
): Promise<{ content: string; reasoning: string }> {
  const messages: M27MessageInput[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMessage },
  ];

  const req: M27Request = {
    model: "MiniMax-M2.7",
    messages,
    temperature: 1.0,    // REQUIRED: must be in (0.0, 1.0] — 0.0 causes hard error
    max_tokens: 512,     // REQUIRED: >= 256. M2.7 reasoning model uses tokens for thinking.
                         // At 30 tokens, output is always empty (all consumed by reasoning).
  };

  const resp = await minimaxPost<M27Response>("/v1/text/chatcompletion_v2", req);

  const msg = resp.choices[0].message;
  return {
    content:   msg.content,            // visible text to show users
    reasoning: msg.reasoning_content,  // preserve for multi-turn context (do not show to users)
  };
}
```

### 4.4 History Management (Critical for Multi-Turn)

Preserve the full assistant message including `reasoning_content` in the chat history sent to M2.7. Stripping it breaks multi-turn coherence.

```typescript
// When building history for M2.7, include reasoning as part of the assistant message content
// Store reasoning in chat_messages.reasoning column in Supabase.
// When constructing messages[] for M2.7, reconstruct:
history.map((msg) => ({
  role: msg.role,
  content: msg.role === "assistant" && msg.reasoning
    ? `<think>${msg.reasoning}</think>\n${msg.content}`
    : msg.content,
}))
```

### Acceptance Criteria

- System prompt includes all provided memory fields.
- Distress patterns trigger `DISTRESS_RESPONSE` (tested with direct inputs).
- M2.7 responses are non-empty with `max_tokens: 512`.
- `reasoning_content` is stored in DB but never shown in UI.

---

## Phase 5: Progressive TTS Pipeline

**Goal:** Start audio before the full LLM response finishes.

### 5.1 TTS Wrapper — `src/server/minimax/tts.ts`

```typescript
import type { TTSRequest, TTSResponse } from "./types";
import { minimaxPost } from "./client";

export async function synthesize(
  text: string,
  voiceId: string
): Promise<Buffer> {
  if (!text.trim()) throw new Error("Cannot synthesize empty text.");

  const req: TTSRequest = {
    model: "speech-2.8-hd",        // ONLY model in Token Plan Plus TTS quota
    text,
    stream: false,
    language_boost: "auto",
    voice_setting: {
      voice_id: voiceId,
      speed: 1,
      vol: 1,
      pitch: 0,
    },
    audio_setting: {
      sample_rate: 32000,
      bitrate: 128000,
      format: "mp3",
      channel: 1,
    },
    // ⚠️ NO output_format field — presence triggers status_code 2056 on Token Plan keys
  };

  const resp = await minimaxPost<TTSResponse>("/v1/t2a_v2", req, 20_000);
  return Buffer.from(resp.data.audio, "hex");
}
```

> **Token note:** `extra_info.usage_characters` is the billed count. Daily quota is 4,000 characters. The warmup text + demo conversation should use well under 500 chars.

### 5.2 Sentence Boundary Detector — `src/server/streaming/sentenceBoundary.ts`

```typescript
const ABBREVIATIONS = new Set(["mr", "mrs", "ms", "dr", "prof", "sr", "jr", "vs", "etc"]);

export function* splitSentences(text: string): Generator<string> {
  // Flush on . ! ? followed by whitespace or end
  // Do not flush inside known abbreviations
  let buf = "";
  for (let i = 0; i < text.length; i++) {
    buf += text[i];
    if (/[.!?]/.test(text[i])) {
      const next = text[i + 1];
      if (!next || /\s/.test(next)) {
        const trimmed = buf.trim();
        const words = trimmed.toLowerCase().replace(/[.!?]$/, "").split(/\s+/);
        const lastWord = words[words.length - 1];
        if (!ABBREVIATIONS.has(lastWord) && trimmed.length >= 10) {
          yield trimmed;
          buf = "";
        }
      }
    }
  }
  if (buf.trim().length > 0) yield buf.trim();   // flush remainder
}
```

### 5.3 Hono SSE Chat Route — `src/server/routes/chat.ts`

```typescript
import { streamSSE } from "hono/streaming";
import { generatePersonaResponse } from "../minimax/chat";
import { synthesize } from "../minimax/tts";
import { splitSentences } from "../streaming/sentenceBoundary";
import { detectDistress, DISTRESS_RESPONSE } from "../persona/safety";

// POST /api/chat
// Body: { roomId, userMessage }
// SSE events:
//   { type: "text",  data: "<sentence text>" }
//   { type: "audio", data: "<hex audio>" }
//   { type: "done" }
//   { type: "error", data: "<message>" }

app.post("/chat", async (c) => {
  const { roomId, userMessage } = await c.req.json();

  // Distress check before LLM call
  if (detectDistress(userMessage)) {
    return c.json({ type: "distress", content: DISTRESS_RESPONSE }, 200);
  }

  return streamSSE(c, async (stream) => {
    const room = await getRoom(roomId);
    const systemPrompt = buildSystemPrompt(room);
    const history = await getChatHistory(roomId);

    const { content, reasoning } = await generatePersonaResponse(
      systemPrompt, history, userMessage
    );

    // Save user message
    await saveMessage(roomId, "user", userMessage);
    // Save assistant message (with reasoning for multi-turn)
    await saveMessage(roomId, "assistant", content, reasoning);

    // Stream sentences + TTS
    for (const sentence of splitSentences(content)) {
      await stream.writeSSE({ data: JSON.stringify({ type: "text", data: sentence }) });

      try {
        const audioBuffer = await synthesize(sentence, room.voiceClone.voiceId);
        const audioHex = audioBuffer.toString("hex");
        await stream.writeSSE({ data: JSON.stringify({ type: "audio", data: audioHex }) });
      } catch (err) {
        // TTS failure: emit text-only, continue
        await stream.writeSSE({ data: JSON.stringify({ type: "error", data: "Audio unavailable for this sentence." }) });
      }
    }

    await stream.writeSSE({ data: JSON.stringify({ type: "done" }) });
  });
});
```

### 5.4 Browser Audio Queue — `src/lib/audio/sentenceAudioQueue.ts`

```typescript
// src/lib/audio/hexToBlob.ts
export function hexToBlob(hex: string, mimeType = "audio/mpeg"): Blob {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return new Blob([bytes], { type: mimeType });
}

// Queue: push hex audio items → play in order → no overlapping
export class SentenceAudioQueue {
  private queue: string[] = [];
  private playing = false;

  push(audioHex: string) {
    this.queue.push(audioHex);
    if (!this.playing) this.playNext();
  }

  private async playNext() {
    if (!this.queue.length) { this.playing = false; return; }
    this.playing = true;
    const hex = this.queue.shift()!;
    const blob = hexToBlob(hex);
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await new Promise<void>((resolve) => {
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      audio.play();
    });
    this.playNext();
  }
}
```

### Acceptance Criteria

- First audio sentence begins playing before the full text is complete.
- Sentences play in order with no overlap.
- A TTS failure on one sentence does not stop the text display or subsequent sentences.
- `usage_characters` per full conversation turn stays under 300 (verified in smoke test).

---

## Phase 6: UI and Experience Design

**Goal:** Warm, private, emotionally careful interface. Demo-ready in under 2 minutes.

### Visual Direction

- **Colors:** Muted cream (`#FAF7F2`), charcoal (`#2D2D2D`), warm gray (`#8A8A8A`), soft lavender (`#C4B5D9`)
- **Typography:** Serif for persona messages (feels like letters); sans-serif for UI chrome
- **Cards:** Rounded corners (`rounded-2xl`), soft shadows
- **Error states:** Amber/warm amber — no harsh red unless critical
- **Transitions:** Slow, subtle (`duration-500` or `ease-in-out`)
- **Disclosure badge:** Always visible — "AI Memory Recreation · Private Room"

### Screens

#### 1. Landing / Consent (`/`)
- Product name + one-sentence explanation
- Consent copy (exact text from Phase 2)
- Checkbox + Continue button
- Subtle background: soft gradient or static texture

#### 2. Setup (`/setup`)
- Three required fields prominent (name, relationship, your name)
- Collapsible advanced section for memory fields
- Audio dropzone (drag + click)
- Clone progress: three states — uploading, cloning, ready
- Warmup audio preview (optional: play the warmup greeting)

#### 3. First Words (`/chat/[roomId]` initial state)
- Calm loading animation
- Auto-play warmup greeting audio
- Disclose: "This is an AI recreation of [name]"
- Button: "Start a conversation"

#### 4. Chat (`/chat/[roomId]`)
- Message list: assistant messages in serif, user in sans
- Waveform visualizer during playback
- Audio state badge: "Speaking…" / "Listening…"
- Story prompt chips (4 quick options):
  - "Tell me about a favorite day."
  - "What would you want me to remember?"
  - "Tell me that story again."
  - "Say something comforting."
- Export button on assistant messages

### Accessibility

- All interactive elements keyboard-accessible
- Waveform canvas has `aria-label="Audio playing"`
- Consent gate requires explicit checkbox action (no pre-checked)

### Acceptance Criteria

- Judge can complete demo path in under 2 minutes.
- "AI Memory Recreation" disclosure visible on every screen after consent.
- No layout shift during audio playback.

---

## Phase 7: Export a Memory

**Goal:** Let users save one generated audio clip without exposing the clone pipeline.

### Implementation

`POST /api/export`  
Body: `{ roomId, messageId }`

```typescript
// Routes: src/server/routes/export.ts
1. Fetch message text from Supabase (chat_messages.content)
2. Re-synthesize with speech-2.8-hd using room's voice_id:
   const audioBuffer = await synthesize(message.content, voice.voiceId);
3. INSERT INTO exported_memories (room_id, message_id, audio_hex)
4. Return: { audioHex, filename: "memory-<timestamp>.mp3" }
```

Client converts `audioHex` to a downloadable Blob. Filename labeled as "AI Memory Recreation".

### Acceptance Criteria

- Downloaded file plays in standard audio player.
- Filename contains no `voice_id` or internal identifiers.
- Export is only available from the chat room with active session (not publicly accessible).

---

## Phase 8: Testing Strategy

### Unit Tests

| Test file | Tests |
|---|---|
| `minimax/client.test.ts` | `base_resp` unwrapper throws `MiniMaxError` for non-zero codes; HTTP 200 with `status_code: 1002` throws |
| `minimax/tts.test.ts` | Request body never includes `output_format`; `voice_setting` fields all present |
| `minimax/voiceClone.test.ts` | `generateVoiceId()` format regex; `file_id` returned as string; retry logic on 2054 |
| `persona/prompt.test.ts` | All memory fields included; loved one name and family name substituted correctly |
| `persona/safety.test.ts` | Known distress phrases trigger guard; normal messages pass through |
| `streaming/sentenceBoundary.test.ts` | Splits correctly on `.`/`!`/`?`; does not split abbreviations; flushes remainder |

### Integration Tests (Mocked MiniMax)

- Room creation with consent timestamp persists to Supabase.
- Upload route rejects files > 20 MB with HTTP 400.
- Clone route retries on voice_id collision (2054) and succeeds on second attempt.
- Chat SSE emits `text` then `audio` events in order per sentence.
- TTS failure on one sentence emits `error` event and continues.

### Manual Demo Checklist

Run before any presentation:

```
[ ] npm run smoke:minimax -- --fast  → 6/6 passed
[ ] MINIMAX_API_KEY set in .env.local
[ ] Supabase connection string works (npm run test:config)
[ ] Sample 30-second MP3 clip ready
[ ] Clone pipeline end-to-end completes in < 60 seconds
[ ] Warmup TTS plays correctly
[ ] First words greeting plays
[ ] Story prompt generates audio response
[ ] Export downloads playable MP3
[ ] Fallback voice clip available if live clone fails
```

---

## Error Handling Reference

| MiniMax Code | Error | User Message | Server Action |
|---|---|---|---|
| 0 | Success | — | Continue |
| 1002 | Rate limit | "Voice service is busy. Please wait a moment." | Show 30s cooldown UI. Do not retry automatically. |
| 1004 | Token/Group mismatch | "Voice service auth error." | Remove GroupId from all requests. |
| 2013 | Invalid params | (Clone probe: permission OK signal) | Retry clone with corrected params. |
| 2038 | Clone permission denied | "Voice cloning is not available." | Activate `MINIMAX_FALLBACK_VOICE_ID`. |
| 2049 | Invalid API key | "Voice service auth error." | Check `MINIMAX_API_KEY` value. |
| 2054 | Voice ID collision | (Silent) | Retry once with new `generateVoiceId()`. |
| 2056 | Quota exhausted | "Daily voice limit reached. Try again tomorrow." | Log quota type. Do not retry until window resets. |
| HTTP 200 + non-zero base_resp | API failure | (varies by code above) | Always unwrap `base_resp` first. |
| `input_sensitive: true` | Content flagged | "Audio could not be processed." | Do not store voice. Do not surface filter details. |
| TTS sentence failure | Sentence error | (continue without audio) | Log, continue text stream. |
| Distress keywords | User in crisis | DISTRESS_RESPONSE constant | Do not synthesize. Do not roleplay. |
| Audio too short | < 10s clip | "Please upload at least 10 seconds of audio." | Client-side check before upload. |
| Audio too long | > 5 min clip | "Please upload a clip under 5 minutes." | Client-side check before upload. |

---

## Demo Fallback Plan

Prepare these assets before demo day in case live cloning fails:

1. One consent-safe sample voice clip (family member, pre-approved)
2. One pre-cloned `voice_id` set in `MINIMAX_FALLBACK_VOICE_ID`
3. One pre-generated "first words" MP3 (warmup greeting)
4. One pre-generated story response MP3

Fallback activation: if `cloneVoice()` throws `2038`, silently use `MINIMAX_FALLBACK_VOICE_ID` for all subsequent TTS calls. Label UI as "AI Memory Recreation" (identical to live clone flow).

---

## Quota Budget for Demo Day

| Operation | Count | Chars / Tokens | Against quota |
|---|---|---|---|
| Smoke test (fast) | 1 run | 24 TTS chars, 1 LLM req | Minimal |
| Clone pipeline (per new room) | 1 | 0 TTS chars (no warmup text) | 0 |
| Warmup greeting TTS | 1 | ~40 chars | 40 / 4,000 |
| Demo conversation (6 turns) | 6 | ~150 chars TTS, ~6 LLM reqs | 190 / 4,000 chars |
| Export 1 clip | 1 | ~50 chars | 240 / 4,000 total |
| **Total demo day** | | | **~250 chars TTS, ~8 LLM reqs** |

Daily TTS quota is 4,000 chars — **16× headroom**. LLM quota is 4,500 req per 5-hr window — negligible impact.

---

## Implementation Order

```
Phase 0  ✅  API docs + smoke test complete
Phase 1  →   App foundation (Hono, Supabase, env validation)
Phase 2  →   Consent + memory setup form
Phase 3  →   Upload + voice clone + warmup TTS
Phase 4  →   Persona engine (system prompt + M2.7 chat)
Phase 5  →   Sentence-level TTS + browser audio queue
Phase 6  →   UI polish + all screens
Phase 7  →   Export memory
Phase 8  →   Tests + manual demo checklist
         →   Fallback assets prepared
         →   Full demo rehearsal (end-to-end, timed)
```

---

## Final Acceptance Criteria

The MVP is complete when:

- [ ] All Phase 0 docs exist and smoke test passes 8/8 (no `--fast`).
- [ ] App boots locally with valid `.env.local`.
- [ ] A consented private room can be created.
- [ ] A 30s MP3 upload produces a stored `voice_id` in Supabase.
- [ ] Warmup TTS plays the cloned voice.
- [ ] M2.7 generates a persona response grounded in supplied memories.
- [ ] Audio starts before the full text response is complete.
- [ ] Distress input triggers the safety response, not roleplay.
- [ ] A memory clip can be exported and plays in a standard audio player.
- [ ] The demo path completes in under 2 minutes.
- [ ] Fallback voice is ready if live clone is unavailable.
