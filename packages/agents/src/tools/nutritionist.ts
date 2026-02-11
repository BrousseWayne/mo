import type Anthropic from "@anthropic-ai/sdk";

export interface ProteinDistributionInput {
  daily_protein_g: number;
  meal_count: number;
  appetite_level: string;
  training_time?: string;
}

export interface ProteinDistributionOutput {
  breakfast_g: number;
  lunch_g: number;
  snack_g: number;
  dinner_g: number;
  presleep_g: number;
}

export function distributeProtein(
  input: ProteinDistributionInput
): ProteinDistributionOutput {
  const total = input.daily_protein_g;

  let presleep: number;
  if (total >= 100) {
    presleep = Math.round(total * 0.35);
    presleep = Math.max(30, Math.min(40, presleep));
  } else {
    presleep = Math.round(total * 0.33);
    presleep = Math.max(25, Math.min(30, presleep));
  }

  const remaining = total - presleep;

  let breakfast: number;
  let lunch: number;
  let snack: number;
  let dinner: number;

  if (input.appetite_level === "low") {
    snack = Math.max(15, Math.min(22, Math.round(remaining * 0.2)));
    breakfast = Math.max(22, Math.min(28, Math.round(remaining * 0.27)));
    const leftover = remaining - snack - breakfast;
    lunch = Math.round(leftover / 2);
    dinner = leftover - lunch;
  } else {
    const perMeal = Math.round(remaining / 4);
    breakfast = perMeal;
    lunch = perMeal;
    snack = perMeal;
    dinner = remaining - breakfast - lunch - snack;
  }

  const meals = { breakfast, lunch, snack, dinner, presleep };
  const keys = ["breakfast", "lunch", "snack", "dinner", "presleep"] as const;
  const minPerMeal = Math.min(20, Math.floor(total / 5));

  let iterations = 0;
  let underMin = true;
  while (underMin && iterations < 20) {
    underMin = false;
    iterations++;
    let maxKey: (typeof keys)[number] = keys[0];
    for (const k of keys) {
      if (meals[k] > meals[maxKey]) maxKey = k;
    }
    if (meals[maxKey] <= minPerMeal) break;
    for (const k of keys) {
      if (meals[k] < minPerMeal) {
        const deficit = minPerMeal - meals[k];
        const available = meals[maxKey] - minPerMeal;
        const transfer = Math.min(deficit, available);
        meals[k] += transfer;
        meals[maxKey] -= transfer;
        if (meals[k] < minPerMeal) underMin = true;
        break;
      }
    }
  }

  const sum =
    meals.breakfast + meals.lunch + meals.snack + meals.dinner + meals.presleep;
  meals.dinner += total - sum;

  return {
    breakfast_g: meals.breakfast,
    lunch_g: meals.lunch,
    snack_g: meals.snack,
    dinner_g: meals.dinner,
    presleep_g: meals.presleep,
  };
}

export interface SupplementProtocolInput {
  has_creatine_contraindication: boolean;
  medications: string[];
  training_status: string;
  weight_kg?: number;
  fish_intake?: string;
  stress_level?: string;
  sun_exposure?: string;
}

export interface SupplementRecommendation {
  supplement: string;
  dose: string;
  timing: string;
  evidence: string;
  confidence: string;
}

