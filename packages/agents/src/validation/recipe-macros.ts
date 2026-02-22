import { INGREDIENT_TABLE } from "../tools/ingredients.js";

interface RecipeIngredient {
  item: string;
  amount_g: number;
}

interface MacrosPerServing {
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  calories: number;
}

interface Recipe {
  recipe_name: string;
  servings: number;
  ingredients: RecipeIngredient[];
  macros_per_serving: MacrosPerServing;
}

interface MacroDeviation {
  field: string;
  declared: number;
  computed: number;
  deviation_pct: number;
}

export interface RecipeMacroVerification {
  verified: boolean;
  recipe_name: string;
  declared: MacrosPerServing;
  computed: MacrosPerServing;
  deviations: MacroDeviation[];
}

export function verifyRecipeMacros(recipe: Recipe): RecipeMacroVerification {
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  let totalCalories = 0;

  for (const ingredient of recipe.ingredients) {
    const normalized = ingredient.item.toLowerCase().trim();

    let entry = INGREDIENT_TABLE[normalized];
    if (!entry) {
      for (const [key, val] of Object.entries(INGREDIENT_TABLE)) {
        if (normalized.includes(key) || key.includes(normalized)) {
          entry = val;
          break;
        }
      }
    }

    if (entry) {
      const factor = ingredient.amount_g / 100;
      totalProtein += entry.protein_g * factor;
      totalFat += entry.fat_g * factor;
      totalCarbs += entry.carbs_g * factor;
      totalCalories += entry.calories * factor;
    }
  }

  const computed: MacrosPerServing = {
    protein_g: Math.round((totalProtein / recipe.servings) * 10) / 10,
    fat_g: Math.round((totalFat / recipe.servings) * 10) / 10,
    carbs_g: Math.round((totalCarbs / recipe.servings) * 10) / 10,
    calories: Math.round(totalCalories / recipe.servings),
  };

  const deviations: MacroDeviation[] = [];
  const fields: (keyof MacrosPerServing)[] = ["protein_g", "fat_g", "carbs_g", "calories"];

  for (const field of fields) {
    const declared = recipe.macros_per_serving[field];
    const comp = computed[field];
    if (declared === 0 && comp === 0) continue;
    const base = Math.max(declared, 1);
    const devPct = Math.abs(declared - comp) / base * 100;
    if (devPct > 10) {
      deviations.push({
        field,
        declared,
        computed: comp,
        deviation_pct: Math.round(devPct * 10) / 10,
      });
    }
  }

  return {
    verified: deviations.length === 0,
    recipe_name: recipe.recipe_name,
    declared: recipe.macros_per_serving,
    computed,
    deviations,
  };
}
