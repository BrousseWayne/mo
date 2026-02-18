import { describe, test, expect, vi, beforeEach } from "vitest";
import {
  searchFoods,
  getFoodDetail,
  scaleMacros,
  scaleMicros,
  executeNutritionTool,
  type NutritionToolContext,
} from "../nutrition.js";
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

function createMockCache(): NutritionCache {
  return {
    searchFoods: vi.fn().mockResolvedValue([CHICKEN_THIGH_SEARCH]),
    getFoodDetail: vi.fn().mockResolvedValue(CHICKEN_THIGH_DETAIL),
    scaleMacros: vi.fn().mockResolvedValue({
      fdc_id: 171477,
      description: CHICKEN_THIGH_DETAIL.description,
      amount_g: 150,
      calories_kcal: 316.5,
      protein_g: 25.91,
      fat_g: 22.88,
      carbs_g: 0,
      fiber_g: 0,
    }),
    scaleMicros: vi.fn().mockResolvedValue({
      fdc_id: 171477,
      description: CHICKEN_THIGH_DETAIL.description,
      amount_g: 150,
      calcium_mg: 13.5,
      iron_mg: 1.43,
      vitamin_d_ug: 0.15,
      vitamin_b12_ug: 0.66,
      folate_dfe_ug: 9,
    }),
  } as unknown as NutritionCache;
}

describe("searchFoods", () => {
  test("delegates to cache with query", async () => {
    const cache = createMockCache();
    const ctx: NutritionToolContext = { nutritionCache: cache };
    const result = await searchFoods(ctx, "chicken thigh");
    expect(cache.searchFoods).toHaveBeenCalledWith("chicken thigh", undefined);
    expect(result).toHaveLength(1);
    expect(result[0].fdc_id).toBe(171477);
  });

  test("passes dataType filter", async () => {
    const cache = createMockCache();
    const ctx: NutritionToolContext = { nutritionCache: cache };
    await searchFoods(ctx, "chicken", ["Foundation"]);
    expect(cache.searchFoods).toHaveBeenCalledWith("chicken", ["Foundation"]);
  });
});

describe("getFoodDetail", () => {
  test("returns full detail with macros, micros, portions", async () => {
    const cache = createMockCache();
    const ctx: NutritionToolContext = { nutritionCache: cache };
    const result = await getFoodDetail(ctx, 171477);
    expect(cache.getFoodDetail).toHaveBeenCalledWith(171477);
    expect(result.macros_per_100g.protein_g).toBe(17.27);
    expect(result.micros_per_100g.iron_mg).toBe(0.95);
    expect(result.portions).toHaveLength(1);
  });
});

describe("scaleMacros", () => {
  test("scales 150g chicken thigh", async () => {
    const cache = createMockCache();
    const ctx: NutritionToolContext = { nutritionCache: cache };
    const result = await scaleMacros(ctx, 171477, 150);
    expect(cache.scaleMacros).toHaveBeenCalledWith(171477, 150);
    expect(result.amount_g).toBe(150);
    expect(result.protein_g).toBe(25.91);
    expect(result.calories_kcal).toBe(316.5);
  });
});

describe("scaleMicros", () => {
  test("scales 150g chicken thigh micros", async () => {
    const cache = createMockCache();
    const ctx: NutritionToolContext = { nutritionCache: cache };
    const result = await scaleMicros(ctx, 171477, 150);
    expect(cache.scaleMicros).toHaveBeenCalledWith(171477, 150);
    expect(result.amount_g).toBe(150);
    expect(result.iron_mg).toBe(1.43);
    expect(result.vitamin_b12_ug).toBe(0.66);
  });
});

describe("executeNutritionTool", () => {
  test("routes search_foods correctly", async () => {
    const cache = createMockCache();
    const ctx: NutritionToolContext = { nutritionCache: cache };
    const result = await executeNutritionTool(ctx, "search_foods", {
      query: "rice",
    });
    expect(cache.searchFoods).toHaveBeenCalledWith("rice", undefined);
    expect(result).toEqual([CHICKEN_THIGH_SEARCH]);
  });

  test("routes get_food_detail correctly", async () => {
    const cache = createMockCache();
    const ctx: NutritionToolContext = { nutritionCache: cache };
    await executeNutritionTool(ctx, "get_food_detail", { fdcId: 171477 });
    expect(cache.getFoodDetail).toHaveBeenCalledWith(171477);
  });

  test("routes scale_macros correctly", async () => {
    const cache = createMockCache();
    const ctx: NutritionToolContext = { nutritionCache: cache };
    await executeNutritionTool(ctx, "scale_macros", {
      fdcId: 171477,
      amountGrams: 200,
    });
    expect(cache.scaleMacros).toHaveBeenCalledWith(171477, 200);
  });

  test("routes scale_micros correctly", async () => {
    const cache = createMockCache();
    const ctx: NutritionToolContext = { nutritionCache: cache };
    await executeNutritionTool(ctx, "scale_micros", {
      fdcId: 171477,
      amountGrams: 200,
    });
    expect(cache.scaleMicros).toHaveBeenCalledWith(171477, 200);
  });

  test("throws on unknown tool name", async () => {
    const cache = createMockCache();
    const ctx: NutritionToolContext = { nutritionCache: cache };
    await expect(
      executeNutritionTool(ctx, "nonexistent_tool", {})
    ).rejects.toThrow("Unknown nutrition tool: nonexistent_tool");
  });
});
