# Kindred Echo Demo Script

## One-Line Pitch

Kindred Echo creates a private AI memory room where a family can hear preserved stories spoken in a loved one's cloned voice, with clear consent and AI disclosure built into the experience.

## 90-Second Demo Flow

1. Open the landing page.
2. Read the disclosure: this is an AI recreation, not the person.
3. Accept consent.
4. Upload a 30-second voicemail.
5. Fill in:
   - Loved one's name
   - Relationship
   - One memory
6. Click **Meet the Memory**.
7. Wait for MiniMax voice clone and warmup TTS.
8. Play the first greeting:

```text
Hello, sweetheart. I'm here as a memory of the voice you loved. Tell me what you want to remember today.
```

9. Ask:

```text
Tell me about the summer at the lake.
```

10. Show streaming text and progressive audio playback.
11. Export the generated memory as an AI-labeled keepsake audio clip.

## Judge Talking Points

- The app uses MiniMax across three layers: M2.7 for persona, Voice Clone for the voice, and Speech 2.6 for low-latency TTS.
- It starts audio before the full model response finishes by splitting streamed text into sentence-level TTS jobs.
- The product treats ethics as core UX: consent gate, private room, no public `voice_id`, no claim that the person is alive.
- The build is grounded in official MiniMax docs, including real endpoint constraints and pricing.

## Fallback Checklist

Prepare these before demo time:

- A verified MiniMax API key with balance.
- Voice cloning permission confirmed.
- One valid 30-second MP3 under 20 MB.
- One pre-cloned `voice_id` in case live cloning fails.
- One pre-generated first-greeting MP3.
- One pre-generated story-response MP3.
- A short note explaining that fallback audio is only used if live API access fails.

