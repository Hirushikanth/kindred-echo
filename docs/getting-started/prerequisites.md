# 🎯 Kindred Echo - Prerequisites Checklist

## What You Need to Provide

Print this page and check off each item as you gather them.

---

## 📝 Prerequisites Gathering Form

### 1. MiniMax API Credentials

**Status**: You have Starter plan ✓

- [ ] Go to [console.minimax.io](https://console.minimax.io)
- [ ] Navigate to "API Keys"
- [ ] Copy your API key
- [ ] **Format**: Should start with `sk_`
- [ ] **Keep secure**: Store safely, never commit to git

**Your MiniMax API Key:**
```
MINIMAX_API_KEY = ___________________________________
```

**What's needed from MiniMax:**
- ✅ Voice cloning API access
- ✅ M2.7-highspeed model access
- ✅ Speech 2.6/2.8 models access

---

### 2. Supabase Project Setup

**Status**: Need to create or provide existing

#### Option A: Create New Supabase Project

- [ ] Visit [supabase.com](https://supabase.com)
- [ ] Click "Start Your Project"
- [ ] Sign up / Log in
- [ ] Create new project
  - [ ] Organization name: `Kindred Echo`
  - [ ] Project name: `kindred-echo`
  - [ ] Password: `strong_random_password_here`
  - [ ] Region: Choose closest to your location
- [ ] Wait 2-3 minutes for setup
- [ ] Proceed to "Get Your Credentials" below

#### Option B: Provide Existing Supabase Credentials

- [ ] You already have Supabase project
- [ ] Go to Settings > API in your dashboard
- [ ] Get the credentials below

#### Get Your Credentials

1. Go to Supabase Dashboard
2. Click ⚙️ **Settings** (bottom left)
3. Click **API** in sidebar
4. Copy these THREE values:

**Your Supabase Credentials:**
```
NEXT_PUBLIC_SUPABASE_URL = _______________________________
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = ___________________
DATABASE_URL = ___________________________________________
```

**Format check:**
- [ ] URL starts with `https://` and ends with `.supabase.co`
- [ ] Anon key is ~150+ characters
- [ ] Service role key is ~150+ characters
- [ ] Service role key is kept SECRET (never share!)

**What's needed from Supabase:**
- ✅ PostgreSQL database
- ✅ Real-time capabilities (optional)
- ✅ Row Level Security (RLS) policies
- ✅ Authentication (optional)

---

### 3. Sample Audio (Optional for MVP)

**Status**: Optional but recommended for testing

- [ ] **Option A**: Record your own
  - [ ] Duration: 30-60 seconds
  - [ ] Format: MP3, WAV, or M4A
  - [ ] Quality: Clear audio, normal speaking voice
  - [ ] Source: Voicemail, voice memo, or interview
  - [ ] Location: Save as `kindred-echo/public/sample-audio.mp3`

- [ ] **Option B**: Use generated placeholder
  - [ ] We can generate test audio automatically

**Audio specifications:**
- ✅ Duration: 10 seconds - 5 minutes
- ✅ Format: MP3, WAV, M4A
- ✅ Size: Under 20 MB
- ✅ Privacy: Keep secure

---

## ✅ Setup Environment File

Once you have all credentials:

1. Copy template (from repo root):
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` in your editor

3. Fill in your credentials:
   ```bash
   MINIMAX_API_KEY=sk_xxxxxxxxxxxxx
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxx
   DATABASE_URL=postgresql://postgres:your_encoded_password@db.xxxxx.supabase.co:5432/postgres
   SUPABASE_DIRECT_URL=postgresql://postgres:your_encoded_password@db.xxxxx.supabase.co:5432/postgres
   NEXT_PUBLIC_APP_NAME=Kindred Echo
   NODE_ENV=development
   ```

4. **IMPORTANT**: Never commit this file!
   - [ ] Verify `.env.local` is in `.gitignore`

---

## 🗄️ Database Setup

After creating Supabase project:

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open file: `docs/sql/supabase-migrations.sql`
4. Copy ALL contents
5. Paste into SQL editor
6. Click **Run**
7. Wait for success ✅

**Tables created:**
- ✅ `config_credentials` - Store API keys
- ✅ `family_rooms` - Store room data
- ✅ `chat_messages` - Store conversations
- ✅ `voice_clones` - Track cloned voices
- ✅ `exported_memories` - Store exported clips
- ✅ `credential_access_logs` - Audit trail

---

## 🧪 Validation Test

After setup:

```bash
npm install
npm run test:config
```

**Expected results:**
- [ ] Environment Variables: ✅
- [ ] MiniMax API Key Format: ✅
- [ ] Supabase URL: ✅
- [ ] Supabase Keys: ✅
- [ ] Supabase Connection: ✅
- [ ] .env.local File: ✅

**Status**: 6 passed, 0 failed, 0 warnings

---

## 🚀 Ready to Launch

- [ ] All credentials gathered
- [ ] `.env.local` file created
- [ ] Database migrations run
- [ ] Validation test passed ✅

**Start development:**
```bash
npm run dev
```

**Open in browser:**
```
http://localhost:3000
```

---

## 📊 Credential Matrix

| Credential | Source | Type | Keep Secret? | Format |
|------------|--------|------|--------------|--------|
| `MINIMAX_API_KEY` | MiniMax Console | Server | 🔴 YES | `sk_xxxxx` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Settings | Shared | 🟢 NO | HTTPS URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Settings | Client | 🟢 NO | `sb_publishable_...` |
| `DATABASE_URL` | Supabase Database Settings | Server | 🔴 YES | Postgres URL |

---

## 🔐 Security Reminders

- 🚫 **Never** commit `.env.local`
- 🚫 **Never** share `DATABASE_URL` or `SUPABASE_DIRECT_URL`
- 🚫 **Never** expose `MINIMAX_API_KEY`
- ✅ **Always** use `NEXT_PUBLIC_*` only for non-secret values
- ✅ **Always** validate credentials on startup
- ✅ **Always** log credential access

---

## 📞 Troubleshooting

### "Missing MINIMAX_API_KEY"
- [ ] Check `.env.local` exists
- [ ] Verify API key is not empty
- [ ] Copy key again from MiniMax console

### "Invalid Supabase URL"
- [ ] Must start with `https://`
- [ ] Must end with `.supabase.co`
- [ ] No trailing slashes

### "Supabase connection failed"
- [ ] Verify anon key is complete
- [ ] Run database migrations
- [ ] Check Supabase project is active

### "Configuration validation failed"
- [ ] Run: `npm run test:config`
- [ ] Check each error message
- [ ] Fix missing/invalid values
- [ ] Run again

---

## 📝 Completion Checklist

**Before you start building:**

- [ ] MiniMax API key obtained and saved
- [ ] Supabase project created
- [ ] Three Supabase credentials copied
- [ ] `.env.local` file created with all values
- [ ] Database migrations run in Supabase
- [ ] `npm install` completed
- [ ] `npm run test:config` passes
- [ ] `npm run dev` starts successfully
- [ ] Can open http://localhost:3000

---

## 🎉 You're Ready!

All prerequisites are gathered and validated.

**Next step**: Open README.md to start building! 🚀
