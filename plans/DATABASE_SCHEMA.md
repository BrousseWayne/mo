# MO -- PostgreSQL Database Schema

Version 2.0 (Drizzle ORM)

---

## 1. Entity-Relationship Summary

### Core Entities

- **clients** -- Central entity. Stores all intake questionnaire data (demographics, goals, constraints, medical history, lifestyle). One client has many programs.
- **programs** -- A client's active coaching program. Tracks phase, week, tier, caloric targets, status. One program has many weekly_plans, training_sessions, progress_entries, and pipeline_runs.
- **weekly_plans** -- A single week's nutrition plan linked to a program. Contains aggregate calorie/macro targets. One weekly_plan has many meal_slots.
- **meal_slots** -- Individual meal specification within a weekly_plan (day + slot type). Links to an optional recipe. Has macro targets and constraints.
- **recipes** -- Recipe library populated from CHEF agent specs. Standalone entity referenced by meal_slots. Contains ingredients, macros, instructions as JSONB.
- **training_sessions** -- Scheduled training sessions within a program. Contains exercises as JSONB array (sets/reps/weight/RPE), warmup protocol, session focus.
- **progress_entries** -- Weekly check-in data. Weight, circumference measurements, cycle phase, subjective markers, minimum viable day count.

### Pipeline/Agent Entities

- **pipeline_runs** -- Tracks a single pipeline execution through agents. Links to program. Records trigger type, status, timing, errors.
- **agent_messages** -- Immutable audit trail of every inter-agent JSON message. Links to pipeline_run. Stores full payload as JSONB.
- **adjustments** -- Records triggered changes (calorie adjustments, phase transitions, deloads). Links to pipeline_run. Captures old/new values and affected agents.

### Health/Safety Entities

- **red_flags** -- Detected health concerns from any agent. Links to client. Tracks flag type, severity, referral target, resolution status.
- **physician_queries** -- On-demand PHYSICIAN interactions outside the main pipeline. Links to client. Stores query, structured response, referral info.

### Relationships

```
clients 1--N programs
programs 1--N weekly_plans
programs 1--N training_sessions
programs 1--N progress_entries
programs 1--N pipeline_runs
weekly_plans 1--N meal_slots
meal_slots N--1 recipes (optional FK)
pipeline_runs 1--N agent_messages
pipeline_runs 1--N adjustments
clients 1--N red_flags
clients 1--N physician_queries
```

### Implementation Status

**MVP Tables (Current Codebase)**:
- `clients` (simplified as users)
- `pipeline_runs`
- `agent_messages` (as agent_outputs)

**Future Tables**:
- `programs`
- `weekly_plans`
- `meal_slots`
- `recipes`
- `training_sessions`
- `progress_entries`
- `adjustments`
- `red_flags`
- `physician_queries`

---

## 2. Table Definitions

### 2.1 clients

**Status**: MVP (implemented as users in current codebase)

