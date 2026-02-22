interface ScientistPayload {
  target_intake_kcal: number;
  macros: { protein_g: number; fat_g: number; carbs_g: number };
  surplus_kcal: number;
  weekly_weight_target_kg: number;
  projected_timeline_months: number;
  training_phase: string;
  ramp_up?: { week: number; target_kcal: number }[];
}

interface CoachSession {
  day: string;
  focus: string;
  exercises: { name: string; sets: number; reps: string }[];
}

interface CoachPayload {
  program: {
    phase: string;
    frequency: string;
    sessions: CoachSession[];
  };
  recovery_protocol: string[];
}

interface NutritionistPayload {
  target_intake_kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  supplement_protocol: { supplement: string; dose: string; timing: string }[];
  hydration_target_L: number;
}

interface DietitianPayload {
  weekly_template: Record<string, Record<string, { slot_spec: { calories: number; protein_g: number }; primary_option: string | null }>>;
  emergency_protocol: { name: string; total_calories: number };
}

interface ChefPayload {
  recipes: { recipe_name: string; cuisine: string; macros_per_serving: { calories: number; protein_g: number }; time: { prep_min: number; cook_min: number } }[];
}

interface PhysicianPayload {
  response: string;
  referral_needed: boolean;
  referral_target: string | null;
  urgency: string;
}

export function formatScientistOutput(payload: ScientistPayload): string {
  const lines: string[] = [
    `Your new daily targets: ${payload.target_intake_kcal} kcal/day (+${payload.surplus_kcal} kcal surplus).`,
    `Macros: ${payload.macros.protein_g}g protein, ${payload.macros.fat_g}g fat, ${payload.macros.carbs_g}g carbs.`,
    `Expected weekly gain: ${payload.weekly_weight_target_kg}kg/week.`,
    `Estimated timeline: ~${payload.projected_timeline_months} months to reach your goal.`,
    `Training phase: ${payload.training_phase.replace(/_/g, " ")}.`,
  ];

  if (payload.ramp_up && payload.ramp_up.length > 0) {
    lines.push(`Ramp-up plan: ${payload.ramp_up.length} weeks of gradual calorie increases.`);
  }

  return lines.join("\n");
}

export function formatNutritionistOutput(payload: NutritionistPayload): string {
  const lines: string[] = [
    `Daily nutrition plan: ${payload.target_intake_kcal} kcal.`,
    `Macros: ${payload.protein_g}g protein, ${payload.fat_g}g fat, ${payload.carbs_g}g carbs.`,
    `Hydration target: ${payload.hydration_target_L}L/day.`,
  ];

  if (payload.supplement_protocol.length > 0) {
    const supps = payload.supplement_protocol.map(s => `${s.supplement} (${s.dose}, ${s.timing})`);
    lines.push(`Supplements: ${supps.join(", ")}.`);
  }

  return lines.join("\n");
}

export function formatDietitianOutput(payload: DietitianPayload): string {
  const days = Object.keys(payload.weekly_template);
  const lines: string[] = [
    `Weekly meal template: ${days.length} days planned.`,
  ];

  const firstDay = days[0];
  if (firstDay) {
    const slots = Object.entries(payload.weekly_template[firstDay]);
    const slotNames = slots.map(([name, slot]) => {
      const option = slot.primary_option ?? "TBD";
      return `${name}: ${option} (${slot.slot_spec.calories} kcal)`;
    });
    lines.push(`${firstDay}: ${slotNames.join(", ")}.`);
    if (days.length > 1) {
      lines.push(`...and ${days.length - 1} more days with rotation.`);
    }
  }

  if (payload.emergency_protocol) {
    lines.push(`Emergency protocol available: ${payload.emergency_protocol.name} (${payload.emergency_protocol.total_calories} kcal).`);
  }

  return lines.join("\n");
}

export function formatChefOutput(payload: ChefPayload): string {
  const lines: string[] = [
    `${payload.recipes.length} recipes prepared for your meal plan:`,
  ];

  for (const r of payload.recipes.slice(0, 5)) {
    const totalTime = r.time.prep_min + r.time.cook_min;
    lines.push(`- ${r.recipe_name} (${r.cuisine}) — ${r.macros_per_serving.calories} kcal, ${r.macros_per_serving.protein_g}g protein, ${totalTime}min total`);
  }

  if (payload.recipes.length > 5) {
    lines.push(`...and ${payload.recipes.length - 5} more recipes.`);
  }

  return lines.join("\n");
}

export function formatCoachOutput(payload: CoachPayload): string {
  const lines: string[] = [
    `Training program: ${payload.program.phase.replace(/_/g, " ")} — ${payload.program.frequency}.`,
  ];

  for (const session of payload.program.sessions) {
    const exerciseList = session.exercises.map(e => `${e.name} (${e.sets}×${e.reps})`).join(", ");
    lines.push(`${session.day} (${session.focus}): ${exerciseList}.`);
  }

  if (payload.recovery_protocol.length > 0) {
    lines.push(`Recovery: ${payload.recovery_protocol.join("; ")}.`);
  }

  return lines.join("\n");
}

export function formatPhysicianOutput(payload: PhysicianPayload): string {
  const lines: string[] = [payload.response];

  if (payload.referral_needed && payload.referral_target) {
    lines.push(`Referral recommended: ${payload.referral_target} (${payload.urgency}).`);
  }

  return lines.join("\n");
}

const FORMATTERS: Record<string, (payload: Record<string, unknown>) => string> = {
  SCIENTIST: (p) => formatScientistOutput(p as unknown as ScientistPayload),
  NUTRITIONIST: (p) => formatNutritionistOutput(p as unknown as NutritionistPayload),
  DIETITIAN: (p) => formatDietitianOutput(p as unknown as DietitianPayload),
  CHEF: (p) => formatChefOutput(p as unknown as ChefPayload),
  COACH: (p) => formatCoachOutput(p as unknown as CoachPayload),
  PHYSICIAN: (p) => formatPhysicianOutput(p as unknown as PhysicianPayload),
};

export function formatAgentOutput(agentName: string, payload: Record<string, unknown>): string {
  const formatter = FORMATTERS[agentName];
  if (!formatter) return JSON.stringify(payload);
  return formatter(payload);
}
