interface Adjustment {
  trigger_type: string;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  reason: string;
  affected_agents: string[];
}

interface Program {
  current_weight_kg: number;
  target_weight_kg: number;
}

const AGENT_VOICE: Record<string, { name: string; perspective: string }> = {
  SCIENTIST: { name: "SCIENTIST", perspective: "Looking at the numbers" },
  NUTRITIONIST: { name: "NUTRITIONIST", perspective: "From a nutrition strategy standpoint" },
  DIETITIAN: { name: "DIETITIAN", perspective: "For your meal plan" },
  CHEF: { name: "CHEF", perspective: "In the kitchen" },
  COACH: { name: "COACH", perspective: "For your training" },
  PHYSICIAN: { name: "PHYSICIAN", perspective: "From a health perspective" },
};

const TRIGGER_CONTEXT: Record<string, string> = {
  insufficient_gain: "Your weight gain has been below the target range",
  excessive_gain: "Your weight gain has been above the target range",
  waist_hip_flag: "Your waist-to-hip measurements have changed",
  training_stall: "Your lifts haven't progressed recently",
  weight_milestone: "You've reached a weight milestone",
  protein_recalc: "Time to recalculate your protein needs based on your new weight",
  compliance_low: "Your meal compliance has been lower than ideal",
  tier_progression: "Your consistency qualifies you for the next calorie tier",
  phase_transition: "Your training progress qualifies you for the next phase",
};

export function generateAdjustmentNarrative(adjustment: Adjustment, program: Program): string {
  const context = TRIGGER_CONTEXT[adjustment.trigger_type] ?? adjustment.reason;
  const remaining = program.target_weight_kg - program.current_weight_kg;
  const parts: string[] = [`${context}.`];

  const oldKcal = adjustment.old_values?.target_intake_kcal;
  const newKcal = adjustment.new_values?.target_intake_kcal;
  if (typeof oldKcal === "number" && typeof newKcal === "number") {
    const diff = newKcal - oldKcal;
    if (diff > 0) {
      parts.push(`Daily calories increased by ${diff} kcal to ${newKcal} kcal.`);
    } else {
      parts.push(`Daily calories adjusted down by ${Math.abs(diff)} kcal to ${newKcal} kcal.`);
    }
  }

  const oldProtein = adjustment.old_values?.protein_g;
  const newProtein = adjustment.new_values?.protein_g;
  if (typeof oldProtein === "number" && typeof newProtein === "number" && oldProtein !== newProtein) {
    parts.push(`Protein target updated: ${oldProtein}g → ${newProtein}g.`);
  }

  for (const agent of adjustment.affected_agents) {
    const voice = AGENT_VOICE[agent];
    if (voice) {
      parts.push(`${voice.perspective}, your plan has been updated.`);
    }
  }

  if (remaining > 0) {
    parts.push(`${remaining.toFixed(1)}kg remaining to your goal.`);
  }

  return parts.join(" ");
}
