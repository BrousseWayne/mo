interface Ingredient {
  item: string;
  amount_g: number;
}

interface Macros {
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  calories: number;
  fiber_g?: number;
}

interface Recipe {
  recipe_name: string;
  cuisine: string;
  servings: number;
  ingredients: Ingredient[];
  macros_per_serving: Macros;
  instructions: string[];
  time_prep: number;
  time_cook: number;
  batch_notes?: string | null;
  storage?: unknown;
  meal_pattern?: unknown;
}

export function scaleRecipe<T extends Recipe>(recipe: T, factor: number): T {
  const scaledIngredients = (recipe.ingredients as Ingredient[]).map((ing) => ({
    ...ing,
    amount_g: Math.round(ing.amount_g * factor),
  }));

  const newServings = Math.round(recipe.servings * factor);

  return {
    ...recipe,
    servings: newServings,
    ingredients: scaledIngredients,
  };
}
