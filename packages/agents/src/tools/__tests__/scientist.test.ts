import { describe, test, expect } from "vitest";
import {
  calculateBMR,
  calculateTDEE,
  calculateMacros,
  calculateRampUp,
  calculateWeightProjection,
} from "../scientist.js";

describe("calculateBMR", () => {
  test("reference case: 55kg, 174cm, 28y → 1337 kcal", () => {
    const result = calculateBMR({ weight_kg: 55, height_cm: 174, age: 28 });
    expect(result.bmr_kcal).toBe(1337);
  });

  test("includes formula string", () => {
    const result = calculateBMR({ weight_kg: 55, height_cm: 174, age: 28 });
    expect(result.formula).toContain("1337");
  });

  test("heavier client: 65kg, 174cm, 28y", () => {
    const result = calculateBMR({ weight_kg: 65, height_cm: 174, age: 28 });
    expect(result.bmr_kcal).toBe(1437);
  });
});

describe("calculateTDEE", () => {
  test("pre-training: BMR 1337 × 1.3 → 1738", () => {
    const result = calculateTDEE({ bmr_kcal: 1337, activity_level: "pre_training" });
    expect(result.tdee_kcal).toBe(1738);
    expect(result.activity_factor).toBe(1.3);
  });

  test("active training: BMR 1337 × 1.55 → 2072", () => {
    const result = calculateTDEE({ bmr_kcal: 1337, activity_level: "active_training" });
    expect(result.tdee_kcal).toBe(2072);
    expect(result.activity_factor).toBe(1.55);
  });

  test("unknown activity level falls back to 1.3", () => {
    const result = calculateTDEE({ bmr_kcal: 1337, activity_level: "unknown" });
    expect(result.activity_factor).toBe(1.3);
  });
});

describe("calculateMacros", () => {
  test("2500 kcal, 55kg, 1.8 g/kg protein", () => {
    const result = calculateMacros({
      target_intake_kcal: 2500,
      weight_kg: 55,
      protein_g_per_kg: 1.8,
    });
    expect(result.protein_g).toBe(99);
    expect(result.fat_g).toBe(69);
    expect(result.fat_percent).toBe(25);
    expect(result.carbs_g).toBe(371);
    expect(result.fiber_g_min).toBe(20);
  });

  test("protein_g_per_kg defaults to 1.8", () => {
    const result = calculateMacros({ target_intake_kcal: 2500, weight_kg: 55 });
    expect(result.protein_g_per_kg).toBe(1.8);
  });

  test("protein_g_per_kg caps at 2.0", () => {
    const result = calculateMacros({
      target_intake_kcal: 2500,
      weight_kg: 55,
      protein_g_per_kg: 2.5,
    });
    expect(result.protein_g_per_kg).toBe(2.0);
    expect(result.protein_g).toBe(110);
  });
});

describe("calculateRampUp", () => {
  test("1800 baseline → 2500 target", () => {
    const result = calculateRampUp({
      baseline_kcal: 1800,
      target_intake_kcal: 2500,
    });
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      week: 1,
      target_kcal: 2100,
      surplus_vs_baseline: 300,
      method: "Add 1 daily shake",
    });
    expect(result[1]).toEqual({
      week: 2,
      target_kcal: 2300,
      surplus_vs_baseline: 500,
      method: "Increase portions, add toppings",
    });
    expect(result[2]).toEqual({
      week: 3,
      target_kcal: 2500,
      surplus_vs_baseline: 700,
      method: "Full 5-meal template",
    });
  });
});

describe("calculateWeightProjection", () => {
  test("55kg → 65kg at 0.35 kg/week", () => {
    const result = calculateWeightProjection({
      current_weight_kg: 55,
      target_weight_kg: 65,
    });
    expect(result.weekly_weight_target_kg).toBe(0.35);
    expect(result.projected_weeks).toBe(29);
    expect(result.projected_timeline_months).toBe(6.7);
    expect(result.next_recalculation_weight_kg).toBe(60);
  });

  test("custom rate: 0.5 kg/week", () => {
    const result = calculateWeightProjection({
      current_weight_kg: 55,
      target_weight_kg: 65,
      weekly_gain_rate_kg: 0.5,
    });
    expect(result.projected_weeks).toBe(20);
  });

  test("next recalc capped at target weight", () => {
    const result = calculateWeightProjection({
      current_weight_kg: 62,
      target_weight_kg: 65,
    });
    expect(result.next_recalculation_weight_kg).toBe(65);
  });
});
