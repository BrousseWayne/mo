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

export const nutritionistOutputSchema = z.object({
  target_intake_kcal: z.number(),
  protein_g: z.number(),
  fat_g: z.number(),
  carbs_g: z.number(),
  protein_distribution: z.object({
    breakfast_g: z.number(),
    lunch_g: z.number(),
    snack_g: z.number(),
    dinner_g: z.number(),
    presleep_g: z.number(),
    reasoning: z.string(),
  }),
  hardgainer_tactics: z.array(
    z.object({
      tactic: z.string(),
      reasoning: z.string(),
      caloric_impact: z.string(),
    })
  ),
  supplement_protocol: z.array(
    z.object({
      supplement: z.string(),
      dose: z.string(),
      timing: z.string(),
      reasoning: z.string(),
      confidence: z.enum(["high", "moderate", "low", "conditional"]),
      adaptation_trigger: z.string(),
    })
  ),
  hydration_target_L: z.number(),
  fiber_target_g: z.number(),
  special_considerations: z.array(z.string()),
  cycle_adjustments: z.record(z.unknown()),
  calcium_iron_plan: z.record(z.unknown()),
  current_tier: z.number(),
  adaptation_triggers: z.array(z.string()),
});

export type NutritionistOutput = z.infer<typeof nutritionistOutputSchema>;

const slotSpecSchema = z.object({
  protein_g: z.number(),
  calories: z.number(),
  carbs_g: z.number().optional(),
  fat_g: z.number().optional(),
  prep_time_max_min: z.number().optional(),
  constraints: z.array(z.string()).optional(),
});

const mealSlotSchema = z.object({
  slot_spec: slotSpecSchema,
  primary_option: z.string().nullable(),
  primary_protein: z.string().optional(),
  cuisine_preference: z.string().optional(),
  batch_portion: z.number().optional(),
  alternatives: z.array(
    z.object({
      option: z.string().nullable(),
      primary_protein: z.string().optional(),
      cuisine_preference: z.string().optional(),
      substitution_reasoning: z.string(),
    })
  ),
  compliance_risk: z.enum(["low", "medium", "high"]),
  compliance_note: z.string(),
  dimensional_tags: z.record(z.string()).optional(),
});

const dayTemplateSchema = z.object({
  breakfast: mealSlotSchema,
  lunch: mealSlotSchema,
  snack: mealSlotSchema,
  dinner: mealSlotSchema,
  presleep: mealSlotSchema,
});

export const dietitianOutputSchema = z.object({
  weekly_template: z.record(dayTemplateSchema),
  rotation_schedule: z.record(z.record(z.string())),
  batch_schedule: z.record(z.unknown()),
  adaptation_path: z.record(z.string()),
  emergency_protocol: z.object({
    name: z.string(),
    max_frequency: z.string(),
    total_calories: z.number(),
    total_protein_g: z.number(),
    meals: z.record(z.unknown()),
    framing: z.string(),
  }),
  solo_week_protocol: z.record(z.unknown()),
  tracking_protocol: z.record(z.unknown()),
});

export type DietitianOutput = z.infer<typeof dietitianOutputSchema>;

const recipeSchema = z.object({
  recipe_name: z.string(),
  cuisine: z.string(),
  meal_pattern: z.record(z.string()),
  servings: z.number(),
  ingredients: z.array(
    z.object({
      item: z.string(),
      amount_g: z.number(),
      prep_notes: z.string().nullable(),
    })
  ),
  macros_per_serving: z.object({
    protein_g: z.number(),
    fat_g: z.number(),
    carbs_g: z.number(),
    fiber_g: z.number().optional(),
    calories: z.number(),
  }),
  instructions: z.array(z.string()),
  seasoning_stack: z.record(z.string()).optional(),
  flavor_balance: z.record(z.string()).optional(),
  time: z.object({ prep_min: z.number(), cook_min: z.number() }),
  batch_notes: z.string().optional(),
  storage: z
    .object({
      fridge_days: z.number(),
      freezer_friendly: z.boolean(),
    })
    .optional(),
  calorie_boost_options: z.array(z.string()).optional(),
});

export const chefOutputSchema = z.object({
  recipes: z.array(recipeSchema),
});

export type ChefOutput = z.infer<typeof chefOutputSchema>;

export const coachOutputSchema = z.object({
  program: z.object({
    phase: z.string(),
    phase_week: z.number(),
    frequency: z.string(),
    total_weeks_remaining_in_phase: z.number().optional(),
    sessions: z.array(
      z.object({
        day: z.string(),
        focus: z.string(),
        warmup: z.array(z.string()),
        exercises: z.array(
          z.object({
            name: z.string(),
            sets: z.number(),
            reps: z.string(),
            rest_sec: z.number(),
            notes: z.string(),
            target_rpe: z.number(),
            progression_rule: z.string(),
          })
        ),
      })
    ),
  }),
  progression_rules: z.array(z.string()),
  recovery_protocol: z.array(z.string()),
  phase_transition_criteria: z.array(z.string()),
  weekly_volume_summary: z.record(z.string()),
  session_notes: z.string(),
});

export type CoachOutput = z.infer<typeof coachOutputSchema>;

export const physicianOutputSchema = z.object({
  response: z.string(),
  sources: z.array(
    z.object({
      author: z.string(),
      year: z.number(),
      publication: z.string().optional(),
      finding: z.string(),
    })
  ),
  mechanism_explained: z.string(),
  timeline: z.string().nullable(),
  referral_needed: z.boolean(),
  referral_target: z.string().nullable(),
  urgency: z.enum(["routine", "soon", "urgent"]),
  pipeline_action: z.enum(["continue", "pause", "abort"]),
  disclaimer: z.string(),
});

export type PhysicianOutput = z.infer<typeof physicianOutputSchema>;
