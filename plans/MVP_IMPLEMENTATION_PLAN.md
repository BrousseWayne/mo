# MO MVP — SCIENTIST Agent Implementation Plan

## Context

MO is documentation-only (zero code). The specs, agent personas, rules, and scientific references are complete. The bottleneck is execution. This plan bootstraps the TypeScript monorepo and implements the first agent (SCIENTIST) with deterministic tool-based calculations.

The user refines agent specs in a parallel Claude session. This session builds the code.

---

## Stack

| Layer | Choice |
|-------|--------|
| Monorepo | Turborepo + pnpm workspaces |
| Backend | Fastify |
| Database | PostgreSQL + Drizzle ORM (postgres.js driver) |
| Validation | Zod |
| LLM | Claude via `@anthropic-ai/sdk` |
| Orchestration | Custom TS pipeline (~200 lines) |
| Testing | Vitest |
| Containerization | Docker Compose (PG only) |

---

## File Tree (final state)

```
package.json                  # root workspace
pnpm-workspace.yaml
turbo.json
tsconfig.base.json
docker-compose.yml
.env.example
.gitignore                    # updated

packages/shared/
  package.json
  tsconfig.json
  src/
    index.ts
    constants.ts
    schemas/
      intake.ts               # Zod: IntakeData
      agent-io.ts             # Zod: AgentEnvelope, ScientistOutput
      pipeline.ts             # Zod: PipelineRunRequest, PipelineStatus

packages/database/
  package.json
  tsconfig.json
  drizzle.config.ts
  src/
    index.ts
    schema.ts                 # users, intake_responses, pipeline_runs, agent_outputs
    client.ts                 # createDb()

packages/agents/
  package.json
  tsconfig.json
  src/
    index.ts
    types.ts                  # ToolDefinition, AgentDefinition, AgentContext, PipelineResult
    pipeline.ts               # runPipeline() — sequential orchestrator
    tools/
      scientist.ts            # 5 pure functions + tool definitions
    agents/
      scientist.ts            # system prompt + tool-use loop via Claude API

apps/api/
  package.json
  tsconfig.json
  .env.example
  src/
    index.ts                  # Fastify bootstrap
    routes/
      index.ts                # route registration
      intake.ts               # POST /intake
      pipeline.ts             # POST /pipeline/run, GET /pipeline/:id
      agents.ts               # GET /agents/:name/output/:runId
```

---

## Steps

### Step 1: Monorepo scaffolding

