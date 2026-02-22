import { describe, it, expect } from "vitest";
import {
  validateNutritionistVsScientist,
  validateChefVsDietitian,
  validateCoachVsScientist,
} from "../cross-agent.js";

describe("validateNutritionistVsScientist", () => {
  const scientist = {
    bmr_kcal: 1337, tdee_kcal: 1838, target_intake_kcal: 2338, surplus_kcal: 500,
    macros: { protein_g: 99, protein_g_per_kg: 1.8, fat_g: 78, fat_percent: 30, carbs_g: 282, fiber_g_min: 25 },
    hydration_L: 2.2, weekly_weight_target_kg: 0.35, projected_timeline_months: 7,
    ramp_up: [], adaptation_period_complete: false, adjustment_triggered: false,
    adjustment_type: null, adjustment_amount_kcal: null, training_phase: "phase_0",
    weeks_on_program: 0, client_constraints: { food_aversions: [], appetite_level: "low" },
    red_flags: [], notes: [],
  } as any;

  it("passes when values match", () => {
    const nutritionist = {
      target_intake_kcal: 2338, protein_g: 99, fat_g: 78, carbs_g: 282,
    } as any;
    const result = validateNutritionistVsScientist(nutritionist, scientist);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails on calorie mismatch", () => {
    const nutritionist = {
      target_intake_kcal: 2500, protein_g: 99, fat_g: 78, carbs_g: 282,
    } as any;
    const result = validateNutritionistVsScientist(nutritionist, scientist);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("validateChefVsDietitian", () => {
  it("fails when recipe has no ingredients", () => {
    const chef = {
      recipes: [{ recipe_name: "Empty", ingredients: [], macros_per_serving: { calories: 100 } }],
    } as any;
    const result = validateChefVsDietitian(chef, {} as any);
    expect(result.valid).toBe(false);
  });

  it("passes with valid recipes", () => {
    const chef = {
      recipes: [{
        recipe_name: "Test",
        ingredients: [{ item: "chicken", amount_g: 150 }],
        macros_per_serving: { calories: 300, protein_g: 30, fat_g: 10, carbs_g: 20 },
      }],
    } as any;
    const result = validateChefVsDietitian(chef, {} as any);
    expect(result.valid).toBe(true);
  });
});

describe("validateCoachVsScientist", () => {
  it("warns on too many sessions for phase_0", () => {
    const coach = {
      program: {
        sessions: [
          { day: "Mon", exercises: [{ name: "squat" }] },
          { day: "Tue", exercises: [{ name: "bench" }] },
          { day: "Wed", exercises: [{ name: "row" }] },
          { day: "Thu", exercises: [{ name: "ohp" }] },
        ],
      },
    } as any;
    const scientist = { training_phase: "phase_0" } as any;
    const result = validateCoachVsScientist(coach, scientist);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
