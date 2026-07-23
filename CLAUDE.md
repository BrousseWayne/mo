# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MO (Multi-Agent Wellness Orchestrator) is a pipeline-based coaching system for female body recomposition. Monorepo scaffolded with Turborepo + pnpm. All 6 agents implemented (tools, agent runners, 145 unit tests). Fastify API with ~64 endpoints across 29 route files, BullMQ async pipeline, admin dashboard (apps/web). The 6-agent LLM pipeline has never completed end-to-end (no valid Anthropic API key); per [plans/ROADMAP_2026-07.md](./plans/ROADMAP_2026-07.md), MO is being rebuilt as a deterministic self-coaching tool first, with the LLM layer as an optional enhancement via headless Claude Code.

### Target Use Case

28-year-old woman, 55-56kg, 174cm (BMI ~18.5), goal +9-10kg total mass (3-5kg muscle + 5-7kg fat + 1-2kg water/glycogen) to reach 65kg. Key constraint: peanut butter aversion.

## Architecture

### Agent Pipeline (Sequential)

```
QUESTIONNAIRE → SCIENTIST → NUTRITIONIST → DIETITIAN → CHEF → COACH → OUTPUT
```

PHYSICIAN is on-demand (any agent can invoke it for health questions or red flags).

### 6 Agents

| Agent        | Color   | Owns                                                                | Position         |
| ------------ | ------- | ------------------------------------------------------------------- | ---------------- |
| SCIENTIST    | #457B9D | Calculations: BMR, TDEE, macros, metrics, timelines                 | 1st (sequential) |
| NUTRITIONIST | #2A9D8F | Strategy: MPS optimization, protein distribution, cycle adjustments | 2nd (sequential) |
| DIETITIAN    | #F4A261 | Architecture: weekly meal templates, substitutions, slot specs      | 3rd (sequential) |
| CHEF         | #E9C46A | Execution: recipes, batch cooking, culinary techniques              | 4th (sequential) |
| COACH        | #9B5DE5 | Programming: training, progression, recovery protocols              | 5th (sequential) |
| PHYSICIAN    | #E63946 | Health advisory: red flags, referrals, medical context              | On-demand        |

### Agent Boundaries

- SCIENTIST produces numbers → NUTRITIONIST consumes and strategizes
- NUTRITIONIST produces strategy → DIETITIAN creates template → CHEF executes recipes
- SCIENTIST triggers adjustments based on metrics → relevant agents execute changes

### Conflict Resolution Hierarchy

1. Health guardrails override all
2. SCIENTIST overrides on numeric matters
3. NUTRITIONIST overrides DIETITIAN/CHEF on nutrition strategy
4. DIETITIAN overrides CHEF on macro compliance
5. COACH autonomous on training, defers to SCIENTIST on recovery metrics

## Canonical Rules

**See [RULES.md](./RULES.md)** for the complete, authoritative reference on:

- Banned terminology (somatotypes, "fast metabolism", "toning", etc.)
- Correct alternatives and evidence-based framing
- Food constraints (no peanut butter, no nut butters)
- Key scientific references
- Red flags triggering referral
- Agent-specific constraints

All project documents must comply with RULES.md. When conflicts exist, RULES.md takes precedence.

## Data Exchange Format

Agents communicate via structured JSON:

```json
{
  "message_id": "UUID",
  "from_agent": "SCIENTIST",
  "to_agent": "NUTRITIONIST",
  "data_type": "macro_targets",
  "payload": { ... },
  "pipeline_run_id": "UUID",
  "timestamp": "ISO8601",
  "version": "1.0"
}
```

## Tech Stack (see plans/TECH_STACK_ADR.md)

- Backend: Fastify (TypeScript) + PostgreSQL (Drizzle ORM) + Redis (BullMQ async pipeline)
- Admin dashboard: React 19 + Vite + react-router 7 (apps/web, port 5173)
- Client frontend: React 19 + Vite + react-router 7 (apps/client, port 5174; reduced scope of plans/FRONTEND_PLAN.md — apps/kitchen and progress/photos/calendar pages deferred)
- Mobile: React Native + Expo (later)
- Agent Orchestration: Custom TypeScript pipeline
- LLM: Anthropic Claude (model IDs centralized in `CLAUDE_MODELS`, packages/shared). No valid API key — LLM calls will go through headless Claude Code (`claude -p`), see plans/ROADMAP_2026-07.md Phase 2
- Notifications: Firebase Cloud Messaging (later)
- Cloud: AWS (ECS Fargate, RDS, ElastiCache) (later)

