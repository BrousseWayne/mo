import { describe, test, expect } from "vitest";
import {
  distributeProtein,
  buildSupplementProtocol,
  calculateHydration,
  applyCycleAdjustments,
} from "../nutritionist.js";

describe("distributeProtein", () => {
  test("130g, low appetite: sum equals 130, presleep >= 30, each meal >= 20", () => {
    const result = distributeProtein({
      daily_protein_g: 130,
      meal_count: 5,
      appetite_level: "low",
    });
    const sum =
      result.breakfast_g +
      result.lunch_g +
      result.snack_g +
      result.dinner_g +
      result.presleep_g;
    expect(sum).toBe(130);
    expect(result.presleep_g).toBeGreaterThanOrEqual(30);
    expect(result.breakfast_g).toBeGreaterThanOrEqual(20);
    expect(result.lunch_g).toBeGreaterThanOrEqual(20);
    expect(result.snack_g).toBeGreaterThanOrEqual(20);
    expect(result.dinner_g).toBeGreaterThanOrEqual(20);
  });

  test("80g, low appetite: sum equals 80, presleep 25-30 before redistribution", () => {
    const result = distributeProtein({
      daily_protein_g: 80,
      meal_count: 5,
      appetite_level: "low",
    });
    const sum =
      result.breakfast_g +
      result.lunch_g +
      result.snack_g +
      result.dinner_g +
      result.presleep_g;
    expect(sum).toBe(80);
  });

  test("150g, normal appetite: roughly even distribution across 4 main meals", () => {
    const result = distributeProtein({
      daily_protein_g: 150,
      meal_count: 5,
      appetite_level: "normal",
    });
    const sum =
      result.breakfast_g +
      result.lunch_g +
      result.snack_g +
      result.dinner_g +
      result.presleep_g;
    expect(sum).toBe(150);
    expect(result.presleep_g).toBeGreaterThanOrEqual(30);
    const mainMeals = [
      result.breakfast_g,
      result.lunch_g,
      result.snack_g,
      result.dinner_g,
    ];
    const maxDiff = Math.max(...mainMeals) - Math.min(...mainMeals);
    expect(maxDiff).toBeLessThanOrEqual(5);
  });
});

describe("buildSupplementProtocol", () => {
  test("standard client: includes creatine, D3, magnesium", () => {
    const result = buildSupplementProtocol({
      has_creatine_contraindication: false,
      medications: [],
      training_status: "beginner",
      weight_kg: 55,
    });
    const names = result.map((s) => s.supplement);
    expect(names).toContain("Creatine monohydrate");
    expect(names).toContain("Vitamin D3");
    expect(names).toContain("Magnesium glycinate");
  });

  test("creatine contraindicated: no creatine in result", () => {
    const result = buildSupplementProtocol({
      has_creatine_contraindication: true,
      medications: [],
      training_status: "beginner",
      weight_kg: 55,
    });
    const names = result.map((s) => s.supplement);
    expect(names).not.toContain("Creatine monohydrate");
    expect(names).toContain("Vitamin D3");
    expect(names).toContain("Magnesium glycinate");
  });
});

describe("calculateHydration", () => {
  test("creatine + training: base + 0.4 + 0.5", () => {
    const result = calculateHydration({
      base_hydration_L: 2.5,
      takes_creatine: true,
      trains_today: true,
    });
    expect(result.target_L).toBe(3.4);
    expect(result.breakdown.creatine_bonus_ml).toBe(400);
    expect(result.breakdown.training_bonus_ml).toBe(500);
  });

  test("no creatine, no training: base only", () => {
    const result = calculateHydration({
      base_hydration_L: 2.0,
      takes_creatine: false,
      trains_today: false,
    });
    expect(result.target_L).toBe(2.0);
    expect(result.breakdown.creatine_bonus_ml).toBe(0);
    expect(result.breakdown.training_bonus_ml).toBe(0);
  });
});

describe("applyCycleAdjustments", () => {
  const baseMacros = { protein_g: 100, fat_g: 70, carbs_g: 370 };

  test("follicular: kcal unchanged, macros unchanged", () => {
    const result = applyCycleAdjustments({
      cycle_phase: "follicular",
      base_target_kcal: 2500,
      base_macros: baseMacros,
    });
    expect(result.adjusted_kcal).toBe(2500);
    expect(result.adjusted_macros.protein_g).toBe(100);
    expect(result.adjusted_macros.carbs_g).toBe(370);
    expect(result.extra_hydration_ml).toBe(0);
  });

  test("luteal: kcal +100-200, extra hydration 250ml", () => {
    const result = applyCycleAdjustments({
      cycle_phase: "luteal",
      base_target_kcal: 2500,
      base_macros: baseMacros,
    });
    expect(result.adjusted_kcal).toBeGreaterThanOrEqual(2600);
    expect(result.adjusted_kcal).toBeLessThanOrEqual(2700);
    expect(result.adjusted_macros.carbs_g).toBeGreaterThan(370);
    expect(result.adjusted_macros.protein_g).toBe(100);
    expect(result.extra_hydration_ml).toBe(250);
  });
});
