import type { ScientistOutput, NutritionistOutput, DietitianOutput, ChefOutput, CoachOutput } from "@mo/shared";

export interface ValidationResult {
  valid: boolean;
  agent_pair: string;
  errors: string[];
  warnings: string[];
}

export function validateNutritionistVsScientist(
  nutritionist: NutritionistOutput,
  scientist: ScientistOutput
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (Math.abs(nutritionist.target_intake_kcal - scientist.target_intake_kcal) > 10) {
    errors.push(
      `Calorie mismatch: NUTRITIONIST=${nutritionist.target_intake_kcal} vs SCIENTIST=${scientist.target_intake_kcal}`
    );
  }

  if (Math.abs(nutritionist.protein_g - scientist.macros.protein_g) > 5) {
    errors.push(
      `Protein mismatch: NUTRITIONIST=${nutritionist.protein_g}g vs SCIENTIST=${scientist.macros.protein_g}g`
    );
  }

  if (Math.abs(nutritionist.fat_g - scientist.macros.fat_g) > 5) {
    warnings.push(
      `Fat deviation: NUTRITIONIST=${nutritionist.fat_g}g vs SCIENTIST=${scientist.macros.fat_g}g`
    );
  }

  if (Math.abs(nutritionist.carbs_g - scientist.macros.carbs_g) > 10) {
    warnings.push(
      `Carb deviation: NUTRITIONIST=${nutritionist.carbs_g}g vs SCIENTIST=${scientist.macros.carbs_g}g`
    );
  }

  return {
    valid: errors.length === 0,
    agent_pair: "NUTRITIONIST_VS_SCIENTIST",
    errors,
    warnings,
  };
}

export function validateDietitianVsNutritionist(
  dietitian: DietitianOutput,
  nutritionist: NutritionistOutput
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const dailyTarget = nutritionist.target_intake_kcal;
  const weeklyTarget = dailyTarget * 7;

  let weeklyTotal = 0;
  for (const [, day] of Object.entries(dietitian.weekly_template)) {
    for (const slot of [day.breakfast, day.lunch, day.snack, day.dinner, day.presleep]) {
      weeklyTotal += slot.slot_spec.calories;
    }
  }

  const deviation = Math.abs(weeklyTotal - weeklyTarget) / weeklyTarget;
  if (deviation > 0.05) {
    errors.push(
      `Weekly total deviation: ${Math.round(weeklyTotal)} kcal vs target ${weeklyTarget} kcal (${(deviation * 100).toFixed(1)}%)`
    );
  }

  return {
    valid: errors.length === 0,
    agent_pair: "DIETITIAN_VS_NUTRITIONIST",
    errors,
    warnings,
  };
}

export function validateChefVsDietitian(
  chef: ChefOutput,
  dietitian: DietitianOutput
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const recipe of chef.recipes) {
    if (!recipe.ingredients?.length) {
      errors.push(`Recipe "${recipe.recipe_name}" has no ingredients`);
    }
    if (recipe.macros_per_serving.calories <= 0) {
      errors.push(`Recipe "${recipe.recipe_name}" has zero/negative calories`);
    }
  }

  return {
    valid: errors.length === 0,
    agent_pair: "CHEF_VS_DIETITIAN",
    errors,
    warnings,
  };
}

export function validateCoachVsScientist(
  coach: CoachOutput,
  scientist: ScientistOutput
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const phase = scientist.training_phase;
  const sessions = coach.program.sessions;

  if (phase === "phase_0" && sessions.length > 3) {
    warnings.push(
      `Phase 0 should have ≤3 sessions/week, got ${sessions.length}`
    );
  }

  for (const session of sessions) {
    if (!session.exercises?.length) {
      errors.push(`Session ${session.day} has no exercises`);
    }
  }

  return {
    valid: errors.length === 0,
    agent_pair: "COACH_VS_SCIENTIST",
    errors,
    warnings,
  };
}
