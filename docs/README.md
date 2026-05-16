# Kindred Echo — Documentation

All project docs live here. Read the repo [README](../README.md) first for overview, ethos, and quick start commands.

## Suggested reading order

1. [Prerequisites](./getting-started/prerequisites.md) (~10 min) — credentials and accounts.
2. [Setup guide](./getting-started/setup-guide.md) (~20 min) — local env, `.env.local`, Supabase SQL.
3. Run `npm run test:config` and `npm run dev` from the repository root.

**Optional:** [Onboarding](./getting-started/onboarding.md) summarizes the autonomous configuration layer (useful after a scaffold or handoff).

---

## Contents

### Getting started

| Document | Purpose |
|----------|---------|
| [Prerequisites](./getting-started/prerequisites.md) | Credential checklist |
| [Setup guide](./getting-started/setup-guide.md) | Step-by-step setup |
| [Onboarding](./getting-started/onboarding.md) | Post-setup checklist / handoff notes |

### Guides

| Document | Purpose |
|----------|---------|
| [Configuration summary](./guides/configuration-summary.md) | Config system overview |
| [Demo script](./guides/demo-script.md) | Demo narration flow |
| [Quick reference](./guides/quick-reference.txt) | Printable ASCII cheatsheet |

### Specification

| Document | Purpose |
|----------|---------|
| [Main development plan](./spec/main-development-plan.md) | Full technical and product specification |

### MiniMax integration

| Document | Purpose |
|----------|---------|
| [API findings](./integration/minimax-api-findings.md) | Exploratory notes |
| [API reference](./integration/minimax-api-reference.md) | Endpoint reference aligned with TypeScript types |
| [Token plan guide](./integration/token-plan-api-guide.md) | Billing / quota-focused usage |
| [Smoke test results](./integration/smoke-test-results.md) | Latest `npm run smoke:minimax` results |

### Reference

| Document | Purpose |
|----------|---------|
| [Configuration architecture](./reference/configuration.md) | Autonomous config manager internals |

### Database

| File | Purpose |
|------|---------|
| [supabase-migrations.sql](./sql/supabase-migrations.sql) | Schema + RLS (paste into Supabase SQL editor) |

### Archive

| Document | Purpose |
|----------|---------|
| [Completion report](./archive/completion-report.md) | Historical scaffold snapshot (paths may reflect an older layout) |

---

## Where to look when something breaks

| Symptom | Start here |
|---------|-------------|
| Missing env / keys | [Prerequisites](./getting-started/prerequisites.md), [.env.example](../.env.example) |
| Database / migration errors | [Setup guide](./getting-started/setup-guide.md), [SQL](./sql/supabase-migrations.sql) |
| `test:config` failures | [Configuration architecture](./reference/configuration.md) |
| MiniMax API mismatches | [API reference](./integration/minimax-api-reference.md), [findings](./integration/minimax-api-findings.md) |
