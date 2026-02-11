# MO Project Tracker

**Last updated**: 2026-02-11

**Status markers**: `[x]` done | `[-]` in progress | `[ ]` todo | `[~]` archived/superseded

---

## Documentation (Agent Specs, Rules, Artifacts)

### Agent System Prompts

- [x] SCIENTIST — Calculation engine, tiered BMR/TDEE/macro system (2026-02-07)
- [x] NUTRITIONIST — MPS optimization, protein distribution, cycle adjustments (2026-02-07)
- [x] DIETITIAN — Meal plan architecture, slot specs, substitutions (2026-02-07)
- [x] CHEF — Pattern-based recipe generation, technique-first cooking, 9 cuisine kits (2026-02-08)
- [x] COACH — Training programming, 3-phase progression, recovery protocols (2026-02-07)
- [x] PHYSICIAN — On-demand health advisory, red flags, referrals (2026-02-07)
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

### Rules & Constraints

- [x] RULES.md — Canonical constraints, banned terms, food exclusions (2026-02-07)
- [x] intake-questionnaire.md — 69 questions, 8 sections (2026-02-07)

---

## Architecture (Plans, Schemas, ADRs)

- [x] CLIENT_PROFILE.md — Target client locked parameters (2026-02-07)
- [x] TECH_STACK_ADR.md — Architecture decision record (2026-02-09)
- [x] DATABASE_SCHEMA.md — PostgreSQL schema design (2026-02-09)
- [x] MVP_IMPLEMENTATION_PLAN.md — SCIENTIST agent implementation plan (2026-02-09)
- [x] NUTRITION_API_SPEC.md — USDA FoodData Central integration spec (2026-02-09)
- [x] IMPLEMENT_5_AGENTS.md — Implementation plan for 5 remaining agents (2026-02-11)
- [ ] API_CONTRACT.md — Full REST endpoint definitions, auth, rate limiting (was P1-7)
- [ ] GENERALIZATION_SPEC.md — Multi-client parameterization spec (was P2-15)

---

## Implementation (Code)

### Monorepo Scaffolding (MVP Steps 1-3)

- [x] Root config — package.json, pnpm-workspace.yaml, turbo.json, tsconfig.base.json (2026-02-09)
- [x] Docker Compose — PostgreSQL 16 container (2026-02-09)
- [x] .gitignore — node_modules, dist, .env exclusions (2026-02-09)
- [x] packages/shared — Zod schemas (intake, agent-io, pipeline), constants (2026-02-09)
- [x] packages/database — Drizzle ORM schema, client, migrations (2026-02-09)

### SCIENTIST Agent (MVP Steps 4-5)

- [x] packages/agents/src/tools/scientist.ts — 5 pure calculation functions + tool definitions (2026-02-09)
- [x] packages/agents/src/tools/__tests__/scientist.test.ts — Unit tests against known values (2026-02-09)
- [x] packages/agents/src/agents/scientist.ts — System prompt + Claude tool-use loop (2026-02-09)

### Pipeline Runner (MVP Step 6)

- [x] packages/agents/src/pipeline.ts — Sequential orchestrator, agent registry (2026-02-09)

### API Routes (MVP Step 7)

- [x] apps/api/src/index.ts — Fastify bootstrap (2026-02-09)
- [x] apps/api/src/routes/intake.ts — POST /intake (2026-02-09)
- [x] apps/api/src/routes/pipeline.ts — POST /pipeline/run, GET /pipeline/:id (2026-02-09)
- [x] apps/api/src/routes/agents.ts — GET /agents/:name/output/:runId (2026-02-09)

### Remaining Agents

- [ ] NUTRITIONIST agent — Tools + agent runner + tests
- [ ] DIETITIAN agent — Tools + agent runner + tests
- [ ] CHEF agent — Tools + agent runner + tests (includes USDA nutrition API tools)
- [ ] COACH agent — Tools + agent runner + tests
- [ ] PHYSICIAN agent — On-demand invocation handler + tests

### Infrastructure

- [ ] .env.example — Document required environment variables
- [ ] CI pipeline — GitHub Actions or equivalent
- [ ] E2E integration tests — Full pipeline with real Claude API call

---

## Audit Items (Migrated from REMAINING_FIXES.md)

### P1 — Should Do Before Production

- [ ] P1-7: Define API contract — Full REST endpoint definitions, auth model, rate limiting, error format
- [x] P1-8: Resolve external file references — Decision: tool-use (USDA API) + RAG (static artifacts) (2026-02-09)
- [-] P1-9: Specify feedback loop — Pipeline.md section 7 partially done; remaining: check-in UI spec, notification triggers, partial data handling, multi-trigger priority, user-facing adjustment communication

### P2 — Important But Non-Blocking

- [~] P2-10: Extract LEXICON.md — Superseded; banned terms in RULES.md, domain terms in agent specs
- [x] P2-11A: Fix "nut butter" references (2026-02-09)
- [x] P2-11B: Fix imperial unit conversions (2026-02-09)
- [x] P2-11C: Fix negative fat gain framing (2026-02-09)
- [x] P2-11D: Fix uncited DIETITIAN myth-busting claims (2026-02-09)
- [x] P2-12: Fix shake recipe macro discrepancies (2026-02-09)
- [x] P2-13: Fix carbohydrate targets in protocol and dev plan prose (2026-02-09)
- [ ] P2-14: Create test matrix and golden dataset — 3-5 client profiles, expected outputs, edge cases
- [ ] P2-15: Multi-client generalization spec — Parameterize for different ages, weights, goals, sexes

### P3 — Nice to Have

- [ ] P3-16: UI wireframes — Intake form, plan view, check-in, progress dashboard, PHYSICIAN chat
- [ ] P3-17: COACH prompt optimization — Measure token count, chunking strategy if >4k tokens
- [ ] P3-18: Food cost tiers — Budget/standard/premium tiers for meal planning
- [ ] P3-19: Add missing health guardrails — ED detection for CHEF, RED-S for SCIENTIST, amenorrhea for NUTRITIONIST