## Dev Environment

- PostgreSQL and Redis are **native Homebrew services** (no Docker): `postgresql://mo:mo@127.0.0.1:5432/mo`, `redis://127.0.0.1:6379`
- `.env` lives at the repo root and is resolved explicitly by drizzle.config, seed, API, and scripts (never relies on package cwd)
- API default port: **3100** (3000 conflicts with another local project)
- `pnpm bootstrap` — checks services, creates role/database if missing, pushes schema, seeds if empty
- `pnpm seed:program` — creates a complete program (meal plan + training sessions) from agents/artifacts/, no LLM
- `pnpm build` / `pnpm test` / `pnpm dev` — Turborepo across all packages
- `pnpm db:generate` / `db:migrate` / `db:push` / `db:seed` — Drizzle. Migrations are authoritative for fresh environments; `db:push` for dev iteration

## File Structure

```
CLAUDE.md                              # Project entry point (Claude Code config)
RULES.md                               # Canonical constraints (absolute authority)
TRACKER.md                             # Single source-of-truth project tracker
intake-questionnaire.md                # Client intake form (69 questions)
ideas.md                               # Feature ideas and future enhancements
package.json                           # Root workspace (pnpm + Turborepo)
pnpm-workspace.yaml                    # Workspace config
turbo.json                             # Turborepo pipeline config
tsconfig.base.json                     # Shared TypeScript config
.github/workflows/ci.yml               # CI: pnpm build + per-package tests

scripts/                               # Dev scripts (run from repo root)
  bootstrap.ts                         # Native Postgres/Redis checks, role/db creation, push + seed
  playground.ts                        # Run a single agent against fixture data
  seed-program.ts                      # Seed a full program from agents/artifacts/ (no LLM)
  fixtures/                            # reference-intake.json, scientist-output.json

packages/shared/                       # SHARED: Zod schemas, constants
  src/index.ts                         # Barrel export
  src/schemas/intake.ts                # IntakeData schema
  src/schemas/agent-io.ts              # AgentEnvelope + 6 agent output schemas
  src/schemas/pipeline.ts              # PipelineRunRequest, PipelineStatus schemas
  src/schemas/nutrition.ts             # Nutrition data Zod schemas (FDC types)
  src/schemas/program.ts               # Program lifecycle schemas
  src/schemas/checkin.ts               # Weekly check-in schemas
  src/schemas/trigger.ts               # Trigger evaluation schemas
  src/schemas/adjustment.ts            # Adjustment schemas
  src/constants.ts                     # Agent list, activity factors, macro ranges, CLAUDE_MODELS

packages/database/                     # DATABASE: Drizzle ORM + PostgreSQL
  src/schema.ts                        # 20 tables: users, intake_responses, pipeline_runs,
                                       #   agent_outputs, foods, programs, progress_entries,
                                       #   training_sessions, adjustments, interaction_events,
                                       #   physician_queries, red_flags, recipes, milestones,
                                       #   notification_log, notification_preferences,
                                       #   pantry_items, program_disruptions, progress_photos,
                                       #   ingredient_prices
  src/client.ts                        # createDb() with postgres.js driver
  src/queries.ts                       # Legacy query helpers
  src/queries/                         # Per-domain query helpers (programs, progress, training,
                                       #   recipes, milestones, red-flags, physician, pantry,
                                       #   outcomes, interactions)
  src/seed.ts                          # 3 seed profiles (reference, intermediate, underweight-anxious)
  drizzle.config.ts                    # Drizzle Kit config (resolves root .env)
  drizzle/                             # Migrations (0000 + 0001, covers all 20 tables)

packages/agents/                       # AGENTS: tool functions + LLM agent runners + engines
  src/pipeline.ts                      # Sequential pipeline orchestrator (all 6 agents)
  src/types.ts                         # AgentContext, PipelineResult, PhysicianQuery
  src/tools/                           # Pure per-agent tool functions + definitions
                                       #   (scientist, nutritionist, dietitian, chef, coach,
                                       #   physician, nutrition lookup, ingredients table)
  src/agents/                          # LLM runners, one per agent (inert without API key)
  src/clients/                         # USDA FDC API client + PostgreSQL nutrition cache
  src/triggers/                        # Check-in trigger engine: evaluators, re-execution map
  src/validation/                      # Cross-agent validation, hallucination detection,
                                       #   recipe macro verification
  src/insights/                        # Insights engine: generators, timing, variety,
                                       #   re-engagement, curiosity hooks
  src/formatting/                      # User-facing output: adjustment narratives,
                                       #   user messages, weekly reports
  src/artifacts/                       # Parsers: static artifacts → schema-validated
                                       #   DIETITIAN/COACH payloads (no LLM)
  src/__tests__/e2e/                   # Check-in flow E2E suite (no LLM required)
  src/**/__tests__/                    # 145 unit tests across 21 suites

apps/api/                              # API: Fastify server (~64 endpoints, port 3100)
  src/index.ts                         # Fastify bootstrap
  src/env.ts                           # Resolves root .env
  src/errors.ts                        # Unified error handler
  src/jobs/                            # BullMQ queue + pipeline/notification workers
  src/routes/                          # 29 route files: intake, pipeline, agents, programs,
                                       #   checkins, training, compliance, adjustments, dashboard,
                                       #   charts, meal-plan, recipes, shopping, milestones,
                                       #   schedule, insights, red-flags, health, admin, calendar,
                                       #   photos, messages, pantry, techniques, ingredient-prices,
                                       #   projection, wearables, disruptions

apps/client/                           # USER FRONTEND: mobile-first, port 5174
  src/pages/                           # DashboardPage, CheckinPage, MealPlanPage,
                                       #   TrainingWeekPage, TrainingSessionPage,
                                       #   intake/ (6-step IntakeWizardPage + sections)
  src/components/                      # BottomNav, field widgets (Choice/Number/Slider/Toggle/Text)
  src/context/ProgramContext.tsx       # Active programId (localStorage), auto-pick or → /intake
  src/api/, src/hooks/, src/layouts/, src/styles/

apps/web/                              # ADMIN DASHBOARD: React 19 + Vite + react-router 7
  src/pages/                           # 9 pages: Home, PipelineList, PipelineDetail,
                                       #   AgentInspector, TriggerDashboard, ProgramTimeline,
                                       #   DataExplorer, Stats, SystemMap
  src/components/                      # AgentBadge, DataTable, JsonViewer, LoadingState, StatusBadge
  src/api/client.ts                    # Fetch wrapper (proxies /api → :3100)
  src/layouts/, src/hooks/, src/styles/

agents/                                # AUTHORITATIVE: system prompts + I/O schemas
  SCIENTIST.md                         # Calculation engine agent
  NUTRITIONIST.md                      # Nutrition strategy agent
  DIETITIAN.md                         # Meal plan architecture agent
  CHEF.md                              # Recipe/culinary execution agent
  COACH.md                             # Training programming agent
  PHYSICIAN.md                         # On-demand health advisory agent
  pipeline.md                          # Pipeline orchestration spec

agents/artifacts/                      # DELIVERABLES: runtime-injected content
  chef-batch-cooking.md                # Batch cooking protocols, sauce recipes
  chef-shake-recipes.md                # Calorie-dense shake formulations
  dietitian-meal-template.md           # 7-day meal template with alternatives
  coach-training-program.md            # Phase 0 training program (parsed by seed:program)

plans/                                 # ARCHITECTURE: decisions & schemas
  ROADMAP_2026-07.md                   # Audit findings + execution roadmap (current entry point)
  CLIENT_PROFILE.md                    # Target client locked parameters
  TECH_STACK_ADR.md                    # Architecture decision record
  DATABASE_SCHEMA.md                   # PostgreSQL schema design
  NUTRITION_API_SPEC.md                # USDA FoodData Central integration spec
  FEATURE_ROADMAP.md                   # Feature roadmap that drove Phases 0-5 (2026-02)
  FRONTEND_PLAN.md                     # apps/client plan

knowledge/                             # REFERENCE: non-authoritative context
  references.md                        # Scientific references
  client-protocol.md                   # Client biohacking protocol
  training-knowledge-base.md           # Training agent knowledge base
  nutrition-science.md                 # MPS, supplements, cycle physiology, Ca-Fe science
  meal-architecture.md                 # Meal timing, compliance psychology, substitution science
  food-science.md                      # Protein/starch/fat/fiber heat science
  cooking-techniques.md                # French techniques, sauces, stocks
  flavor-science.md                    # Taste elements, balancing, seasoning stack
  cuisine-profiles.md                  # 9 cuisine flavor kits
  body-composition-science.md          # BMR, activity factors, surplus science, protein targets, measurement methods
  medical-reference.md                 # Underweight physiology, deficiencies, supplement pharmacology, refeeding

audits/                                # TRACKING: temporal, non-authoritative
  FULL_AUDIT_REPORT.md                 # 6-pass audit results

archive/                               # HISTORICAL: non-authoritative
  (superseded plans, early proposals, prompt iterations, compass exports,
   newfeatures.md gap analysis superseded by Phases 4-5)
```

