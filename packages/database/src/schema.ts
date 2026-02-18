import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  integer,
  real,
  pgEnum,
} from "drizzle-orm/pg-core";

export const pipelineStatusEnum = pgEnum("pipeline_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "paused",
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

export const pipelineRuns = pgTable("pipeline_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  intake_response_id: uuid("intake_response_id")
    .references(() => intakeResponses.id)
    .notNull(),
  status: pipelineStatusEnum("status").default("pending").notNull(),
  agents_requested: jsonb("agents_requested").notNull(),
  current_agent: text("current_agent"),
  error: text("error"),
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
