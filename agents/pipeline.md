# Inter-Agent Communication Specification

Version 1.0

**Implementation**: TypeScript monorepo (Turborepo + pnpm). Backend: Fastify. Validation: Zod. Agent runtime: custom sequential pipeline with Claude tool-use.

---

## 1. Pipeline State Machine

### States

| State | Description |
|-------|-------------|
| `intake_pending` | Waiting for user to complete intake questionnaire |
| `scientist_processing` | SCIENTIST calculating BMR, TDEE, macros, timelines |
| `nutritionist_processing` | NUTRITIONIST developing strategy from SCIENTIST targets |
| `dietitian_processing` | DIETITIAN building weekly meal template from strategy |
| `chef_processing` | CHEF generating recipes for slot specs |
| `coach_processing` | COACH producing training program |
| `output_ready` | All agents complete, final output assembled |
| `paused_physician` | Pipeline halted pending PHYSICIAN evaluation |
| `error` | Unrecoverable failure; requires manual intervention |

### Valid Transitions

```
intake_pending        → scientist_processing
scientist_processing  → nutritionist_processing
scientist_processing  → paused_physician         (red flag detected)
scientist_processing  → error                    (timeout/validation failure)
nutritionist_processing → dietitian_processing
nutritionist_processing → paused_physician       (red flag detected)
nutritionist_processing → scientist_processing   (validation failure, upstream re-run)
nutritionist_processing → error
dietitian_processing  → chef_processing
dietitian_processing  → nutritionist_processing  (validation failure, upstream re-run)
dietitian_processing  → paused_physician         (red flag detected)
dietitian_processing  → error
chef_processing       → coach_processing
chef_processing       → dietitian_processing     (slot spec conflict, request clarification)
chef_processing       → error
coach_processing      → output_ready
coach_processing      → paused_physician         (red flag detected)
coach_processing      → error
paused_physician      → {previous_state}         (pipeline_action = "continue")
paused_physician      → paused_physician         (pipeline_action = "pause_pending_referral")
paused_physician      → error                    (pipeline_action = "abort")
output_ready          → scientist_processing     (weekly feedback loop triggers re-run)
```

COACH and the nutrition chain (SCIENTIST through CHEF) receive data in parallel only at initial pipeline run. On feedback loops, re-execution is partial (see section 10).

---

## 2. Canonical Message Envelope

Every inter-agent message uses this wrapper:

```json
{
  "message_id": "uuid-v4",
  "from_agent": "SCIENTIST",
  "to_agent": "NUTRITIONIST",
  "data_type": "macro_targets",
  "payload": {},
  "pipeline_run_id": "uuid-v4",
  "timestamp": "2026-02-09T14:30:00Z",
  "version": "1.0"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message_id` | string (UUID v4) | yes | Unique identifier for this message |
| `from_agent` | string | yes | Sending agent: `INTAKE`, `SCIENTIST`, `NUTRITIONIST`, `DIETITIAN`, `CHEF`, `COACH`, `PHYSICIAN` |
| `to_agent` | string | yes | Receiving agent (same enum + `USER` for final output) |
| `data_type` | string | yes | Schema identifier for `payload` (see section 4) |
| `payload` | object | yes | Agent-specific data conforming to `data_type` schema |
| `pipeline_run_id` | string (UUID v4) | yes | Groups all messages from a single pipeline execution |
| `timestamp` | string (ISO 8601) | yes | UTC timestamp of message creation |
| `version` | string | yes | Schema version. Currently `"1.0"` |

---

## 3. Canonical Field Names

All agents use these normalized field names. Deviations are rejected at validation.

| Canonical Name | Type | Unit | Replaces |
|----------------|------|------|----------|
| `target_intake_kcal` | number | kcal | `daily_calories`, `total_calories`, `calorie_target` |
| `protein_g` | number | g | `daily_protein_g`, `protein_target` |
| `fat_g` | number | g | `daily_fat_g`, `fat_target` |
| `carbs_g` | number | g | `daily_carbs_g`, `carb_target` |
| `fiber_g_min` | number | g | `fiber_minimum`, `min_fiber` |
| `fiber_target_g` | number | g | `fiber_goal`, `daily_fiber` |
| `current_weight_kg` | number | kg | `weight`, `body_weight` |
| `target_weight_kg` | number | kg | `goal_weight` |
| `protein_g_per_kg` | number | g/kg | `protein_ratio` |
| `hydration_L` | number | L | `water_target`, `daily_water` |
| `weekly_weight_target_kg` | number | kg/week | `gain_rate` |