```typescript
import { pgTable, uuid, text, decimal, integer, smallint, jsonb, timestamp } from "drizzle-orm/pg-core";

export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  fullName: text("full_name").notNull(),

  ageBracket: text("age_bracket").notNull(),
  heightCm: decimal("height_cm", { precision: 5, scale: 1 }).notNull(),
  currentWeightKg: decimal("current_weight_kg", { precision: 5, scale: 1 }).notNull(),
  targetWeightKg: decimal("target_weight_kg", { precision: 5, scale: 1 }),
  bmi: decimal("bmi", { precision: 4, scale: 1 }),

  primaryGoal: text("primary_goal").notNull(),
  physiqueDescription: text("physique_description"),
  desiredTimeline: text("desired_timeline"),

  weightHistory: text("weight_history"),
  bodyFatPct: text("body_fat_pct"),
  fatDistribution: text("fat_distribution"),
  measurements: jsonb("measurements"),

  trainingExperience: text("training_experience"),
  trainingModality: text("training_modality"),
  trainingFrequency: text("training_frequency"),
  currentRoutine: text("current_routine"),
  sessionDuration: text("session_duration"),
  strengthLevel: smallint("strength_level"),
  bodyweightCapabilities: jsonb("bodyweight_capabilities"),
  personalRecords: jsonb("personal_records"),
  equipmentAccess: jsonb("equipment_access"),
  trainingLocation: text("training_location"),
  injuryHistory: text("injury_history"),
  exercisesAvoided: text("exercises_avoided"),
  recoveryRating: smallint("recovery_rating"),

  mealFrequency: text("meal_frequency"),
  tracksMacros: text("tracks_macros"),
  estimatedCalories: integer("estimated_calories"),
  estimatedProtein: text("estimated_protein"),
  proteinSources: jsonb("protein_sources"),
  typicalDayEating: text("typical_day_eating"),
  dietaryRestrictions: jsonb("dietary_restrictions"),
  foodAversions: text("food_aversions").notNull().default("peanut_butter, nut_butters"),
  cookingExperience: text("cooking_experience"),
  cuisinePreferences: text("cuisine_preferences"),
  appetiteLevel: smallint("appetite_level"),
  hydrationLevel: text("hydration_level"),
  wholeFoodPct: text("whole_food_pct"),
  currentSupplements: text("current_supplements"),
  eatingChallenges: text("eating_challenges"),

  cycleLength: text("cycle_length"),
  tracksCycle: text("tracks_cycle"),
  cycleSymptoms: jsonb("cycle_symptoms"),
  cyclePerformanceNotes: text("cycle_performance_notes"),
  hormonalConditions: text("hormonal_conditions"),
  pregnancyStatus: text("pregnancy_status"),
  postpartumMonths: text("postpartum_months"),

  sleepDuration: text("sleep_duration"),
  sleepQuality: smallint("sleep_quality"),
  stressLevel: smallint("stress_level"),
  stressSources: jsonb("stress_sources"),
  dailyStepCount: text("daily_step_count"),
  workSchedule: text("work_schedule"),
  preferredTrainingTime: text("preferred_training_time"),
  lifestyleFactors: text("lifestyle_factors"),

  medicalClearance: text("medical_clearance"),
  currentMedications: text("current_medications"),
  medicalHistory: jsonb("medical_history"),
  disorderedEatingHistory: text("disordered_eating_history"),
  emergencyContact: jsonb("emergency_contact"),

  trainingDaysPerWeek: text("training_days_per_week"),
  preferredProgramStructure: text("preferred_program_structure"),
  preferredRepRanges: jsonb("preferred_rep_ranges"),
  feedbackFrequency: text("feedback_frequency"),
  motivators: jsonb("motivators"),
  anticipatedObstacles: text("anticipated_obstacles"),
  pastSuccesses: text("past_successes"),
  pastFailures: text("past_failures"),
  additionalNotes: text("additional_notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true })
});
```

### 2.2 programs

**Status**: Future

