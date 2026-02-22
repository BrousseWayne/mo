# MO Feature Roadmap

**Created**: 2026-02-22
**Status**: Living document — iterate as features are scoped and built
**Scope**: Comprehensive gap analysis from MVP to production personal trainer

---

## How to Read This Document

**IDs** follow domain prefixes: `T-` temporal loop, `Q-` quality, `I-` infrastructure, `A-` agent intelligence, `U-` user experience, `D-` data/knowledge, `X-` integrations, `L-` lifecycle, `DX-` developer experience.

**Severity**: `[CRITICAL]` = system fundamentally broken without it. `[MAJOR]` = works but significantly limited. Unmarked = enhancement/differentiator.

**Effort**: `S` = hours, `M` = 1-2 days, `L` = 3-5 days, `XL` = 1-2 weeks.

**Current state** tracks what spec/code already exists vs what's missing.

---

## Two Systemic Issues

Nearly every feature below depends on one or both of these being resolved first. They are the load-bearing walls.

### Systemic Issue 1: No Temporal Dimension

The system captures state at time T (intake), generates a plan, and stops. A personal trainer is fundamentally a relationship over time: **observe → plan → execute → measure → adapt → repeat**. This loop does not exist. The system is a one-shot plan generator.

What this blocks: check-ins, progress tracking, adjustment triggers, compliance tracking, trend analysis, milestone detection, lifecycle management, notifications.

### Systemic Issue 2: No Output Quality Validation