export function buildSupplementProtocol(
  input: SupplementProtocolInput
): SupplementRecommendation[] {
  const result: SupplementRecommendation[] = [];
  const weight = input.weight_kg ?? 55;

  if (!input.has_creatine_contraindication) {
    result.push({
      supplement: "Creatine monohydrate",
      dose: weight >= 65 ? "5g/day" : "3g/day",
      timing: "Any time, daily, with water",
      evidence: "ISSN position paper (Kreider 2017), 680+ trials",
      confidence: "high",
    });
  }

  result.push({
    supplement: "Vitamin D3",
    dose: input.sun_exposure === "low" ? "4000 IU/day" : "2000 IU/day",
    timing: "With fat-containing meal (breakfast or lunch)",
    evidence: "Default unless serum 25(OH)D >75 nmol/L verified",
    confidence: "high",
  });

  result.push({
    supplement: "Magnesium glycinate",
    dose: weight >= 60 ? "300-400mg" : "200mg",
    timing: "Bedtime",
    evidence: "Supports sleep via GABA pathway; training recovery",
    confidence: "high",
  });

  const fishLow =
    !input.fish_intake ||
    input.fish_intake === "never" ||
    input.fish_intake === "rarely" ||
    input.fish_intake === "1x_week";
  if (fishLow) {
    const noFish =
      !input.fish_intake ||
      input.fish_intake === "never" ||
      input.fish_intake === "rarely";
    result.push({
      supplement: "Omega-3 EPA+DHA",
      dose: noFish ? "3-4g/day" : "2g/day",
      timing: "With dinner (fat-containing meal)",
      evidence: "Smith 2011: MPS augmentation when combined with protein",
      confidence: "high",
    });
  }

  if (input.stress_level === "high") {
    result.push({
      supplement: "Ashwagandha KSM-66",
      dose: "600mg",
      timing: "Morning, cycle 8-12 weeks on / 4 weeks off",
      evidence: "Cortisol reduction; limited long-term data",
      confidence: "moderate",
    });
  } else if (input.stress_level === "moderate") {
    result.push({
      supplement: "Ashwagandha KSM-66",
      dose: "300mg",
      timing: "Morning, cycle 8-12 weeks on / 4 weeks off",
      evidence: "Cortisol reduction; limited long-term data",
      confidence: "moderate",
    });
  }

  const trainingActive =
    input.training_status === "active_training" ||
    input.training_status === "beginner" ||
    input.training_status === "intermediate";
  if (trainingActive) {
    result.push({
      supplement: "Collagen peptides",
      dose: "10-15g + 50mg vitamin C",
      timing: "30-60 min pre-training",
      evidence: "Tendon/joint support; hypertrophy data limited",
      confidence: "moderate",
    });
  }

  return result;
}

export interface HydrationInput {
  base_hydration_L: number;
  takes_creatine: boolean;
  trains_today: boolean;
}

export interface HydrationOutput {
  target_L: number;
  breakdown: {
    base_L: number;
    creatine_bonus_ml: number;
    training_bonus_ml: number;
  };
}

export function calculateHydration(input: HydrationInput): HydrationOutput {
  const creatine_bonus_ml = input.takes_creatine ? 400 : 0;
  const training_bonus_ml = input.trains_today ? 500 : 0;
  const target_L =
    Math.round(
      (input.base_hydration_L + creatine_bonus_ml / 1000 + training_bonus_ml / 1000) * 10
    ) / 10;

  return {
    target_L,
    breakdown: {
      base_L: input.base_hydration_L,
      creatine_bonus_ml,
      training_bonus_ml,
    },
  };
}

export interface CycleAdjustmentsInput {
  cycle_phase: string;
  base_target_kcal: number;
  base_macros: {
    protein_g: number;
    fat_g: number;
    carbs_g: number;
  };
}

export interface CycleAdjustmentsOutput {
  adjusted_kcal: number;
  adjusted_macros: {
    protein_g: number;
    fat_g: number;
    carbs_g: number;
  };
  recommendations: string[];
  extra_hydration_ml: number;
}

export function applyCycleAdjustments(
  input: CycleAdjustmentsInput
): CycleAdjustmentsOutput {
  const { cycle_phase, base_target_kcal, base_macros } = input;

  if (cycle_phase === "luteal") {
    const extra_kcal = 150;
    const extra_carbs_g = Math.round(extra_kcal / 4);
    return {
      adjusted_kcal: base_target_kcal + extra_kcal,
      adjusted_macros: {
        protein_g: base_macros.protein_g,
        fat_g: base_macros.fat_g,
        carbs_g: base_macros.carbs_g + extra_carbs_g,
      },
      recommendations: [
        "Extra calories from carbohydrates (TDEE increases 5-10% in luteal phase)",
        "Expect 0.5-2.3 kg water retention — do NOT reduce calories to compensate",
        "Allow lighter training sessions in late luteal if needed",
      ],
      extra_hydration_ml: 250,
    };
  }

  if (cycle_phase === "follicular") {
    return {
      adjusted_kcal: base_target_kcal,
      adjusted_macros: { ...base_macros },
      recommendations: [
        "Carbohydrate tolerance is higher in follicular phase",
        "Can push carb-heavy meals and higher training volume",
      ],
      extra_hydration_ml: 0,
    };
  }

  return {
    adjusted_kcal: base_target_kcal,
    adjusted_macros: { ...base_macros },
    recommendations: [
      cycle_phase === "amenorrhea"
        ? "Amenorrhea detected — flag for PHYSICIAN monitoring (RED-S concern)"
        : "Irregular cycle — no phase-specific adjustments, flag for monitoring",
    ],
    extra_hydration_ml: 0,
  };
}