`fiber_g_min` is the hard floor (SCIENTIST output). `fiber_target_g` is the operational target (NUTRITIONIST output, may be higher).

---

## 4. Schema Summary per Edge

### 4.1 INTAKE -> SCIENTIST

**data_type**: `"intake_data"`

| Field | Type | Notes |
|-------|------|-------|
| `age` | number | years |
| `height_cm` | number | |
| `current_weight_kg` | number | morning, fasted, post-void |
| `target_weight_kg` | number | |
| `training_phase` | string | `"pre_training"` or `"active_training"` |
| `estimated_daily_intake_kcal` | number | self-reported baseline |
| `avg_daily_steps` | number | NEAT proxy |
| `menstrual_status` | string | `"regular"`, `"irregular"`, `"amenorrhea"` |
| `training_experience` | string | `"none"`, `"beginner"`, `"intermediate"` |
| `food_aversions` | string[] | always includes `"peanut_butter"`, `"nut_butters"` |
| `appetite_level` | string | `"low"`, `"normal"`, `"high"` |
| `cooking_skill` | string | `"basic"`, `"intermediate"`, `"advanced"` |
| `partner_cooks` | boolean | |
| `equipment_access` | string | `"home_minimal"`, `"home_full"`, `"commercial_gym"`, `"both"` |
| `gym_anxiety_level` | string | `"high"`, `"moderate"`, `"low"` |
| `medical_history` | object | medications, conditions, injuries |

### 4.2 SCIENTIST -> NUTRITIONIST

**data_type**: `"macro_targets"`

| Field | Type | Notes |
|-------|------|-------|
| `bmr_kcal` | number | Mifflin-St Jeor |
| `tdee_kcal` | number | BMR x activity multiplier |
| `target_intake_kcal` | number | TDEE + surplus |
| `protein_g` | number | 1.6-2.0 g/kg |
| `protein_g_per_kg` | number | |
| `fat_g` | number | >=25% of calories |
| `fat_percent` | number | |
| `carbs_g` | number | remainder |
| `fiber_g_min` | number | >=20g |
| `hydration_L` | number | |
| `current_weight_kg` | number | |
| `target_weight_kg` | number | |
| `weekly_weight_target_kg` | number | 0.25-0.5 kg/week |
| `training_phase` | string | |
| `weeks_on_program` | number | |
| `adaptation_period_complete` | boolean | false if weeks_on_program < 4 |
| `client_constraints` | object | `food_aversions`, `appetite_level`, `cooking_skill`, `partner_cooks` |

### 4.3 NUTRITIONIST -> DIETITIAN

**data_type**: `"nutrition_strategy"`

| Field | Type | Notes |
|-------|------|-------|
| `target_intake_kcal` | number | pass-through from SCIENTIST |
| `protein_g` | number | pass-through |
| `fat_g` | number | pass-through |
| `carbs_g` | number | pass-through |
| `protein_distribution` | object | per-meal protein targets: `breakfast_g`, `lunch_g`, `snack_g`, `dinner_g`, `presleep_g` |
| `hardgainer_tactics` | string[] | ordered by priority |
| `supplement_protocol` | object[] | each: `supplement`, `dose`, `timing` |
| `hydration_target_L` | number | may exceed SCIENTIST base due to creatine/training |
| `fiber_target_g` | number | operational target (>= fiber_g_min) |
| `special_considerations` | string[] | appetite, partner, calcium-iron separation |
| `cycle_adjustments` | object | `follicular` and `luteal` strategy strings |
| `current_tier` | number | 0, 1, or 2 (calorie ramp-up tier) |

### 4.4 DIETITIAN -> CHEF

**data_type**: `"weekly_meal_plan"`

