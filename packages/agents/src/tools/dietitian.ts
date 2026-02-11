import type Anthropic from "@anthropic-ai/sdk";

export interface SlotSpec {
  slot_name: string;
  protein_g: number;
  calories: number;
  fat_g: number;
  carbs_g: number;
  constraints: string[];
}

export interface AllocateMealSlotsInput {
  target_intake_kcal: number;
  protein_distribution: {
    breakfast_g: number;
    lunch_g: number;
    snack_g: number;
    dinner_g: number;
    presleep_g: number;
  };
  fat_g: number;
  carbs_g: number;
}

const SLOT_CONFIG = [
  { name: "breakfast", pct: 0.21, constraints: ["fast_prep", "no_nut_butters"] },
  { name: "lunch", pct: 0.25, constraints: ["batch_cookable", "no_nut_butters"] },
  { name: "snack", pct: 0.17, constraints: ["portable", "can_be_shake", "no_nut_butters"] },
  { name: "dinner", pct: 0.25, constraints: ["batch_cookable", "no_nut_butters"] },
  { name: "presleep", pct: 0.12, constraints: ["casein_based", "simple", "no_nut_butters"] },
] as const;

const PROTEIN_KEY_MAP: Record<string, keyof AllocateMealSlotsInput["protein_distribution"]> = {
  breakfast: "breakfast_g",
  lunch: "lunch_g",
  snack: "snack_g",
  dinner: "dinner_g",
  presleep: "presleep_g",
};

export function allocateMealSlots(input: AllocateMealSlotsInput): SlotSpec[] {
  return SLOT_CONFIG.map(({ name, pct, constraints }) => {
    const calories = Math.round(input.target_intake_kcal * pct);
    const protein_g = input.protein_distribution[PROTEIN_KEY_MAP[name]];
    const fat_per_slot = Math.round(input.fat_g * pct);
    const carbs_g = Math.round((calories - protein_g * 4 - fat_per_slot * 9) / 4);
    return {
      slot_name: name,
      protein_g,
      calories,
      fat_g: fat_per_slot,
      carbs_g,
      constraints: [...constraints],
    };
  });
}

export interface ApplyCalorieTierInput {
  tier: number;
  base_slots: SlotSpec[];
  target_intake_kcal: number;
}

export interface ApplyCalorieTierOutput {
  adjusted_slots: SlotSpec[];
  tier_notes: string;
}

export function applyCalorieTier(input: ApplyCalorieTierInput): ApplyCalorieTierOutput {
  if (input.tier === 2) {
    return {
      adjusted_slots: input.base_slots.map((s) => ({ ...s })),
      tier_notes: "Tier 2: full target intake, no scaling applied",
    };
  }

  const tierTarget = input.tier === 0 ? 2100 : 2300;
  const currentTotal = input.base_slots.reduce((sum, s) => sum + s.calories, 0);
  const ratio = tierTarget / currentTotal;

  const adjusted = input.base_slots.map((s) => {
    const scaled: SlotSpec = {
      ...s,
      calories: Math.round(s.calories * ratio),
      carbs_g: Math.round(s.carbs_g * ratio),
      fat_g: Math.round(s.fat_g * ratio),
      constraints: [...s.constraints],
    };

    if (input.tier === 0 && s.slot_name === "snack") {
      scaled.constraints.push("shake_mandatory");
    }

    if (input.tier === 1 && ["breakfast", "lunch", "dinner"].includes(s.slot_name)) {
      const stealthPerSlot = Math.round(125 / 3);
      scaled.calories += stealthPerSlot;
      scaled.fat_g += Math.round(stealthPerSlot / 9);
      scaled.constraints.push("stealth_fats");
    }

    return scaled;
  });

  return { adjusted_slots: adjusted, tier_notes: `Tier ${input.tier} (~${tierTarget} kcal): scaled proportionally${input.tier === 1 ? " + stealth fats" : input.tier === 0 ? ", snack = shake" : ""}` };
}

