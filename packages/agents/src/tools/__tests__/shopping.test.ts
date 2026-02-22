import { describe, it, expect } from "vitest";
import { generateShoppingList } from "../shopping.js";

describe("generateShoppingList", () => {
  it("aggregates ingredients across recipes", () => {
    const recipes = [
      {
        recipe_name: "Chicken Bowl",
        ingredients: [
          { item: "chicken_breast", amount_g: 200 },
          { item: "white_rice", amount_g: 150 },
        ],
      },
      {
        recipe_name: "Chicken Salad",
        ingredients: [
          { item: "chicken_breast", amount_g: 150 },
          { item: "spinach", amount_g: 100 },
        ],
      },
    ];

    const result = generateShoppingList(recipes);
    const protein = result.find((c) => c.category === "protein");
    const chicken = protein?.items.find((i) => i.name === "chicken_breast");
    expect(chicken?.total_amount_g).toBe(350);
    expect(chicken?.recipes).toContain("Chicken Bowl");
    expect(chicken?.recipes).toContain("Chicken Salad");
  });

  it("categorizes ingredients correctly", () => {
    const recipes = [
      {
        recipe_name: "Stir Fry",
        ingredients: [
          { item: "tofu", amount_g: 200 },
          { item: "broccoli", amount_g: 150 },
          { item: "soy_sauce", amount_g: 30 },
          { item: "cumin", amount_g: 5 },
        ],
      },
    ];

    const result = generateShoppingList(recipes);
    const categories = result.map((c) => c.category);
    expect(categories).toContain("protein");
    expect(categories).toContain("produce");
    expect(categories).toContain("pantry");
    expect(categories).toContain("spices");
  });

  it("returns empty for empty input", () => {
    expect(generateShoppingList([])).toEqual([]);
  });

  it("preserves category order", () => {
    const recipes = [
      {
        recipe_name: "Mix",
        ingredients: [
          { item: "salt", amount_g: 5 },
          { item: "salmon", amount_g: 200 },
          { item: "greek_yogurt", amount_g: 150 },
          { item: "tomato", amount_g: 100 },
        ],
      },
    ];

    const result = generateShoppingList(recipes);
    const categories = result.map((c) => c.category);
    expect(categories.indexOf("produce")).toBeLessThan(categories.indexOf("protein"));
    expect(categories.indexOf("protein")).toBeLessThan(categories.indexOf("dairy"));
  });
});
