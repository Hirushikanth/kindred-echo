# Kindred Echo 💔🎤

> Conversational AI that helps families hear preserved memories in a loved one's cloned voice, while staying explicit that the experience is an AI recreation.

## 🎯 What is Kindred Echo?

Kindred Echo is a private, consent-gated memory room where family members can:
1. **Upload** old voice recordings
2. **Provide** family context and memories
3. **Hear** an AI-guided remembrance spoken in a cloned voice
4. **Export** one generated memory clip as a keepsake

The experience is designed to be **emotionally careful**, **transparent about AI**, and **grief-sensitive**.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MiniMax API key (for voice cloning & TTS)
- Supabase project (free tier available)

### 1. Clone & Install
```bash
git clone https://github.com/hareeshkar/kindred-echo.git
cd kindred-echo
npm install
```

### 2. Setup Configuration
Follow the **[Setup guide](./docs/getting-started/setup-guide.md)** for:
- Getting your MiniMax API key
- Creating a Supabase project
- Setting up `.env.local`
- Running the database migrations

### 3. Validate Configuration
```bash
npm run test:config
```

### 4. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Project structure

**Current repository layout:**

```
kindred-echo/
├── docs/               # Canonical documentation hub (see docs/README.md)
├── src/server/
│   ├── config/         # Autonomous configuration + credential validation helpers
│   └── minimax/        # Verified MiniMax typings + smoke-test harness
├── package.json
├── tsconfig.json
└── .env.example
```

The **[main development plan](./docs/spec/main-development-plan.md)** describes the full Next.js routing, streaming chat, FFmpeg upload path, persona layer, Supabase repos, etc. Implement those pieces progressively; the tree above reflects what ships in Git today.

### Documentation layout (`docs/`)

| Path | Role |
|------|------|
| `getting-started/` | Prerequisites, onboarding, guided setup |
| `guides/` | Configuration recap, demos, cheatsheets |
| `spec/` | Product + architecture master plan |
| `integration/` | MiniMax endpoints, quotas, verification logs |
| `reference/` | Autonomous credential architecture deep dive |
| `sql/` | Supabase DDL + Row Level Security |
| `archive/` | Frozen handoff narratives (historic context only) |

---

## 🔧 Configuration & Credentials

### What You Need

