import { describe, it, expect } from "vitest";
import { verifyRecipeMacros } from "../recipe-macros.js";

describe("verifyRecipeMacros", () => {
  it("verifies a recipe with known ingredients", () => {
    const recipe = {
      recipe_name: "Chicken Rice",
      servings: 1,
      ingredients: [
        { item: "chicken breast", amount_g: 150 },
        { item: "rice", amount_g: 200 },
      ],
      macros_per_serving: {
        protein_g: 55,
        fat_g: 5,
        carbs_g: 57,
        calories: 500,
      },
    };
    const result = verifyRecipeMacros(recipe);
    expect(result.recipe_name).toBe("Chicken Rice");
    expect(result.computed.protein_g).toBeGreaterThan(0);
  });

  it("returns empty deviations for unknown ingredients", () => {
    const recipe = {
      recipe_name: "Mystery Dish",
      servings: 1,
      ingredients: [
        { item: "unicorn tears", amount_g: 100 },
      ],
      macros_per_serving: {
        protein_g: 10,
        fat_g: 5,
        carbs_g: 20,
        calories: 150,
      },
    };
    const result = verifyRecipeMacros(recipe);
    expect(result.computed.calories).toBe(0);
  });
});
