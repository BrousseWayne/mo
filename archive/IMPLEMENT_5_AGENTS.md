# Plan: Implement 5 Remaining Agents

## Context

The MO pipeline has SCIENTIST fully implemented (tools, agent runner, unit tests) and registered in the pipeline. The 4 other sequential agents (NUTRITIONIST, DIETITIAN, CHEF, COACH) and the on-demand PHYSICIAN agent need implementation. All 6 agent specs are complete in `agents/*.md`. The pipeline orchestrator, Zod schemas, and API routes exist but only SCIENTIST is wired up.

---

## Established Pattern (replicate for each agent)

From the SCIENTIST implementation:

| Layer | File | Pattern |
|-------|------|---------|
| Tools | `packages/agents/src/tools/{agent}.ts` | Input/Output interfaces, pure functions, `toolExecutors` record, `toolDefinitions: Anthropic.Tool[]` |
| Runner | `packages/agents/src/agents/{agent}.ts` | `SYSTEM_PROMPT` const, tool-use loop with Sonnet 4.5, JSON extraction regex, Zod validation, `AgentEnvelope` return |
| Tests | `packages/agents/src/tools/__tests__/{agent}.test.ts` | Vitest, reference values from agent specs, edge cases |
| Schema | `packages/shared/src/schemas/agent-io.ts` | Zod output schema + type export |
| Registry | `packages/agents/src/pipeline.ts` | Add to `agentRegistry` |
| Exports | `packages/agents/src/index.ts` | Export runner + tools |

Runner signature: `async (client: Anthropic, context: AgentContext) => Promise<AgentEnvelope>`

---

## Implementation Order

**NUTRITIONIST → COACH → DIETITIAN → CHEF → PHYSICIAN**

- NUTRITIONIST first: only depends on SCIENTIST (done), unblocks DIETITIAN/CHEF chain
- COACH second: only depends on SCIENTIST (done), independent from nutrition chain
- DIETITIAN third: depends on NUTRITIONIST
- CHEF fourth: depends on DIETITIAN. Uses hardcoded ingredient macro table (not USDA API)
- PHYSICIAN last: on-demand (not sequential), requires pipeline modification for interrupt mechanism

---

## Phase 1: NUTRITIONIST

**Envelope**: `from_agent: "NUTRITIONIST"`, `to_agent: "DIETITIAN"`, `data_type: "nutrition_strategy"`

### Tools (`tools/nutritionist.ts`) — 4 functions

| Tool | Input | Output | Logic |
|------|-------|--------|-------|
| `distribute_protein` | `daily_protein_g, meal_count` | `{ breakfast_g, lunch_g, snack_g, dinner_g, presleep_g }` | Pre-sleep 30-40g (casein), remaining split across 4 meals. Sum = input. |
| `build_supplement_protocol` | `has_creatine_contraindication, medications[], training_status` | `Array<{ supplement, dose, timing, evidence }>` | Tier 1 always (creatine 3g, D3 2000IU, Mg 300mg). Tier 2 conditional (omega-3, ashwagandha, collagen). Skip creatine if contraindicated. |
| `calculate_hydration` | `base_hydration_L, takes_creatine, trains_today` | `{ target_L, breakdown }` | Base + creatine bonus 300-500ml + training bonus 500ml |
| `apply_cycle_adjustments` | `cycle_phase, base_target_kcal, base_macros` | `{ adjusted_kcal, recommendations[], extra_hydration_ml }` | Follicular: no change. Luteal: +100-200 kcal from carbs, +250ml water. |

### Zod Schema — `nutritionistOutputSchema`

Key fields: `target_intake_kcal`, `protein_g`, `fat_g`, `carbs_g`, `protein_distribution` object, `hardgainer_tactics[]`, `supplement_protocol[]`, `hydration_target_L`, `fiber_target_g`, `special_considerations[]`, `cycle_adjustments`, `current_tier`

### Agent Runner (`agents/nutritionist.ts`)

- System prompt: Extract from `agents/NUTRITIONIST.md` lines 40-211 (~170 lines)
- User message: SCIENTIST output from `context.previousOutputs.find(o => o.from_agent === "SCIENTIST")` + intake data
- Model: `claude-sonnet-4-5-20250929`, max_tokens: 4096

### Tests — ~8 cases