| Item | Source | Purpose |
|------|--------|---------|
| **MiniMax API Key** | [MiniMax Console](https://console.minimax.io) | Voice cloning, LLM, TTS |
| **Supabase URL** | [Supabase Dashboard](https://supabase.com) | PostgreSQL database |
| **Supabase Publishable Key** | Supabase Settings > API | Client-side access |
| **Direct Postgres URL** | Supabase Settings > Database | Server-side database access (SECRET!) |

### Autonomous Configuration System

Kindred Echo uses an **autonomous configuration manager** that:

✅ **Auto-validates** all required credentials on startup
✅ **Loads** from `.env.local` or Supabase database
✅ **Caches** credentials for performance (5min TTL)
✅ **Provides** type-safe credential access
✅ **Logs** credential access for security audit trail
✅ **Handles** errors gracefully with fallback

**Usage in code:**
```typescript
import { config } from "@/server/config/manager";

// Get all credentials
const creds = await config.getAll();

// Get specific credential
const miniMaxKey = await config.get("MINIMAX_API_KEY");

// Check if credential exists
const hasSupabase = await config.has("NEXT_PUBLIC_SUPABASE_URL");
```

---

## 📋 Available Scripts

```bash
# Development
npm run dev                # Start dev server (port 3000)
npm run build             # Build for production
npm run start             # Start production server

# Testing & Validation
npm run test:config       # Validate all credentials
npm run test              # Run unit tests
npm run test:minimax      # Test MiniMax API connectivity

# Setup & Database
npm run setup:db          # Initialize Supabase schema
npm run setup:db          # Create database tables

# Code Quality
npm run lint              # ESLint check
npm run type-check        # TypeScript check
npm run format            # Prettier format
```

---

## 🏗️ Technical Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 14 + React 18 | Full-stack TypeScript app |
| **Styling** | Tailwind CSS | Quick, consistent design |
| **Motion** | Framer Motion | Gentle, caring animations |
| **Backend** | Hono + Node.js | Clean routing, low overhead |
| **Database** | Supabase (PostgreSQL) | Scalable, real-time capable |
| **Audio Processing** | ffmpeg.wasm | Extract audio from video |
| **Audio Playback** | Web Audio API | Progressive streaming |
| **LLM** | MiniMax M2.7-highspeed | Fast persona generation |
| **Voice Clone** | MiniMax Voice Clone API | Custom voice synthesis |
| **TTS** | MiniMax Speech 2.6/2.8 | High-quality speech synthesis |

---

## 🎨 Design Philosophy

The UI should feel:
- **Warm** - Muted colors, soft shadows, rounded cards
- **Private** - Consistent privacy/consent messaging
- **Careful** - No harsh error states, gentle transitions
- **Transparent** - Always explicit that voice is AI-generated
- **Fast** - Demo path completable in <2 minutes

---

## 🔐 Security & Privacy

### Data Protection
- ✅ Voice recordings stored only on server
- ✅ Voice IDs never exposed to frontend
- ✅ Row-level security (RLS) on all database tables
- ✅ API keys always kept server-side
- ✅ Consent required before any processing

### Ethical Guidelines
- ✅ App must state voice is AI-generated
- ✅ Persona never claims to be alive
- ✅ Distress detected → exit roleplay immediately
- ✅ Family context drives responses (no invention)
- ✅ Users control all generated content

### Consent Gate
Every session starts with explicit consent:
> "This experience uses AI to recreate a voice from uploaded recordings. It is not the person, and it should not replace real family, community, or professional support."

---

## 💰 Cost Estimate (Hackathon Demo)

| Item | Cost |
|------|------|
| One voice clone | ~$1.50 |
| Warmup TTS | <$0.01 |
| LLM chat session | <$0.01 |
| Multiple TTS responses | <$0.10 |
| **Total per demo** | **~$1.50-$2.00** |

*Based on MiniMax pay-as-you-go pricing*

---

## 🐛 Troubleshooting

### Configuration Issues
```bash
# Validate configuration
npm run test:config

# Check env variables
cat .env.local

# Verify Supabase connection
npm run setup:db
```

### Port Already in Use
```bash
npm run dev -- -p 3001  # Use port 3001 instead
```

### Dependencies Not Installing
```bash
rm -rf node_modules package-lock.json
npm install
```

### Database Schema Not Found
```bash
# Run migrations
npm run setup:db

# Then run SQL migrations in Supabase dashboard
# Copy: docs/sql/supabase-migrations.sql
```

---

## 📚 Documentation

Canonical index: **[docs/README.md](./docs/README.md)**

- **[docs/getting-started/setup-guide.md](./docs/getting-started/setup-guide.md)** — environment and database setup
- **[docs/spec/main-development-plan.md](./docs/spec/main-development-plan.md)** — full specification
- **[docs/reference/configuration.md](./docs/reference/configuration.md)** — configuration architecture
- **[docs/sql/supabase-migrations.sql](./docs/sql/supabase-migrations.sql)** — database schema + RLS

---

## 🤝 Contributing

This is a hackathon project. For improvements:
1. Create a feature branch
2. Make changes with tests
3. Verify configuration with `npm run test:config`
4. Run full test suite: `npm test`
5. Submit PR with clear description

---

## ⚖️ Ethical Considerations

Kindred Echo is designed with grief and emotional safety in mind:

- ✅ **Transparency** - Always explicit about AI
- ✅ **Boundaries** - Persona never claims to be alive
- ✅ **Safety** - Distress triggers professional support redirection
- ✅ **Consent** - Users control all data and generated content
- ✅ **Privacy** - No external data sharing without consent

This is a tool for remembrance, not replacement of real human connection.

---

## 📞 Support & Questions

Check the troubleshooting section or review the full documentation in `docs/`.

---

## 📄 License

This project is provided as-is for educational and hackathon purposes.

---

**Ready to build? Start with [docs/getting-started/setup-guide.md](./docs/getting-started/setup-guide.md)** 🚀
