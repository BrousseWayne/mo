# MO Project Tracker

**Last updated**: 2026-07-23

**Status markers**: `[x]` done | `[-]` in progress | `[ ]` todo | `[~]` archived/superseded

---

## Documentation (Agent Specs, Rules, Artifacts)

### Agent System Prompts

- [x] SCIENTIST — v2 redesign: 5 decision frameworks, knowledge externalization to body-composition-science.md, enriched output with reasoning chains (2026-02-18)
- [x] NUTRITIONIST — v2 redesign: generative decision frameworks, knowledge externalization, enriched output (2026-02-11)
- [x] DIETITIAN — v2 redesign: generative slot grammar, rotation engines, compliance risk assessment (2026-02-11)
- [x] CHEF — Pattern-based recipe generation, technique-first cooking, 9 cuisine kits (2026-02-08)
- [x] COACH — v2 redesign: 6 decision frameworks, generative session grammar, knowledge externalization (2026-02-18)
- [x] PHYSICIAN — v2 redesign: 4 decision frameworks, generative response model, knowledge externalization to medical-reference.md (2026-02-18)
- [x] Pipeline orchestration spec — Sequential pipeline, feedback loop schema (2026-02-08)

### Artifacts (Runtime-Injected Content)

- [x] dietitian-meal-template.md — 7-day meal template with alternatives (2026-02-07)
- [x] chef-batch-cooking.md — Batch cooking protocols, sauce recipes (2026-02-08)
- [x] chef-shake-recipes.md — Calorie-dense shake formulations, macro-verified (2026-02-09)

### Knowledge Bases

- [x] references.md — Scientific references (2026-02-07)
- [x] client-protocol.md — Client biohacking protocol (2026-02-07)
- [x] training-knowledge-base.md — Training agent knowledge base (2026-02-07)
- [x] food-science.md — Protein/starch/fat/fiber heat science (2026-02-09)
- [x] cooking-techniques.md — French techniques, sauces, stocks (2026-02-09)
- [x] flavor-science.md — Taste elements, balancing, seasoning stack (2026-02-09)
- [x] cuisine-profiles.md — 9 cuisine flavor kits (2026-02-09)
- [x] nutrition-science.md — MPS, supplements, cycle physiology, Ca-Fe science (2026-02-11)
- [x] meal-architecture.md — Meal timing, compliance psychology, substitution science (2026-02-11)
- [x] body-composition-science.md — BMR derivation, activity factors, surplus science, protein targets, measurement methods, myth-busting evidence (2026-02-18)
- [x] medical-reference.md — Underweight physiology, deficiencies, supplement pharmacology, refeeding, psychology (2026-02-18)

### Rules & Constraints

- [x] RULES.md — Canonical constraints, banned terms, food exclusions (2026-02-07)
- [x] intake-questionnaire.md — 69 questions, 8 sections (2026-02-07)

---

## Architecture (Plans, Schemas, ADRs)

- [x] CLIENT_PROFILE.md — Target client locked parameters (2026-02-07)
- [x] TECH_STACK_ADR.md — Architecture decision record (2026-02-09)
- [x] DATABASE_SCHEMA.md — PostgreSQL schema design (2026-02-09)
- [~] MVP_IMPLEMENTATION_PLAN.md — SCIENTIST agent implementation plan (archived 2026-02-18, all 6 agents + API implemented)
- [x] NUTRITION_API_SPEC.md — USDA FoodData Central integration spec (2026-02-09)
- [~] IMPLEMENT_5_AGENTS.md — Implementation plan for 5 remaining agents (archived 2026-02-11, all agents implemented)
- [x] FEATURE_ROADMAP.md — Feature roadmap that drove implementation Phases 0-5 (2026-02-19)
- [x] FRONTEND_PLAN.md — Client-facing frontend plan (2026-02-23)
- [x] ROADMAP_2026-07.md — Audit findings + execution roadmap; entry point after dormancy (2026-07-23)
- [ ] API_CONTRACT.md — Full REST endpoint definitions, auth, rate limiting, error format (was P1-7)
- [ ] GENERALIZATION_SPEC.md — Multi-client parameterization spec (was P2-15; deprioritized 2026-07-23: single-client tool is a locked decision in ROADMAP_2026-07.md)

---

## Implementation (Code)

### Monorepo Scaffolding (MVP Steps 1-3)