## Cross-Cutting Constraints

- All output in English, metric units only (kg, cm, g, ml, kcal)
- Peanut butter and nut butters and nuts excluded from all recommendations (substitutes: tahini, sunflower seed butter, coconut cream, avocado)
- Fat gain framed as desired outcome at BMI 18.5, not negative side effect
- Health guardrails trigger medical referral on: amenorrhea >3mo, eating disorder history, persistent training pain >1wk, thyroid dysfunction signs, RED-S indicators

## Compliance Hierarchy

1. **RULES.md** — absolute authority
2. **agents/\*.md** — agent system prompts
3. **plans/CLIENT_PROFILE.md** — locked client parameters
4. **agents/pipeline.md** — pipeline orchestration
5. **plans/\*.md** — architecture decisions
6. **agents/artifacts/\*.md** — deliverable content
7. **knowledge/\*.md** — supporting reference

If conflict exists, higher-numbered documents defer to lower-numbered ones.

## Development Status

See [TRACKER.md](./TRACKER.md) for full item-level tracking and [plans/ROADMAP_2026-07.md](./plans/ROADMAP_2026-07.md) for the current execution roadmap.

### Complete

- Documentation: 6 agent specs, pipeline spec, 3 macro-verified artifacts, 11 knowledge bases
- Architecture: tech stack ADR, database schema, nutrition API spec, client profile, frontend plan
- Implementation Phases 0-5 (2026-02): schema expansion, BullMQ pipeline, check-in loop + trigger engine, cross-agent validation, observability, insights, anomaly detection, formatters, admin dashboard
- Environment sanity (2026-07-23, ROADMAP Phase 0): root .env resolution, green root test run, native Postgres/Redis dev environment, port 3100, centralized model IDs, CI, docs sync