| Field | Type | Notes |
|-------|------|-------|
| `weekly_template` | object | keyed by day (monday-sunday), each day keyed by meal slot |
| `weekly_template.{day}.{meal}.slot_spec` | object | `protein_g`, `calories`, `carbs_g`, `fat_g`, `prep_time_max_min`, `constraints` |
| `weekly_template.{day}.{meal}.alternatives` | string[] | recipe IDs for substitution |
| `weekly_template.{day}.{meal}.primary_protein` | string | protein source assignment |
| `weekly_template.{day}.{meal}.cuisine_theme` | string or null | |
| `substitution_bank` | object | keyed by slot type, each an array of recipe IDs |
| `emergency_protocol` | object | minimum viable day spec: meals, calories, protein targets |
| `solo_week_protocol` | object | partner-unavailable fallback |
| `tracking_protocol` | object | weeks 1-4 vs 5+ method |

Meal slot enum: `"breakfast"`, `"lunch"`, `"snack"`, `"dinner"`, `"presleep"`

### 4.5 CHEF -> OUTPUT

**data_type**: `"recipes"`

| Field | Type | Notes |
|-------|------|-------|
| `recipes` | object[] | array of recipe objects |
| `recipes[].recipe_name` | string | |
| `recipes[].cuisine` | string | |
| `recipes[].servings` | number | |
| `recipes[].ingredients` | object[] | each: `item`, `amount_g`, `prep_notes` |
| `recipes[].macros_per_serving` | object | `protein_g`, `fat_g`, `carbs_g`, `fiber_g`, `calories` |
| `recipes[].instructions` | string[] | step-by-step |
| `recipes[].time` | object | `prep_min`, `cook_min` |
| `recipes[].batch_notes` | string | |
| `recipes[].storage` | object | `fridge_days`, `freezer_friendly` |
| `recipes[].calorie_boost_options` | string[] | |

### 4.6 SCIENTIST -> COACH

**data_type**: `"training_input"`

| Field | Type | Notes |
|-------|------|-------|
| `client_data` | object | `training_experience`, `equipment_access`, `gym_anxiety_level`, `weeks_on_program`, `current_phase`, `injuries`, `available_days`, `menstrual_cycle_day`, `cycle_phase` |
| `progress_data` | object | `training_log` (last session exercises with sets/reps/weight), `stall_detected`, `consecutive_stall_sessions`, `sleep_hours_avg`, `step_count_avg` |
| `scientist_triggers` | object | `phase_transition_due`, `deload_recommended`, `adjustment_note` |

### 4.7 COACH -> OUTPUT

**data_type**: `"training_program"`

| Field | Type | Notes |
|-------|------|-------|
| `program` | object | `phase`, `phase_week`, `frequency`, `total_weeks_remaining_in_phase` |
| `program.sessions` | object[] | each: `day`, `focus`, `warmup` (string[]), `exercises` (object[]) |
| `program.sessions[].exercises[]` | object | `name`, `sets`, `reps`, `rest_sec`, `notes`, `target_rpe`, `progression_rule` |
| `progression_rules` | string[] | |
| `recovery_protocol` | string[] | |
| `phase_transition_criteria` | string[] | |
| `weekly_volume_summary` | object | sets/week per muscle group |

### 4.8 Any Agent -> PHYSICIAN

**data_type**: `"health_query"`

| Field | Type | Notes |
|-------|------|-------|
| `query_type` | string | `"health_question"`, `"red_flag"`, `"symptom_check"` |
| `query` | string | free-text description |
| `requesting_agent` | string | agent that triggered the query |
| `user_context` | object | `current_weight_kg`, `bmi`, `symptoms`, `menstrual_status`, `training_weeks`, `supplements_current` |

### 4.9 PHYSICIAN -> Requesting Agent

**data_type**: `"medical_context"`

| Field | Type | Notes |
|-------|------|-------|
| `response` | string | evidence-based explanation |
| `sources` | object[] | each: `author`, `year`, `publication`, `finding` |
| `mechanism_explained` | string | physiological mechanism in accessible language |
| `timeline` | string or null | expected resolution timeline |
| `referral_needed` | boolean | |
| `referral_target` | string or null | specific specialist type |
| `urgency` | string | `"routine"`, `"soon"`, `"urgent"` |
| `pipeline_action` | string | `"continue"`, `"pause_pending_referral"`, `"abort"` |
| `disclaimer` | string | medical disclaimer (always present) |