- [x] Root config — package.json, pnpm-workspace.yaml, turbo.json, tsconfig.base.json (2026-02-09)
- [~] Docker Compose — PostgreSQL 16 container (2026-02-09; removed 2026-07-23, dev uses native Homebrew PostgreSQL + Redis)
- [x] .gitignore — node_modules, dist, .env exclusions (2026-02-09)
- [x] packages/shared — Zod schemas (intake, agent-io, pipeline, program, checkin, trigger, adjustment, nutrition), constants (2026-02-09, extended through 2026-02-23)
- [x] packages/database — Drizzle ORM schema (20 tables), client, migrations, per-domain query helpers (2026-02-09, extended through 2026-02-23)

### Agents (MVP Steps 4-6 + v2 redesign)

- [x] SCIENTIST agent — Tools + agent runner + tests (2026-02-09)
- [x] NUTRITIONIST agent — Tools + agent runner + tests (2026-02-11)
- [x] DIETITIAN agent — Tools + agent runner + tests (2026-02-11)
- [x] CHEF agent — Tools + agent runner + tests, hardcoded ingredient table (2026-02-11)
- [x] COACH agent — Tools + agent runner + tests (2026-02-11)
- [x] PHYSICIAN agent — On-demand invocation handler + tests (2026-02-11)
- [x] Pipeline orchestrator — Sequential runner, agent registry, PHYSICIAN callback, archival with LLM trace (2026-02-09, extended 2026-02-19)
- [x] USDA FoodData Central integration — API client, PostgreSQL nutrition cache, lookup tools (2026-02-18)

### Feature Phases 0-5 (2026-02-19 → 2026-02-23, per FEATURE_ROADMAP.md)

- [x] Phase 0 — Schema expansion, shared Zod schemas, Redis + BullMQ async pipeline, seed data, bootstrap + playground scripts, pipeline archival
- [x] Phase 1 — Program CRUD, check-in API + progress storage, training session logging, trigger evaluation engine (7 evaluators), partial re-execution, compliance computation
- [x] Phase 2 — Cross-agent validation, recipe macro verification, observability (health/stats/error handler), PHYSICIAN audit + referral tracking
- [x] Phase 3 — Dashboard/charts/meal-plan/recipe endpoints, shopping list + recipe scaling + batch cooking, milestones, notification infrastructure, adjustment explanations, insights engine, program pause/resume lifecycle
- [x] Phase 4 — CHEF recipe memory, PHYSICIAN proactive monitoring, outcome tracking + implicit preferences, smart timing + re-engagement, tier progression + phase transition triggers, technique reference, pantry CRUD, variety detection
- [x] Phase 5 — Anomaly detection + cycle detrending + trajectory projection, hallucination detection, LLM cost tracking + data export, formatters + unified message API, progress photos + iCal export + weekly reports, ingredient prices + projection + wearable stub, training autoregulation + cross-agent signals, program disruptions, E2E check-in flow test suite

### API (apps/api)

- [x] Fastify server — bootstrap, error handler, BullMQ queue + pipeline/notification workers (2026-02-19)
- [x] 29 route files, ~64 endpoints — intake, pipeline, agents, programs, checkins, training, compliance, adjustments, dashboard, charts, meal-plan, recipes, shopping, milestones, schedule, insights, red-flags, health, admin, calendar, photos, messages, pantry, techniques, ingredient-prices, projection, wearables, disruptions (2026-02-19 → 2026-02-23)

### Admin Dashboard (apps/web)

- [x] React 19 + Vite + react-router 7, 9 pages: Home, PipelineList, PipelineDetail, AgentInspector, TriggerDashboard, ProgramTimeline, DataExplorer, Stats, SystemMap (2026-02-23)

### Infrastructure

- [x] .env.example — Document required environment variables (2026-02-09)
- [x] CI pipeline — GitHub Actions: pnpm build + per-package tests (2026-07-23)
- [x] E2E integration tests — Check-in flow suite, no LLM required (2026-02-23)
- [ ] E2E pipeline run with real LLM — never completed; blocked on invalid Anthropic API key, will go through headless Claude Code (ROADMAP_2026-07.md Phase 2)

---

## Environment Sanity — ROADMAP_2026-07.md Phase 0 (2026-07-23)

