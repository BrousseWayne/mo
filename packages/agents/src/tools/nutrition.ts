import type { NutritionCache } from "../clients/nutrition-cache.js";

export type NutritionToolName =
  | "search_foods"
  | "get_food_detail"
  | "scale_macros"
  | "scale_micros";

export const nutritionTools = [
  {
    name: "search_foods" as const,
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
    name: "get_food_detail" as const,
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
    name: "scale_macros" as const,
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
    name: "scale_micros" as const,
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
  cache: NutritionCache,
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<unknown> {
  switch (toolName as NutritionToolName) {
    case "search_foods":
      return cache.searchFoods(
        toolInput.query as string,
        toolInput.dataType as string[] | undefined
      );
    case "get_food_detail":
      return cache.getFoodDetail(toolInput.fdcId as number);
    case "scale_macros":
      return cache.scaleMacros(
        toolInput.fdcId as number,
        toolInput.amountGrams as number
      );
    case "scale_micros":
      return cache.scaleMicros(
        toolInput.fdcId as number,
        toolInput.amountGrams as number
      );
    default:
      throw new Error(`Unknown nutrition tool: ${toolName}`);
  }
}
