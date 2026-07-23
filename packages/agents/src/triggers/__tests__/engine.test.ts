import { describe, it, expect } from "vitest";
import { evaluateAllTriggers } from "../engine.js";

const baseProgram = {
  current_week: 8,
  current_weight_kg: 57,
  target_weight_kg: 65,
  last_recalc_weight_kg: null,
  last_protein_recalc_at: null,
  started_at: new Date("2025-12-01"),
};

describe("evaluateAllTriggers", () => {
  it("returns empty during adaptation period", () => {
    const program = { ...baseProgram, current_week: 2 };
    const progress = [
      { weight_kg: 55.1, week_number: 2, waist_cm: null, hip_cm: null, minimum_viable_days_count: null },
      { weight_kg: 55.0, week_number: 1, waist_cm: null, hip_cm: null, minimum_viable_days_count: null },
    ];
    const result = evaluateAllTriggers(program, progress, []);
    expect(result).toHaveLength(0);
  });

  it("prioritizes waist-hip flag over calorie adjustments", () => {
    const progress = [
      { weight_kg: 55.1, week_number: 8, waist_cm: 73, hip_cm: 90, minimum_viable_days_count: null },
      { weight_kg: 55.05, week_number: 7, waist_cm: 72, hip_cm: 90, minimum_viable_days_count: null },
      { weight_kg: 55.0, week_number: 6, waist_cm: 71, hip_cm: 90, minimum_viable_days_count: null },
      { weight_kg: 54.98, week_number: 5, waist_cm: 70, hip_cm: 90, minimum_viable_days_count: null },
    ];
    const result = evaluateAllTriggers(baseProgram, progress, []);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].trigger_type).toBe("waist_hip_flag");
  });

  it("deduplicates conflicting gain triggers", () => {
    const progress = [
      { weight_kg: 55.2, week_number: 8, waist_cm: null, hip_cm: null, minimum_viable_days_count: null },
      { weight_kg: 55.1, week_number: 7, waist_cm: null, hip_cm: null, minimum_viable_days_count: null },
      { weight_kg: 55.0, week_number: 6, waist_cm: null, hip_cm: null, minimum_viable_days_count: null },
    ];
    const result = evaluateAllTriggers(baseProgram, progress, []);
    const gainTypes = result.filter(
      (r) => r.trigger_type === "insufficient_gain" || r.trigger_type === "excessive_gain"
    );
    expect(gainTypes.length).toBeLessThanOrEqual(1);
  });

  it("handles missing data gracefully", () => {
    const result = evaluateAllTriggers(baseProgram, [], []);
    expect(result).toHaveLength(0);
  });

  it("fires multiple non-conflicting triggers", () => {
    const program = {
      ...baseProgram,
      last_protein_recalc_at: new Date("2025-12-01"),
    };
    const progress = [
      { weight_kg: 55.1, week_number: 8, waist_cm: null, hip_cm: null, minimum_viable_days_count: 1 },
      { weight_kg: 55.05, week_number: 7, waist_cm: null, hip_cm: null, minimum_viable_days_count: 1 },
      { weight_kg: 55.0, week_number: 6, waist_cm: null, hip_cm: null, minimum_viable_days_count: 1 },
    ];
    const result = evaluateAllTriggers(program, progress, []);
    const types = result.map((r) => r.trigger_type);
    expect(types).toContain("insufficient_gain");
    expect(types).toContain("compliance");
    expect(types).toContain("protein_recalc");
  });

  it("fires weight milestone when 5 kg gained since last recalc", () => {
    const program = {
      ...baseProgram,
      current_weight_kg: 60.5,
      last_recalc_weight_kg: 55,
    };
    const result = evaluateAllTriggers(program, [], []);
    const milestone = result.find((r) => r.trigger_type === "weight_milestone");
    expect(milestone).toBeDefined();
    expect(milestone!.new_values).toEqual({ milestone_kg: 5 });
  });

  it("fires tier progression when current_tier is provided and compliance is sustained", () => {
    const program = {
      ...baseProgram,
      current_weight_kg: 57.0,
      last_recalc_weight_kg: 57.0,
      last_protein_recalc_at: new Date(),
      current_tier: "tier_0",
      current_phase: "phase_0",
    };
    const progress = [
      { weight_kg: 57.0, week_number: 8, waist_cm: null, hip_cm: null, minimum_viable_days_count: 6 },
      { weight_kg: 56.6, week_number: 7, waist_cm: null, hip_cm: null, minimum_viable_days_count: 5 },
      { weight_kg: 56.2, week_number: 6, waist_cm: null, hip_cm: null, minimum_viable_days_count: 5 },
    ];
    const result = evaluateAllTriggers(program, progress, []);
    const tier = result.find((r) => r.trigger_type === "tier_progression");
    expect(tier).toBeDefined();
    expect(tier!.new_values).toEqual({ new_tier: "tier_1" });
  });

  it("fires phase transition when current_phase is provided and lifts progress", () => {
    const program = {
      ...baseProgram,
      current_weight_kg: 57.0,
      last_recalc_weight_kg: 57.0,
      last_protein_recalc_at: new Date(),
      current_tier: "tier_0",
      current_phase: "phase_0",
    };
    const sessions = [1, 2, 3, 4].map((week) => ({
      week_number: week,
      status: "completed",
      exercises: [
        { name: "Goblet Squat", actual: [{ weight_kg: 4 + week, reps: 12 }] },
        { name: "Dumbbell Row", actual: [{ weight_kg: 2 + week, reps: 10 }] },
        { name: "Split Squat", actual: [{ weight_kg: week, reps: 10 }] },
      ],
    }));
    const result = evaluateAllTriggers(program, [], sessions);
    const phase = result.find((r) => r.trigger_type === "phase_transition");
    expect(phase).toBeDefined();
    expect(phase!.new_values).toEqual({ new_phase: "phase_1" });
  });
});
