import { foods, createFoodQueries, foodRowToDetail, foodDetailToRow, type Database } from "@mo/database";
import type { FoodSearchResult, FoodDetail, ScaledMacros, ScaledMicros } from "@mo/shared";
import type { UsdaFdcClient } from "./usda-fdc.js";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function scaleNullable(value: number | null, factor: number): number | null {
  return value !== null ? round2(value * factor) : null;
}

export class NutritionCache {
  private queries: ReturnType<typeof createFoodQueries>;

  constructor(
    private db: Database,
    private usdaClient: UsdaFdcClient
  ) {
    this.queries = createFoodQueries(db);
  }

  async searchFoods(query: string, dataType?: string[]): Promise<FoodSearchResult[]> {
    return this.usdaClient.searchFoods(query, dataType);
  }

  async getFoodDetail(fdcId: number): Promise<FoodDetail> {
    const rows = await this.queries.findById.execute({ fdcId });
    if (rows.length > 0) return foodRowToDetail(rows[0]);

    const detail = await this.usdaClient.getFoodDetail(fdcId);
    await this.db.insert(foods).values(foodDetailToRow(detail));
    return detail;
  }

  async scaleMacros(fdcId: number, amountGrams: number): Promise<ScaledMacros> {
    const detail = await this.getFoodDetail(fdcId);
    const f = amountGrams / 100;

    return {
      fdc_id: detail.fdc_id,
      description: detail.description,
      amount_g: amountGrams,
      calories_kcal: round2(detail.macros_per_100g.calories_kcal * f),
      protein_g: round2(detail.macros_per_100g.protein_g * f),
      fat_g: round2(detail.macros_per_100g.fat_g * f),
      carbs_g: round2(detail.macros_per_100g.carbs_g * f),
      fiber_g: round2(detail.macros_per_100g.fiber_g * f),
    };
  }

  async scaleMicros(fdcId: number, amountGrams: number): Promise<ScaledMicros> {
    const detail = await this.getFoodDetail(fdcId);
    const f = amountGrams / 100;

    return {
      fdc_id: detail.fdc_id,
      description: detail.description,
      amount_g: amountGrams,
      calcium_mg: scaleNullable(detail.micros_per_100g.calcium_mg, f),
      iron_mg: scaleNullable(detail.micros_per_100g.iron_mg, f),
      vitamin_d_ug: scaleNullable(detail.micros_per_100g.vitamin_d_ug, f),
      vitamin_b12_ug: scaleNullable(detail.micros_per_100g.vitamin_b12_ug, f),
      folate_dfe_ug: scaleNullable(detail.micros_per_100g.folate_dfe_ug, f),
    };
  }
}

export function createNutritionCache(db: Database, usdaClient: UsdaFdcClient): NutritionCache {
  return new NutritionCache(db, usdaClient);
}
