import { describe, test, expect } from "vitest";
import {
  allocateMealSlots,
  applyCalorieTier,
  buildEmergencyProtocol,
} from "../dietitian.js";

const BASE_INPUT = {
  target_intake_kcal: 2500,
  protein_distribution: {
    breakfast_g: 25,
    lunch_g: 28,
    snack_g: 20,
    dinner_g: 28,
    presleep_g: 35,
  },
  fat_g: 70,
  carbs_g: 368,
};

describe("allocateMealSlots", () => {
  test("2500 kcal: sum of slot calories within 5% of 2500", () => {
    const slots = allocateMealSlots(BASE_INPUT);
    const total = slots.reduce((sum, s) => sum + s.calories, 0);
    expect(total).toBeGreaterThanOrEqual(2500 * 0.95);
    expect(total).toBeLessThanOrEqual(2500 * 1.05);
  });

  test("protein distribution preserved: presleep >= 30g", () => {
    const slots = allocateMealSlots(BASE_INPUT);
    const presleep = slots.find((s) => s.slot_name === "presleep")!;
    expect(presleep.protein_g).toBeGreaterThanOrEqual(30);
  });

  test("correct constraints per slot type", () => {
    const slots = allocateMealSlots(BASE_INPUT);
    const breakfast = slots.find((s) => s.slot_name === "breakfast")!;
    const snack = slots.find((s) => s.slot_name === "snack")!;
    const dinner = slots.find((s) => s.slot_name === "dinner")!;
    const presleep = slots.find((s) => s.slot_name === "presleep")!;
    expect(breakfast.constraints).toContain("fast_prep");
    expect(snack.constraints).toContain("can_be_shake");
    expect(snack.constraints).toContain("portable");
    expect(dinner.constraints).toContain("batch_cookable");
    expect(presleep.constraints).toContain("casein_based");
    expect(presleep.constraints).toContain("simple");
  });
});

describe("applyCalorieTier", () => {
  const baseSlots = allocateMealSlots(BASE_INPUT);

  test("tier 0: total ~2100 kcal", () => {
    const result = applyCalorieTier({ tier: 0, base_slots: baseSlots, target_intake_kcal: 2500 });
    const total = result.adjusted_slots.reduce((sum, s) => sum + s.calories, 0);
    expect(total).toBeGreaterThanOrEqual(2100 * 0.95);
    expect(total).toBeLessThanOrEqual(2100 * 1.05);
  });

  test("tier 2: total matches target", () => {
    const result = applyCalorieTier({ tier: 2, base_slots: baseSlots, target_intake_kcal: 2500 });
    const total = result.adjusted_slots.reduce((sum, s) => sum + s.calories, 0);
    const baseTotal = baseSlots.reduce((sum, s) => sum + s.calories, 0);
    expect(total).toBe(baseTotal);
  });
});

describe("buildEmergencyProtocol", () => {
  test("total ~1800 kcal", () => {
    const protocol = buildEmergencyProtocol();
    expect(protocol.total_calories).toBe(1800);
  });

  test("protein >= 85g", () => {
    const protocol = buildEmergencyProtocol();
    expect(protocol.total_protein_g).toBeGreaterThanOrEqual(85);
  });
});