- `distribute_protein`: 100g → sum equals 100, pre-sleep ≥ 30, each meal ≥ 20
- `distribute_protein`: 80g edge case
- `build_supplement_protocol`: standard → 6-7 supplements including creatine
- `build_supplement_protocol`: creatine contraindicated → no creatine
- `calculate_hydration`: creatine + training → ~3.0L
- `calculate_hydration`: no creatine, no training → base only
- `apply_cycle_adjustments`: follicular → no calorie change
- `apply_cycle_adjustments`: luteal → +100-200 kcal, +250ml

---

## Phase 2: COACH

**Envelope**: `from_agent: "COACH"`, `to_agent: "USER"`, `data_type: "training_program"`

### Tools (`tools/coach.ts`) — 4 functions

| Tool | Input | Output | Logic |
|------|-------|--------|-------|
| `assign_phase` | `weeks_on_program, training_experience, stall_detected, consecutive_stall_sessions` | `{ phase, phase_week, rationale }` | Wk 0-2 + exp "none" → phase_0. Wk 3-16 → phase_1. Wk 17+ or stall≥3 post-deload → phase_2. |
| `calculate_weekly_volume` | `exercises: Array<{ name, muscle_groups[], sets }>` | `Record<string, number>` | Sum sets per muscle group. Target: glutes 12-15, glute med 4-6, back 9+. |
| `check_progressive_overload` | `training_log: Array<{ exercise, sets: Array<{weight_kg, reps}>, rep_range_top }>` | `Array<{ exercise, ready_to_increase, reason }>` | All sets hit top of range → ready. Otherwise not. |
| `schedule_deload` | `weeks_since_last_deload, consecutive_stall_sessions, sleep_hours_avg` | `{ deload_needed, reason, deload_protocol }` | Needed if weeks ≥ 6 or stall ≥ 3. Protocol: 50% volume, same intensity, 1 week. |

### Zod Schema — `coachOutputSchema`

Key fields: `program` object (phase, phase_week, frequency, sessions array with exercises/sets/reps/RPE/warmup), `progression_rules[]`, `recovery_protocol[]`, `phase_transition_criteria[]`, `weekly_volume_summary`

### Agent Runner (`agents/coach.ts`)

- System prompt: Extract from `agents/COACH.md` lines 55-456 (~400 lines — largest prompt)
- User message: SCIENTIST output + intake data (equipment_access, training_status, gym_anxiety_level, injuries)
- Model: `claude-sonnet-4-5-20250929`, max_tokens: 4096

### Tests — ~10 cases

- `assign_phase`: weeks=0, exp="none" → phase_0
- `assign_phase`: weeks=5 → phase_1
- `assign_phase`: weeks=17 → phase_2
- `assign_phase`: stall≥3 post-deload → phase_2
- `calculate_weekly_volume`: 3-day full body → glutes ≥ 12 sets
- `calculate_weekly_volume`: glute med counted separately
- `check_progressive_overload`: all sets at top → ready
- `check_progressive_overload`: mixed reps → not ready
- `schedule_deload`: 7 weeks → needed
- `schedule_deload`: 3 weeks, no stall → not needed

---

## Phase 3: DIETITIAN

**Envelope**: `from_agent: "DIETITIAN"`, `to_agent: "CHEF"`, `data_type: "weekly_meal_plan"`

### Tools (`tools/dietitian.ts`) — 3 functions

| Tool | Input | Output | Logic |
|------|-------|--------|-------|
| `allocate_meal_slots` | `target_intake_kcal, protein_distribution, fat_g, carbs_g` | 5 slot specs with per-meal macros and constraints | Calories derived from macros per meal. Constraints: breakfast=fast_prep, lunch/dinner=batch_cookable, snack=portable/can_be_shake, presleep=casein_based. |
| `apply_calorie_tier` | `tier (0/1/2), base_slots, target_intake_kcal` | Adjusted slot specs | Tier 0: ~2100 kcal + 1 shake. Tier 1: ~2300 + stealth fats. Tier 2: full target. |
| `build_emergency_protocol` | (none) | Emergency day spec | Fixed: 3 shakes/minimal meal ≈ 1800 kcal, ≥ 85g protein. |

### Zod Schema — `dietitianOutputSchema`