The system trusts its own outputs completely. Zod validates structure (field names, types). Nothing validates semantics (do the macros add up? is the exercise appropriate for the phase? do CHEF's claimed macros match USDA data?). No golden dataset. No cross-agent consistency checks. No recipe verification pipeline.

What this blocks: reliable coaching output, PHYSICIAN safety guarantees, recipe accuracy, agent improvement iteration.

Architectural designs for both are in **Appendix A** and **Appendix B**.

---

## 1. Temporal Loop (Feedback & Adaptation)

### T-1: Check-in API + DB tables [CRITICAL]

**Description**: API endpoint to accept weekly check-in data. Database tables to store it. This is the entry point for the entire feedback loop.

**Current state**: `pipeline.md` §7 fully specifies the `weekly_checkin` schema. `DATABASE_SCHEMA.md` §2.7 defines the `progress_entries` table. Zero implementation — no endpoint, no table, no Zod schema.

**Dependencies**: None (foundation item)
**Effort**: M
**Touches**: `packages/shared/src/schemas/` (new checkin schema), `packages/database/src/schema.ts` (new tables), `apps/api/src/routes/` (new checkin route)

### T-2: Progress History Storage [CRITICAL]

**Description**: Time-series storage for weight, measurements, training logs, subjective markers. Without history, SCIENTIST cannot evaluate trends or fire adjustment triggers.

**Current state**: `DATABASE_SCHEMA.md` specs `progress_entries`, `training_sessions`, `adjustments`, `programs` tables — all marked "Future", none implemented. Current DB has only: `users`, `intake_responses`, `pipeline_runs`, `agent_outputs`, `foods`.

**Dependencies**: T-1
**Effort**: M
**Touches**: `packages/database/src/schema.ts`, new migration files

### T-3: Trigger Evaluation Engine [CRITICAL]

**Description**: Pure function that evaluates whether caloric intake, training, or other parameters need modification based on accumulated check-in data. Implements the 7 rules from `pipeline.md` §7.3.

**Current state**: Rules fully specified in `pipeline.md` §7.3 (insufficient gain, excessive gain, waist-hip ratio, training stall, weight milestone, phase transition, no gain despite surplus). Zero implementation.

**Dependencies**: T-1, T-2
**Effort**: L (complex business logic, many edge cases, needs cycle-phase awareness)
**Touches**: New module `packages/agents/src/triggers.ts`, constants in `packages/shared/src/constants.ts`

### T-4: Partial Re-execution [CRITICAL]

**Description**: When a trigger fires, re-run only the affected agents. The re-execution matrix is fully specified in `pipeline.md` §10 (e.g., calorie adjustment re-runs NUTRITIONIST/DIETITIAN/CHEF but skips COACH).

**Current state**: The pipeline already accepts `agents: string[]` and filters `PIPELINE_ORDER`. What's missing: injecting cached outputs for skipped agents into `AgentContext.previousOutputs`, so re-run agents have full upstream context.

**Dependencies**: T-3
**Effort**: M (mechanism mostly exists, needs `cachedOutputs` parameter)
**Touches**: `packages/agents/src/pipeline.ts` (add `cachedOutputs?` param), `packages/agents/src/types.ts`

### T-5: Training Session Logging [CRITICAL]

**Description**: User logs what they actually did per session: sets, reps, weight, RPE, completion status. Without this, COACH can't detect stalls, prescribe deloads, or trigger phase transitions.

**Current state**: `DATABASE_SCHEMA.md` §2.6 defines `training_sessions` table with `exercises` JSONB including `actual[]` array for logged data. Not implemented.

**Dependencies**: T-2
**Effort**: M
**Touches**: `packages/database/src/schema.ts`, new API route

### T-6: Compliance Tracking [CRITICAL]

**Description**: Track whether the user follows the meal plan and training program. Meal adherence, training adherence, minimum-viable-day counting, streak tracking.

**Current state**: `weekly_checkin` schema includes `minimum_viable_days_count`. DIETITIAN outputs `compliance_risk` per meal slot and `tracking_protocol`. No implementation for collecting or analyzing compliance data.

**Dependencies**: T-1, T-5
**Effort**: M
**Touches**: New fields on progress_entries or separate compliance table

### T-7: Anomaly Detection & Cycle Detrending

**Description**: Weight fluctuates 0.5-2.3 kg from menstrual water retention, glycogen shifts, measurement timing. Raw weekly averages fire false triggers. Need: cycle-phase detrending, rolling averages with outlier rejection, noise vs trend distinction.

**Current state**: `pipeline.md` §7.3 mentions "cycle-adjusted weekly average" — undefined mathematically. SCIENTIST spec references cycle tracking but no detrending algorithm.

**Dependencies**: T-2, T-3
**Effort**: L
**Touches**: `packages/agents/src/triggers.ts`, potentially `knowledge/body-composition-science.md`

### T-8: Predictive Trajectory Analysis [MAJOR]

**Description**: Instead of waiting 2 weeks to detect undershoot, detect trajectory flattening after 1 week and communicate proactively. Predicted vs actual trajectory comparison. Early warning signals.

**Dependencies**: T-2, T-3, T-7
**Effort**: L
**Touches**: New analytics module

---

## 2. Output Quality & Safety

### Q-1: Recipe Macro Verification Pipeline [CRITICAL]

**Description**: Automatically verify CHEF's claimed recipe macros against USDA data. For each recipe, look up each ingredient via USDA FDC, scale to specified grams, sum, compare to `macros_per_serving`. Flag deviations >10%.

**Current state**: Infrastructure exists — `usda-fdc.ts` client, `nutrition-cache.ts`, `searchFoods()`, `scaleMacros()` all working. CHEF prompt specifies ±10% tolerance workflow. But nothing enforces this programmatically. CHEF can hallucinate macros and nothing catches it.

**Dependencies**: None (uses existing USDA infrastructure)
**Effort**: M
**Touches**: New module `packages/agents/src/validation/recipe-verifier.ts`, called post-CHEF in pipeline

### Q-2: Cross-Agent Consistency Checks [CRITICAL]

**Description**: After each agent completes, verify its output against upstream inputs before passing downstream. Catches: NUTRITIONIST deviating from SCIENTIST targets, DIETITIAN weekly totals drifting >5% from NUTRITIONIST, CHEF recipes violating DIETITIAN slot specs.

**Current state**: `pipeline.md` §8 specifies conflict detection rules. Not implemented. Pipeline passes outputs directly with no inter-agent validation.

**Dependencies**: None
**Effort**: M (add validation call between runner() and outputs.push() in pipeline loop)
**Touches**: `packages/agents/src/pipeline.ts` (3-line change), new `packages/agents/src/validation/consistency.ts`

### Q-3: Golden Dataset & Evaluation Framework [MAJOR]

**Description**: 3-5 synthetic client profiles covering edge cases (low BMI + novice + low appetite, normal BMI + intermediate + vegan, amenorrhea + ED history + high anxiety). Expected output ranges per agent per profile. Integration test suite that runs full pipeline and asserts outputs fall within expected bounds.

**Current state**: P2-14 in TRACKER explicitly lists this as TODO. No profiles, no expected outputs, no integration tests. 58 unit tests test tool functions only.

**Dependencies**: DX-2 (seed data)
**Effort**: XL
**Touches**: New `packages/agents/src/__tests__/golden/` directory

### Q-4: Hallucination Detection [MAJOR]

**Description**: Beyond recipe macros (Q-1), detect hallucinated claims from PHYSICIAN (medical advice not in knowledge base), SCIENTIST (miscalculations), COACH (inappropriate exercises for phase).

**Dependencies**: Q-1, Q-3
**Effort**: XL
**Touches**: Validation modules per agent

### Q-5: Agent Self-Correction / Reflection [MAJOR]

**Description**: After generating output, agent reviews its own output against constraints before submitting. A reflection pass. Currently single-shot generation.

**Dependencies**: None
**Effort**: L (per agent)
**Touches**: Agent runner files in `packages/agents/src/agents/`

### Q-6: PHYSICIAN Audit Trail [MAJOR]

**Description**: Medical recommendations need immutable, timestamped, separately queryable storage. Currently PHYSICIAN outputs are stored as JSON blobs in `agent_outputs` with no special treatment.

**Current state**: `DATABASE_SCHEMA.md` §2.12 defines `physician_queries` table. Not implemented.

**Dependencies**: T-2
**Effort**: M
**Touches**: `packages/database/src/schema.ts`, PHYSICIAN agent runner

### Q-7: Referral Follow-up Tracking [MAJOR]

**Description**: When PHYSICIAN recommends a referral, track: was it communicated? did the user follow through? is medical clearance required before pipeline resumption? Currently PHYSICIAN says "refer to specialist" and nothing tracks what happens next.

**Current state**: `pipeline.md` §6.4 specifies "New pipeline run blocked until user provides medical clearance confirmation" — not implemented. `DATABASE_SCHEMA.md` §2.11 `red_flags` table has `status` enum (detected → acknowledged → resolved → referred) — not implemented.

**Dependencies**: Q-6
**Effort**: M
**Touches**: `packages/database/src/schema.ts`, API routes for status updates

### Q-9: Prompt Versioning & A/B Testing [MAJOR]

**Description**: Agent specs are at v2 but there's no way to: track which prompt version produced which output, A/B test v2 vs v3, measure regression. The system prompt is baked into agent runner files.

**Dependencies**: Q-3
**Effort**: L
**Touches**: Agent runners, `agent_outputs` table (add prompt_version column)

---

## 3. Infrastructure & Operations

### ~~I-1: Authentication & Multi-tenancy~~ [REMOVED]

**Rationale**: MO is a single-user personal project. No multi-tenancy needed. Auth is unnecessary overhead. The single `users` row is sufficient as an identity anchor.

### I-2: Background Job Processing [CRITICAL]

**Description**: Pipeline runs 40-70s synchronously in an HTTP request handler. Fragile, blocks the server, can't retry, no progress streaming. Needs job queue.

**Current state**: `pipeline.ts` runs sequentially in the request handler. Tech stack ADR mentions future Redis. Pipeline hooks (`onAgentStart`, `onAgentComplete`) could emit progress events.

**Dependencies**: None
**Effort**: L
**Touches**: `apps/api/src/routes/pipeline.ts`, new job queue module

### ~~I-3: Rate Limiting~~ [REMOVED]

**Rationale**: Single-user personal project. Self-inflicted rate abuse is not a threat vector.

### I-4: Observability [CRITICAL]

**Description**: No latency dashboards, error rate monitoring, token cost aggregation, alerting. `duration_ms` and `llm_tokens_used` are stored in `agent_outputs` but never analyzed. Good architecture demands visibility into system behavior.

**Dependencies**: None
**Effort**: M
**Touches**: New metrics collection, potentially `/admin/stats` endpoint

### I-5: LLM Cost Tracking & Optimization

**Description**: No model routing (Haiku for simple recalculations, Sonnet for complex generation). No token budget per agent. No alert when a pipeline run costs more than expected. SCIENTIST's deterministic calculations don't need LLM calls.

**Dependencies**: I-4
**Effort**: M
**Touches**: `packages/agents/src/pipeline.ts`, agent runners

### I-6: Data Backup & Recovery [MAJOR]

**Description**: PostgreSQL with no documented backup policy. No point-in-time recovery. No data export.

**Dependencies**: None
**Effort**: M
**Touches**: Infrastructure/ops, docker-compose.yml

### ~~I-7: Consent & Privacy Management~~ [REMOVED]

**Rationale**: Single-user personal project. No regulatory requirements apply to self-hosted personal data.

---

## 4. Agent Intelligence

### A-1: CHEF Recipe Memory & Repetition Avoidance [MAJOR]

**Description**: CHEF generates from scratch every run. No awareness of: what was cooked last week, which recipes were prepared vs skipped, seasonal ingredients, leftover management. Over weeks, this produces repetitive or disconnected meal plans.

**Current state**: CHEF receives DIETITIAN output and generates recipes. No recipe history query. No user preference feedback. `DATABASE_SCHEMA.md` §2.5 specs a `recipes` table — not implemented.

**Dependencies**: D-1
**Effort**: L
**Touches**: CHEF agent runner, recipe storage, pipeline context

### A-2: COACH Autoregulation [MAJOR]

**Description**: Real autoregulation adjusts today's session based on warmup set performance, last night's sleep, and current soreness. Requires intra-session interaction, not weekly plan generation.

**Dependencies**: T-5, U-1
**Effort**: XL
**Touches**: Fundamental architectural change to COACH interaction model

### A-3: DIETITIAN Substitution Learning

**Description**: If the user always swaps fish for chicken, that's signal. DIETITIAN should learn implicit preferences beyond the initial intake, adapting meal templates to actual behavior.

**Dependencies**: T-6, D-5
**Effort**: M
**Touches**: DIETITIAN agent runner, user preference model

### A-4: PHYSICIAN Proactive Monitoring [MAJOR]

**Description**: PHYSICIAN only fires when explicitly called via `callPhysician` callback. A proactive PHYSICIAN would: monitor trends across check-ins (progressive sleep deterioration, mood decline), cross-reference supplement interactions, detect RED-S from composite signals.

**Current state**: PHYSICIAN is a synchronous interrupt callable by other agents. No background monitoring. No trend analysis.

**Dependencies**: T-2, Q-6
**Effort**: L
**Touches**: New background analysis module, PHYSICIAN agent, red_flags table

### A-5: Cross-Agent Signal Propagation

**Description**: Agents are siloed. If CHEF recipes aren't eaten → signal to DIETITIAN. If COACH detects Monday performance drops → signal to NUTRITIONIST about weekend compliance. No feedback between agents outside the main pipeline flow.

**Dependencies**: T-6, A-1
**Effort**: L
**Touches**: Pipeline architecture, agent context model

### A-6: SCIENTIST Predictive Mode

**Description**: SCIENTIST waits 2 weeks of undershoot before adjusting (+200 kcal). Could detect trajectory flattening after week 1 and communicate proactively. Related to T-8 but specifically about SCIENTIST behavior.

**Dependencies**: T-8
**Effort**: M
**Touches**: SCIENTIST agent spec, trigger evaluation

---

## 5. User Experience

### U-1: User Communication Layer [CRITICAL]

**Description**: No conversational interface. Can't ask PHYSICIAN questions ad-hoc. Can't report issues between check-ins (injury, illness, travel). When adjustments happen, no explanation of why. The pipeline returns JSON silently. A real trainer talks — explains the why, answers questions in the moment, adapts tone to how you're feeling.

**Dependencies**: None
**Effort**: XL
**Touches**: New chat/messaging infrastructure, agent invocation model

### U-2: Notifications & Reminders [CRITICAL]

**Description**: No check-in reminders (weekly weigh-in, biweekly measurements), training day prompts, meal prep alerts (batch cooking day), supplement timing reminders, deload week notices.

**Current state**: P1-9 in TRACKER lists "notification triggers" as remaining. Tech stack ADR mentions FCM for mobile push.

**Dependencies**: T-1, I-2
**Effort**: L
**Touches**: New notification service, user preference settings

### U-3: Progress Visualization & Dashboard [CRITICAL]

**Description**: No frontend. No weight trajectory chart (actual vs projected). No strength progression graphs. No measurement trends. No compliance heatmap. This is the primary surface the user interacts with daily.

**Current state**: P3-16 in TRACKER: "UI wireframes". Tech stack ADR specifies React Router v7 + Vite.

**Dependencies**: T-2
**Effort**: XL
**Touches**: New `apps/web/` package

### U-4: Photo Tracking [CRITICAL]

**Description**: Progress photos are the highest-impact motivational feedback for body recomposition. Side-by-side comparison across weeks/months. Standardized pose guidance. Overlay mode to see change over time.

**Current state**: `ideas.md` mentions "Maybe think about pictures to track". No design.

**Dependencies**: U-3, I-6
**Effort**: L
**Touches**: File storage, new UI component

### U-5: Training Session UI [CRITICAL]

**Description**: In-session interface for logging training: current exercise displayed with target sets/reps/weight, tap to log actual, rest timer between sets, RPE slider after each set, auto-progression suggestions when top of rep range hit. This replaces pen-and-paper or generic gym apps.

**Dependencies**: T-5, U-3
**Effort**: L
**Touches**: `apps/web/` or mobile app, training session API

### U-6: Meal Plan Viewer [CRITICAL]

**Description**: Daily/weekly meal plan view with: today's meals at a glance, recipe detail on tap, ingredient checklist, macro summary per meal and daily total, swap button for alternatives (from DIETITIAN's `alternatives` array), "I ate this" / "I skipped this" quick logging.