- [x] 0.1 dotenv resolves root .env explicitly (drizzle.config, seed, API, playground)
- [x] 0.2 Root `pnpm test` green — @mo/shared passes with no test files
- [x] 0.3 Database story settled — native PostgreSQL (postgresql://mo:mo@127.0.0.1:5432/mo) + native Redis; Docker Compose removed; migrations regenerated (0001 adds the 7 missing tables; fresh `db:migrate` = `db:push` = 20 tables); bootstrap checks native services, creates role/db, skips seed on non-empty DB
- [x] 0.4 API default port 3100 (3000 conflicted with another local project)
- [x] 0.5 Claude model IDs centralized in `CLAUDE_MODELS` (packages/shared)
- [x] 0.6 GitHub Actions CI added
- [x] 0.7 TRACKER.md + CLAUDE.md updated for Phases 0-5; newfeatures.md archived

## Non-AI Critical Path — ROADMAP_2026-07.md Phase 1

- [x] 1.8 Program seeding from agents/artifacts/ without the LLM pipeline — coach-training-program.md authored (Phase 0, from training KB §15), artifact parsers in packages/agents/src/artifacts/ (schema-validated DIETITIAN/COACH payloads, 15 tests), `pnpm seed:program` creates user + intake + program targets + completed run + agent outputs + week-1 training sessions; meal-plan and training endpoints serve real data (2026-07-23)
- [x] 1.9 apps/client per FRONTEND_PLAN.md, reduced scope — intake wizard (6 steps) → POST /programs/from-artifacts, dashboard (progress ring, KPIs, macro targets, adjustments), weekly check-in with trigger feedback, meal plan (day tabs, slot alternatives), training week + session logging (actuals, complete/skip); port 5174; browser-smoke-tested end-to-end incl. full wizard flow; progress/photos/calendar and apps/kitchen deferred (2026-07-23)
- [ ] 1.10 Run the temporal loop for real (spec detailed in ROADMAP_2026-07.md, 2026-07-23)
  - [ ] 10a Deterministic adjustment executor at check-in (apply trigger new_values; stop enqueuing pipeline.checkin; fix current_tier/current_phase omission in checkins.ts)
  - [ ] 10b Weekly session generation (phase_0 copy; later phases double progression on actuals)
  - [ ] 10c coach-training-program-phase1.md artifact + phase transition wiring
  - [ ] 10d Multi-week simulation E2E test (definition of done for Phase 1)
  - [ ] 10e Hygiene: programs.paused_at column, purge test programs, push to GitHub

## Client Content — ROADMAP_2026-07.md Phase 3

- [ ] 3.14 Glossary artifact + in-app glossary page (RULES-compliant definitions)
- [ ] 3.15 Exercise form-video links (schema + artifacts + parser + client link; verify URLs)

---

## Audit Items (Migrated from REMAINING_FIXES.md)

### P1 — Should Do Before Production

- [ ] P1-7: Define API contract — Full REST endpoint definitions, auth model, rate limiting, error format
- [x] P1-8: Resolve external file references — Decision: tool-use (USDA API) + RAG (static artifacts) (2026-02-09)
- [-] P1-9: Specify feedback loop — Implementation now exists (check-in API, trigger engine, partial re-execution, notifications, adjustment narratives; Phases 1-5). Remaining: check-in UI (apps/client, item 1.9)

### P2 — Important But Non-Blocking

- [~] P2-10: Extract LEXICON.md — Superseded; banned terms in RULES.md, domain terms in agent specs
- [x] P2-11A: Fix "nut butter" references (2026-02-09)
- [x] P2-11B: Fix imperial unit conversions (2026-02-09)
- [x] P2-11C: Fix negative fat gain framing (2026-02-09)
- [x] P2-11D: Fix uncited DIETITIAN myth-busting claims (2026-02-09)
- [x] P2-12: Fix shake recipe macro discrepancies (2026-02-09)
- [x] P2-13: Fix carbohydrate targets in protocol and dev plan prose (2026-02-09)
- [ ] P2-14: Create test matrix and golden dataset — 3-5 client profiles, expected outputs, edge cases (seed profiles reference/intermediate/underweight-anxious are a starting point)
- [~] P2-15: Multi-client generalization spec — Deprioritized; single-client tool locked in ROADMAP_2026-07.md (2026-07-23)

### P3 — Nice to Have

- [-] P3-16: UI wireframes — Superseded by FRONTEND_PLAN.md for apps/client (2026-02-23)
- [ ] P3-17: COACH prompt optimization — Measure token count, chunking strategy if >4k tokens
- [ ] P3-18: Food cost tiers — ingredient_prices table + endpoints exist (Phase 5); meal-plan tiering not built
- [ ] P3-19: Add missing health guardrails — ED detection for CHEF, RED-S for SCIENTIST, amenorrhea for NUTRITIONIST