Key fields: `weekly_template` (7 days × 5 meal slots, each with slot_spec/macros, alternatives[], primary_protein, cuisine_preference, batch_portion), `substitution_bank`, `emergency_protocol`, `solo_week_protocol`, `tracking_protocol`

### Agent Runner (`agents/dietitian.ts`)

- System prompt: Extract from `agents/DIETITIAN.md` lines 43-227 (~185 lines)
- User message: NUTRITIONIST output + intake data. Inject `agents/artifacts/dietitian-meal-template.md` as reference context.
- Model: `claude-sonnet-4-5-20250929`, **max_tokens: 8192** (large output: 35 meal slots)

### Tests — ~7 cases

- `allocate_meal_slots`: 2500 kcal → sum within 5% of target
- `allocate_meal_slots`: pre-sleep protein ≥ 30g
- `allocate_meal_slots`: correct constraints per slot
- `apply_calorie_tier`: tier 0 → ~2100 kcal
- `apply_calorie_tier`: tier 2 → matches target
- `build_emergency_protocol`: total ≈ 1800 kcal, protein ≥ 85g

---

## Phase 4: CHEF

**Envelope**: `from_agent: "CHEF"`, `to_agent: "USER"`, `data_type: "recipes"`

### Tools (`tools/chef.ts`) — 3 functions

| Tool | Input | Output | Logic |
|------|-------|--------|-------|
| `calculate_recipe_macros` | `ingredients: Array<{ item, amount_g }>` | `{ total_protein_g, total_fat_g, total_carbs_g, total_fiber_g, total_calories }` | Hardcoded lookup table (~40 ingredients with per-100g macros). Fuzzy name matching. Returns null for unknown ingredients. |
| `scale_batch` | `recipe_ingredients[], target_servings, original_servings` | Scaled ingredient list | `amount_g * (target / original)`, rounded to nearest gram. |
| `compose_shake` | `base_ingredients[], boosters[]` | `{ ingredients, macros_per_serving }` | Combine base + boosters, calls `calculate_recipe_macros` internally. |

### Hardcoded Ingredient Table

~40 entries covering all MO-relevant ingredients: chicken thigh/breast, salmon, beef, eggs, rice, oats, pasta, potatoes, whole milk, whey protein, casein, banana, olive oil, tahini, sunflower seed butter, Greek yogurt, cottage cheese, avocado, sweet potato, quinoa, broccoli, spinach, etc.

### Zod Schema — `chefOutputSchema`

Key fields: `recipes[]` — each with recipe_name, cuisine, meal_pattern, servings, ingredients[], macros_per_serving, instructions[], seasoning_stack, time, batch_notes, storage, calorie_boost_options[]

### Agent Runner (`agents/chef.ts`)

- System prompt: Extract from `agents/CHEF.md` lines 52-242 (~190 lines)
- User message: DIETITIAN output. Inject `agents/artifacts/chef-batch-cooking.md` and `agents/artifacts/chef-shake-recipes.md` as reference context.
- Model: `claude-sonnet-4-5-20250929`, **max_tokens: 8192** (multiple full recipes)

### Tests — ~8 cases

- `calculate_recipe_macros`: chicken 150g + rice 200g + olive oil 15g → verify against manual calculation
- `calculate_recipe_macros`: shake ingredients → verify against chef-shake-recipes.md values
- `calculate_recipe_macros`: unknown ingredient → null handling
- `scale_batch`: 1 → 4 servings → amounts × 4
- `scale_batch`: fractional (0.5) → amounts halved
- `compose_shake`: base + boosters → correct totals

---

## Phase 5: PHYSICIAN

**On-demand agent. NOT in `PIPELINE_ORDER`. Uses Haiku 4.5.**

**Envelope**: `from_agent: "PHYSICIAN"`, `to_agent: varies`, `data_type: "medical_context"`

### Tools (`tools/physician.ts`) — 3 functions

| Tool | Input | Output | Logic |
|------|-------|--------|-------|
| `classify_red_flag` | `symptom, duration_days, bmi, training_weeks` | `{ urgency, referral_target, pipeline_action, rationale }` | Pattern-match symptom keywords against red flag table. Amenorrhea>90d → urgent/pause. Pain>7d → soon/continue. ED signs → urgent/pause. |
| `lookup_supplement_safety` | `supplement_name` | `{ safety_profile, dose_range, contraindications[], interactions[] }` | Lookup table (6 supplements from PHYSICIAN spec). Unknown → generic safety notice. |
| `assess_refeeding_risk` | `bmi, recent_intake_pattern` | `{ risk_level, protocol, monitoring[] }` | BMI≥18.5 + normal → low. BMI≥18.5 + reduced → moderate. BMI<16 or severe → high. |

