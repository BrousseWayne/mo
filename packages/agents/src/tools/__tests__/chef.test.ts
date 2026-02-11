import { describe, test, expect } from "vitest";
import {
  calculateRecipeMacros,
  scaleBatch,
  composeShake,
} from "../chef.js";

describe("calculateRecipeMacros", () => {
  test("chicken 150g + rice 200g + olive oil 15g", () => {
    const result = calculateRecipeMacros({
      ingredients: [
        { item: "chicken thigh", amount_g: 150 },
        { item: "rice", amount_g: 200 },
        { item: "olive oil", amount_g: 15 },
      ],
    });
    expect(result.total_protein_g).toBe(34.7);
    expect(result.total_fat_g).toBe(32);
    expect(result.total_carbs_g).toBe(56);
    expect(result.total_fiber_g).toBe(0.8);
    expect(result.total_calories).toBe(658.1);
    expect(result.unknown_ingredients).toEqual([]);
  });

  test("single ingredient: whey 30g", () => {
    const result = calculateRecipeMacros({
      ingredients: [{ item: "whey protein", amount_g: 30 }],
    });
    expect(result.total_protein_g).toBe(22.5);
    expect(result.total_fat_g).toBe(1.5);
    expect(result.total_carbs_g).toBe(3);
    expect(result.total_fiber_g).toBe(0);
    expect(result.total_calories).toBe(117);
  });

  test("unknown ingredient appears in unknown_ingredients", () => {
    const result = calculateRecipeMacros({
      ingredients: [
        { item: "chicken thigh", amount_g: 150 },
        { item: "dragon fruit extract", amount_g: 50 },
      ],
    });
    expect(result.unknown_ingredients).toEqual(["dragon fruit extract"]);
    expect(result.total_protein_g).toBe(29.3);
  });

  test("fuzzy match: 'chicken thigh, boneless' matches 'chicken thigh'", () => {
    const result = calculateRecipeMacros({
      ingredients: [{ item: "chicken thigh, boneless", amount_g: 100 }],
    });
    expect(result.total_protein_g).toBe(19.5);
    expect(result.total_fat_g).toBe(10.9);
    expect(result.unknown_ingredients).toEqual([]);
  });
});

describe("scaleBatch", () => {
  test("1 to 4 servings: amounts x4", () => {
    const result = scaleBatch({
      recipe_ingredients: [
        { item: "chicken thigh", amount_g: 150 },
        { item: "rice", amount_g: 200 },
        { item: "olive oil", amount_g: 15 },
      ],
      target_servings: 4,
      original_servings: 1,
    });
    expect(result).toEqual([
      { item: "chicken thigh", amount_g: 600 },
      { item: "rice", amount_g: 800 },
      { item: "olive oil", amount_g: 60 },
    ]);
  });

  test("3 to 1 servings: amounts /3, rounded", () => {
    const result = scaleBatch({
      recipe_ingredients: [
        { item: "chicken thigh", amount_g: 450 },
        { item: "rice", amount_g: 600 },
        { item: "olive oil", amount_g: 40 },
      ],
      target_servings: 1,
      original_servings: 3,
    });
    expect(result).toEqual([
      { item: "chicken thigh", amount_g: 150 },
      { item: "rice", amount_g: 200 },
      { item: "olive oil", amount_g: 13 },
    ]);
  });
});

describe("composeShake", () => {
  test("banana + oats + whey + milk: combined macros", () => {
    const result = composeShake({
      base_ingredients: [
        { item: "banana", amount_g: 120 },
        { item: "oats", amount_g: 40 },
        { item: "whey protein", amount_g: 30 },
        { item: "whole milk", amount_g: 300 },
      ],
      boosters: [],
    });
    expect(result.ingredients).toHaveLength(4);
    expect(result.macros_per_serving.protein_g).toBe(39);
    expect(result.macros_per_serving.fat_g).toBe(14.4);
    expect(result.macros_per_serving.carbs_g).toBe(72.1);
    expect(result.macros_per_serving.fiber_g).toBe(7.2);
    expect(result.macros_per_serving.calories).toBe(558.4);
  });

  test("with boosters: boosters added to ingredients", () => {
    const result = composeShake({
      base_ingredients: [
        { item: "banana", amount_g: 120 },
        { item: "whey protein", amount_g: 30 },
      ],
      boosters: [
        { item: "tahini", amount_g: 30 },
        { item: "honey", amount_g: 15 },
      ],
    });
    expect(result.ingredients).toHaveLength(4);
    expect(result.ingredients[2]).toEqual({ item: "tahini", amount_g: 30 });
    expect(result.ingredients[3]).toEqual({ item: "honey", amount_g: 15 });
    expect(result.macros_per_serving.protein_g).toBeGreaterThan(0);
    expect(result.macros_per_serving.calories).toBeGreaterThan(0);
  });
});