---

## 5. PHYSICIAN Invocation Contract

PHYSICIAN is not a pipeline stage. It is a synchronous interrupt callable by any agent or by the user.

### Invocation Flow

```
1. Agent detects red flag or receives health question
2. Agent sends health_query message to PHYSICIAN
3. Pipeline state transitions to paused_physician
4. PHYSICIAN processes and returns medical_context
5. Pipeline reads pipeline_action from PHYSICIAN response
```

### pipeline_action Outcomes

| Value | Pipeline Behavior |
|-------|-------------------|
| `"continue"` | Resume from the state that triggered the pause. PHYSICIAN response attached as context to next agent. |
| `"pause_pending_referral"` | Pipeline remains in `paused_physician`. User is shown the referral recommendation. Pipeline resumes only when user explicitly confirms they have seen the referral and wish to continue. |
| `"abort"` | Pipeline transitions to `error`. User directed to seek medical care. No further agent processing. Pipeline run is terminated. A new pipeline run is required after medical clearance. |

### Invocation Rules

- Any agent can invoke PHYSICIAN at any point during its processing.
- Only one PHYSICIAN invocation can be active at a time.
- PHYSICIAN does not modify any other agent's output.
- PHYSICIAN response is logged but does not alter the data flowing through the main pipeline (it is metadata, not payload).
- If multiple red flags are detected in the same pipeline run, they are batched into a single PHYSICIAN query.

---

## 6. Error Handling

### 6.1 Agent Timeout

| Step | Action |
|------|--------|
| 1 | Agent does not respond within 30 seconds |
| 2 | Orchestrator retries the same agent with identical input (1 retry) |
| 3 | If retry also times out, pipeline transitions to `error` |
| 4 | Error message includes: `failing_agent`, `pipeline_run_id`, `timeout_duration_ms`, `input_hash` |

### 6.2 Validation Failure

| Step | Action |
|------|--------|
| 1 | Downstream agent receives output that fails schema validation |
| 2 | Orchestrator sends error context back to the failing (upstream) agent: missing fields, type mismatches, constraint violations |
| 3 | Failing agent re-processes with error context attached |
| 4 | If second attempt also fails validation, pipeline transitions to `error` |

### 6.3 Upstream Data Missing

| Step | Action |
|------|--------|
| 1 | Agent requires data that should have been provided by an upstream agent but is absent |
| 2 | Agent returns a structured `upstream_data_request` specifying which fields are missing and from which agent |
| 3 | Orchestrator triggers re-run of the upstream agent |
| 4 | If upstream agent cannot produce the missing data after re-run, pipeline transitions to `error` |

### 6.4 PHYSICIAN Abort

| Step | Action |
|------|--------|
| 1 | PHYSICIAN returns `pipeline_action: "abort"` |
| 2 | Pipeline immediately transitions to `error` |
| 3 | All in-progress agent tasks are cancelled |
| 4 | User receives: PHYSICIAN response, referral details, instruction to seek medical care |
| 5 | Pipeline run is marked as `terminated_medical` |
| 6 | New pipeline run blocked until user provides medical clearance confirmation |

### Error Message Schema

```json
{
  "message_id": "uuid-v4",
  "from_agent": "ORCHESTRATOR",
  "to_agent": "USER",
  "data_type": "pipeline_error",
  "payload": {
    "error_type": "timeout | validation_failure | upstream_missing | physician_abort",
    "failing_agent": "SCIENTIST",
    "details": "Description of what failed",
    "pipeline_run_id": "uuid-v4",
    "recoverable": true,
    "retry_count": 1
  },
  "timestamp": "ISO8601",
  "version": "1.0"
}
```

---

## 7. Feedback Loop Spec

The weekly monitoring cycle re-enters the pipeline with updated data.

### 7.1 Check-In Input Schema

**data_type**: `"weekly_checkin"`

