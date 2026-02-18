import { eq } from "drizzle-orm";
import { foods, type Database } from "@mo/database";
import type { FoodSearchResult, FoodDetail, ScaledMacros, ScaledMicros } from "@mo/shared";
import type { UsdaFdcClient } from "./usda-fdc.js";

export class NutritionCache {
  constructor(
    private db: Database,
    private usdaClient: UsdaFdcClient
  ) {}

  async searchFoods(
    query: string,
    dataType?: string[]
  ): Promise<FoodSearchResult[]> {
    return this.usdaClient.searchFoods(query, dataType);
  }

  async getFoodDetail(fdcId: number): Promise<FoodDetail> {
    const cached = await this.db
      .select()
      .from(foods)
      .where(eq(foods.fdc_id, fdcId))
      .limit(1);

    if (cached.length > 0) {
      const food = cached[0];
      return {
        fdc_id: food.fdc_id,
        description: food.description || "",
        category: food.category || "",
        data_type: food.data_type,
        macros_per_100g: {
          calories_kcal: food.calories_kcal,
          protein_g: food.protein_g,
          fat_g: food.fat_g,
          carbs_g: food.carbs_g,
          fiber_g: food.fiber_g,
        },
        micros_per_100g: {
          calcium_mg: food.calcium_mg,
          iron_mg: food.iron_mg,
          vitamin_d_ug: food.vitamin_d_ug,
          vitamin_b12_ug: food.vitamin_b12_ug,
          folate_dfe_ug: food.folate_dfe_ug,
        },
        portions: (food.portions as { description: string; gram_weight: number }[]) || [],
      };
    }

    const detail = await this.usdaClient.getFoodDetail(fdcId);

    await this.db.insert(foods).values({
      fdc_id: detail.fdc_id,
      name: detail.description,
      description: detail.description,
      category: detail.category,
      data_type: detail.data_type,
      calories_kcal: detail.macros_per_100g.calories_kcal,
      protein_g: detail.macros_per_100g.protein_g,
      fat_g: detail.macros_per_100g.fat_g,
      carbs_g: detail.macros_per_100g.carbs_g,
      fiber_g: detail.macros_per_100g.fiber_g,
      calcium_mg: detail.micros_per_100g.calcium_mg,
      iron_mg: detail.micros_per_100g.iron_mg,
      vitamin_d_ug: detail.micros_per_100g.vitamin_d_ug,
      vitamin_b12_ug: detail.micros_per_100g.vitamin_b12_ug,
      folate_dfe_ug: detail.micros_per_100g.folate_dfe_ug,
      portions: detail.portions,
    });

    return detail;
  }

  async scaleMacros(
    fdcId: number,
    amountGrams: number
  ): Promise<ScaledMacros> {
    const detail = await this.getFoodDetail(fdcId);
    const factor = amountGrams / 100;

    return {
      fdc_id: detail.fdc_id,
      description: detail.description,
      amount_g: amountGrams,
      calories_kcal: Math.round(detail.macros_per_100g.calories_kcal * factor * 100) / 100,
      protein_g: Math.round(detail.macros_per_100g.protein_g * factor * 100) / 100,
      fat_g: Math.round(detail.macros_per_100g.fat_g * factor * 100) / 100,
      carbs_g: Math.round(detail.macros_per_100g.carbs_g * factor * 100) / 100,
      fiber_g: Math.round(detail.macros_per_100g.fiber_g * factor * 100) / 100,
    };
  }

  async scaleMicros(
    fdcId: number,
    amountGrams: number
  ): Promise<ScaledMicros> {
    const detail = await this.getFoodDetail(fdcId);
    const factor = amountGrams / 100;

    const scale = (val: number | null): number | null =>
      val !== null ? Math.round(val * factor * 100) / 100 : null;

    return {
      fdc_id: detail.fdc_id,
      description: detail.description,
      amount_g: amountGrams,
      calcium_mg: scale(detail.micros_per_100g.calcium_mg),
      iron_mg: scale(detail.micros_per_100g.iron_mg),
      vitamin_d_ug: scale(detail.micros_per_100g.vitamin_d_ug),
      vitamin_b12_ug: scale(detail.micros_per_100g.vitamin_b12_ug),
      folate_dfe_ug: scale(detail.micros_per_100g.folate_dfe_ug),
    };
  }
}

export function createNutritionCache(
  db: Database,
  usdaClient: UsdaFdcClient
): NutritionCache {
  return new NutritionCache(db, usdaClient);
}
