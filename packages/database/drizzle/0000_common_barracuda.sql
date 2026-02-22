CREATE TYPE "public"."calorie_tier" AS ENUM('tier_0', 'tier_1', 'tier_2');--> statement-breakpoint
CREATE TYPE "public"."day_of_week" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');--> statement-breakpoint
CREATE TYPE "public"."flag_severity" AS ENUM('warning', 'serious', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."flag_status" AS ENUM('detected', 'acknowledged', 'resolved', 'referred');--> statement-breakpoint
CREATE TYPE "public"."pipeline_status" AS ENUM('pending', 'running', 'completed', 'failed', 'paused');--> statement-breakpoint
CREATE TYPE "public"."pipeline_trigger" AS ENUM('initial', 'weekly_checkin', 'adjustment', 'manual');--> statement-breakpoint
CREATE TYPE "public"."program_status" AS ENUM('active', 'paused', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."query_urgency" AS ENUM('routine', 'soon', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."slot_type" AS ENUM('breakfast', 'lunch', 'snack', 'dinner', 'presleep');--> statement-breakpoint
CREATE TYPE "public"."training_phase" AS ENUM('phase_0', 'phase_1', 'phase_2');--> statement-breakpoint
CREATE TYPE "public"."training_session_status" AS ENUM('scheduled', 'completed', 'skipped', 'partial');--> statement-breakpoint
CREATE TABLE "adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"pipeline_run_id" uuid,
	"trigger_type" text NOT NULL,
	"old_values" jsonb NOT NULL,
	"new_values" jsonb NOT NULL,
	"affected_agents" jsonb NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_outputs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_run_id" uuid NOT NULL,
	"agent_name" text NOT NULL,
	"envelope" jsonb NOT NULL,
	"duration_ms" integer,
	"llm_tokens_used" integer,
	"llm_trace" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"fdc_id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"data_type" text NOT NULL,
	"calories_kcal" real NOT NULL,
	"protein_g" real NOT NULL,
	"fat_g" real NOT NULL,
	"carbs_g" real NOT NULL,
	"fiber_g" real NOT NULL,
	"calcium_mg" real,
	"iron_mg" real,
	"vitamin_d_ug" real,
	"vitamin_b12_ug" real,
	"folate_dfe_ug" real,
	"portions" jsonb DEFAULT '[]' NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intake_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interaction_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid,
	"event_type" text NOT NULL,
	"actor" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "physician_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"pipeline_run_id" uuid,
	"requesting_agent" text NOT NULL,
	"query_type" text NOT NULL,
	"query" text NOT NULL,
	"response" jsonb,
	"urgency" "query_urgency" NOT NULL,
	"pipeline_action" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"intake_response_id" uuid NOT NULL,
	"program_id" uuid,
	"trigger" "pipeline_trigger",
	"status" "pipeline_status" DEFAULT 'pending' NOT NULL,
	"agents_requested" jsonb NOT NULL,
	"current_agent" text,
	"error" text,
	"started_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"intake_response_id" uuid NOT NULL,
	"status" "program_status" DEFAULT 'active' NOT NULL,
	"current_phase" "training_phase" DEFAULT 'phase_0' NOT NULL,
	"current_tier" "calorie_tier" DEFAULT 'tier_0' NOT NULL,
	"current_week" integer DEFAULT 1 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"target_weight_kg" real NOT NULL,
	"current_weight_kg" real NOT NULL,
	"target_intake_kcal" integer NOT NULL,
	"protein_g" real NOT NULL,
	"fat_g" real NOT NULL,
	"carbs_g" real NOT NULL,
	"surplus_kcal" integer NOT NULL,
	"last_recalc_weight_kg" real,
	"last_protein_recalc_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"week_number" integer NOT NULL,
	"weight_kg" real NOT NULL,
	"waist_cm" real,
	"hip_cm" real,
	"cycle_phase" text,
	"cycle_day" integer,
	"training_log" jsonb,
	"subjective_markers" jsonb,
	"minimum_viable_days_count" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_name" text NOT NULL,
	"cuisine" text NOT NULL,
	"meal_pattern" jsonb,
	"servings" integer NOT NULL,
	"ingredients" jsonb NOT NULL,
	"macros_per_serving" jsonb NOT NULL,
	"instructions" jsonb NOT NULL,
	"time_prep" integer NOT NULL,
	"time_cook" integer NOT NULL,
	"batch_notes" text,
	"storage" jsonb,
	"source_run_id" uuid,
	"verified" boolean DEFAULT false NOT NULL,
	"usda_verification_result" jsonb,
	"rating" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "red_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"flag_type" text NOT NULL,
	"severity" "flag_severity" NOT NULL,
	"status" "flag_status" DEFAULT 'detected' NOT NULL,
	"details" jsonb NOT NULL,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp,
	"resolved_at" timestamp,
	"referred_at" timestamp,
	"physician_query_id" uuid
);
--> statement-breakpoint
CREATE TABLE "training_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"week_number" integer NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"focus" text NOT NULL,
	"warmup" jsonb NOT NULL,
	"exercises" jsonb NOT NULL,
	"status" "training_session_status" DEFAULT 'scheduled' NOT NULL,
	"completed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "adjustments" ADD CONSTRAINT "adjustments_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adjustments" ADD CONSTRAINT "adjustments_pipeline_run_id_pipeline_runs_id_fk" FOREIGN KEY ("pipeline_run_id") REFERENCES "public"."pipeline_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_outputs" ADD CONSTRAINT "agent_outputs_pipeline_run_id_pipeline_runs_id_fk" FOREIGN KEY ("pipeline_run_id") REFERENCES "public"."pipeline_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_responses" ADD CONSTRAINT "intake_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interaction_events" ADD CONSTRAINT "interaction_events_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physician_queries" ADD CONSTRAINT "physician_queries_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physician_queries" ADD CONSTRAINT "physician_queries_pipeline_run_id_pipeline_runs_id_fk" FOREIGN KEY ("pipeline_run_id") REFERENCES "public"."pipeline_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_runs" ADD CONSTRAINT "pipeline_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_runs" ADD CONSTRAINT "pipeline_runs_intake_response_id_intake_responses_id_fk" FOREIGN KEY ("intake_response_id") REFERENCES "public"."intake_responses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_runs" ADD CONSTRAINT "pipeline_runs_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_intake_response_id_intake_responses_id_fk" FOREIGN KEY ("intake_response_id") REFERENCES "public"."intake_responses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_entries" ADD CONSTRAINT "progress_entries_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_source_run_id_pipeline_runs_id_fk" FOREIGN KEY ("source_run_id") REFERENCES "public"."pipeline_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "red_flags" ADD CONSTRAINT "red_flags_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;