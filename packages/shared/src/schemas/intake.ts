import { z } from "zod";

export const intakeSchema = z.object({
  age: z.number().int().min(18).max(65),
  height_cm: z.number().min(100).max(220),
  current_weight_kg: z.number().min(30).max(200),
  target_weight_kg: z.number().min(30).max(200),
  training_status: z.enum(["none", "beginner", "intermediate"]),
  training_frequency_per_week: z.number().int().min(0).max(7).optional(),
  estimated_daily_calories: z.number().optional(),
  daily_step_count: z
    .enum(["sedentary", "lightly_active", "moderately_active", "very_active"])
    .optional(),
  menstrual_cycle_length: z
    .enum([
      "under_21",
      "21_25",
      "26_30",
      "31_35",
      "over_35",
      "irregular",
      "amenorrhea",
      "postmenopausal",
      "hormonal_contraception",
    ])
    .optional(),
  cycle_tracking: z.boolean().optional(),
  sleep_hours: z.number().min(0).max(24).optional(),
  stress_level: z.number().int().min(1).max(10).optional(),
  previous_weight_gain_attempts: z.string().optional(),
  food_aversions: z.array(z.string()).default(["peanut_butter", "nut_butters"]),
  appetite_level: z.enum(["low", "moderate", "high"]).optional(),
  cooking_skill: z.enum(["none", "basic", "intermediate", "advanced"]).optional(),
  partner_cooks: z.boolean().optional(),
  equipment_access: z
    .enum(["home_minimal", "home_full", "commercial_gym", "both"])
    .optional(),
  gym_anxiety_level: z.enum(["high", "moderate", "low"]).optional(),
  medical_history: z
    .object({
      medications: z.array(z.string()).optional(),
      conditions: z.array(z.string()).optional(),
      injuries: z.array(z.string()).optional(),
    })
    .optional(),
});

export type IntakeData = z.infer<typeof intakeSchema>;