```typescript
import { pgTable, uuid, text, integer, decimal, boolean, jsonb, timestamp, date, pgEnum } from "drizzle-orm/pg-core";
import { clients } from "./clients";

export const programStatusEnum = pgEnum("program_status", ["active", "paused", "completed", "cancelled"]);
export const trainingPhaseEnum = pgEnum("training_phase", ["phase_0", "phase_1", "phase_2"]);
export const calorieTierEnum = pgEnum("calorie_tier", ["tier_0", "tier_1", "tier_2"]);

export const programs = pgTable("programs", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").notNull().references(() => clients.id),

  status: programStatusEnum("status").notNull().default("active"),
  currentPhase: trainingPhaseEnum("current_phase").notNull().default("phase_0"),
  currentTier: calorieTierEnum("current_tier").notNull().default("tier_0"),
  currentWeek: integer("current_week").notNull().default(1),

  startDate: date("start_date").notNull().defaultNow(),
  endDate: date("end_date"),

  startWeightKg: decimal("start_weight_kg", { precision: 5, scale: 1 }).notNull(),
  targetWeightKg: decimal("target_weight_kg", { precision: 5, scale: 1 }).notNull(),

  bmrKcal: integer("bmr_kcal").notNull(),
  tdeeKcal: integer("tdee_kcal").notNull(),
  targetIntakeKcal: integer("target_intake_kcal").notNull(),
  proteinG: decimal("protein_g", { precision: 5, scale: 1 }).notNull(),
  fatG: decimal("fat_g", { precision: 5, scale: 1 }).notNull(),
  carbsG: decimal("carbs_g", { precision: 5, scale: 1 }).notNull(),
  fiberGMin: decimal("fiber_g_min", { precision: 5, scale: 1 }).notNull().default("20.0"),
  hydrationL: decimal("hydration_l", { precision: 3, scale: 1 }).notNull().default("2.5"),

  activityMultiplier: decimal("activity_multiplier", { precision: 3, scale: 2 }).notNull(),
  adaptationPeriodComplete: boolean("adaptation_period_complete").notNull().default(false),

  clientConstraints: jsonb("client_constraints").notNull().default({}),
  supplementProtocol: jsonb("supplement_protocol"),
  cycleAdjustments: jsonb("cycle_adjustments"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true })
});
```

### 2.3 weekly_plans

**Status**: Future

```typescript
import { pgTable, uuid, integer, decimal, jsonb, timestamp, unique } from "drizzle-orm/pg-core";
import { programs, calorieTierEnum } from "./programs";

export const weeklyPlans = pgTable("weekly_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  programId: uuid("program_id").notNull().references(() => programs.id),

  weekNumber: integer("week_number").notNull(),
  tier: calorieTierEnum("tier").notNull(),

  targetIntakeKcal: integer("target_intake_kcal").notNull(),
  proteinG: decimal("protein_g", { precision: 5, scale: 1 }).notNull(),
  fatG: decimal("fat_g", { precision: 5, scale: 1 }).notNull(),
  carbsG: decimal("carbs_g", { precision: 5, scale: 1 }).notNull(),
  fiberG: decimal("fiber_g", { precision: 5, scale: 1 }).notNull(),

  proteinDistribution: jsonb("protein_distribution").notNull(),
  hardgainerTactics: jsonb("hardgainer_tactics"),
  specialConsiderations: jsonb("special_considerations"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  uniqueProgramWeek: unique().on(table.programId, table.weekNumber)
}));
```

### 2.4 meal_slots

**Status**: Future

```typescript
import { pgTable, uuid, integer, decimal, text, jsonb, timestamp, pgEnum, unique } from "drizzle-orm/pg-core";
import { weeklyPlans } from "./weeklyPlans";
import { recipes } from "./recipes";

export const dayOfWeekEnum = pgEnum("day_of_week", ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);
export const slotTypeEnum = pgEnum("slot_type", ["breakfast", "lunch", "snack", "dinner", "presleep"]);

export const mealSlots = pgTable("meal_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  weeklyPlanId: uuid("weekly_plan_id").notNull().references(() => weeklyPlans.id),

  day: dayOfWeekEnum("day").notNull(),
  slot: slotTypeEnum("slot").notNull(),

  proteinG: decimal("protein_g", { precision: 5, scale: 1 }).notNull(),
  fatG: decimal("fat_g", { precision: 5, scale: 1 }),
  carbsG: decimal("carbs_g", { precision: 5, scale: 1 }),
  calories: integer("calories").notNull(),
  prepTimeMaxMin: integer("prep_time_max_min"),

  constraints: jsonb("constraints").notNull().default([]),
  alternatives: jsonb("alternatives").notNull().default([]),
  primaryProtein: text("primary_protein"),
  cuisinePreference: text("cuisine_preference"),
  batchPortion: integer("batch_portion"),

  recipeId: uuid("recipe_id").references(() => recipes.id),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  uniqueWeeklyPlanDaySlot: unique().on(table.weeklyPlanId, table.day, table.slot)
}));
```