**Dependencies**: U-3, T-6
**Effort**: L
**Touches**: `apps/web/`, meal plan API

### U-7: Weekly Report / Summary [MAJOR]

**Description**: Auto-generated weekly summary: weight change, strength progressions, compliance rate, subjective marker trends, next week's focus. Written in the agent personalities (SCIENTIST gives the numbers, COACH gives the encouragement). Delivered as a push notification or in-app card.

**Dependencies**: T-1, T-2, U-2
**Effort**: M
**Touches**: Report generation module, notification service

### U-8: Adjustment Explanations [MAJOR]

**Description**: When SCIENTIST triggers a calorie adjustment or COACH modifies the program, the user gets a clear explanation: what changed, why, what the data showed, what to expect. Not raw JSON — a human-readable narrative from the agent's personality.

**Dependencies**: T-3, U-1
**Effort**: M
**Touches**: Adjustment result formatting, agent personality layer

### U-9: Adaptive Communication Style [MAJOR]

**Description**: Some users want the SCIENTIST numbers. Others want simple instructions. Output style should adapt to preference — data-rich mode vs simple mode. The agents have rich personalities in their specs but the output is uniform JSON.

**Dependencies**: U-1
**Effort**: M
**Touches**: Agent output formatting layer, user preference setting

### U-10: Calendar & Schedule View [MAJOR]

