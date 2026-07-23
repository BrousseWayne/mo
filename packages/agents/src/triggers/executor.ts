import type { TriggerResult } from "@mo/shared";
import { calculateBMR, calculateTDEE, calculateMacros } from "../tools/scientist.js";

export interface ExecutorProgramState {
  current_weight_kg: number;
  target_intake_kcal: number;
  surplus_kcal: number;
  current_phase: string;
}

export interface ClientProfile {
  height_cm: number;
  age: number;
}

export interface ProgramAdjustmentUpdates {
  target_intake_kcal?: number;
  protein_g?: number;
  fat_g?: number;
  carbs_g?: number;
  surplus_kcal?: number;
  current_tier?: "tier_0" | "tier_1" | "tier_2";
  current_phase?: "phase_0" | "phase_1" | "phase_2";
  last_recalc_weight_kg?: number;
  last_protein_recalc_at?: Date;
}

function activityLevelForPhase(phase: string): string {
  return phase === "phase_0" ? "pre_training" : "active_training";
}

export function executeAdjustments(
  program: ExecutorProgramState,
  triggers: TriggerResult[],
  profile?: ClientProfile,
  now: Date = new Date()
): ProgramAdjustmentUpdates {
  const updates: ProgramAdjustmentUpdates = {};
  let kcal = program.target_intake_kcal;
  let surplus = program.surplus_kcal;
  let kcalChanged = false;
  let recalcMacros = false;

  for (const trigger of triggers) {
    switch (trigger.trigger_type) {
      case "insufficient_gain": {
        const delta = Number(trigger.new_values.calorie_increase_kcal ?? 0);
        kcal += delta;
        surplus += delta;
        kcalChanged = true;
        recalcMacros = true;
        break;
      }
      case "excessive_gain": {
        const delta = Number(trigger.new_values.calorie_decrease_kcal ?? 0);
        kcal -= delta;
        surplus -= delta;
        kcalChanged = true;
        recalcMacros = true;
        break;
      }
      case "weight_milestone": {
        updates.last_recalc_weight_kg = program.current_weight_kg;
        if (profile) {
          const bmr = calculateBMR({
            weight_kg: program.current_weight_kg,
            height_cm: profile.height_cm,
            age: profile.age,
          });
          const tdee = calculateTDEE({
            bmr_kcal: bmr.bmr_kcal,
            activity_level: activityLevelForPhase(program.current_phase),
          });
          kcal = tdee.tdee_kcal + surplus;
          kcalChanged = true;
        }
        recalcMacros = true;
        break;
      }
      case "protein_recalc": {
        updates.last_protein_recalc_at = now;
        recalcMacros = true;
        break;
      }
      case "tier_progression": {
        const tier = trigger.new_values.new_tier;
        if (tier === "tier_1" || tier === "tier_2") {
          updates.current_tier = tier;
        }
        break;
      }
      case "phase_transition": {
        const phase = trigger.new_values.new_phase;
        if (phase === "phase_1" || phase === "phase_2") {
          updates.current_phase = phase;
        }
        break;
      }
    }
  }

  if (kcalChanged) {
    updates.target_intake_kcal = kcal;
    updates.surplus_kcal = surplus;
  }
  if (recalcMacros) {
    const macros = calculateMacros({
      target_intake_kcal: kcal,
      weight_kg: program.current_weight_kg,
    });
    updates.protein_g = macros.protein_g;
    updates.fat_g = macros.fat_g;
    updates.carbs_g = macros.carbs_g;
  }

  return updates;
}