```json
{
  "from_agent": "USER",
  "to_agent": "SCIENTIST",
  "data_type": "weekly_checkin",
  "payload": {
    "weight_kg": 56.2,
    "waist_cm": 68.5,
    "hip_cm": 92.5,
    "cycle_phase": "follicular",
    "cycle_day": 10,
    "training_log": {
      "sessions_completed": 3,
      "exercises": [
        {
          "name": "Hip Thrust",
          "best_set": {"weight_kg": 45, "reps": 12},
          "progressed": true
        }
      ]
    },
    "subjective_markers": {
      "energy": 7,
      "sleep_quality": 8,
      "mood": 7,
      "appetite": 5
    },
    "minimum_viable_days_count": 1,
    "notes": "Felt bloated on Wednesday, skipped afternoon snack"
  },
  "pipeline_run_id": "uuid-v4",
  "timestamp": "ISO8601",
  "version": "1.0"
}
```

### 7.2 Field Requirements

| Field | Required | Frequency |
|-------|----------|-----------|
| `weight_kg` | yes | weekly |
| `waist_cm` | yes | biweekly (every 2 weeks) |
| `hip_cm` | yes | biweekly (every 2 weeks) |
| `cycle_phase` or `cycle_day` | no | weekly if tracking |
| `training_log` | no | weekly if available |
| `subjective_markers` | no | weekly (1-10 scale each) |
| `minimum_viable_days_count` | no | weekly |

### 7.3 Processing Flow

```
1. USER submits weekly_checkin
2. SCIENTIST evaluates against adjustment trigger rules:
   - Gain <0.25 kg/week x 2 weeks (post-adaptation) → +200 kcal
   - Gain >0.75 kg/week (post-adaptation) → -150 kcal
   - Waist growing faster than hips → flag for review
   - Training stall >=3 sessions on >=2 lifts → COACH modifies
   - TDEE recalculation at every 5 kg gained
   - Protein recalculation monthly
3. If NO trigger fires → output "no_change"
4. If trigger fires → determine affected agents (see section 10)
5. Re-run affected agents with updated targets
6. Produce delta output (only changed fields)
```

### 7.4 Output Schema

**data_type**: `"adjustment_result"`

```json
{
  "from_agent": "SCIENTIST",
  "to_agent": "USER",
  "data_type": "adjustment_result",
  "payload": {
    "triggers_fired": ["calorie_increase"],
    "adjustment_type": "calorie_increase",
    "adjustment_amount_kcal": 200,
    "new_target_intake_kcal": 2700,
    "new_macros": {
      "protein_g": 102,
      "fat_g": 75,
      "carbs_g": 393
    },
    "agents_re_run": ["NUTRITIONIST", "DIETITIAN", "CHEF"],
    "agents_unchanged": ["COACH"],
    "notes": [
      "Gain rate 0.18 kg/week for 2 consecutive weeks — below 0.25 kg/week threshold",
      "Added 200 kcal primarily from carbohydrates"
    ]
  },
  "pipeline_run_id": "uuid-v4",
  "timestamp": "ISO8601",
  "version": "1.0"
}
```

If no change:

```json
{
  "payload": {
    "triggers_fired": [],
    "adjustment_type": null,
    "agents_re_run": [],
    "agents_unchanged": ["NUTRITIONIST", "DIETITIAN", "CHEF", "COACH"],
    "notes": ["Week 6: gain rate 0.32 kg/week — within target range"]
  }
}
```

---

## 8. Conflict Resolution

When two agents produce contradictory outputs, the following hierarchy resolves the conflict. Higher rank overrides lower rank.

| Rank | Rule | Example |
|------|------|---------|
| 1 | Health guardrails override all agents | PHYSICIAN says abort; all agents stop regardless of progress |
| 2 | SCIENTIST overrides on numeric matters | NUTRITIONIST cannot change calorie targets; DIETITIAN cannot modify macro totals |
| 3 | NUTRITIONIST overrides DIETITIAN and CHEF on nutrition strategy | Protein distribution, MPS timing, supplement protocol, cycle adjustments |
| 4 | DIETITIAN overrides CHEF on macro compliance | If CHEF recipe doesn't hit slot spec, DIETITIAN's spec wins; CHEF must adjust or substitute |
| 5 | COACH is autonomous on training programming | Exercise selection, volume, intensity, phase design. Defers to SCIENTIST on recovery metrics and adjustment triggers. |

### Conflict Detection

