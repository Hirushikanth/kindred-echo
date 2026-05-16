# Kindred Echo - Configuration Management Guide

## Prerequisites Checklist

Before building Kindred Echo, you need the following:

### 1. MiniMax API Access ✓
- **Status**: You have a Starter plan token
- **Required for**: 
  - Voice cloning (rapid voice clone feature)
  - M2.7-highspeed LLM for persona generation
  - Speech 2.6/2.8 for TTS
- **Action**: Provide your actual API key from [MiniMax Console](https://console.minimax.io)
- **Cost**: ~$1.50 per voice clone + TTS charges (usually <$1 per demo session)

### 2. Supabase Project (Recommended) ✓
- **Status**: Need setup or credentials
- **Required for**:
  - Storing family rooms and chat history
  - Managing voice clone metadata
  - User authentication and consent tracking
  - Real-time data sync (optional)
- **How to setup**:
  1. Go to [supabase.com](https://supabase.com)
  2. Click "Start Your Project"
  3. Create a new organization/project
  4. Choose region (close to your users)
  5. Set a strong database password
  6. Copy your credentials from Settings > API
- **Credentials needed**:
  - `NEXT_PUBLIC_SUPABASE_URL` (from API settings)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client-side, safe to expose)
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side, SECRET, keep secure)

### 3. Sample Audio (Optional for MVP)
- **Required for**: Demo purposes
- **Format**: MP3, WAV, or M4A
- **Duration**: 30-60 seconds minimum, 5 minutes maximum
- **Size**: Up to 20 MB
- **Source**: 
  - Family member voicemail
  - Voice memo
  - Audio interview
- **Privacy**: Only stored server-side, never exposed

## Configuration Storage Architecture

### Option A: Supabase (Recommended for MVP)
Stores all configuration in a PostgreSQL table with RLS (Row Level Security).

**Pros**:
- Single backend for data + config
- Real-time sync capability
- Scalable to production
- Free tier available

**Cons**:
- Requires Supabase project setup

**Table Schema**:
```sql
CREATE TABLE config_credentials (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  credential_key TEXT UNIQUE NOT NULL,
  credential_value TEXT NOT NULL,
  is_secret BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- RLS Policy: Only service role can read secrets
CREATE POLICY "service_role_read_secrets" 
  ON config_credentials 
  FOR SELECT 
  USING (auth.role() = 'service_role');
```

### Option B: Environment Variables (Faster for Hackathon)
Store secrets in `.env.local` (git-ignored).

**Pros**:
- No setup required
- Fast to implement
- Offline-capable

**Cons**:
- Manual env file management
- Not real-time

## What You Need to Provide

| Item | Priority | Format | Example |
|------|----------|--------|---------|
| MiniMax API Key | 🔴 HIGH | String | `sk_xxxxxxxxxxxxx` |
| Supabase URL | 🟡 MEDIUM | URL | `https://xxxxx.supabase.co` |
| Supabase Anon Key | 🟡 MEDIUM | String | `eyJxxxx...` |
| Supabase Service Role Key | 🟡 MEDIUM | String | `eyJxxxx...` |
| Sample Audio File | 🟢 LOW | Audio (MP3/WAV) | `grandma_voice.mp3` |

## Next Steps

1. **Provide MiniMax API Key** → I'll validate it
2. **Create/Provide Supabase Credentials** → I'll set up the schema
3. **Upload Sample Audio** → I'll test voice cloning
4. **Initialize Config Module** → I'll create autonomous credential manager
5. **Run Configuration Test** → Verify all services work

## Configuration Module Features

The autonomous config system will:
- ✅ Load credentials from Supabase or env
- ✅ Validate all required keys at startup
- ✅ Provide type-safe access to credentials
- ✅ Handle credential rotation
- ✅ Cache credentials with TTL
- ✅ Mask secrets in logs
- ✅ Provide audit trail of access

---

**Ready to proceed?** Share your credentials and I'll set everything up!