### 2.5 recipes

**Status**: Future

```typescript
import { pgTable, uuid, text, integer, decimal, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";

export const recipes = pgTable("recipes", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull(),
  cuisine: text("cuisine"),
  servings: integer("servings").notNull().default(1),

  ingredients: jsonb("ingredients").notNull(),
  instructions: jsonb("instructions").notNull(),

  proteinG: decimal("protein_g", { precision: 5, scale: 1 }).notNull(),
  fatG: decimal("fat_g", { precision: 5, scale: 1 }).notNull(),
  carbsG: decimal("carbs_g", { precision: 5, scale: 1 }).notNull(),
  fiberG: decimal("fiber_g", { precision: 5, scale: 1 }),
  calories: integer("calories").notNull(),

  prepTimeMin: integer("prep_time_min"),
  cookTimeMin: integer("cook_time_min"),

  batchFriendly: boolean("batch_friendly").notNull().default(false),
  storageFridgeDays: integer("storage_fridge_days"),
  storageFreezerFriendly: boolean("storage_freezer_friendly").notNull().default(false),

  calorieBoostOptions: jsonb("calorie_boost_options"),
  tags: jsonb("tags").notNull().default([]),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true })
});
```

### 2.6 training_sessions

**Status**: Future

```typescript
import { pgTable, uuid, integer, text, decimal, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { programs, trainingPhaseEnum } from "./programs";
import { dayOfWeekEnum } from "./mealSlots";

export const trainingSessions = pgTable("training_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  programId: uuid("program_id").notNull().references(() => programs.id),

  weekNumber: integer("week_number").notNull(),
  day: dayOfWeekEnum("day").notNull(),
  sessionFocus: text("session_focus").notNull(),

  phase: trainingPhaseEnum("phase").notNull(),

  warmup: jsonb("warmup").notNull().default([]),
  exercises: jsonb("exercises").notNull(),

  targetRpe: decimal("target_rpe", { precision: 3, scale: 1 }),
  actualRpe: decimal("actual_rpe", { precision: 3, scale: 1 }),
  sessionNotes: text("session_notes"),

  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  skipped: boolean("skipped").notNull().default(false),
  skipReason: text("skip_reason"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
```

`exercises` JSONB structure:

```json
[
  {
    "name": "Barbell Hip Thrust",
    "sets": 3,
    "reps": "10-15",
    "rest_sec": 120,
    "target_rpe": 7,
    "progression_rule": "double_progression",
    "notes": "Squeeze glutes 2 sec at top.",
    "actual": [
      {"weight_kg": 40, "reps": 12},
      {"weight_kg": 40, "reps": 11},
      {"weight_kg": 40, "reps": 10}
    ]
  }
]
```

### 2.7 progress_entries

**Status**: Future

```typescript
import { pgTable, uuid, integer, decimal, text, jsonb, timestamp, date } from "drizzle-orm/pg-core";
import { programs } from "./programs";

export const progressEntries = pgTable("progress_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  programId: uuid("program_id").notNull().references(() => programs.id),

  weekNumber: integer("week_number").notNull(),
  recordedAt: date("recorded_at").notNull().defaultNow(),

  weightKg: decimal("weight_kg", { precision: 5, scale: 1 }).notNull(),
  waistCm: decimal("waist_cm", { precision: 5, scale: 1 }),
  hipCm: decimal("hip_cm", { precision: 5, scale: 1 }),
  thighCm: decimal("thigh_cm", { precision: 5, scale: 1 }),
  armCm: decimal("arm_cm", { precision: 5, scale: 1 }),

  cyclePhase: text("cycle_phase"),
  cycleDay: integer("cycle_day"),

  sleepHoursAvg: decimal("sleep_hours_avg", { precision: 3, scale: 1 }),
  stepCountAvg: integer("step_count_avg"),

  subjectiveMarkers: jsonb("subjective_markers").notNull().default({}),

  minimumViableDays: integer("minimum_viable_days").notNull().default(0),
  mealsCompleted: integer("meals_completed"),
  mealsTarget: integer("meals_target"),

  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
```

