const TECHNIQUES: Record<string, { description: string; best_for: string[]; temperature?: string; time?: string }> = {
  rotir: { description: "Oven roasting at high heat with fat basting", best_for: ["chicken", "vegetables", "potatoes"], temperature: "200-220C", time: "30-60 min" },
  sauter: { description: "High-heat pan frying with minimal fat, constant movement", best_for: ["chicken breast", "shrimp", "stir-fry vegetables"], temperature: "medium-high", time: "5-10 min" },
  braiser: { description: "Sear then slow-cook in liquid, covered", best_for: ["chicken thighs", "beef", "root vegetables"], temperature: "160-180C", time: "1.5-3 hours" },
  poeler: { description: "Pan-roast in covered pot with butter and aromatics", best_for: ["chicken", "pork", "whole vegetables"], temperature: "180C", time: "45-90 min" },
  griller: { description: "Direct high heat, open flame or grill pan", best_for: ["salmon", "chicken breast", "vegetables"], temperature: "high direct", time: "8-15 min" },
  pocher: { description: "Gentle simmering in liquid below boiling point", best_for: ["eggs", "salmon", "chicken breast"], temperature: "70-85C", time: "10-20 min" },
  vapeur: { description: "Steam cooking over boiling water", best_for: ["fish", "vegetables", "dumplings"], temperature: "100C steam", time: "10-20 min" },
  frire: { description: "Deep frying in oil", best_for: ["tempura", "falafel"], temperature: "170-190C", time: "3-8 min" },
  glacer: { description: "Cook in liquid that reduces to a shiny coating", best_for: ["carrots", "turnips", "pearl onions"], temperature: "medium", time: "15-25 min" },
  etuver: { description: "Sweat gently in own juices with minimal fat, covered", best_for: ["spinach", "mushrooms", "onions"], temperature: "low-medium", time: "5-15 min" },
};

export function lookupTechnique(name: string): typeof TECHNIQUES[string] | null {
  const normalized = name.toLowerCase().trim();
  return TECHNIQUES[normalized] ?? null;
}

export function listTechniques(): { name: string; description: string }[] {
  return Object.entries(TECHNIQUES).map(([name, t]) => ({ name, description: t.description }));
}