### Zod Schema — `physicianOutputSchema`

Key fields: `response`, `sources[]` (author/year/finding), `mechanism_explained`, `timeline` (nullable), `referral_needed`, `referral_target` (nullable), `urgency` (routine/soon/urgent), `pipeline_action` (continue/pause/abort), `disclaimer`

### Agent Runner (`agents/physician.ts`)

- System prompt: Extract from `agents/PHYSICIAN.md` lines 53-362 (~310 lines)
- **Model: `claude-haiku-4-5-20251001`** (per CLAUDE.md tech stack)
- Different signature to accept health query: `runPhysician(client, context, query?)`

### Pipeline Integration

Add `callPhysician` callback to `AgentContext` in `types.ts`:
```
callPhysician?: (query: { query_type: string; query: string; requesting_agent: string }) => Promise<AgentEnvelope>
```

In `runPipeline`, create and inject the callback so any agent runner can call `context.callPhysician?.(query)`.

PHYSICIAN is NOT added to `PIPELINE_ORDER` — it stays on-demand only.

### Tests — ~9 cases

- `classify_red_flag`: amenorrhea 100 days → urgent, gynecologist, pause
- `classify_red_flag`: knee pain 3 days → routine, continue
- `classify_red_flag`: knee pain 10 days → soon, physiotherapist
- `classify_red_flag`: ED signs → urgent, psychologist, pause
- `lookup_supplement_safety`: creatine → correct profile
- `lookup_supplement_safety`: ashwagandha → thyroid interaction
- `lookup_supplement_safety`: unknown → generic notice
- `assess_refeeding_risk`: BMI 18.5 normal → low
- `assess_refeeding_risk`: BMI 15 severe → high

---

## Files Summary

### New files (16)

| File | Phase |
|------|-------|
| `packages/agents/src/tools/nutritionist.ts` | 1 |
| `packages/agents/src/tools/__tests__/nutritionist.test.ts` | 1 |
| `packages/agents/src/agents/nutritionist.ts` | 1 |
| `packages/agents/src/tools/coach.ts` | 2 |
| `packages/agents/src/tools/__tests__/coach.test.ts` | 2 |
| `packages/agents/src/agents/coach.ts` | 2 |
| `packages/agents/src/tools/dietitian.ts` | 3 |
| `packages/agents/src/tools/__tests__/dietitian.test.ts` | 3 |
| `packages/agents/src/agents/dietitian.ts` | 3 |
| `packages/agents/src/tools/chef.ts` | 4 |
| `packages/agents/src/tools/__tests__/chef.test.ts` | 4 |
| `packages/agents/src/agents/chef.ts` | 4 |
| `packages/agents/src/tools/physician.ts` | 5 |
| `packages/agents/src/tools/__tests__/physician.test.ts` | 5 |
| `packages/agents/src/agents/physician.ts` | 5 |
| `packages/agents/src/tools/ingredients.ts` | 4 |

### Modified files (5 unique, touched across phases)

| File | Changes |
|------|---------|
| `packages/shared/src/schemas/agent-io.ts` | Add 5 output schemas + types |
| `packages/agents/src/pipeline.ts` | Register 5 agents + add PHYSICIAN callback |
| `packages/agents/src/index.ts` | Export 5 runners + tools |
| `packages/agents/src/types.ts` | Add `callPhysician?` to AgentContext |
| `packages/shared/src/constants.ts` | Add PHYSICIAN_AGENT constant |

---

## Verification

After each phase, run:
```bash
pnpm --filter @mo/agents test
```

After all phases:
1. All unit tests pass (~42 test cases)
2. `agentRegistry` in pipeline.ts has 5 entries (SCIENTIST + 4 new)
3. `agent-io.ts` exports 6 schemas (1 existing + 5 new)
4. TypeScript compiles: `pnpm --filter @mo/agents build`
5. Pipeline dry-run: request all 5 agents, verify sequential execution and envelope chaining
