import { eq, sql } from "drizzle-orm";
import type { Database } from "./client.js";
import { foods } from "./schema.js";
import type { FoodDetail, FoodPortion } from "@mo/shared";

export type FoodRow = typeof foods.$inferSelect;

export function foodRowToDetail(row: FoodRow): FoodDetail {
  return {
    fdc_id: row.fdc_id,
    description: row.description || "",
    category: row.category || "",
    data_type: row.data_type,
    macros_per_100g: {
      calories_kcal: row.calories_kcal,
      protein_g: row.protein_g,
      fat_g: row.fat_g,
      carbs_g: row.carbs_g,
      fiber_g: row.fiber_g,
    },
    micros_per_100g: {
      calcium_mg: row.calcium_mg,
      iron_mg: row.iron_mg,
      vitamin_d_ug: row.vitamin_d_ug,
      vitamin_b12_ug: row.vitamin_b12_ug,
      folate_dfe_ug: row.folate_dfe_ug,
    },
    portions: (row.portions as FoodPortion[]) || [],
  };
}

export type FoodInsert = typeof foods.$inferInsert;

export function foodDetailToRow(detail: FoodDetail): FoodInsert {
  return {
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
  };
}

export function createFoodQueries(db: Database) {
  const findById = db
    .select()
    .from(foods)
    .where(eq(foods.fdc_id, sql.placeholder("fdcId")))
    .limit(1)
    .prepare("find_food_by_id");

  return { findById };
}
