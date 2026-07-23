import { dietitianOutputSchema, type DietitianOutput } from "@mo/shared";
import { extractSection, parseTable, midpoint } from "./markdown.js";

const SLOT_KEYS = {
  Breakfast: "breakfast",
  Lunch: "lunch",
  Snack: "snack",
  Dinner: "dinner",
  "Pre-sleep": "presleep",
} as const;

type SlotKey = (typeof SLOT_KEYS)[keyof typeof SLOT_KEYS];

const COMPLIANCE: Record<SlotKey, { risk: "low" | "medium" | "high"; note: string }> = {
  breakfast: {
    risk: "low",
    note: "Max 10 min prep or batch-preppable; quick options protect the slot on rushed mornings",
  },
  lunch: {
    risk: "low",
    note: "Batch-cooked by partner; main compliance lever is batch adherence",
  },
  snack: {
    risk: "medium",
    note: "Portable slot for a low-appetite client; the shake option is the fallback when solid food does not appeal",
  },
  dinner: {
    risk: "low",
    note: "Partner-cooked; highest-variety slot",
  },
  presleep: {
    risk: "high",
    note: "Most commonly skipped slot; keep maximally simple — casein-based, 2-minute prep",
  },
};

const PROTOCOLS = {
  adaptation_path: {
    appetite_improving: "Reduce shake frequency; add solid breakfast variety; increase dinner complexity",
    partner_unavailable: "Switch to solo week protocol; increase shakes to 2/day; survival recipes only",
    calorie_target_increased:
      "Add stealth calories (oil, butter, cheese) to existing meals first; then increase carb portions; then add second shake",
    presleep_skipped_consistently:
      "Simplify to casein shake only; if still skipped, merge 200 kcal into dinner",
    cuisine_boredom: "Rotate in 2 new cuisines from the cuisine pool; increase weekly variety",
  },
  emergency_protocol: {
    name: "minimum_viable_day",
    max_frequency: "2x_per_week",
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
        description: "whatever tolerable — toast + cheese + eggs suggested",
        calories: 550,
        protein_g: 20,
      },
    },
    framing: "maintenance mode — protecting your base",
  },
  solo_week_protocol: {
    trigger: "partner_unavailable",
    approved_shortcuts: [
      "rotisserie_chicken",
      "precooked_rice",
      "canned_tuna_salmon",
      "eggs",
      "macro_checked_frozen_meals",
    ],
    max_shake_frequency: "2_per_day",
    survival_recipes_required: 6,
    recipe_constraints: { max_steps: 5, max_prep_min: 15 },
  },
  tracking_protocol: {
    weeks_1_4: "food_scale_app_myfitnesspal",
    weeks_5_plus: "portion_estimation",
    reengagement_triggers: ["weight_stall_2_weeks", "user_request", "major_schedule_change"],
  },
};

function parseSlotSpecs(md: string) {
  const rows = parseTable(extractSection(md, "## Slot Specifications (Fixed)")).slice(1);
  const specs = new Map<SlotKey, { protein_g: number; calories: number; prep_time_max_min?: number; constraints: string[] }>();
  for (const [slot, , protein, calories, prep] of rows) {
    const key = SLOT_KEYS[slot as keyof typeof SLOT_KEYS];
    if (!key) continue;
    const prepMax = prep.match(/≤(\d+)\s*min/);
    specs.set(key, {
      protein_g: midpoint(protein),
      calories: midpoint(calories),
      ...(prepMax ? { prep_time_max_min: Number(prepMax[1]) } : {}),
      constraints: [prep, "no_peanut_butter", "no_nut_butters"],
    });
  }
  return specs;
}

function parseRotation(md: string): Record<string, Record<string, string>> {
  const rows = parseTable(extractSection(md, "## Protein Rotation Schedule")).slice(1);
  const rotation: Record<string, Record<string, string>> = {};
  for (const [day, protein, cuisine] of rows) {
    rotation[day.toLowerCase()] = {
      protein: protein.toLowerCase(),
      cuisine: cuisine.toLowerCase(),
    };
  }
  return rotation;
}

function parseBatchSchedule(md: string): Record<string, unknown> {
  const section = extractSection(md, "## Batch Cooking Schedule");
  const rows = parseTable(section).slice(1);
  const schedule: Record<string, unknown> = {};
  for (const [session, day, produces, covers] of rows) {
    schedule[session.toLowerCase().replace(/\s+/g, "_")] = {
      cook_day: day.toLowerCase(),
      produces,
      covers,
    };
  }
  const sundayOff = section.match(/\*\*Sunday off\*\*:\s*(.+)/);
  if (sundayOff) {
    schedule.sunday_off = sundayOff[1].trim();
  }
  return schedule;
}

function parseWeeklyTemplate(
  md: string,
  specs: ReturnType<typeof parseSlotSpecs>,
  rotation: Record<string, Record<string, string>>
) {
  const section = extractSection(md, "## Weekly Template");
  const weekly: Record<string, Record<string, unknown>> = {};
  const dayBlocks = section.split(/^### /m).slice(1);
  for (const block of dayBlocks) {
    const day = block.match(/^([A-Z]+)/)?.[1]?.toLowerCase();
    if (!day) continue;
    const rows = parseTable(block).slice(1);
    const slots: Record<string, unknown> = {};
    for (const [slotLabel, primary, alt1, alt2] of rows) {
      const key = SLOT_KEYS[slotLabel as keyof typeof SLOT_KEYS];
      if (!key) continue;
      const spec = specs.get(key);
      if (!spec) throw new Error(`No slot spec for ${key}`);
      const reasoning = `Template alternative meeting the same ${key} slot spec (~${spec.protein_g}g protein, ~${spec.calories} kcal)`;
      slots[key] = {
        slot_spec: spec,
        primary_option: primary,
        ...(key === "lunch" || key === "dinner"
          ? {
              primary_protein: rotation[day]?.protein,
              cuisine_preference: rotation[day]?.cuisine,
            }
          : {}),
        alternatives: [alt1, alt2].filter(Boolean).map((option) => ({
          option,
          substitution_reasoning: reasoning,
        })),
        compliance_risk: COMPLIANCE[key].risk,
        compliance_note: COMPLIANCE[key].note,
      };
    }
    weekly[day] = slots;
  }
  return weekly;
}

export function parseMealTemplate(md: string): DietitianOutput {
  const specs = parseSlotSpecs(md);
  const rotation = parseRotation(md);
  return dietitianOutputSchema.parse({
    weekly_template: parseWeeklyTemplate(md, specs, rotation),
    rotation_schedule: rotation,
    batch_schedule: parseBatchSchedule(md),
    ...PROTOCOLS,
  });
}