export const toolExecutors: Record<
  string,
  (input: Record<string, unknown>) => unknown
> = {
  distribute_protein: (input) =>
    distributeProtein(input as unknown as ProteinDistributionInput),
  build_supplement_protocol: (input) =>
    buildSupplementProtocol(input as unknown as SupplementProtocolInput),
  calculate_hydration: (input) =>
    calculateHydration(input as unknown as HydrationInput),
  apply_cycle_adjustments: (input) =>
    applyCycleAdjustments(input as unknown as CycleAdjustmentsInput),
};

export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: "distribute_protein",
    description:
      "Distribute daily protein across 5 meals (breakfast, lunch, snack, dinner, presleep) optimized for MPS. Pre-sleep casein allocation. Every meal >= 20g leucine threshold.",
    input_schema: {
      type: "object" as const,
      properties: {
        daily_protein_g: {
          type: "number",
          description: "Total daily protein target in grams",
        },
        meal_count: {
          type: "number",
          description: "Number of meals (always 5)",
        },
        appetite_level: {
          type: "string",
          description: "Client appetite level",
          enum: ["low", "normal", "high"],
        },
        training_time: {
          type: "string",
          description:
            "Time of day client trains (optional, for post-training meal placement)",
        },
      },
      required: ["daily_protein_g", "meal_count", "appetite_level"],
    },
  },
  {
    name: "build_supplement_protocol",
    description:
      "Generate personalized supplement protocol. Tier 1 (always): creatine, Vitamin D3, Magnesium. Tier 2 (conditional): omega-3, ashwagandha, collagen.",
    input_schema: {
      type: "object" as const,
      properties: {
        has_creatine_contraindication: {
          type: "boolean",
          description: "Whether client has kidney disease or other creatine contraindication",
        },
        medications: {
          type: "array",
          items: { type: "string" },
          description: "Current medications",
        },
        training_status: {
          type: "string",
          description: "Current training status",
          enum: ["none", "beginner", "intermediate", "advanced", "active_training"],
        },
        weight_kg: {
          type: "number",
          description: "Client weight in kg (affects dosing)",
        },
        fish_intake: {
          type: "string",
          description: "Fish intake frequency",
          enum: ["never", "rarely", "1x_week", "2x_week", "3x_plus_week"],
        },
        stress_level: {
          type: "string",
          description: "Current stress level",
          enum: ["low", "moderate", "high"],
        },
        sun_exposure: {
          type: "string",
          description: "Sun exposure level",
          enum: ["low", "moderate", "high"],
        },
      },
      required: ["has_creatine_contraindication", "medications", "training_status"],
    },
  },
  {
    name: "calculate_hydration",
    description:
      "Calculate daily hydration target: base + creatine bonus (300-500ml) + training bonus (500ml).",
    input_schema: {
      type: "object" as const,
      properties: {
        base_hydration_L: {
          type: "number",
          description: "Base hydration target in liters (2.0-2.5L)",
        },
        takes_creatine: {
          type: "boolean",
          description: "Whether client takes creatine (adds 300-500ml)",
        },
        trains_today: {
          type: "boolean",
          description: "Whether client trains today (adds 500ml)",
        },
      },
      required: ["base_hydration_L", "takes_creatine", "trains_today"],
    },
  },
  {
    name: "apply_cycle_adjustments",
    description:
      "Apply menstrual cycle phase adjustments. Follicular: no calorie change, higher carb tolerance. Luteal: +100-200 kcal from carbs, +250ml water, water retention warning. Amenorrhea/irregular: no adjustment, flag for monitoring.",
    input_schema: {
      type: "object" as const,
      properties: {
        cycle_phase: {
          type: "string",
          description: "Current menstrual cycle phase",
          enum: ["follicular", "luteal", "amenorrhea", "irregular"],
        },
        base_target_kcal: {
          type: "number",
          description: "Base daily caloric target",
        },
        base_macros: {
          type: "object",
          description: "Base macronutrient targets",
          properties: {
            protein_g: { type: "number" },
            fat_g: { type: "number" },
            carbs_g: { type: "number" },
          },
          required: ["protein_g", "fat_g", "carbs_g"],
        },
      },
      required: ["cycle_phase", "base_target_kcal", "base_macros"],
    },
  },
];