`subjective_markers` JSONB structure:

```json
{
  "energy_level": 7,
  "appetite_level": 5,
  "mood": 7,
  "stress": 4,
  "sleep_quality": 8,
  "training_motivation": 7,
  "gi_comfort": 8,
  "body_image_comfort": 6
}
```

### 2.8 pipeline_runs

**Status**: MVP (implemented in current codebase)

```typescript
import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { programs } from "./programs";

export const pipelineTriggerEnum = pgEnum("pipeline_trigger", ["initial", "weekly_checkin", "adjustment", "manual"]);
export const pipelineStatusEnum = pgEnum("pipeline_status", ["pending", "running", "completed", "failed", "cancelled"]);

export const pipelineRuns = pgTable("pipeline_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  programId: uuid("program_id").notNull().references(() => programs.id),

  trigger: pipelineTriggerEnum("trigger").notNull(),
  status: pipelineStatusEnum("status").notNull().default("pending"),
  currentAgent: text("current_agent"),

  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),

  errorMessage: text("error_message"),
  errorAgent: text("error_agent"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
```

### 2.9 agent_messages

**Status**: MVP (implemented as agent_outputs in current codebase)

```typescript
import { pgTable, uuid, text, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { pipelineRuns } from "./pipelineRuns";

export const agentNameEnum = pgEnum("agent_name", ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF", "COACH", "PHYSICIAN"]);

export const agentMessages = pgTable("agent_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  pipelineRunId: uuid("pipeline_run_id").notNull().references(() => pipelineRuns.id),

  fromAgent: agentNameEnum("from_agent").notNull(),
  toAgent: agentNameEnum("to_agent").notNull(),
  dataType: text("data_type").notNull(),
  payload: jsonb("payload").notNull(),
  version: text("version").notNull().default("1.0"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
```

### 2.10 adjustments

**Status**: Future

```typescript
import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { pipelineRuns } from "./pipelineRuns";
import { programs } from "./programs";
import { agentNameEnum } from "./agentMessages";

export const adjustments = pgTable("adjustments", {
  id: uuid("id").defaultRandom().primaryKey(),
  pipelineRunId: uuid("pipeline_run_id").notNull().references(() => pipelineRuns.id),
  programId: uuid("program_id").notNull().references(() => programs.id),

  triggerType: text("trigger_type").notNull(),
  detectingAgent: agentNameEnum("detecting_agent").notNull(),

  oldValues: jsonb("old_values").notNull(),
  newValues: jsonb("new_values").notNull(),
  affectedAgents: jsonb("affected_agents").notNull().default([]),

  reason: text("reason"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
```

`trigger_type` values: `calorie_increase`, `calorie_decrease`, `phase_transition`, `deload`, `tdee_recalculation`, `protein_recalculation`, `red_flag_pause`.

### 2.11 red_flags

**Status**: Future

```typescript
import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { programs } from "./programs";
import { agentNameEnum } from "./agentMessages";

export const flagSeverityEnum = pgEnum("flag_severity", ["warning", "serious", "urgent"]);
export const flagStatusEnum = pgEnum("flag_status", ["detected", "acknowledged", "resolved", "referred"]);

export const redFlags = pgTable("red_flags", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  programId: uuid("program_id").references(() => programs.id),

  detectingAgent: agentNameEnum("detecting_agent").notNull(),
  flagType: text("flag_type").notNull(),
  description: text("description"),

  severity: flagSeverityEnum("severity").notNull(),
  referralTarget: text("referral_target"),

  status: flagStatusEnum("status").notNull().default("detected"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolutionNotes: text("resolution_notes"),

  detectedAt: timestamp("detected_at", { withTimezone: true }).defaultNow().notNull()
});
```

