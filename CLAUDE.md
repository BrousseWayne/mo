# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MO (Multi-Agent Wellness Orchestrator) is a pipeline-based coaching system for female body recomposition. Monorepo scaffolded with Turborepo + pnpm. All 6 agents implemented (tools, agent runners, unit tests). Fastify API live with 4 routes. All 6 agent specs, pipeline orchestration, and knowledge bases are complete.

### Target Use Case

28-year-old woman, 55-56kg, 174cm (BMI ~18.5), goal +9-10kg total mass (3-5kg muscle + 5-7kg fat + 1-2kg water/glycogen) to reach 65kg. Key constraint: peanut butter aversion.

## Architecture

### Agent Pipeline (Sequential)

```
QUESTIONNAIRE → SCIENTIST → NUTRITIONIST → DIETITIAN → CHEF → COACH → OUTPUT
```

PHYSICIAN is on-demand (any agent can invoke it for health questions or red flags).

### 6 Agents

| Agent        | Color   | Owns                                                    | Position |
|--------------|---------|--------------------------------------------------------|----------|
| SCIENTIST    | #457B9D | Calculations: BMR, TDEE, macros, metrics, timelines    | 1st (sequential) |
| NUTRITIONIST | #2A9D8F | Strategy: MPS optimization, protein distribution, cycle adjustments | 2nd (sequential) |
| DIETITIAN    | #F4A261 | Architecture: weekly meal templates, substitutions, slot specs | 3rd (sequential) |
| CHEF         | #E9C46A | Execution: recipes, batch cooking, culinary techniques | 4th (sequential) |
| COACH        | #9B5DE5 | Programming: training, progression, recovery protocols | 5th (sequential) |
| PHYSICIAN    | #E63946 | Health advisory: red flags, referrals, medical context | On-demand |

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
  "from_agent": "SCIENTIST",
  "to_agent": "NUTRITIONIST",
  "data_type": "macro_targets",
  "payload": { ... },
  "timestamp": "ISO8601",
  "version": "1.0"
}
```

## Tech Stack (see plans/TECH_STACK_ADR.md)

- Backend: Fastify (TypeScript) + PostgreSQL
- Frontend: React Router v7 + Vite (later, not MVP)
- Mobile: React Native + Expo (later)
- Agent Orchestration: Custom TypeScript pipeline
- LLM: Anthropic Claude (Sonnet 4.5 pipeline, Haiku 4.5 PHYSICIAN)
- Cache: Redis (later, not MVP)
- Notifications: Firebase Cloud Messaging (later)
- Cloud: AWS (ECS Fargate, RDS, ElastiCache) (later)

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
docker-compose.yml                     # PostgreSQL 16 container

packages/shared/                       # SHARED: Zod schemas, constants
  package.json                         # Package config
  tsconfig.json                        # TypeScript config
  src/index.ts                         # Barrel export
  src/schemas/intake.ts                # IntakeData schema
  src/schemas/agent-io.ts              # AgentEnvelope + 6 agent output schemas
  src/schemas/pipeline.ts              # PipelineRunRequest, PipelineStatus schemas
  src/constants.ts                     # Agent list, activity factors, macro ranges

packages/database/                     # DATABASE: Drizzle ORM + PostgreSQL
  package.json                         # Package config
  tsconfig.json                        # TypeScript config
  src/index.ts                         # Barrel export
  src/schema.ts                        # users, intake_responses, pipeline_runs, agent_outputs
  src/client.ts                        # createDb() with postgres.js driver
  drizzle.config.ts                    # Drizzle Kit config

packages/agents/                       # AGENTS: tool functions + LLM agent runners
  package.json                         # Package config
  tsconfig.json                        # TypeScript config
  src/index.ts                         # Barrel export
  src/pipeline.ts                      # Sequential pipeline orchestrator (all 6 agents)
  src/types.ts                         # AgentContext, PipelineResult, PhysicianQuery
  src/tools/scientist.ts               # 5 pure calculation functions + tool definitions
  src/tools/nutritionist.ts            # 4 nutrition strategy functions + tool definitions
  src/tools/dietitian.ts               # 3 meal architecture functions + tool definitions
  src/tools/chef.ts                    # 3 recipe/batch functions + tool definitions
  src/tools/coach.ts                   # 4 training programming functions + tool definitions
  src/tools/physician.ts               # 3 health advisory functions + tool definitions
  src/tools/ingredients.ts             # 41-entry ingredient macro lookup table
  src/tools/__tests__/scientist.test.ts     # SCIENTIST tool unit tests
  src/tools/__tests__/nutritionist.test.ts  # NUTRITIONIST tool unit tests
  src/tools/__tests__/dietitian.test.ts     # DIETITIAN tool unit tests
  src/tools/__tests__/chef.test.ts          # CHEF tool unit tests
  src/tools/__tests__/coach.test.ts         # COACH tool unit tests
  src/tools/__tests__/physician.test.ts     # PHYSICIAN tool unit tests
  src/agents/scientist.ts              # SCIENTIST agent: system prompt + tool-use loop
  src/agents/nutritionist.ts           # NUTRITIONIST agent: nutrition strategy runner
  src/agents/dietitian.ts              # DIETITIAN agent: meal template runner
  src/agents/chef.ts                   # CHEF agent: recipe generation runner
  src/agents/coach.ts                  # COACH agent: training program runner
  src/agents/physician.ts              # PHYSICIAN agent: on-demand health advisory (Haiku)

apps/api/                              # API: Fastify server
  package.json                         # Package config
  tsconfig.json                        # TypeScript config
  src/index.ts                         # Fastify bootstrap
  src/routes/index.ts                  # Route registration
  src/routes/intake.ts                 # POST /intake
  src/routes/pipeline.ts               # POST /pipeline/run, GET /pipeline/:id
  src/routes/agents.ts                 # GET /agents/:name/output/:runId

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

plans/                                 # ARCHITECTURE: decisions & schemas
  CLIENT_PROFILE.md                    # Target client locked parameters
  TECH_STACK_ADR.md                    # Architecture decision record
  DATABASE_SCHEMA.md                   # PostgreSQL schema design
  MVP_IMPLEMENTATION_PLAN.md           # MVP implementation plan
  NUTRITION_API_SPEC.md                # USDA FoodData Central integration spec
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

audits/                                # TRACKING: temporal, non-authoritative
  FULL_AUDIT_REPORT.md                 # 6-pass audit results

archive/                               # HISTORICAL: non-authoritative
  IMPLEMENT_5_AGENTS.md               # Superseded: all 5 agents now implemented
  BMAD_LITE_PROPOSAL.md               # Early architecture proposal
  conversation-brief.md                # Original project brief
  EXPERT_AUDIT_25_flags.md             # Pre-restructure audit flags
  futur_stack_FR.md                    # French-language stack exploration
  initial.md                           # Initial project notes
  MO_Agent_Development_Plan.md         # Superseded (extracted to CLIENT_PROFILE.md)
  REMAINING_FIXES_2026-02-09.md        # Migrated to TRACKER.md
  old_plans/                           # Previous plan versions
    prompt1.md                         # First prompt draft
    prompt-iterations.md               # Prompt iteration history
    MO_Agent_Development_Plan_v2.md    # Dev plan v2
    MO_Agent_Development_Plan_v2.1.md  # Dev plan v2.1
  compass_artifacts/                   # Original compass exports
    compass_artifact_wf-01788e2e-*.md  # Compass workflow export 1
    compass_artifact_wf-2f159dd6-*.md  # Compass workflow export 2
```

