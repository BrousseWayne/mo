interface Adjustment {
  trigger_type: string;
  affected_agents: string[];
}

const HOOK_TEMPLATES: Record<string, (adj: Adjustment) => string> = {
  insufficient_gain: () => "SCIENTIST adjusted your calorie targets upward — check your updated plan.",
  excessive_gain: () => "SCIENTIST fine-tuned your surplus — your plan has been updated.",
  waist_hip_flag: () => "SCIENTIST flagged a body composition change — review the updated analysis.",
  training_stall: () => "COACH updated your training program to break through the plateau.",
  weight_milestone: () => "You hit a weight milestone! Check your progress dashboard.",
  protein_recalc: () => "NUTRITIONIST recalculated your protein targets based on your current weight.",
  compliance_low: () => "DIETITIAN simplified your meal plan to improve adherence.",
};

export function generateCuriosityHook(adjustment: Adjustment): string {
  const template = HOOK_TEMPLATES[adjustment.trigger_type];
  if (template) return template(adjustment);
  return `Your plan was updated based on ${adjustment.trigger_type}. Check the latest changes.`;
}

export function generatePipelineHook(agentsRun: string[]): string[] {
  const hooks: string[] = [];
  if (agentsRun.includes("CHEF")) hooks.push("CHEF prepared new recipes for this week.");
  if (agentsRun.includes("COACH")) hooks.push("COACH updated your training schedule.");
  if (agentsRun.includes("DIETITIAN")) hooks.push("DIETITIAN refreshed your meal template.");
  return hooks;
}
