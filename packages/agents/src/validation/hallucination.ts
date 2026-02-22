interface ToolCallResult {
  tool_name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
}

interface ScientistOutput {
  bmr_kcal?: number;
  tdee_kcal?: number;
  surplus_kcal?: number;
  target_intake_kcal?: number;
  macros?: { protein_g?: number; fat_g?: number; carbs_g?: number };
}

interface ChefRecipe {
  recipe_name: string;
  macros_per_serving?: { protein_g?: number; fat_g?: number; carbs_g?: number; calories?: number };
}

export interface HallucinationFlag {
  agent: string;
  field: string;
  claimed_value: unknown;
  tool_value: unknown;
  severity: "warning" | "error";
}

export function detectScientistHallucinations(
  output: ScientistOutput,
  toolResults: ToolCallResult[]
): HallucinationFlag[] {
  const flags: HallucinationFlag[] = [];

  const bmrResult = toolResults.find((t) => t.tool_name === "calculate_bmr");
  if (bmrResult && output.bmr_kcal) {
    const toolBmr = (bmrResult.output as { bmr_kcal?: number }).bmr_kcal;
    if (toolBmr && Math.abs(output.bmr_kcal - toolBmr) > 10) {
      flags.push({
        agent: "SCIENTIST",
        field: "bmr_kcal",
        claimed_value: output.bmr_kcal,
        tool_value: toolBmr,
        severity: "error",
      });
    }
  }

  const tdeeResult = toolResults.find((t) => t.tool_name === "calculate_tdee");
  if (tdeeResult && output.tdee_kcal) {
    const toolTdee = (tdeeResult.output as { tdee_kcal?: number }).tdee_kcal;
    if (toolTdee && Math.abs(output.tdee_kcal - toolTdee) > 20) {
      flags.push({
        agent: "SCIENTIST",
        field: "tdee_kcal",
        claimed_value: output.tdee_kcal,
        tool_value: toolTdee,
        severity: "error",
      });
    }
  }

  return flags;
}

export function detectChefHallucinations(
  recipes: ChefRecipe[],
  usdaVerifications: { recipe_name: string; computed_calories: number }[]
): HallucinationFlag[] {
  const flags: HallucinationFlag[] = [];
  const verificationMap = new Map(usdaVerifications.map((v) => [v.recipe_name, v.computed_calories]));

  for (const recipe of recipes) {
    const computed = verificationMap.get(recipe.recipe_name);
    if (computed && recipe.macros_per_serving?.calories) {
      const deviation = Math.abs(recipe.macros_per_serving.calories - computed) / computed;
      if (deviation > 0.15) {
        flags.push({
          agent: "CHEF",
          field: `${recipe.recipe_name}.calories`,
          claimed_value: recipe.macros_per_serving.calories,
          tool_value: computed,
          severity: deviation > 0.25 ? "error" : "warning",
        });
      }
    }
  }

  return flags;
}
