import { describe, it, expect } from "vitest";
import { scaleRecipe } from "../recipe-utils.js";

describe("scaleRecipe", () => {
  const base = {
    recipe_name: "Test Recipe",
    cuisine: "Mediterranean",
    servings: 2,
    ingredients: [
      { item: "chicken_breast", amount_g: 200 },
      { item: "rice", amount_g: 150 },
    ],
    macros_per_serving: { protein_g: 30, fat_g: 5, carbs_g: 40, calories: 325 },
    instructions: ["Cook chicken", "Cook rice"],
    time_prep: 10,
    time_cook: 20,
  };

  it("doubles ingredients and servings", () => {
    const scaled = scaleRecipe(base, 2);
    expect(scaled.servings).toBe(4);
    expect(scaled.ingredients[0].amount_g).toBe(400);
    expect(scaled.ingredients[1].amount_g).toBe(300);
  });

  it("halves ingredients and servings", () => {
    const scaled = scaleRecipe(base, 0.5);
    expect(scaled.servings).toBe(1);
    expect(scaled.ingredients[0].amount_g).toBe(100);
  });

  it("preserves non-scaled fields", () => {
    const scaled = scaleRecipe(base, 3);
    expect(scaled.recipe_name).toBe("Test Recipe");
    expect(scaled.instructions).toEqual(["Cook chicken", "Cook rice"]);
    expect(scaled.time_prep).toBe(10);
  });
});
