import { describe, test, expect, vi } from "vitest";
import { executeNutritionTool } from "../nutrition.js";
import type { NutritionCache } from "../../clients/nutrition-cache.js";

const CHICKEN_THIGH_SEARCH = {
  fdc_id: 171477,
  description: "Chicken, broilers or fryers, thigh, meat and skin, raw",
  data_type: "SR Legacy",
  macros_per_100g: {
    calories_kcal: 211,
    protein_g: 17.27,
    fat_g: 15.25,
    carbs_g: 0,
    fiber_g: 0,
  },
};

const CHICKEN_THIGH_DETAIL = {
  ...CHICKEN_THIGH_SEARCH,
  category: "Poultry Products",
  micros_per_100g: {
    calcium_mg: 9,
    iron_mg: 0.95,
    vitamin_d_ug: 0.1,
    vitamin_b12_ug: 0.44,
    folate_dfe_ug: 6,
  },
  portions: [
    { description: "thigh", gram_weight: 125 },
  ],
};

const SCALED_MACROS = {
  fdc_id: 171477,
  description: CHICKEN_THIGH_DETAIL.description,
  amount_g: 150,
  calories_kcal: 316.5,
  protein_g: 25.91,
  fat_g: 22.88,
  carbs_g: 0,
  fiber_g: 0,
};

const SCALED_MICROS = {
  fdc_id: 171477,
  description: CHICKEN_THIGH_DETAIL.description,
  amount_g: 150,
  calcium_mg: 13.5,
  iron_mg: 1.43,
  vitamin_d_ug: 0.15,
  vitamin_b12_ug: 0.66,
  folate_dfe_ug: 9,
};

function createMockCache(): NutritionCache {
  return {
    searchFoods: vi.fn().mockResolvedValue([CHICKEN_THIGH_SEARCH]),
    getFoodDetail: vi.fn().mockResolvedValue(CHICKEN_THIGH_DETAIL),
    scaleMacros: vi.fn().mockResolvedValue(SCALED_MACROS),
    scaleMicros: vi.fn().mockResolvedValue(SCALED_MICROS),
  } as unknown as NutritionCache;
}

describe("executeNutritionTool", () => {
  test("search_foods delegates to cache with query", async () => {
    const cache = createMockCache();
    const result = await executeNutritionTool(cache, "search_foods", {
      query: "chicken thigh",
    });
    expect(cache.searchFoods).toHaveBeenCalledWith("chicken thigh", undefined);
    expect(result).toEqual([CHICKEN_THIGH_SEARCH]);
  });

  test("search_foods passes dataType filter", async () => {
    const cache = createMockCache();
    await executeNutritionTool(cache, "search_foods", {
      query: "chicken",
      dataType: ["Foundation"],
    });
    expect(cache.searchFoods).toHaveBeenCalledWith("chicken", ["Foundation"]);
  });

  test("get_food_detail returns full detail with macros, micros, portions", async () => {
    const cache = createMockCache();
    const result = await executeNutritionTool(cache, "get_food_detail", {
      fdcId: 171477,
    });
    expect(cache.getFoodDetail).toHaveBeenCalledWith(171477);
    const detail = result as typeof CHICKEN_THIGH_DETAIL;
    expect(detail.macros_per_100g.protein_g).toBe(17.27);
    expect(detail.micros_per_100g.iron_mg).toBe(0.95);
    expect(detail.portions).toHaveLength(1);
  });

  test("scale_macros scales 150g chicken thigh", async () => {
    const cache = createMockCache();
    const result = await executeNutritionTool(cache, "scale_macros", {
      fdcId: 171477,
      amountGrams: 150,
    });
    expect(cache.scaleMacros).toHaveBeenCalledWith(171477, 150);
    const scaled = result as typeof SCALED_MACROS;
    expect(scaled.amount_g).toBe(150);
    expect(scaled.protein_g).toBe(25.91);
    expect(scaled.calories_kcal).toBe(316.5);
  });

  test("scale_micros scales 150g chicken thigh micros", async () => {
    const cache = createMockCache();
    const result = await executeNutritionTool(cache, "scale_micros", {
      fdcId: 171477,
      amountGrams: 150,
    });
    expect(cache.scaleMicros).toHaveBeenCalledWith(171477, 150);
    const scaled = result as typeof SCALED_MICROS;
    expect(scaled.amount_g).toBe(150);
    expect(scaled.iron_mg).toBe(1.43);
    expect(scaled.vitamin_b12_ug).toBe(0.66);
  });

  test("throws on unknown tool name", async () => {
    const cache = createMockCache();
    await expect(
      executeNutritionTool(cache, "nonexistent_tool", {})
    ).rejects.toThrow("Unknown nutrition tool: nonexistent_tool");
  });
});