`flag_type` values: `no_weight_gain`, `waist_hip_ratio_deteriorating`, `amenorrhea`, `persistent_pain`, `disordered_eating_signs`, `thyroid_dysfunction`, `reds_indicators`, `training_dizziness`, `gi_distress`, `supplement_interaction`, `appetite_suppression`, `excessive_cardio`, `refusal_solid_food`.

### 2.12 physician_queries

**Status**: Future

```typescript
import { pgTable, uuid, text, jsonb, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { agentNameEnum } from "./agentMessages";

export const queryUrgencyEnum = pgEnum("query_urgency", ["routine", "soon", "urgent"]);

export const physicianQueries = pgTable("physician_queries", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").notNull().references(() => clients.id),

  requestingAgent: agentNameEnum("requesting_agent"),
  queryType: text("query_type").notNull(),
  query: text("query").notNull(),
  userContext: jsonb("user_context"),

  response: jsonb("response"),
  mechanismExplained: text("mechanism_explained"),
  sources: jsonb("sources"),

  referralNeeded: boolean("referral_needed").notNull().default(false),
  referralTarget: text("referral_target"),
  urgency: queryUrgencyEnum("urgency").notNull().default("routine"),
  pipelineAction: text("pipeline_action").default("continue"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
```

---

## 3. Indexes

Indexes are defined using Drizzle's `index()` and `uniqueIndex()` helpers within table definitions, or added separately:

```typescript
import { index, uniqueIndex } from "drizzle-orm/pg-core";

// Example for programs table
export const programs = pgTable("programs", {
  // ... column definitions
}, (table) => ({
  clientStatusIdx: index("idx_programs_client_status")
    .on(table.clientId, table.status)
    .where(sql`deleted_at IS NULL`),
  clientActiveIdx: index("idx_programs_client_active")
    .on(table.clientId)
    .where(sql`status = 'active' AND deleted_at IS NULL`)
}));
```

For complex partial indexes with WHERE clauses, use raw SQL via Drizzle migrations or manual index creation:

```sql
-- Add these via custom SQL in Drizzle migrations

CREATE INDEX idx_programs_client_status ON programs(client_id, status)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_programs_client_active ON programs(client_id)
    WHERE status = 'active' AND deleted_at IS NULL;

CREATE INDEX idx_weekly_plans_program ON weekly_plans(program_id, week_number);

CREATE INDEX idx_meal_slots_weekly_plan ON meal_slots(weekly_plan_id, day, slot);

CREATE INDEX idx_meal_slots_recipe ON meal_slots(recipe_id)
    WHERE recipe_id IS NOT NULL;

CREATE INDEX idx_training_sessions_program_week ON training_sessions(program_id, week_number);

CREATE INDEX idx_progress_entries_program_date ON progress_entries(program_id, recorded_at);

CREATE INDEX idx_progress_entries_program_week ON progress_entries(program_id, week_number);

CREATE INDEX idx_pipeline_runs_program_status ON pipeline_runs(program_id, status);

CREATE INDEX idx_pipeline_runs_program_created ON pipeline_runs(program_id, created_at DESC);

CREATE INDEX idx_agent_messages_pipeline_run ON agent_messages(pipeline_run_id, created_at);

CREATE INDEX idx_agent_messages_agents ON agent_messages(from_agent, to_agent);

CREATE INDEX idx_adjustments_pipeline_run ON adjustments(pipeline_run_id);

CREATE INDEX idx_adjustments_program ON adjustments(program_id, created_at DESC);

CREATE INDEX idx_red_flags_client_status ON red_flags(client_id, status)
    WHERE status IN ('detected', 'acknowledged');

CREATE INDEX idx_red_flags_client_active ON red_flags(client_id)
    WHERE status = 'detected';

CREATE INDEX idx_physician_queries_client ON physician_queries(client_id, created_at DESC);

CREATE INDEX idx_recipes_cuisine ON recipes(cuisine)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_recipes_batch ON recipes(batch_friendly)
    WHERE batch_friendly = TRUE AND deleted_at IS NULL;
```

---

## 4. Redis Usage

### 4.1 Pipeline State

