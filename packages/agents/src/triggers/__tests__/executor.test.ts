import { describe, it, expect } from "vitest";
import { executeAdjustments } from "../executor.js";
import type { TriggerResult } from "@mo/shared";

function trigger(type: string, newValues: Record<string, unknown>): TriggerResult {
  return {
    trigger_type: type,
    adjustment_kcal: null,
    affected_agents: [],
    old_values: {},
    new_values: newValues,
    reason: "",
  };
}

const baseProgram = {
  current_weight_kg: 57,
  target_intake_kcal: 2400,
  surplus_kcal: 500,
  current_phase: "phase_0",
};

const profile = { height_cm: 174, age: 28 };

describe("executeAdjustments", () => {
  it("returns no updates for no triggers", () => {
    expect(executeAdjustments(baseProgram, [])).toEqual({});
  });

  it("returns no updates for advisory triggers", () => {
    const updates = executeAdjustments(baseProgram, [
      trigger("waist_hip_flag", {}),
      trigger("training_stall", {}),
      trigger("compliance", {}),
    ]);
    expect(updates).toEqual({});
  });

  it("applies a calorie increase and recalculates macros", () => {
    const updates = executeAdjustments(baseProgram, [
      trigger("insufficient_gain", { calorie_increase_kcal: 200 }),
    ]);
    expect(updates.target_intake_kcal).toBe(2600);
    expect(updates.surplus_kcal).toBe(700);
    expect(updates.protein_g).toBe(103);
    expect(updates.fat_g).toBe(72);
    expect(updates.carbs_g).toBe(385);
  });

  it("applies a calorie decrease and recalculates macros", () => {
    const updates = executeAdjustments(baseProgram, [
      trigger("excessive_gain", { calorie_decrease_kcal: 150 }),
    ]);
    expect(updates.target_intake_kcal).toBe(2250);
    expect(updates.surplus_kcal).toBe(350);
    expect(updates.protein_g).toBe(103);
    expect(updates.fat_g).toBe(63);
    expect(updates.carbs_g).toBe(318);
  });

  it("recalculates TDEE at the new weight on a milestone when a profile is available", () => {
    const program = { ...baseProgram, current_weight_kg: 60 };
    const updates = executeAdjustments(program, [trigger("weight_milestone", { milestone_kg: 5 })], profile);
    expect(updates.last_recalc_weight_kg).toBe(60);
    expect(updates.target_intake_kcal).toBe(2303);
    expect(updates.surplus_kcal).toBe(500);
    expect(updates.protein_g).toBe(108);
  });

  it("uses the active training factor for milestone recalc after phase 0", () => {
    const program = { ...baseProgram, current_weight_kg: 60, current_phase: "phase_1" };
    const updates = executeAdjustments(program, [trigger("weight_milestone", { milestone_kg: 5 })], profile);
    expect(updates.target_intake_kcal).toBe(2650);
  });

  it("recalculates macros only on a milestone without a profile", () => {
    const program = { ...baseProgram, current_weight_kg: 60 };
    const updates = executeAdjustments(program, [trigger("weight_milestone", { milestone_kg: 5 })]);
    expect(updates.last_recalc_weight_kg).toBe(60);
    expect(updates.target_intake_kcal).toBeUndefined();
    expect(updates.protein_g).toBe(108);
  });

  it("stamps the protein recalc date and recalculates protein at current weight", () => {
    const now = new Date("2026-07-23T10:00:00Z");
    const program = { ...baseProgram, current_weight_kg: 59 };
    const updates = executeAdjustments(program, [trigger("protein_recalc", { days_since_recalc: 31 })], undefined, now);
    expect(updates.last_protein_recalc_at).toEqual(now);
    expect(updates.protein_g).toBe(106);
    expect(updates.target_intake_kcal).toBeUndefined();
  });

  it("persists tier progression", () => {
    const updates = executeAdjustments(baseProgram, [trigger("tier_progression", { new_tier: "tier_1" })]);
    expect(updates).toEqual({ current_tier: "tier_1" });
  });

  it("persists phase transition", () => {
    const updates = executeAdjustments(baseProgram, [trigger("phase_transition", { new_phase: "phase_1" })]);
    expect(updates).toEqual({ current_phase: "phase_1" });
  });

  it("compounds a calorie increase with a milestone recalc in priority order", () => {
    const program = { ...baseProgram, current_weight_kg: 60 };
    const updates = executeAdjustments(
      program,
      [
        trigger("insufficient_gain", { calorie_increase_kcal: 200 }),
        trigger("weight_milestone", { milestone_kg: 5 }),
      ],
      profile
    );
    expect(updates.surplus_kcal).toBe(700);
    expect(updates.target_intake_kcal).toBe(2503);
    expect(updates.last_recalc_weight_kg).toBe(60);
  });
});