**Description**: Week view showing: training days with session focus, batch cooking days, check-in day, measurement day, supplement schedule, deload weeks. Syncs with external calendar (Google Calendar, Apple Calendar) via iCal export.

**Dependencies**: U-3, T-5
**Effort**: M
**Touches**: Calendar module, iCal export

### U-11: Cultural & Calendar Awareness

**Description**: Ramadan, holidays, travel, exams — all affect compliance. The system should accept planned disruptions and proactively adjust (lighter meal plan during travel, modified training during fasting, recovery protocol after vacation).

**Dependencies**: D-5, U-2
**Effort**: M
**Touches**: Calendar integration, DIETITIAN/CHEF context

---

<!-- as a fact we should try to kee[ as much data as we can. Persistence is key -->

## 6. Data & Knowledge

### D-1: Recipe Database Accumulation [MAJOR]

**Description**: CHEF generates recipes from scratch every pipeline run. Validated recipes (macro-verified via USDA, user-rated) should persist in a searchable database. CHEF draws from existing recipes when a good match exists, generates only when needed.

**Current state**: `DATABASE_SCHEMA.md` §2.5 defines `recipes` table. Not implemented. `ideas.md` mentions ingredient API and caching.

**Dependencies**: Q-1
**Effort**: L
**Touches**: `packages/database/src/schema.ts`, CHEF agent runner, recipe search logic

### D-2: Knowledge Versioning [MAJOR]

**Description**: Updating `knowledge/nutrition-science.md` affects all future runs with no way to track which knowledge version produced which output. No rollback if new knowledge degrades quality.

**Dependencies**: Q-9
**Effort**: M
**Touches**: Knowledge file management, agent output metadata

### D-3: Evidence Base Update Pipeline

**Description**: Scientific references in `knowledge/references.md` are static. New research publishes constantly. No pipeline to flag when cited studies are superseded or contradicted.

**Dependencies**: D-2
**Effort**: L
**Touches**: Knowledge base maintenance process

<!-- will a single or maybe 2 with the creator a male but, shouldnt change much for me, be enough data ? -->

### D-4: Outcome Tracking & Population Learning

**Description**: Over time, track what actually worked: which surplus levels produced the best gain rate? Which cuisines had highest compliance? Which exercises showed fastest progression? The system should learn from its own historical data.

**Dependencies**: T-2
**Effort**: XL
**Touches**: Analytics pipeline, aggregate queries on single-user historical data

### D-5: Static User Model Refresh [MAJOR]

**Description**: The intake questionnaire captures a snapshot. Over 12 months: cooking skill improves, appetite normalizes, gym anxiety decreases, food preferences evolve, life circumstances change. No mechanism to update the user profile incrementally.

**Dependencies**: T-1
**Effort**: M
**Touches**: User profile update API, how intake data flows into agents

---

## 7. Integrations

<!-- We need to expand these as tools for the partner, me to be honest. Let's think about user facing features for the cook -->

### X-1: Grocery/Shopping Lists [CRITICAL]

**Description**: CHEF generates recipes with ingredients. No aggregated weekly shopping list, no pantry tracking, no cost estimation, no batch cooking shopping consolidation.

**Current state**: `ideas.md` mentions grocery lists and stock tracking.

**Dependencies**: D-1
**Effort**: M
**Touches**: New module from CHEF output, potential API endpoint

### X-2: Wearable Integrations

**Description**: Step count, sleep data, heart rate — all manual self-report. Could automate via Apple Health, Google Fit, Fitbit, Garmin APIs.

**Dependencies**: None
**Effort**: L per integration
**Touches**: New integration service, progress_entries auto-population

---

## 8. Lifecycle & Engagement

<!-- We need to expand this massively the user is unmotivted, i don't blame sport is hard. But we need to maximize engagement. But she is smart, it needs to be subtle and fun -->

### L-1: Program Lifecycle Management [CRITICAL]

**Description**: No pause/resume (vacation, illness), no transition to maintenance at 65kg, no program completion logic, no long-term follow-up after month 12.

**Current state**: `DATABASE_SCHEMA.md` §2.2 `programs` table has `status` enum (active, paused, completed, cancelled). Not implemented.

**Dependencies**: T-2
**Effort**: L
**Touches**: `packages/database/src/schema.ts`, program state management, API routes

### L-2: Milestone/Achievement System [CRITICAL]

**Description**: No defined milestones (first 1kg, first lift progression, first phase transition, 50% to goal). No celebration mechanics. COACH spec says "celebrates progress explicitly" but has no data structure to detect or surface milestones.

**Dependencies**: T-2, T-5
**Effort**: M
**Touches**: Milestone detection logic, notification triggers

---

<!-- We need to expand these, a way for the dev (me) to have better insight into what is happening at every steps would be immensly useful. Dependencies graph, execution flow charts, we can and should add as much quality of life as possible-->

## 9. Developer Experience

### DX-1: Agent Playground [CRITICAL]

**Description**: To iterate on CHEF's prompt, you must run the full pipeline. Need a sandbox where you feed an agent specific input and inspect output in isolation.

**Dependencies**: None
**Effort**: M
**Touches**: New dev tool, potentially CLI script or simple web UI

### DX-2: Seed Data / Synthetic Profiles [CRITICAL]

**Description**: No way to bootstrap a dev environment with realistic test data. No synthetic user profiles for edge case testing (amenorrhea + high anxiety + no gym access).

**Dependencies**: None
**Effort**: M
**Touches**: New seed scripts, test fixtures

### DX-3: API Documentation (OpenAPI) [CRITICAL]

**Description**: No OpenAPI spec, no Swagger UI. P1-7 partially covers this.

**Dependencies**: None
**Effort**: M
**Touches**: `apps/api/` (Fastify OpenAPI plugin)

---

## Build Order (Phased)

### Phase 0: Foundation

Unlocks everything. No user-facing value alone, but everything depends on it.

| Item | Description                    | Effort |
| ---- | ------------------------------ | ------ |
| I-2  | Background job processing      | L      |
| DX-2 | Seed data / synthetic profiles | M      |
| DX-1 | Agent playground               | M      |

**Why I-1 (auth) isn't here**: For a single-user MVP, auth can be deferred. The temporal loop is more urgent. Auth becomes critical at multi-user.

### Phase 1: Core Loop

The system becomes temporal. This is the highest-impact work.

| Item | Description                  | Effort | Depends on |
| ---- | ---------------------------- | ------ | ---------- |
| T-1  | Check-in API + DB tables     | M      | —          |
| T-2  | Progress history storage     | M      | T-1        |
| T-5  | Training session logging     | M      | T-2        |
| T-3  | Trigger evaluation engine    | L      | T-1, T-2   |
| T-4  | Partial re-execution         | M      | T-3        |
| D-5  | Static user model refresh    | M      | T-1        |
| L-1  | Program lifecycle management | L      | T-2        |

**Outcome**: User submits weekly check-ins → SCIENTIST evaluates triggers → affected agents re-run → updated plan delivered. The adaptive loop is live.

### Phase 2: Quality & Safety

Outputs become trustworthy. Can partially parallelize with Phase 1.

| Item | Description                    | Effort | Depends on |
| ---- | ------------------------------ | ------ | ---------- |
| Q-2  | Cross-agent consistency checks | M      | —          |
| Q-1  | Recipe macro verification      | M      | —          |
| Q-3  | Golden dataset                 | XL     | DX-2       |
| Q-6  | PHYSICIAN audit trail          | M      | T-2        |
| Q-7  | Referral follow-up tracking    | M      | Q-6        |
| Q-8  | Ongoing ED detection           | L      | T-2, T-5   |
| I-4  | Observability                  | M      | —          |

**Outcome**: Agent outputs are verified against each other and against USDA ground truth. Medical recommendations are auditable. Edge cases tested.

### Phase 3: Intelligence & UX

The system becomes smart and usable.

| Item    | Description                    | Effort | Depends on                    |
| ------- | ------------------------------ | ------ | ----------------------------- |
| T-6     | Compliance tracking            | M      | T-1, T-5                      |
| D-1     | Recipe database accumulation   | L      | Q-1                           |
| A-1     | CHEF recipe memory             | L      | D-1                           |
| A-4     | PHYSICIAN proactive monitoring | L      | T-2, Q-6                      |
| U-2     | Notifications & reminders      | L      | T-1, I-2                      |
| U-3     | Progress dashboard             | XL     | T-2                           |
| L-2     | Milestone/achievement system   | M      | T-2, T-5                      |
| DX-3    | API documentation              | M      | —                             |
| ~~I-1~~ | ~~Authentication~~             | —      | REMOVED (single-user project) |

### Phase 4: Scale & Polish

Differentiators. Build when the core product is solid.

T-7, T-8, Q-4, Q-5, Q-9, I-3, I-5, I-6, I-7, A-2, A-3, A-5, A-6, U-1, U-4, U-5, U-6, D-2, D-3, D-4, X-1, X-2, X-3

---

## Appendix A: Temporal Loop Architecture

Detailed design for resolving Systemic Issue 1.

### A.1 Data Layer

New tables from `DATABASE_SCHEMA.md` (already fully specified, need migration):

| Table               | Purpose                                   | Key Fields                                                                            |
| ------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- |
| `programs`          | Coaching engagement container, state root | `current_week`, `current_phase`, `current_tier`, active macro targets, `status`       |
| `progress_entries`  | Weekly check-in storage                   | `weight_kg`, measurements, `cycle_phase`, `subjective_markers`, `minimum_viable_days` |
| `training_sessions` | Prescribed + actual session data          | `exercises` JSONB with `actual[]` array for logged sets/reps/weight                   |
| `adjustments`       | Triggered change records                  | `trigger_type`, `old_values`, `new_values`, `affected_agents`                         |
| `red_flags`         | Health concern lifecycle                  | `flag_type`, `severity`, `status` (detected → acknowledged → resolved → referred)     |

Migration order: `programs` first (other tables FK to it) → `progress_entries`, `training_sessions`, `adjustments`, `red_flags` in parallel.

`pipeline_runs` gains: `program_id` FK (replaces direct `user_id`), `trigger` column (enum: initial, weekly_checkin, adjustment, manual).

### A.2 Check-in API

New route: `POST /checkin`

```
Request body → weeklyCheckinSchema (new Zod schema matching pipeline.md §7.1)
  1. Validate input
  2. Look up active program for user
  3. Insert progress_entries row
  4. Call evaluateTriggers()
  5. If triggers fire → create pipeline_run with trigger: 'weekly_checkin', run partial re-execution
  6. If no triggers → return adjustment_result with triggers_fired: []
  7. Record adjustments rows
```

### A.3 Trigger Evaluation Engine

New pure function: `evaluateTriggers(program, currentCheckin, previousCheckins) → TriggerResult[]`

Implements `pipeline.md` §7.3 rules:

| Rule              | Condition                                    | Action                                  | Post-adaptation only? |
| ----------------- | -------------------------------------------- | --------------------------------------- | --------------------- |
| Insufficient gain | <0.25 kg/week × 2 consecutive weeks          | +200 kcal                               | Yes                   |
| Excessive gain    | >0.75 kg/week                                | -150 kcal                               | Yes                   |
| Waist-hip flag    | Waist growing faster than hips over 4+ weeks | Review, possible -100 kcal              | Yes                   |
| Training stall    | ≥3 sessions stalled on ≥2 lifts              | COACH modification                      | Yes                   |
| Weight milestone  | Every +5 kg gained                           | Full TDEE/macro recalculation           | No                    |
| Protein recalc    | Monthly                                      | Protein target update at current weight | No                    |
| Compliance issue  | >2 minimum viable days/week                  | DIETITIAN template simplification       | No                    |

Each trigger returns: `{ type, affectedAgents, oldValues, newValues, reason }`.

The `affectedAgents` array maps directly to the partial re-execution matrix in `pipeline.md` §10.

### A.4 Partial Re-execution

The existing `runPipeline` already supports agent subsets via `agents: string[]`. One change needed:

Add optional `cachedOutputs?: AgentEnvelope[]` parameter. When provided, pre-populate the `outputs` array with cached values before running the requested agents. This gives re-run agents full upstream context via `AgentContext.previousOutputs`.

Re-execution matrix (from `pipeline.md` §10):

| Trigger                | Re-run                        | Skip                           |
| ---------------------- | ----------------------------- | ------------------------------ |
| Calorie adjustment     | NUTRITIONIST, DIETITIAN, CHEF | COACH                          |
| Training stall         | COACH                         | NUTRITIONIST, DIETITIAN, CHEF  |
| Waist-hip flag         | All 4                         | None                           |
| Compliance issue       | DIETITIAN, CHEF               | SCIENTIST, NUTRITIONIST, COACH |
| Cycle-phase adjustment | DIETITIAN, CHEF               | SCIENTIST, COACH               |
| Tier progression       | NUTRITIONIST, DIETITIAN, CHEF | COACH                          |

### A.5 Program State Management

New module: `packages/agents/src/program.ts`

- `createProgram(userId, intakeId, scientistOutput)` — creates program from initial pipeline
- `getActiveProgram(userId)` — returns current active program
- `updateProgramFromAdjustment(programId, adjustmentResult)` — updates targets, tier, phase, week
- `advanceWeek(programId)` — increments week counter on check-in

The `programs` table becomes the single source of truth for "where is this client right now" — replacing the current stateless model where everything is tied to individual pipeline runs.

---

## Appendix B: Output Validation Architecture

Detailed design for resolving Systemic Issue 2.

### B.1 Three Validation Layers

**Layer 1: Structural + Range (synchronous, in-pipeline, zero latency cost)**

Extend Zod schemas in `packages/shared/src/schemas/agent-io.ts` with `.refine()`:

- SCIENTIST: `protein_g * 4 + fat_g * 9 + carbs_g * 4` within 5% of `target_intake_kcal`
- SCIENTIST: `protein_g / current_weight` in [1.6, 2.2] range
- SCIENTIST: `(fat_g * 9) / target_intake_kcal >= 0.25`
- SCIENTIST: `bmr_kcal` in [1000, 2500] reasonable range
- CHEF: each recipe `ingredients` count > 0
- COACH: weekly volume per muscle group within phase-appropriate range

Refinements need intake data as context → factory function `createValidatedSchema(context)`.

**Layer 2: Cross-Agent Consistency (synchronous, post-agent)**

New module: `packages/agents/src/validation/consistency.ts`

Add `validateAgentOutput(agentName, output, previousOutputs)` call in the pipeline loop, between `runner()` and `outputs.push()`:

| Check                                            | Tolerance               | On Failure                          |
| ------------------------------------------------ | ----------------------- | ----------------------------------- |
| NUTRITIONIST total macros vs SCIENTIST targets   | Exact match (rounding)  | Re-run NUTRITIONIST with constraint |
| DIETITIAN weekly total vs NUTRITIONIST daily × 7 | ±5%                     | Re-run DIETITIAN                    |
| CHEF recipe macros vs DIETITIAN slot spec        | ±10%                    | Re-run CHEF                         |
| COACH volume vs phase prescription               | Phase-appropriate range | Re-run COACH                        |

Max 1 retry. If still fails, escalate to user.

**Layer 3: USDA Recipe Verification (async, post-pipeline)**

For each CHEF recipe:

1. Look up each ingredient by name via existing `searchFoods()` from `usda-fdc.ts`
2. Scale to specified `amount_g` via existing `scaleMacros()` from `nutrition-cache.ts`
3. Sum all ingredients
4. Compare against `macros_per_serving`
5. Flag if deviation >10%

Runs asynchronously after pipeline completes. Results stored as metadata on pipeline run or in separate `recipe_verifications` table.

### B.2 Golden Dataset

New directory: `packages/agents/src/__tests__/golden/`

3-5 profiles:

1. **Reference**: 28y, 55kg, 174cm, BMI 18.2, novice, low appetite, commercial gym, regular cycle
2. **Edge — underweight anxious**: 22y, 48kg, 165cm, BMI 17.6, no training, high gym anxiety (9/10), home only, irregular cycle
3. **Edge — vegetarian intermediate**: 32y, 58kg, 170cm, BMI 20.1, intermediate, vegetarian, full gym, regular cycle
4. **Edge — medical flags**: 25y, 52kg, 168cm, BMI 18.4, novice, amenorrhea 4 months, ED history (past), medications
5. **Edge — advanced**: 35y, 62kg, 175cm, BMI 20.2, advanced, high appetite, both locations, postpartum 8 months

Each profile has expected output ranges (not exact values) per agent. Integration test runs full pipeline, asserts within ranges.

### B.3 Hallucination Detection Priority

| Agent        | Risk                             | Detection Method                   | Priority |
| ------------ | -------------------------------- | ---------------------------------- | -------- |
| CHEF         | High (macro claims)              | USDA verification (Layer 3)        | Phase 2  |
| SCIENTIST    | Medium (miscalculation)          | Zod refinements (Layer 1)          | Phase 2  |
| COACH        | Medium (inappropriate exercises) | Phase/tier filter validation       | Phase 2  |
| PHYSICIAN    | High (medical claims)            | Knowledge base similarity matching | Phase 4  |
| NUTRITIONIST | Low (pass-through + strategy)    | Cross-agent consistency (Layer 2)  | Phase 2  |
| DIETITIAN    | Low (template generation)        | Cross-agent consistency (Layer 2)  | Phase 2  |

---

## Cross-references

| Roadmap Item  | TRACKER.md Item                                                    |
| ------------- | ------------------------------------------------------------------ |
| DX-3          | P1-7 (API contract)                                                |
| T-1, T-3, U-2 | P1-9 (Feedback loop spec)                                          |
| Q-3, DX-2     | P2-14 (Test matrix, golden dataset)                                |
| ~~I-1~~       | ~~P2-15 (Multi-client generalization)~~ — N/A, single-user project |
| U-3           | P3-16 (UI wireframes)                                              |
| I-5           | P3-17 (COACH prompt optimization)                                  |
| X-1           | P3-18 (Food cost tiers)                                            |
| Q-8           | P3-19 (Missing health guardrails)                                  |