**Key**: `pipeline:{pipeline_run_id}:state`
**TTL**: 1 hour
**Structure**:
```json
{
  "pipeline_run_id": "uuid",
  "program_id": "uuid",
  "current_agent": "NUTRITIONIST",
  "agent_outputs": {
    "SCIENTIST": { "...payload..." },
    "NUTRITIONIST": null
  },
  "started_at": "ISO8601",
  "timeout_at": "ISO8601"
}
```

Accumulated agent outputs are stored here during execution so downstream agents can read upstream results without hitting PostgreSQL. Written to `agent_messages` table on completion.

### 4.2 Session Management

**Key**: `session:{user_id}`
**TTL**: 24 hours
**Structure**:
```json
{
  "user_id": "uuid",
  "client_id": "uuid",
  "role": "client|trader|admin",
  "authenticated_at": "ISO8601"
}
```

### 4.3 Rate Limiting

**Key**: `ratelimit:pipeline:{client_id}`
**TTL**: Matches pipeline TTL (1 hour max)
**Value**: `1`

Set via `SET NX` to enforce max 1 concurrent pipeline run per client. Deleted on pipeline completion or expiry.

### 4.4 Agent Output Cache

**Key**: `cache:agent_output:{program_id}:{agent_name}`
**TTL**: 24 hours
**Structure**: Full agent output payload JSONB.

Used for partial re-execution. If a pipeline fails at CHEF, cached SCIENTIST/NUTRITIONIST/DIETITIAN outputs can be reused without re-running those agents.

---

## 5. Data Constraints

| Domain | Type | Rationale |
|--------|------|-----------|
| Weight, measurements (kg, cm) | `decimal("column", { precision: 5, scale: 1 })` | One decimal precision, max 9999.9 |
| Calories (kcal) | `integer("column")` | Whole numbers sufficient |
| Macros (g) | `decimal("column", { precision: 5, scale: 1 })` | One decimal precision |
| Timestamps | `timestamp("column", { withTimezone: true })` | Timezone-aware, UTC storage |
| Flexible structures | `jsonb("column")` | Ingredients, exercises, subjective markers, capabilities |
| Soft deletes | `timestamp("deleted_at", { withTimezone: true })` | On clients, programs, recipes |

Additional constraints enforced at application level:

- `protein_g` in programs must satisfy: `protein_g >= current_weight_kg * 1.6` and `protein_g <= current_weight_kg * 2.0`
- `fat_g` in programs must satisfy: `(fat_g * 9) / target_intake_kcal >= 0.25`
- `fiber_g_min` must be >= 20.0
- `minimum_viable_days` in progress_entries must be <= 2 per week
- `food_aversions` in clients must always contain peanut butter / nut butters

---

## 6. Migration Strategy

### Tool

Drizzle Kit (official migration tool for Drizzle ORM, matching the TypeScript backend).

### Project Structure

```
src/
  db/
    schema/
      clients.ts          # Client table schema
      programs.ts         # Program table schema + enums
      weeklyPlans.ts      # Weekly plan table schema
      mealSlots.ts        # Meal slot table schema + enums
      recipes.ts          # Recipe table schema
      trainingSessions.ts # Training session table schema
      progressEntries.ts  # Progress entry table schema
      pipelineRuns.ts     # Pipeline run table schema + enums
      agentMessages.ts    # Agent message table schema + enums
      adjustments.ts      # Adjustment table schema
      redFlags.ts         # Red flag table schema + enums
      physicianQueries.ts # Physician query table schema + enums
      index.ts            # Export all schemas
    migrations/           # Generated migration files
    client.ts             # Drizzle database client
drizzle.config.ts         # Drizzle Kit configuration
```

### Configuration

`drizzle.config.ts`:

