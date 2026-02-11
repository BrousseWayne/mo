import type Anthropic from "@anthropic-ai/sdk";
import { lookupIngredient, INGREDIENT_TABLE } from "./ingredients.js";

export interface RecipeMacrosInput {
  ingredients: Array<{ item: string; amount_g: number }>;
}

export interface RecipeMacrosOutput {
  total_protein_g: number;
  total_fat_g: number;
  total_carbs_g: number;
  total_fiber_g: number;
  total_calories: number;
  unknown_ingredients: string[];
}

export function calculateRecipeMacros(input: RecipeMacrosInput): RecipeMacrosOutput {
  let protein = 0;
  let fat = 0;
  let carbs = 0;
  let fiber = 0;
  let calories = 0;
  const unknown: string[] = [];

  for (const ing of input.ingredients) {
    const data = lookupIngredient(ing.item);
    if (!data) {
      unknown.push(ing.item);
      continue;
    }
    const factor = ing.amount_g / 100;
    protein += data.protein_g * factor;
    fat += data.fat_g * factor;
    carbs += data.carbs_g * factor;
    fiber += data.fiber_g * factor;
    calories += data.calories * factor;
  }

  return {
    total_protein_g: Math.round(protein * 10) / 10,
    total_fat_g: Math.round(fat * 10) / 10,
    total_carbs_g: Math.round(carbs * 10) / 10,
    total_fiber_g: Math.round(fiber * 10) / 10,
    total_calories: Math.round(calories * 10) / 10,
    unknown_ingredients: unknown,
  };
}

export interface ScaleBatchInput {
  recipe_ingredients: Array<{ item: string; amount_g: number }>;
  target_servings: number;
  original_servings: number;
}

export function scaleBatch(
  input: ScaleBatchInput
): Array<{ item: string; amount_g: number }> {
  const ratio = input.target_servings / input.original_servings;
  return input.recipe_ingredients.map((ing) => ({
    item: ing.item,
    amount_g: Math.round(ing.amount_g * ratio),
  }));
}

export interface ComposeShakeInput {
  base_ingredients: Array<{ item: string; amount_g: number }>;
  boosters: Array<{ item: string; amount_g: number }>;
}

export interface ComposeShakeOutput {
  ingredients: Array<{ item: string; amount_g: number }>;
  macros_per_serving: {
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    fiber_g: number;
    calories: number;
  };
}

export function composeShake(input: ComposeShakeInput): ComposeShakeOutput {
  const allIngredients = [...input.base_ingredients, ...input.boosters];
  const macros = calculateRecipeMacros({ ingredients: allIngredients });

  return {
    ingredients: allIngredients,
    macros_per_serving: {
      protein_g: macros.total_protein_g,
      fat_g: macros.total_fat_g,
      carbs_g: macros.total_carbs_g,
      fiber_g: macros.total_fiber_g,
      calories: macros.total_calories,
    },
  };
}

export const toolExecutors: Record<
  string,
  (input: Record<string, unknown>) => unknown
> = {
  calculate_recipe_macros: (input) =>
    calculateRecipeMacros(input as unknown as RecipeMacrosInput),
  scale_batch: (input) => scaleBatch(input as unknown as ScaleBatchInput),
  compose_shake: (input) => composeShake(input as unknown as ComposeShakeInput),
};

export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: "calculate_recipe_macros",
    description:
      "Calculate total macros for a recipe from ingredient list with gram weights. Looks up each ingredient in the nutrition table and sums proportional macros. Returns totals and any unrecognized ingredients.",
    input_schema: {
      type: "object" as const,
      properties: {
        ingredients: {
          type: "array",
          description: "List of ingredients with gram amounts",
          items: {
            type: "object",
            properties: {
              item: { type: "string", description: "Ingredient name" },
              amount_g: { type: "number", description: "Amount in grams" },
            },
            required: ["item", "amount_g"],
          },
        },
      },
      required: ["ingredients"],
    },
  },
  {
    name: "scale_batch",
    description:
      "Scale recipe ingredient amounts from original servings to target servings. Rounds to nearest gram.",
    input_schema: {
      type: "object" as const,
      properties: {
        recipe_ingredients: {
          type: "array",
          description: "Original recipe ingredients",
          items: {
            type: "object",
            properties: {
              item: { type: "string", description: "Ingredient name" },
              amount_g: { type: "number", description: "Amount in grams" },
            },
            required: ["item", "amount_g"],
          },
        },
        target_servings: {
          type: "number",
          description: "Desired number of servings",
        },
        original_servings: {
          type: "number",
          description: "Original number of servings",
        },
      },
      required: ["recipe_ingredients", "target_servings", "original_servings"],
    },
  },
  {
    name: "compose_shake",
    description:
      "Combine base ingredients and boosters into a shake recipe with calculated macros per serving.",
    input_schema: {
      type: "object" as const,
      properties: {
        base_ingredients: {
          type: "array",
          description: "Base shake ingredients",
          items: {
            type: "object",
            properties: {
              item: { type: "string", description: "Ingredient name" },
              amount_g: { type: "number", description: "Amount in grams" },
            },
            required: ["item", "amount_g"],
          },
        },
        boosters: {
          type: "array",
          description: "Booster ingredients to add",
          items: {
            type: "object",
            properties: {
              item: { type: "string", description: "Ingredient name" },
              amount_g: { type: "number", description: "Amount in grams" },
            },
            required: ["item", "amount_g"],
          },
        },
      },
      required: ["base_ingredients", "boosters"],
    },
  },
];