The orchestrator validates each agent's output against its upstream input before passing downstream. Conflicts detected:

- Macro totals in NUTRITIONIST output differ from SCIENTIST targets (violation of rank 2).
- DIETITIAN weekly total deviates >5% from NUTRITIONIST daily targets x 7 (violation of rank 3).
- CHEF recipe macros deviate >10% from DIETITIAN slot spec (violation of rank 4).

### Resolution Protocol

1. Orchestrator identifies the conflict and the two agents involved.
2. Higher-ranked agent's output is treated as authoritative.
3. Lower-ranked agent receives the authoritative data and a re-run instruction with explicit constraint.
4. If lower-ranked agent cannot comply after re-run, the conflict is escalated to the user with both agents' reasoning.

---

## 9. Latency Expectations

Assumes LLM-based agents using Claude or equivalent models.

| Segment | Expected Duration | Notes |
|---------|-------------------|-------|
| INTAKE -> SCIENTIST | 5-10s | Single calculation pass |
| SCIENTIST -> NUTRITIONIST | 5-10s | Strategy derivation |
| NUTRITIONIST -> DIETITIAN | 8-15s | Weekly template generation (7 days x 5 meals) |
| DIETITIAN -> CHEF | 10-15s | Recipe matching/generation for full week |
| SCIENTIST -> COACH | 8-12s | Training program output |
| PHYSICIAN (when invoked) | 5-10s | Single query response |
| Full initial pipeline | 40-70s | Sequential, no parallelism |
| Full pipeline with PHYSICIAN interrupt | 50-80s | Adds one PHYSICIAN call |
| Weekly feedback (no adjustment) | 5-10s | SCIENTIST evaluation only |
| Weekly feedback (with adjustment) | 25-50s | Partial re-execution |

### Timeout Configuration

| Parameter | Value |
|-----------|-------|
| Per-agent timeout | 30s |
| Retry timeout (same as first) | 30s |
| Max retries per agent | 1 |
| Total pipeline timeout | 180s |
| PHYSICIAN timeout | 30s |

---

## 10. Partial Re-execution

When a weekly adjustment or mid-cycle correction triggers a change, only agents downstream from the change point re-run. Agents upstream of the change point and agents unaffected by the change type are skipped.

### Re-execution Map

| Trigger Type | Change Point | Agents Re-run | Agents Skipped |
|--------------|-------------|---------------|----------------|
| Calorie adjustment (+/- kcal) | SCIENTIST | NUTRITIONIST, DIETITIAN, CHEF | COACH |
| Protein recalculation | SCIENTIST | NUTRITIONIST, DIETITIAN, CHEF | COACH |
| TDEE recalculation (5 kg milestone) | SCIENTIST | NUTRITIONIST, DIETITIAN, CHEF | COACH |
| Training stall | SCIENTIST | COACH | NUTRITIONIST, DIETITIAN, CHEF |
| Phase transition (training) | SCIENTIST | COACH | NUTRITIONIST, DIETITIAN, CHEF |
| Waist-to-hip ratio flag | SCIENTIST | NUTRITIONIST, DIETITIAN, CHEF, COACH | none (full review) |
| Compliance issue (>2 MVD/week) | DIETITIAN | DIETITIAN, CHEF | SCIENTIST, NUTRITIONIST, COACH |
| Tier progression (calorie ramp) | SCIENTIST | NUTRITIONIST, DIETITIAN, CHEF | COACH |
| PHYSICIAN "continue" with advisory | none | none (advisory only) | all |
| Cycle-phase adjustment (luteal) | NUTRITIONIST | DIETITIAN, CHEF | SCIENTIST, COACH |

### Re-execution Rules

1. Skipped agents retain their most recent output from the current pipeline_run_id.
2. Re-run agents receive the updated upstream output plus their own previous output as context (for delta-aware generation).
3. Re-run messages carry the same `pipeline_run_id` with an incremented version suffix (e.g., `run-abc_v2`).
4. COACH is only re-run when the trigger explicitly involves training (stall, phase transition, recovery metrics). Calorie or macro changes do not affect COACH output.
5. If a re-execution itself triggers a new conflict or red flag, the normal conflict resolution and PHYSICIAN invocation protocols apply.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-09 | Initial specification |