## Cross-Cutting Constraints

- All output in English, metric units only (kg, cm, g, ml, kcal)
- Peanut butter and nut butters excluded from all recommendations (substitutes: tahini, sunflower seed butter, coconut cream, avocado)
- Fat gain framed as desired outcome at BMI 18.5, not negative side effect
- Health guardrails trigger medical referral on: amenorrhea >3mo, eating disorder history, persistent training pain >1wk, thyroid dysfunction signs, RED-S indicators

## Compliance Hierarchy

1. **RULES.md** — absolute authority
2. **agents/*.md** — agent system prompts
3. **plans/CLIENT_PROFILE.md** — locked client parameters
4. **agents/pipeline.md** — pipeline orchestration
5. **plans/*.md** — architecture decisions
6. **agents/artifacts/*.md** — deliverable content
7. **knowledge/*.md** — supporting reference

If conflict exists, higher-numbered documents defer to lower-numbered ones.

## Development Status

See [TRACKER.md](./TRACKER.md) for full item-level tracking.

### Documentation — Complete
- All 6 agent system prompts written and audited
- Pipeline orchestration spec formalized
- 3 artifacts (meal template, batch cooking, shakes) macro-verified
- 9 knowledge bases (references, client protocol, training, food science, cooking techniques, flavor science, cuisine profiles, nutrition science, meal architecture)

### Architecture — Complete
- Tech stack ADR, database schema, MVP implementation plan, nutrition API spec, client profile

### Implementation — In Progress
- Monorepo scaffolded (Turborepo + pnpm, 3 packages + 1 app)
- `packages/shared`: Zod schemas (intake, agent-io with 6 output schemas, pipeline) + constants
- `packages/database`: Drizzle ORM schema (4 tables), client, migrations
- `packages/agents`: All 6 agents implemented (tools, runners, unit tests — 58 tests across 6 suites), pipeline orchestrator with PHYSICIAN on-demand callback
- `apps/api`: Fastify server with 4 routes (intake, pipeline run/status, agent output)
- Remaining: E2E tests, CI, .env.example

### Pending (Non-Code)
- P1-7: Full API contract (auth, rate limiting, error format)
- P1-9: Feedback loop remaining specs (check-in UI, notifications, partial data)
- P2-14: Test matrix and golden dataset
- P3-16 through P3-19: UI wireframes, COACH optimization, food cost tiers, missing health guardrails

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
