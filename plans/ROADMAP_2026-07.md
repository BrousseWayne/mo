# MO — Audit Findings & Execution Roadmap (2026-07-23)

Instructions distilled from the 2026-07-23 full audit session. This document is the
entry point for resuming work after 5 months of dormancy (last commit 2026-02-23).

## Decisions (locked)

- **No Anthropic API key available.** LLM calls will go through Claude Code headless
  (`claude -p`) using the Max subscription. The raw `@anthropic-ai/sdk` path stays in
  the code but is inert until an API key exists.
- **Non-AI version first.** MO is rebuilt as a deterministic self-coaching tool; the
  LLM layer becomes an optional enhancement (recipe variety, PHYSICIAN Q&A), not a
  prerequisite. Rationale: no API route touches the Anthropic client — the LLM
  dependency is confined to `packages/agents/src/agents/*`, `pipeline.ts`, and the
  BullMQ worker (~20% of the code). The deliverables the pipeline would generate
  already exist, macro-verified, in `agents/artifacts/`.
- **Single-client tool, not a multi-client product.** Target client is locked in
  `plans/CLIENT_PROFILE.md`. Freeze backend expansion (Phase 5 added infra for users
  that don't exist). Revisit only if the scope genuinely changes.

## Audit findings

### Working (verified 2026-07-23)

- `pnpm build`: 5/5 packages compile (tsc + vite).
- `@mo/agents`: 145 unit tests green across 21 suites (agent tools, trigger engine,
  anomaly detection, detrending, trajectory, compliance, milestones, macro validation).
- API boots and serves: `/health` OK, ~64 endpoints across 29 route files, BullMQ +
  Redis queue operational.
- Admin dashboard (`apps/web`, 9 pages) builds and serves.
- USDA FDC API key valid (tested, 200).
- `db:push` + `db:seed` work — but only with `DATABASE_URL` exported manually.

### Broken (ordered by severity)

1. **Anthropic API key invalid (401, tested).** The only pipeline run ever attempted
   (2026-02-22) failed on the same 401 — **the 6-agent pipeline has never completed
   end-to-end with a real LLM.** `progress_entries` is empty: zero real-world usage.
2. **Root `pnpm test` fails**: `@mo/shared` has a `test` script but no test files;
   vitest exits 1 and turbo kills the whole run (including the 145 passing tests).
3. **dotenv loads from package cwd**: `drizzle.config.ts` and `apps/api/src/index.ts`
   use `dotenv/config`, but `.env` lives at the repo root → `pnpm bootstrap`,
   `db:push`, and `pnpm dev` fail or silently connect with default credentials.
4. **Database environment trap**: a native Homebrew PostgreSQL owns `127.0.0.1:5432`
   and shadows the Docker container. Everything (push, seed, API) actually writes to
   the **native** Postgres, database `mo` (20 tables + seed as of the audit). The
   `mo-postgres` container is decorative; its database is empty.
5. **Drizzle migrations stale**: 1 migration covers 13 tables vs 21 in `schema.ts`.
   7 tables (ingredient_prices, milestones, notification_log, notification_preferences,
   pantry_items, program_disruptions, progress_photos) have no migration. A fresh env
   via `db:migrate` is broken; the project depends on `push`.
6. **No CI** (no `.github/`), which is why items 2–5 went undetected.
7. **Docs 39 commits behind**: TRACKER.md and CLAUDE.md frozen at 2026-02-18; Phases
   3–5, `apps/web`, BullMQ, `scripts/bootstrap.ts`/`playground.ts` undocumented. The
   Session-End Protocol in CLAUDE.md was not applied. `newfeatures.md` (uncommitted)
   is a stale gap analysis — most of its gaps were implemented in Phases 4–5.
8. Minor: API port 3000 conflicts with another local project (Klox Admin, binds via
   IPv6 — `curl localhost:3000` hits the wrong app). Claude model IDs hardcoded in
   14 places (`claude-sonnet-4-5-20250929` ×11, `claude-haiku-4-5-20251001` ×3).

## Phase 0 — Dev environment sanity (1 session)

1. Fix dotenv: resolve the root `.env` explicitly (e.g. `dotenv.config({ path: <repo
   root>/.env })`) in `packages/database/drizzle.config.ts` and `apps/api/src/index.ts`.
2. Fix root `pnpm test`: remove the `test` script from `@mo/shared`, or use
   `vitest run --passWithNoTests`.
3. Settle the database story: either delete `docker-compose.yml` (dev = native
   Postgres, document `postgresql://mo:mo@127.0.0.1:5432/mo`) or move the container
   to a non-conflicting port and migrate data into it. Then regenerate migrations
   (`pnpm db:generate`) so all 21 tables are covered.
4. Change the API `PORT` default away from 3000 (Klox conflict).
5. Centralize Claude model IDs into one constant (single edit point for the headless
   adapter later).
6. Add minimal CI (GitHub Actions): `pnpm build` + per-package tests.
7. Update TRACKER.md and CLAUDE.md to reflect the 39 unaccounted commits (apps/web,
   29 routes, BullMQ, scripts/). Delete or archive `newfeatures.md`.

## Phase 1 — Non-AI critical path (the actual product)

8. **Program seeding without the pipeline**: build a seed path that creates a program
   from `agents/artifacts/` (parse `dietitian-meal-template.md`; author the training
   program once as a static artifact the same way). The pipeline-run endpoint remains
   but is not on the critical path.
9. **Build `apps/client`** per `plans/FRONTEND_PLAN.md`, reduced scope: intake wizard →
   dashboard → check-in → meal plan → training session logging. Defer `apps/kitchen`
   and the progress/photos/calendar pages until one real usage cycle has happened.
10. **Run the temporal loop for real**: weekly check-ins → trigger engine (already
    implemented and unit-tested) → parametric adjustments (portion scaling, slot
    swaps). This is the feature that makes MO a coach instead of a plan document.

## Phase 2 — Optional AI layer (headless Claude Code)

11. **Headless adapter**: `claude -p --output-format json` + Zod validation with
    retry, behind the same interface as the current agent runners so the API-key path
    stays swappable. Auth: `claude setup-token` → `CLAUDE_CODE_OAUTH_TOKEN` (1-year
    OAuth token). Headless usage draws from the Max 5-hour/weekly limits — fine at
    personal cadence.
12. **Priority AI uses**: CHEF recipe variety/regeneration, PHYSICIAN ad-hoc Q&A.
    Do **not** attempt full 6-agent pipeline runs until the Phase 1 loop is alive.
13. **ToS boundary**: subscription auth is for personal use only — never embed the
    OAuth token in anything serving third parties. If MO ever goes multi-client,
    switch to API keys (and revisit the Agent SDK, whose usage bills against the Max
    monthly credit pool instead of the 5h/weekly limits).

## Standing guardrails

- RULES.md remains absolute authority (banned terms, no peanut/nut butters, fat gain
  framed positively, metric units only).
- Apply the CLAUDE.md Session-End Protocol every session: update TRACKER.md, run the
  consistency check, archive superseded docs, commit untracked files that belong.
