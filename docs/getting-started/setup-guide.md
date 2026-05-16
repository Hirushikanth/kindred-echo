# Kindred Echo - Setup & Configuration Guide

## 📋 Prerequisites Summary

Based on your project review, here's what you need:

| Item | Status | Priority | Action |
|------|--------|----------|--------|
| **MiniMax API Key** | ✓ Have Starter plan | 🔴 HIGH | Provide actual API key |
| **Supabase Project** | Need setup/credentials | 🟡 MEDIUM | Create project or provide credentials |
| **Sample Audio** | Not yet | 🟢 LOW | We'll generate or you can provide |
| **Node.js/npm** | Assumed | 🟡 MEDIUM | v18+ required |

---

## Step 1️⃣: Get Your MiniMax API Key

### From your Starter plan:

1. Go to [MiniMax Console](https://console.minimax.io)
2. Navigate to **API Keys**
3. Copy your API key (looks like `sk_xxxxxxxxxxxxx`)
4. Save it safely - you'll need it in Step 4

**Why you need it:**
- Voice cloning from uploaded audio
- M2.7 LLM for persona responses
- Speech synthesis (TTS) for audio output
- Costs ~$1.50 per demo + TTS charges

---

## Step 2️⃣: Create a Supabase Project

### Option A: Free Supabase Cloud (Recommended)

1. Go to [supabase.com](https://supabase.com)
2. Click **Start Your Project** or **Sign In**
3. **Create new organization** (if first time)
   - Organization name: `Kindred Echo` (or your preference)
   - Click **Create organization**
4. **Create new project**
   - Project name: `kindred-echo`
   - Database password: `strong_random_password` (save this!)
   - Region: Choose closest to your location
   - Pricing: Free tier is sufficient for MVP
   - Click **Create new project**
5. Wait 2-3 minutes for project initialization
6. You'll see the **Project URL Dashboard**

### Getting Your Credentials:

1. In Supabase dashboard, click **⚙️ Settings** (bottom left)
2. Click **API** in the left sidebar
3. Copy these three values:

   ```
   NEXT_PUBLIC_SUPABASE_URL = Project URL
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = publishable key
   DATABASE_URL = direct Postgres connection string (server-side secret)
   ```

4. Save them - you'll use them in Step 4

### Setup the Database Schema:

1. Still in Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire contents of `docs/sql/supabase-migrations.sql`
4. Paste it into the SQL editor
5. Click **Run** (or Cmd+Enter)
6. You should see success messages ✅

✨ Your database is now ready!

---

## Step 3️⃣: Prepare Sample Audio (Optional for MVP)

The demo works best with a 30-60 second voice recording.

### Option A: Use Your Own Audio
- Record a voicemail, voice memo, or audio interview
- Format: MP3, WAV, or M4A
- Duration: 30-60 seconds
- Size: Under 20 MB
- Keep it private/secure

### Option B: Use Placeholder Audio
We can generate test audio if you prefer (I can create this).

**Where to put it:**
```
kindred-echo/
└── public/
    └── sample-audio.mp3  ← Put your audio here
```

---

## Step 4️⃣: Create Environment File

1. From the cloned repository root, create `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and fill in your credentials:
   ```bash
   # From Step 1 - MiniMax
   MINIMAX_API_KEY=sk_xxxxxxxxxxxxx

   # From Step 2 - Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxx
   DATABASE_URL=postgresql://postgres:your_encoded_password@db.xxxxx.supabase.co:5432/postgres
   SUPABASE_DIRECT_URL=postgresql://postgres:your_encoded_password@db.xxxxx.supabase.co:5432/postgres

   # App config
   NEXT_PUBLIC_APP_NAME=Kindred Echo
   NODE_ENV=development
   ```

3. Save the file (⚠️ Never commit this file!)

### Verify .env.local is in .gitignore:
```bash
cat .gitignore | grep env
```

You should see `.env.local` in the list.

---

## Step 5️⃣: Install Dependencies

```bash
npm install

# Or if using pnpm:
pnpm install

# Or if using yarn:
yarn install
```

**Dependencies that will be installed:**
- `next` - Next.js framework
- `hono` - HTTP routing
- `@supabase/supabase-js` - Supabase client
- `zod` - Type validation
- `framer-motion` - Animations
- `@ffmpeg/ffmpeg` - Audio extraction
- `tailwindcss` - Styling
- Plus testing and dev tools

---

## Step 6️⃣: Test Configuration

Run the configuration validation:

```bash
npm run test:config
```

**Expected output:**
```
✅ MiniMax API Key: valid
✅ Supabase URL: valid
✅ Supabase publishable/client key: valid
✅ Supabase direct database URL: valid
✅ Configuration initialized successfully
```

If you see errors, check:
- API keys are correct (no extra spaces)
- Supabase credentials are from the right project
- `.env.local` is in the root directory
- Environment variables are loaded by checking: `cat .env.local`

---

## Step 7️⃣: Run the Development Server

```bash
npm run dev
```

**Expected output:**
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Environments: .env.local
  ✓ Ready in XXms
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Autonomous Configuration System

The configuration manager (`src/server/config/manager.ts`) will:

✅ **Auto-load** credentials from `.env.local` on startup
✅ **Validate** all required keys are present
✅ **Cache** credentials for 5 minutes to reduce API calls
✅ **Sync** with Supabase if configured
✅ **Provide** type-safe credential access throughout the app
✅ **Log** credential access for security audit trail
✅ **Handle** errors gracefully with fallback to env vars

### Usage in Your Code:

```typescript
// Server-side (protected)
import { config } from "@/server/config/manager";

// Initialize on app startup
const credentials = await config.initialize();

// Get specific credential
const miniMaxKey = await config.get("MINIMAX_API_KEY");

// Check if credential exists
const hasSupabase = await config.has("NEXT_PUBLIC_SUPABASE_URL");

// Get all credentials (cached)
const allCreds = await config.getAll();
```

---

## 🚀 Next Steps After Setup

1. ✅ Verify MiniMax API key works with smoke test
2. ✅ Test voice cloning pipeline
3. ✅ Build consent and setup flow
4. ✅ Implement chat with M2.7
5. ✅ Add progressive TTS
6. ✅ Polish UI

---

## ⚠️ Security Reminders

- **Never** commit `.env.local`
- **Never** share your `DATABASE_URL`, `SUPABASE_DIRECT_URL`, or optional `SUPABASE_SERVICE_ROLE_KEY`
- **Always** use `NEXT_PUBLIC_*` only for non-secret values
- **Always** keep `MINIMAX_API_KEY` server-side only
- **Rotate** credentials regularly
- **Use** Supabase RLS for database security

---

## 🆘 Troubleshooting

### "Missing MINIMAX_API_KEY"
→ Check `.env.local` file exists and has the key

### "Invalid Supabase URL"
→ Make sure URL starts with `https://` and ends with `.supabase.co`

### "Supabase connection failed"
→ Verify credentials are from the same Supabase project

### "ENOENT: no such file or directory"
→ Run `npm install` first to install all dependencies

### "Port 3000 already in use"
→ Kill existing process or use: `npm run dev -- -p 3001`

---

## 📞 Support

If you're stuck:
1. Check error messages carefully
2. Verify credentials are correct
3. Run `npm run test:config`
4. Check logs: `tail -f .next/logs`

**You're ready to build! 🎉**
