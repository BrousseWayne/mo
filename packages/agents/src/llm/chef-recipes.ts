import { CLAUDE_MODELS, chefOutputSchema, type ChefOutput } from "@mo/shared";
import { INGREDIENT_TABLE } from "../tools/ingredients.js";
import { verifyRecipeMacros, type RecipeMacroVerification } from "../validation/recipe-macros.js";
import type { LlmJsonClient } from "./types.js";

export interface RecipeSlotTarget {
  slot: string;
  protein_g: number;
  calories: number;
  constraints?: string[];
}

export interface RecipeGenerationInput {
  slots: RecipeSlotTarget[];
  count: number;
  foodAversions: string[];
  recentRecipes?: string[];
  ratedRecipes?: { name: string; rating: number }[];
}

export interface RecipeGenerationResult {
  recipes: ChefOutput["recipes"];
  verifications: RecipeMacroVerification[];
  rejected: RecipeMacroVerification[];
}

function ingredientTableText(): string {
  return Object.entries(INGREDIENT_TABLE)
    .map(
      ([name, m]) =>
        `${name}: ${m.protein_g}g protein, ${m.fat_g}g fat, ${m.carbs_g}g carbs, ${m.calories} kcal per 100g`
    )
    .join("\n");
}

function buildSystem(): string {
  return `You are CHEF Marco Delacroix, the culinary execution agent in the MO wellness system. Classically trained (Le Cordon Bleu), 10 years in sports nutrition meal prep.

## Philosophy
Food must be delicious first, nutritious second. Flavor drives compliance. Compliance drives results.

## Core Constraints
- English only, metric units only (g, ml, kg, kcal, C)
- NO peanut butter, NO nut butters, NO nuts in any recipe
- Substitutes: tahini, sunflower seed butter, coconut cream, avocado
- Calorie density prioritized over volume
- All recipes include gram weights and macros per serving

## Ingredient Rules
You may ONLY use ingredients from this table. Macros are per 100 g; compute each recipe's macros_per_serving from these exact values (sum ingredient contributions, divide by servings):

${ingredientTableText()}

Seasonings, herbs, spices, vinegar, lemon juice, stock and water are allowed freely and count as zero macros — do not list them in the ingredients array; mention them in the instructions instead.

## Recipe Model
Every meal is composed from: protein (technique) + carb + vegetable + sauce (cuisine kit). Vary cuisines across recipes (Mediterranean, Korean, Italian, French, Mexican, Japanese...).

## Output Format
Produce a JSON object: { "recipes": [ { "recipe_name": string, "cuisine": string, "meal_pattern": { "protein": string, "technique": string, "carb": string, "vegetable": string, "sauce": string }, "servings": number, "ingredients": [{ "item": string, "amount_g": number, "prep_notes": string | null }], "macros_per_serving": { "protein_g": number, "fat_g": number, "carbs_g": number, "fiber_g": number, "calories": number }, "instructions": string[], "time": { "prep_min": number, "cook_min": number }, "batch_notes": string, "storage": { "fridge_days": number, "freezer_friendly": boolean }, "calorie_boost_options": string[] } ] }

The "item" field of each ingredient must be an exact name from the ingredient table. Output ONLY the JSON object, no additional text.`;
}

function buildPrompt(input: RecipeGenerationInput): string {
  const slotLines = input.slots
    .map(
      (s) =>
        `- ${s.slot}: ~${s.protein_g} g protein, ~${s.calories} kcal per serving${s.constraints?.length ? ` (${s.constraints.join(", ")})` : ""}`
    )
    .join("\n");

  let memory = "";
  if (input.recentRecipes?.length) {
    memory += `\n\nRecently generated recipes (do NOT repeat these): ${input.recentRecipes.join(", ")}`;
  }
  const liked = input.ratedRecipes?.filter((r) => r.rating >= 4).map((r) => r.name) ?? [];
  const disliked = input.ratedRecipes?.filter((r) => r.rating <= 2).map((r) => r.name) ?? [];
  if (liked.length) memory += `\nHighly rated by the client (create similar): ${liked.join(", ")}`;
  if (disliked.length) memory += `\nPoorly rated by the client (avoid similar): ${disliked.join(", ")}`;

  return `Generate ${input.count} new recipes for these meal slots:
${slotLines}

Food aversions (never use): ${input.foodAversions.join(", ")}${memory}

Each recipe's macros_per_serving must land within 10% of the slot's protein and calorie targets, computed strictly from the ingredient table values.`;
}

function correctionPrompt(
  base: string,
  failing: ChefOutput["recipes"],
  verifications: RecipeMacroVerification[]
): string {
  const details = verifications
    .map(
      (v) =>
        `${v.recipe_name}: declared ${JSON.stringify(v.declared)} but computed from the ingredient table ${JSON.stringify(v.computed)} (deviations: ${v.deviations.map((d) => `${d.field} ${d.deviation_pct}%`).join(", ")})`
    )
    .join("\n");

  return `${base}

Your previous attempt produced these recipes whose declared macros do not match the ingredient table (deviation > 10%):
${details}

Previous recipes:
${JSON.stringify({ recipes: failing }, null, 2)}

Fix them: recompute macros_per_serving strictly from the ingredient table per-100g values, adjusting ingredient amounts if needed to stay near the slot targets. Return the same JSON structure with ONLY the corrected versions of these ${failing.length} recipes. Output ONLY the JSON object.`;
}

export async function generateVerifiedRecipes(
  client: LlmJsonClient,
  input: RecipeGenerationInput
): Promise<RecipeGenerationResult> {
  const system = buildSystem();
  const prompt = buildPrompt(input);

  const first = await client.generateJson({
    prompt,
    system,
    schema: chefOutputSchema,
    model: CLAUDE_MODELS.pipeline,
    timeoutMs: 480_000,
  });

  const verified: ChefOutput["recipes"] = [];
  const verifications: RecipeMacroVerification[] = [];
  let failing: ChefOutput["recipes"] = [];
  let failingVerifs: RecipeMacroVerification[] = [];

  for (const recipe of first.recipes) {
    const verification = verifyRecipeMacros(recipe);
    if (verification.verified) {
      verified.push(recipe);
      verifications.push(verification);
    } else {
      failing.push(recipe);
      failingVerifs.push(verification);
    }
  }

  if (failing.length > 0) {
    const second = await client.generateJson({
      prompt: correctionPrompt(prompt, failing, failingVerifs),
      system,
      schema: chefOutputSchema,
      model: CLAUDE_MODELS.pipeline,
      timeoutMs: 480_000,
    });

    failing = [];
    failingVerifs = [];
    for (const recipe of second.recipes) {
      const verification = verifyRecipeMacros(recipe);
      if (verification.verified) {
        verified.push(recipe);
        verifications.push(verification);
      } else {
        failing.push(recipe);
        failingVerifs.push(verification);
      }
    }
  }

  return { recipes: verified, verifications, rejected: failingVerifs };
}
