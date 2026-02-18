import { foods, createFoodQueries, foodRowToDetail, foodDetailToRow, type Database } from "@mo/database";
import type { FoodSearchResult, FoodDetail, ScaledMacros, ScaledMicros } from "@mo/shared";
import type { UsdaFdcClient } from "./usda-fdc.js";

export class NutritionCache {
  private queries: ReturnType<typeof createFoodQueries>;

  constructor(
    private db: Database,
    private usdaClient: UsdaFdcClient
  ) {
    this.queries = createFoodQueries(db);
  }

  async searchFoods(
    query: string,
    dataType?: string[]
  ): Promise<FoodSearchResult[]> {
    return this.usdaClient.searchFoods(query, dataType);
  }

  async getFoodDetail(fdcId: number): Promise<FoodDetail> {
    const rows = await this.queries.findById.execute({ fdcId });

    if (rows.length > 0) {
      return foodRowToDetail(rows[0]);
    }

    const detail = await this.usdaClient.getFoodDetail(fdcId);
    await this.db.insert(foods).values(foodDetailToRow(detail));
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