Create root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`. Update `.gitignore` (add `node_modules/`, `dist/`, `.env`).

Run: `pnpm install`

### Step 2: `packages/shared`

- `constants.ts`: AGENTS, ACTIVITY_FACTORS, PROTEIN_RANGE, FAT_MIN_PERCENT, FIBER_MIN_G, SURPLUS_RANGE, ADAPTATION_WEEKS
- `schemas/intake.ts`: Zod schema matching SCIENTIST.md input (age, height_cm, current_weight_kg, target_weight_kg, training_status, menstrual data, etc.)
- `schemas/agent-io.ts`: `agentEnvelopeSchema`, `scientistOutputSchema` — matching SCIENTIST.md output schema exactly
- `schemas/pipeline.ts`: PipelineRunRequest, PipelineStatus

Dep: `zod`

### Step 3: `packages/database`

- `schema.ts`: 4 tables
  - `users` (id uuid, created_at)
  - `intake_responses` (id, user_id FK, data jsonb, created_at)
  - `pipeline_runs` (id, user_id FK, intake_response_id FK, status enum, current_agent, error, created_at, completed_at)
  - `agent_outputs` (id, pipeline_run_id FK, agent_name, envelope jsonb, duration_ms, llm_tokens_used, created_at)
- `client.ts`: `createDb(url)` using postgres.js + drizzle
- `drizzle.config.ts`

Deps: `drizzle-orm`, `postgres`, `drizzle-kit` (dev), `dotenv`

Setup: `docker-compose.yml` with PG 16, then `pnpm db:push`

### Step 4: `packages/agents` — SCIENTIST tools

5 pure deterministic functions in `tools/scientist.ts`:

1. **`calculateBMR({ weight_kg, height_cm, age })`** → `{ bmr_kcal, formula }`
   - Mifflin-St Jeor women: `10*w + 6.25*h - 5*a - 161`

2. **`calculateTDEE({ bmr_kcal, activity_level })`** → `{ tdee_kcal, activity_factor }`
   - Maps to ACTIVITY_FACTORS from constants

3. **`calculateMacros({ target_intake_kcal, weight_kg, protein_g_per_kg? })`** → `{ protein_g, fat_g, carbs_g, ... }`
   - Protein: weight * g_per_kg (default 1.8, cap 2.0)
   - Fat: 25% of kcal / 9
   - Carbs: remainder

4. **`calculateRampUp({ baseline_kcal, target_intake_kcal })`** → `Week[]`
   - Week 1: +300, Week 2: +500, Week 3+: full target

5. **`calculateWeightProjection({ current_weight_kg, target_weight_kg, weekly_gain_rate_kg? })`** → `{ projected_weeks, projected_timeline_months, next_recalculation_weight_kg }`

Each function exports a companion `toolDefinition` object (name, description, input_schema as JSON Schema) for Claude tool registration.

Unit tests in `tools/__tests__/scientist.test.ts` with known values from SCIENTIST.md (BMR=1337 at 55kg/174cm/28y, TDEE pre-training=1738, etc.)

Dep: `@anthropic-ai/sdk`, `@mo/shared`

### Step 5: `packages/agents` — SCIENTIST agent

`agents/scientist.ts`:
- System prompt extracted from `agents/SCIENTIST.md` lines 37-168 (verbatim)
- Tool-use loop: call Claude → if stop_reason is "tool_use" → execute tool functions → feed results back → repeat until text response
- Parse final JSON output from Claude's text response
- Validate with `scientistOutputSchema`
- Return as `AgentEnvelope`

Model: `claude-sonnet-4-5-20250929` (sufficient for tool routing, cheaper than Opus)

### Step 6: `packages/agents` — Pipeline runner

`pipeline.ts`:
- `agentRegistry`: map of agent name → runner function
- `PIPELINE_ORDER`: ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF", "COACH"]
- `runPipeline({ client, runId, intake, agents, onAgentStart?, onAgentComplete? })` → `PipelineResult`
- Filters requested agents, runs in order, passes state between agents

~150-200 lines with error handling.

### Step 7: `apps/api`

Fastify server with 4 routes:

| Method | Path | Action |
|--------|------|--------|
| POST | `/intake` | Validate intake → create user + intake_response → return IDs |
| POST | `/pipeline/run` | Create pipeline_run → run agents → store outputs → return run_id |
| GET | `/pipeline/:id` | Return pipeline_run + agent_outputs |
| GET | `/agents/:name/output/:runId` | Return specific agent output |

Deps: `fastify`, `@fastify/cors`, `@anthropic-ai/sdk`, `@mo/shared`, `@mo/database`, `@mo/agents`, `dotenv`

### Step 8: Testing & verification

1. **Unit tests**: `pnpm --filter @mo/agents test` — all 5 tool functions against SCIENTIST.md known values
2. **Schema tests**: `pnpm --filter @mo/shared test` — Zod validation (valid passes, invalid rejects)
3. **Integration test**: SCIENTIST agent with real Claude API call, verify output matches `scientistOutputSchema`
4. **E2E manual test**:
   ```bash
   curl -X POST localhost:3000/intake \
     -H 'Content-Type: application/json' \
     -d '{"age":28,"height_cm":174,"current_weight_kg":55,"target_weight_kg":65,"training_status":"none"}'
   # → { user_id, intake_response_id }

   curl -X POST localhost:3000/pipeline/run \
     -H 'Content-Type: application/json' \
     -d '{"user_id":"...","intake_response_id":"..."}'
   # → { run_id, status: "completed" }

   curl localhost:3000/pipeline/{run_id}
   # → full pipeline result with SCIENTIST output
   ```

---

## Critical files to reference during implementation

- `/Users/samy/Documents/mo/agents/SCIENTIST.md` — System prompt (lines 37-168), I/O schemas (lines 176-230), formulas, red flags, adjustment triggers
- `/Users/samy/Documents/mo/RULES.md` — Canonical constraints (banned terminology, food exclusions, metric units)
- `/Users/samy/Documents/mo/CLAUDE.md` — Project overview, agent pipeline, data exchange format
- `/Users/samy/Documents/mo/intake-questionnaire.md` — 69 questions mapped to agents (intake schema source)

---

## Execution order

1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 (sequential, each depends on previous)
