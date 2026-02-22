import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  integer,
  real,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

export const pipelineStatusEnum = pgEnum("pipeline_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "paused",
]);

export const programStatusEnum = pgEnum("program_status", [
  "active",
  "paused",
  "completed",
  "cancelled",
]);

export const trainingPhaseEnum = pgEnum("training_phase", [
  "phase_0",
  "phase_1",
  "phase_2",
]);

export const calorieTierEnum = pgEnum("calorie_tier", [
  "tier_0",
  "tier_1",
  "tier_2",
]);

export const dayOfWeekEnum = pgEnum("day_of_week", [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const slotTypeEnum = pgEnum("slot_type", [
  "breakfast",
  "lunch",
  "snack",
  "dinner",
  "presleep",
]);

export const pipelineTriggerEnum = pgEnum("pipeline_trigger", [
  "initial",
  "weekly_checkin",
  "adjustment",
  "manual",
]);

export const flagSeverityEnum = pgEnum("flag_severity", [
  "warning",
  "serious",
  "urgent",
]);

export const flagStatusEnum = pgEnum("flag_status", [
  "detected",
  "acknowledged",
  "resolved",
  "referred",
]);

export const queryUrgencyEnum = pgEnum("query_urgency", [
  "routine",
  "soon",
  "urgent",
]);

export const trainingSessionStatusEnum = pgEnum("training_session_status", [
  "scheduled",
  "completed",
  "skipped",
  "partial",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const intakeResponses = pgTable("intake_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  data: jsonb("data").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const programs = pgTable("programs", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  intake_response_id: uuid("intake_response_id")
    .references(() => intakeResponses.id)
    .notNull(),
  status: programStatusEnum("status").default("active").notNull(),
  current_phase: trainingPhaseEnum("current_phase").default("phase_0").notNull(),
  current_tier: calorieTierEnum("current_tier").default("tier_0").notNull(),
  current_week: integer("current_week").default(1).notNull(),
  started_at: timestamp("started_at").defaultNow().notNull(),
  target_weight_kg: real("target_weight_kg").notNull(),
  current_weight_kg: real("current_weight_kg").notNull(),
  target_intake_kcal: integer("target_intake_kcal").notNull(),
  protein_g: real("protein_g").notNull(),
  fat_g: real("fat_g").notNull(),
  carbs_g: real("carbs_g").notNull(),
  surplus_kcal: integer("surplus_kcal").notNull(),
  last_recalc_weight_kg: real("last_recalc_weight_kg"),
  last_protein_recalc_at: timestamp("last_protein_recalc_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const pipelineRuns = pgTable("pipeline_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  intake_response_id: uuid("intake_response_id")
    .references(() => intakeResponses.id)
    .notNull(),
  program_id: uuid("program_id").references(() => programs.id),
  trigger: pipelineTriggerEnum("trigger"),
  status: pipelineStatusEnum("status").default("pending").notNull(),
  agents_requested: jsonb("agents_requested").notNull(),
  current_agent: text("current_agent"),
  error: text("error"),
  started_at: timestamp("started_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  completed_at: timestamp("completed_at"),
});

export const agentOutputs = pgTable("agent_outputs", {
  id: uuid("id").defaultRandom().primaryKey(),
  pipeline_run_id: uuid("pipeline_run_id")
    .references(() => pipelineRuns.id)
    .notNull(),
  agent_name: text("agent_name").notNull(),
  envelope: jsonb("envelope").notNull(),
  duration_ms: integer("duration_ms"),
  llm_tokens_used: integer("llm_tokens_used"),
  llm_trace: jsonb("llm_trace"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const progressEntries = pgTable("progress_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  program_id: uuid("program_id")
    .references(() => programs.id)
    .notNull(),
  week_number: integer("week_number").notNull(),
  weight_kg: real("weight_kg").notNull(),
  waist_cm: real("waist_cm"),
  hip_cm: real("hip_cm"),
  cycle_phase: text("cycle_phase"),
  cycle_day: integer("cycle_day"),
  training_log: jsonb("training_log"),
  subjective_markers: jsonb("subjective_markers"),
  minimum_viable_days_count: integer("minimum_viable_days_count"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const trainingSessions = pgTable("training_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  program_id: uuid("program_id")
    .references(() => programs.id)
    .notNull(),
  week_number: integer("week_number").notNull(),
  day_of_week: dayOfWeekEnum("day_of_week").notNull(),
  focus: text("focus").notNull(),
  warmup: jsonb("warmup").notNull(),
  exercises: jsonb("exercises").notNull(),
  status: trainingSessionStatusEnum("status").default("scheduled").notNull(),
  completed_at: timestamp("completed_at"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const adjustments = pgTable("adjustments", {
  id: uuid("id").defaultRandom().primaryKey(),
  program_id: uuid("program_id")
    .references(() => programs.id)
    .notNull(),
  pipeline_run_id: uuid("pipeline_run_id").references(() => pipelineRuns.id),
  trigger_type: text("trigger_type").notNull(),
  old_values: jsonb("old_values").notNull(),
  new_values: jsonb("new_values").notNull(),
  affected_agents: jsonb("affected_agents").notNull(),
  reason: text("reason").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const redFlags = pgTable("red_flags", {
  id: uuid("id").defaultRandom().primaryKey(),
  program_id: uuid("program_id")
    .references(() => programs.id)
    .notNull(),
  flag_type: text("flag_type").notNull(),
  severity: flagSeverityEnum("severity").notNull(),
  status: flagStatusEnum("status").default("detected").notNull(),
  details: jsonb("details").notNull(),
  detected_at: timestamp("detected_at").defaultNow().notNull(),
  acknowledged_at: timestamp("acknowledged_at"),
  resolved_at: timestamp("resolved_at"),
  referred_at: timestamp("referred_at"),
  physician_query_id: uuid("physician_query_id"),
});

export const physicianQueries = pgTable("physician_queries", {
  id: uuid("id").defaultRandom().primaryKey(),
  program_id: uuid("program_id")
    .references(() => programs.id)
    .notNull(),
  pipeline_run_id: uuid("pipeline_run_id").references(() => pipelineRuns.id),
  requesting_agent: text("requesting_agent").notNull(),
  query_type: text("query_type").notNull(),
  query: text("query").notNull(),
  response: jsonb("response"),
  urgency: queryUrgencyEnum("urgency").notNull(),
  pipeline_action: text("pipeline_action"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const recipes = pgTable("recipes", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipe_name: text("recipe_name").notNull(),
  cuisine: text("cuisine").notNull(),
  meal_pattern: jsonb("meal_pattern"),
  servings: integer("servings").notNull(),
  ingredients: jsonb("ingredients").notNull(),
  macros_per_serving: jsonb("macros_per_serving").notNull(),
  instructions: jsonb("instructions").notNull(),
  time_prep: integer("time_prep").notNull(),
  time_cook: integer("time_cook").notNull(),
  batch_notes: text("batch_notes"),
  storage: jsonb("storage"),
  source_run_id: uuid("source_run_id").references(() => pipelineRuns.id),
  verified: boolean("verified").default(false).notNull(),
  usda_verification_result: jsonb("usda_verification_result"),
  rating: integer("rating"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const interactionEvents = pgTable("interaction_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  program_id: uuid("program_id").references(() => programs.id),
  event_type: text("event_type").notNull(),
  actor: text("actor").notNull(),
  metadata: jsonb("metadata"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const milestones = pgTable("milestones", {
  id: uuid("id").defaultRandom().primaryKey(),
  program_id: uuid("program_id").references(() => programs.id).notNull(),
  type: text("type").notNull(),
  value: real("value"),
  achieved_at: timestamp("achieved_at").defaultNow().notNull(),
  metadata: jsonb("metadata"),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  program_id: uuid("program_id").references(() => programs.id).notNull(),
  checkin_reminder_day: integer("checkin_reminder_day").default(0).notNull(),
  checkin_reminder_hour: integer("checkin_reminder_hour").default(9).notNull(),
  measurement_reminder_enabled: boolean("measurement_reminder_enabled").default(true).notNull(),
  training_reminder_enabled: boolean("training_reminder_enabled").default(true).notNull(),
  insight_notifications_enabled: boolean("insight_notifications_enabled").default(true).notNull(),
});

export const notificationLog = pgTable("notification_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  program_id: uuid("program_id").references(() => programs.id),
  channel: text("channel").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  metadata: jsonb("metadata"),
  sent_at: timestamp("sent_at").defaultNow().notNull(),
});

export const pantryItems = pgTable("pantry_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity_g: real("quantity_g").notNull(),
  expires_at: timestamp("expires_at"),
  added_at: timestamp("added_at").defaultNow().notNull(),
});

export const progressPhotos = pgTable("progress_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  program_id: uuid("program_id").references(() => programs.id).notNull(),
  week_number: integer("week_number").notNull(),
  photo_type: text("photo_type").notNull(),
  file_path: text("file_path").notNull(),
  metadata: jsonb("metadata"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const foods = pgTable("foods", {
  fdc_id: integer("fdc_id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  data_type: text("data_type").notNull(),

  calories_kcal: real("calories_kcal").notNull(),
  protein_g: real("protein_g").notNull(),
  fat_g: real("fat_g").notNull(),
  carbs_g: real("carbs_g").notNull(),
  fiber_g: real("fiber_g").notNull(),

  calcium_mg: real("calcium_mg"),
  iron_mg: real("iron_mg"),
  vitamin_d_ug: real("vitamin_d_ug"),
  vitamin_b12_ug: real("vitamin_b12_ug"),
  folate_dfe_ug: real("folate_dfe_ug"),

  portions: jsonb("portions").notNull().default("[]"),
  fetched_at: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
});
