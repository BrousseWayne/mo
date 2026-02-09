import { ACTIVITY_FACTORS, FAT_MIN_PERCENT, FIBER_MIN_G, type ActivityLevel } from "@mo/shared";
import type Anthropic from "@anthropic-ai/sdk";

export interface BMRInput {
  weight_kg: number;
  height_cm: number;
  age: number;
}

export interface BMROutput {
  bmr_kcal: number;
  formula: string;
}

export function calculateBMR(input: BMRInput): BMROutput {
  const bmr = Math.round(
    10 * input.weight_kg + 6.25 * input.height_cm - 5 * input.age - 161
  );
  return {
    bmr_kcal: bmr,
    formula: `10 × ${input.weight_kg} + 6.25 × ${input.height_cm} - 5 × ${input.age} - 161 = ${bmr}`,
  };
}

export interface TDEEInput {
  bmr_kcal: number;
  activity_level: string;
}

export interface TDEEOutput {
  tdee_kcal: number;
  activity_factor: number;
}

export function calculateTDEE(input: TDEEInput): TDEEOutput {
  const factor = ACTIVITY_FACTORS[input.activity_level as ActivityLevel] ?? 1.3;
  const tdee = Math.round(input.bmr_kcal * factor);
  return { tdee_kcal: tdee, activity_factor: factor };
}

export interface MacrosInput {
  target_intake_kcal: number;
  weight_kg: number;
  protein_g_per_kg?: number;
}

export interface MacrosOutput {
  protein_g: number;
  protein_g_per_kg: number;
  fat_g: number;
  fat_percent: number;
  carbs_g: number;
  fiber_g_min: number;
}

export function calculateMacros(input: MacrosInput): MacrosOutput {
  const proteinPerKg = Math.min(input.protein_g_per_kg ?? 1.8, 2.0);
  const protein_g = Math.round(input.weight_kg * proteinPerKg);
  const fat_g = Math.round((input.target_intake_kcal * FAT_MIN_PERCENT) / 9);
  const fat_percent = Math.round(((fat_g * 9) / input.target_intake_kcal) * 100);
  const carbs_g = Math.round(
    (input.target_intake_kcal - protein_g * 4 - fat_g * 9) / 4
  );
  return {
    protein_g,
    protein_g_per_kg: proteinPerKg,
    fat_g,
    fat_percent,
    carbs_g,
    fiber_g_min: FIBER_MIN_G,
  };
}

export interface RampUpInput {
  baseline_kcal: number;
  target_intake_kcal: number;
}

export interface RampUpWeek {
  week: number;
  target_kcal: number;
  surplus_vs_baseline: number;
  method: string;
}

export function calculateRampUp(input: RampUpInput): RampUpWeek[] {
  return [
    {
      week: 1,
      target_kcal: input.baseline_kcal + 300,
      surplus_vs_baseline: 300,
      method: "Add 1 daily shake",
    },
    {
      week: 2,
      target_kcal: input.baseline_kcal + 500,
      surplus_vs_baseline: 500,
      method: "Increase portions, add toppings",
    },
    {
      week: 3,
      target_kcal: input.target_intake_kcal,
      surplus_vs_baseline: input.target_intake_kcal - input.baseline_kcal,
      method: "Full 5-meal template",
    },
  ];
}

export interface ProjectionInput {
  current_weight_kg: number;
  target_weight_kg: number;
  weekly_gain_rate_kg?: number;
}

export interface ProjectionOutput {
  weekly_weight_target_kg: number;
  projected_weeks: number;
  projected_timeline_months: number;
  next_recalculation_weight_kg: number;
}

export function calculateWeightProjection(
  input: ProjectionInput
): ProjectionOutput {
  const rate = input.weekly_gain_rate_kg ?? 0.35;
  const delta = input.target_weight_kg - input.current_weight_kg;
  const weeks = Math.round(delta / rate);
  const months = Math.round((weeks / 4.33) * 10) / 10;
  const nextRecalc = input.current_weight_kg + 5;
  return {
    weekly_weight_target_kg: rate,
    projected_weeks: weeks,
    projected_timeline_months: months,
    next_recalculation_weight_kg: Math.min(nextRecalc, input.target_weight_kg),
  };
}

export const toolExecutors: Record<
  string,
  (input: Record<string, unknown>) => unknown
> = {
  calculate_bmr: (input) => calculateBMR(input as unknown as BMRInput),
  calculate_tdee: (input) => calculateTDEE(input as unknown as TDEEInput),
  calculate_macros: (input) => calculateMacros(input as unknown as MacrosInput),
  calculate_ramp_up: (input) =>
    calculateRampUp(input as unknown as RampUpInput),
  calculate_weight_projection: (input) =>
    calculateWeightProjection(input as unknown as ProjectionInput),
};

export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: "calculate_bmr",
    description:
      "Calculate Basal Metabolic Rate using Mifflin-St Jeor equation for women: 10×weight(kg) + 6.25×height(cm) - 5×age - 161",
    input_schema: {
      type: "object" as const,
      properties: {
        weight_kg: { type: "number", description: "Body weight in kilograms" },
        height_cm: { type: "number", description: "Height in centimeters" },
        age: { type: "number", description: "Age in years" },
      },
      required: ["weight_kg", "height_cm", "age"],
    },
  },
  {
    name: "calculate_tdee",
    description:
      "Calculate Total Daily Energy Expenditure: BMR × activity factor. Activity levels: sedentary (1.2), lightly_active (1.375), pre_training (1.3), active_training (1.55), very_active (1.725), extremely_active (1.9)",
    input_schema: {
      type: "object" as const,
      properties: {
        bmr_kcal: { type: "number", description: "Basal Metabolic Rate in kcal" },
        activity_level: {
          type: "string",
          description: "Activity level key",
          enum: Object.keys(ACTIVITY_FACTORS),
        },
      },
      required: ["bmr_kcal", "activity_level"],
    },
  },
  {
    name: "calculate_macros",
    description:
      "Calculate macronutrient targets: protein (1.6-2.0 g/kg), fat (≥25% kcal), carbs (remainder). Fiber minimum 20g.",
    input_schema: {
      type: "object" as const,
      properties: {
        target_intake_kcal: {
          type: "number",
          description: "Total daily caloric target in kcal",
        },
        weight_kg: { type: "number", description: "Current body weight in kg" },
        protein_g_per_kg: {
          type: "number",
          description: "Protein target in g/kg (default 1.8, max 2.0)",
        },
      },
      required: ["target_intake_kcal", "weight_kg"],
    },
  },
  {
    name: "calculate_ramp_up",
    description:
      "Calculate caloric ramp-up protocol: Week 1 +300 kcal, Week 2 +500 kcal, Week 3+ full target.",
    input_schema: {
      type: "object" as const,
      properties: {
        baseline_kcal: {
          type: "number",
          description: "Current estimated daily intake or pre-training TDEE",
        },
        target_intake_kcal: {
          type: "number",
          description: "Full protocol daily caloric target",
        },
      },
      required: ["baseline_kcal", "target_intake_kcal"],
    },
  },
  {
    name: "calculate_weight_projection",
    description:
      "Project weight gain timeline: target rate 0.25-0.5 kg/week, recalculate every 5 kg.",
    input_schema: {
      type: "object" as const,
      properties: {
        current_weight_kg: { type: "number", description: "Current weight in kg" },
        target_weight_kg: { type: "number", description: "Target weight in kg" },
        weekly_gain_rate_kg: {
          type: "number",
          description: "Target weekly gain rate in kg (default 0.35)",
        },
      },
      required: ["current_weight_kg", "target_weight_kg"],
    },
  },
];
