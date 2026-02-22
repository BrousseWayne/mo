interface Adjustment {
  trigger_type: string;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  reason: string;
  affected_agents: string[];
  created_at: Date | string;
}

interface Program {
  current_weight_kg: number;
  target_weight_kg: number;
  current_phase?: string | null;
  current_tier?: string | null;
}

const TRIGGER_LABELS: Record<string, string> = {
  insufficient_gain: "Insufficient weight gain detected",
  excessive_gain: "Excessive weight gain detected",
  waist_hip_flag: "Waist-to-hip ratio change flagged",
  training_stall: "Training progression stall detected",
  weight_milestone: "Weight milestone reached",
  protein_recalc: "Protein intake recalculation due",
  compliance_low: "Low meal compliance detected",
  tier_progression: "Tier progression recommended",
  phase_transition: "Phase transition triggered",
};

export function generateExplanation(adjustment: Adjustment, program: Program): string {
  const label = TRIGGER_LABELS[adjustment.trigger_type] ?? adjustment.trigger_type;
  const parts: string[] = [label + "."];

  if (adjustment.reason) {
    parts.push(adjustment.reason);
  }

  const oldKcal = adjustment.old_values?.target_intake_kcal;
  const newKcal = adjustment.new_values?.target_intake_kcal;
  if (typeof oldKcal === "number" && typeof newKcal === "number") {
    const diff = newKcal - oldKcal;
    const direction = diff > 0 ? "increased" : "decreased";
    parts.push(`Daily calorie target ${direction} by ${Math.abs(diff)} kcal (${oldKcal} → ${newKcal}).`);
  }

  const oldProtein = adjustment.old_values?.protein_g;
  const newProtein = adjustment.new_values?.protein_g;
  if (typeof oldProtein === "number" && typeof newProtein === "number" && oldProtein !== newProtein) {
    parts.push(`Protein target adjusted from ${oldProtein}g to ${newProtein}g.`);
  }

  if (adjustment.affected_agents.length > 0) {
    const agents = adjustment.affected_agents.join(", ");
    parts.push(`Updated agents: ${agents}.`);
  }

  return parts.join(" ");
}
