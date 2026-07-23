import {
  scientistOutputSchema,
  SURPLUS_RANGE,
  HYDRATION_RANGE,
  type IntakeData,
  type ScientistOutput,
} from "@mo/shared";
import {
  calculateBMR,
  calculateTDEE,
  calculateMacros,
  calculateRampUp,
  calculateWeightProjection,
} from "../tools/scientist.js";

export function buildScientistPayload(intake: IntakeData): ScientistOutput {
  const bmr = calculateBMR({
    weight_kg: intake.current_weight_kg,
    height_cm: intake.height_cm,
    age: intake.age,
  });
  const tdee = calculateTDEE({
    bmr_kcal: bmr.bmr_kcal,
    activity_level: intake.daily_step_count ?? "lightly_active",
  });
  const surplus_kcal = SURPLUS_RANGE.max;
  const target_intake_kcal = tdee.tdee_kcal + surplus_kcal;
  const macros = calculateMacros({
    target_intake_kcal,
    weight_kg: intake.current_weight_kg,
  });
  const projection = calculateWeightProjection({
    current_weight_kg: intake.current_weight_kg,
    target_weight_kg: intake.target_weight_kg,
  });
  const hydration_L = Math.min(
    HYDRATION_RANGE.max,
    Math.max(HYDRATION_RANGE.min, Math.round(intake.current_weight_kg * 0.04 * 10) / 10)
  );

  const red_flags: string[] = [];
  if (intake.menstrual_cycle_length === "amenorrhea") {
    red_flags.push("Amenorrhea reported — medical referral required before program start");
  }

  const notes: string[] = [
    "Deterministic calculation from intake (no LLM); targets derived with Mifflin-St Jeor + activity factor",
  ];
  if (intake.appetite_level === "low") {
    notes.push("Low appetite — prioritize calorie-dense foods and liquid calories");
  }

  return scientistOutputSchema.parse({
    bmr_kcal: bmr.bmr_kcal,
    tdee_kcal: tdee.tdee_kcal,
    target_intake_kcal,
    surplus_kcal,
    macros,
    hydration_L,
    weekly_weight_target_kg: projection.weekly_weight_target_kg,
    projected_timeline_months: projection.projected_timeline_months,
    ramp_up: calculateRampUp({
      baseline_kcal: intake.estimated_daily_calories ?? tdee.tdee_kcal,
      target_intake_kcal,
    }),
    adaptation_period_complete: false,
    adjustment_triggered: false,
    adjustment_type: null,
    adjustment_amount_kcal: null,
    training_phase: "phase_0",
    weeks_on_program: 0,
    client_constraints: {
      food_aversions: intake.food_aversions,
      ...(intake.appetite_level ? { appetite_level: intake.appetite_level } : {}),
      ...(intake.cooking_skill ? { cooking_skill: intake.cooking_skill } : {}),
      ...(intake.partner_cooks !== undefined ? { partner_cooks: intake.partner_cooks } : {}),
    },
    red_flags,
    notes,
  });
}
