import { describe, it, expect } from "vitest";
import { intakeSchema } from "@mo/shared";
import { buildScientistPayload } from "../scientist-payload.js";

const referenceIntake = intakeSchema.parse({
  age: 28,
  height_cm: 174,
  current_weight_kg: 55,
  target_weight_kg: 65,
  training_status: "beginner",
  estimated_daily_calories: 1800,
  daily_step_count: "lightly_active",
  appetite_level: "low",
  cooking_skill: "basic",
  partner_cooks: true,
});

describe("buildScientistPayload", () => {
  const payload = buildScientistPayload(referenceIntake);

  it("computes BMR and TDEE for the reference client", () => {
    expect(payload.bmr_kcal).toBe(1337);
    expect(payload.tdee_kcal).toBe(1838);
  });

  it("derives intake target and macros deterministically", () => {
    expect(payload.surplus_kcal).toBe(500);
    expect(payload.target_intake_kcal).toBe(2338);
    expect(payload.macros.protein_g).toBe(99);
    expect(payload.macros.protein_g_per_kg).toBe(1.8);
    expect(payload.macros.fat_g).toBe(65);
    expect(payload.macros.carbs_g).toBe(339);
  });

  it("projects timeline and hydration", () => {
    expect(payload.weekly_weight_target_kg).toBe(0.35);
    expect(payload.projected_timeline_months).toBeCloseTo(6.7, 1);
    expect(payload.hydration_L).toBe(2.2);
  });

  it("ramps up from the estimated baseline", () => {
    expect(payload.ramp_up).toHaveLength(3);
    expect(payload.ramp_up[0].target_kcal).toBe(2100);
    expect(payload.ramp_up[2].target_kcal).toBe(2338);
  });

  it("starts at phase 0 with client constraints carried over", () => {
    expect(payload.training_phase).toBe("phase_0");
    expect(payload.weeks_on_program).toBe(0);
    expect(payload.client_constraints.food_aversions).toContain("peanut_butter");
    expect(payload.client_constraints.partner_cooks).toBe(true);
    expect(payload.red_flags).toHaveLength(0);
  });

  it("flags amenorrhea as a red flag", () => {
    const flagged = buildScientistPayload({
      ...referenceIntake,
      menstrual_cycle_length: "amenorrhea",
    });
    expect(flagged.red_flags).toHaveLength(1);
    expect(flagged.red_flags[0].toLowerCase()).toContain("amenorrhea");
  });

  it("falls back to TDEE as ramp-up baseline without estimated calories", () => {
    const { estimated_daily_calories, ...rest } = referenceIntake;
    const payload2 = buildScientistPayload(intakeSchema.parse(rest));
    expect(payload2.ramp_up[0].target_kcal).toBe(payload2.tdee_kcal + 300);
  });
});