export interface EmergencyMeal {
  ingredients: string[];
  calories: number;
  protein_g: number;
}

export interface EmergencyProtocolOutput {
  total_calories: number;
  total_protein_g: number;
  meals: {
    morning_shake: EmergencyMeal;
    afternoon_shake: EmergencyMeal;
    evening_minimal: EmergencyMeal & { description: string };
  };
  max_frequency: string;
}

export function buildEmergencyProtocol(): EmergencyProtocolOutput {
  return {
    total_calories: 1800,
    total_protein_g: 85,
    meals: {
      morning_shake: {
        ingredients: ["banana", "oats_50g", "whey_scoop", "tahini_1tbsp", "whole_milk_300ml"],
        calories: 650,
        protein_g: 35,
      },
      afternoon_shake: {
        ingredients: ["berries_100g", "casein_scoop", "coconut_cream_2tbsp", "honey_1tbsp", "whole_milk_250ml"],
        calories: 600,
        protein_g: 30,
      },
      evening_minimal: {
        ingredients: ["toast_2slices", "cheese_30g", "eggs_2"],
        description: "whatever tolerable — toast + cheese + eggs suggested",
        calories: 550,
        protein_g: 20,
      },
    },
    max_frequency: "2x_per_week",
  };
}

export const toolExecutors: Record<
  string,
  (input: Record<string, unknown>) => unknown
> = {
  allocate_meal_slots: (input) => allocateMealSlots(input as unknown as AllocateMealSlotsInput),
  apply_calorie_tier: (input) => applyCalorieTier(input as unknown as ApplyCalorieTierInput),
  build_emergency_protocol: () => buildEmergencyProtocol(),
};

export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: "allocate_meal_slots",
    description:
      "Allocate daily calories, protein, fat, and carbs across 5 meal slots (breakfast, lunch, snack, dinner, presleep) using fixed percentages. Returns slot specs with constraints.",
    input_schema: {
      type: "object" as const,
      properties: {
        target_intake_kcal: { type: "number", description: "Total daily caloric target in kcal" },
        protein_distribution: {
          type: "object",
          description: "Protein allocation per slot from NUTRITIONIST",
          properties: {
            breakfast_g: { type: "number" },
            lunch_g: { type: "number" },
            snack_g: { type: "number" },
            dinner_g: { type: "number" },
            presleep_g: { type: "number" },
          },
          required: ["breakfast_g", "lunch_g", "snack_g", "dinner_g", "presleep_g"],
        },
        fat_g: { type: "number", description: "Total daily fat target in grams" },
        carbs_g: { type: "number", description: "Total daily carbs target in grams" },
      },
      required: ["target_intake_kcal", "protein_distribution", "fat_g", "carbs_g"],
    },
  },
  {
    name: "apply_calorie_tier",
    description:
      "Apply calorie tier adjustments to slot specs. Tier 0: scale to ~2100 kcal, snack = shake. Tier 1: scale to ~2300 kcal + stealth fats. Tier 2: full target, no change.",
    input_schema: {
      type: "object" as const,
      properties: {
        tier: { type: "number", description: "Current calorie tier (0, 1, or 2)", enum: [0, 1, 2] },
        base_slots: {
          type: "array",
          description: "Slot specs from allocate_meal_slots",
          items: {
            type: "object",
            properties: {
              slot_name: { type: "string" },
              protein_g: { type: "number" },
              calories: { type: "number" },
              fat_g: { type: "number" },
              carbs_g: { type: "number" },
              constraints: { type: "array", items: { type: "string" } },
            },
          },
        },
        target_intake_kcal: { type: "number", description: "Full protocol daily caloric target" },
      },
      required: ["tier", "base_slots", "target_intake_kcal"],
    },
  },
  {
    name: "build_emergency_protocol",
    description:
      "Generate the fixed emergency minimum viable day protocol: ~1800 kcal, ~85g protein across 3 liquid/minimal meals. Max 2x per week. No input required.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];