```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### Migration Sequence

**Migration 001**: Create enum types and all tables.

```bash
drizzle-kit generate
```

Generated migration creates in order:
1. Enum types (`program_status`, `training_phase`, `calorie_tier`, `day_of_week`, `slot_type`, `pipeline_trigger`, `pipeline_status`, `agent_name`, `flag_severity`, `flag_status`, `query_urgency`)
2. `clients`
3. `programs` (FK to clients)
4. `weekly_plans` (FK to programs)
5. `recipes` (no FK dependencies)
6. `meal_slots` (FK to weekly_plans, recipes)
7. `training_sessions` (FK to programs)
8. `progress_entries` (FK to programs)
9. `pipeline_runs` (FK to programs)
10. `agent_messages` (FK to pipeline_runs)
11. `adjustments` (FK to pipeline_runs, programs)
12. `red_flags` (FK to clients, programs)
13. `physician_queries` (FK to clients)

**Migration 002**: Add indexes with WHERE clauses (custom SQL).

Create a custom migration file to add partial indexes:

```typescript
import { sql } from "drizzle-orm";

export async function up(db) {
  await db.execute(sql`
    CREATE INDEX idx_programs_client_status ON programs(client_id, status)
        WHERE deleted_at IS NULL;
  `);

  await db.execute(sql`
    CREATE INDEX idx_programs_client_active ON programs(client_id)
        WHERE status = 'active' AND deleted_at IS NULL;
  `);

  // ... add all indexes from section 3
}

export async function down(db) {
  await db.execute(sql`DROP INDEX IF EXISTS idx_programs_client_status;`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_programs_client_active;`);
  // ... drop all indexes
}
```

**Migration 003**: Seed recipe library from CHEF agent specs.

Create a custom seed migration or use a separate seed script:

```typescript
import { recipes } from "./schema/recipes";

export async function up(db) {
  await db.insert(recipes).values([
    {
      name: "Greek Chicken Bowl",
      cuisine: "Mediterranean",
      servings: 4,
      ingredients: [...], // Full JSONB
      instructions: [...], // Full JSONB
      proteinG: "42.0",
      fatG: "18.0",
      carbsG: "55.0",
      fiberG: "8.0",
      calories: 520,
      prepTimeMin: 15,
      cookTimeMin: 25,
      batchFriendly: true,
      storageFridgeDays: 4,
      storageFreezerFriendly: true,
      tags: ["high_protein", "batch_friendly", "mediterranean"]
    },
    // CHEF v2.0 generates recipes at runtime from cuisine flavor kits.
    // Seed data contains only static recipes (shakes, pre-sleep, survival).
    // - Shake recipes (Chocolate Tahini Power, Tropical Coconut Cream, Avocado Date Power, etc.)
    // - Pre-sleep options (cottage cheese + honey, casein shake, Greek yogurt parfait, quark + berries)
    // - Survival recipes (egg scramble, rotisserie chicken bowl, canned salmon rice, overnight oats, etc.)
  ]);
}

export async function down(db) {
  await db.delete(recipes).where(sql`created_at < NOW()`);
}
```

Each seed recipe includes full `ingredients` JSONB, `instructions` JSONB, macro breakdown, time estimates, batch-friendliness, and storage info as defined in the CHEF agent output schema.

### Running Migrations

```bash
# Generate new migration from schema changes
drizzle-kit generate

# Apply migrations to database
drizzle-kit migrate

# Push schema changes directly (dev only, no migration files)
drizzle-kit push

# Introspect existing database
drizzle-kit introspect

# View migration status
drizzle-kit up
```

### Database Client Usage

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

// Query examples
const allClients = await db.select().from(schema.clients);
const activePrograms = await db.select()
  .from(schema.programs)
  .where(eq(schema.programs.status, "active"));
```

### Conventions

- One structural change per migration file
- Seed data in separate migrations from schema changes
- Custom SQL for partial indexes goes in dedicated migration
- All schema definitions in TypeScript (type-safe)
- Migration filenames: `{timestamp}_{description}.sql` (auto-generated by Drizzle Kit)
- Use `drizzle-kit generate` for automatic migration generation
- Use `drizzle-kit push` only in development for rapid prototyping