### In Progress (ROADMAP Phase 1 — non-AI critical path)

- ~~1.8 Program seeding from agents/artifacts/~~ done 2026-07-23 (`pnpm seed:program`, POST /programs/from-artifacts)
- ~~1.9 apps/client~~ done 2026-07-23 (intake wizard → dashboard → check-in → meals → training logging)
- 1.10 Run the temporal loop for real (weekly check-ins → triggers → parametric adjustments)

### Known Gaps

- The 6-agent LLM pipeline has never run end-to-end (invalid API key; headless adapter is ROADMAP Phase 2)
- `progress_entries` has no real-world data — zero actual usage cycles so far
- P1-7 API contract, P2-14 golden dataset, P3-17/18/19 (see TRACKER.md)

## Session-End Protocol

Before ending any work session, execute:

1. **Update TRACKER.md** — Mark completed items `[x]`, add new items discovered during work
2. **Consistency check** — Verify that files modified during the session don't contradict:
   - RULES.md (banned terms, food constraints, framing)
   - CLAUDE.md (architecture, data formats, compliance hierarchy)
   - Other agent specs (if modifying an agent that consumes/produces for another)
3. **Stale doc scan** — If implementation made a plan doc obsolete or inaccurate:
   - Update the plan doc to reflect reality, OR
   - Move to `archive/` if fully superseded
4. **Git hygiene** — Stage and commit untracked files that belong in the repo
