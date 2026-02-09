import { z } from "zod";
import { AGENTS } from "../constants.js";

export const agentEnvelopeSchema = z.object({
  message_id: z.string().uuid(),
  from_agent: z.string(),
  to_agent: z.string(),
  data_type: z.string(),
  payload: z.record(z.unknown()),
  pipeline_run_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  version: z.literal("1.0"),
});

export type AgentEnvelope = z.infer<typeof agentEnvelopeSchema>;

export const rampUpWeekSchema = z.object({
  week: z.number(),
  target_kcal: z.number(),
  surplus_vs_baseline: z.number(),
  method: z.string(),
});

export const scientistOutputSchema = z.object({
  bmr_kcal: z.number(),
  tdee_kcal: z.number(),
  target_intake_kcal: z.number(),
  surplus_kcal: z.number(),
  macros: z.object({
    protein_g: z.number(),
    protein_g_per_kg: z.number(),
    fat_g: z.number(),
    fat_percent: z.number(),
    carbs_g: z.number(),
    fiber_g_min: z.number(),
  }),
  hydration_L: z.number(),
  weekly_weight_target_kg: z.number(),
  projected_timeline_months: z.number(),
  ramp_up: z.array(rampUpWeekSchema),
  adaptation_period_complete: z.boolean(),
  adjustment_triggered: z.boolean(),
  adjustment_type: z.string().nullable(),
  adjustment_amount_kcal: z.number().nullable(),
  training_phase: z.string(),
  weeks_on_program: z.number(),
  client_constraints: z.object({
    food_aversions: z.array(z.string()),
    appetite_level: z.string().optional(),
    cooking_skill: z.string().optional(),
    partner_cooks: z.boolean().optional(),
  }),
  red_flags: z.array(z.string()),
  notes: z.array(z.string()),
});

export type ScientistOutput = z.infer<typeof scientistOutputSchema>;
