import type { NutritionCache } from "../clients/nutrition-cache.js";
import type { FoodSearchResult, FoodDetail } from "@mo/shared";

export interface NutritionToolContext {
  nutritionCache: NutritionCache;
}

export async function searchFoods(
  ctx: NutritionToolContext,
  query: string,
  dataType?: string[]
): Promise<FoodSearchResult[]> {
  return ctx.nutritionCache.searchFoods(query, dataType);
}

export async function getFoodDetail(
  ctx: NutritionToolContext,
  fdcId: number
): Promise<FoodDetail> {
  return ctx.nutritionCache.getFoodDetail(fdcId);
}

export async function scaleMacros(
  ctx: NutritionToolContext,
  fdcId: number,
  amountGrams: number
): Promise<{
  fdc_id: number;
  description: string;
  amount_g: number;
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
}> {
  return ctx.nutritionCache.scaleMacros(fdcId, amountGrams);
}

export async function scaleMicros(
  ctx: NutritionToolContext,
  fdcId: number,
  amountGrams: number
): Promise<{
  fdc_id: number;
  description: string;
  amount_g: number;
  calcium_mg: number | null;
  iron_mg: number | null;
  vitamin_d_ug: number | null;
  vitamin_b12_ug: number | null;
  folate_dfe_ug: number | null;
}> {
  return ctx.nutritionCache.scaleMicros(fdcId, amountGrams);
}

export const nutritionTools = [
  {
    name: "search_foods",
    description:
      "Search USDA FoodData Central for foods matching a query. Returns up to 10 results with macros per 100g. Use this to find FDC IDs for specific ingredients.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search term (e.g., 'chicken breast', 'quinoa cooked', 'greek yogurt')",
        },
        dataType: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional filter by data type. Use ['Foundation', 'SR Legacy'] for highest quality data.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_food_detail",
    description:
      "Get complete nutrition data for a specific food by FDC ID. Returns macros, micros, and portion sizes. Data is cached in PostgreSQL after first fetch.",
    input_schema: {
      type: "object" as const,
      properties: {
        fdcId: {
          type: "number",
          description: "USDA FoodData Central ID (from search_foods results)",
        },
      },
      required: ["fdcId"],
    },
  },
  {
    name: "scale_macros",
    description:
      "Calculate scaled macros for a specific food amount. Takes FDC ID and gram amount, returns calories and macros for that portion.",
    input_schema: {
      type: "object" as const,
      properties: {
        fdcId: {
          type: "number",
          description: "USDA FoodData Central ID",
        },
        amountGrams: {
          type: "number",
          description: "Amount in grams to calculate macros for",
        },
      },
      required: ["fdcId", "amountGrams"],
    },
  },
  {
    name: "scale_micros",
    description:
      "Calculate scaled micronutrients for a specific food amount. Returns calcium, iron, vitamin D, B12, and folate for the specified portion. Use for micronutrient-sensitive recipes (Ca-Fe competition, cycle-phase optimization).",
    input_schema: {
      type: "object" as const,
      properties: {
        fdcId: {
          type: "number",
          description: "USDA FoodData Central ID",
        },
        amountGrams: {
          type: "number",
          description: "Amount in grams to calculate micros for",
        },
      },
      required: ["fdcId", "amountGrams"],
    },
  },
] as const;

export async function executeNutritionTool(
  ctx: NutritionToolContext,
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case "search_foods":
      return searchFoods(
        ctx,
        toolInput.query as string,
        toolInput.dataType as string[] | undefined
      );
    case "get_food_detail":
      return getFoodDetail(ctx, toolInput.fdcId as number);
    case "scale_macros":
      return scaleMacros(
        ctx,
        toolInput.fdcId as number,
        toolInput.amountGrams as number
      );
    case "scale_micros":
      return scaleMicros(
        ctx,
        toolInput.fdcId as number,
        toolInput.amountGrams as number
      );
    default:
      throw new Error(`Unknown nutrition tool: ${toolName}`);
  }
}
