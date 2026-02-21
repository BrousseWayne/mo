import type Anthropic from "@anthropic-ai/sdk";
import type { NutritionCache } from "../clients/nutrition-cache.js";

const NUTRITION_TOOL_NAMES = [
  "search_foods",
  "get_food_detail",
  "scale_macros",
  "scale_micros",
] as const;

export type NutritionToolName = (typeof NUTRITION_TOOL_NAMES)[number];

const NUTRITION_TOOL_SET: ReadonlySet<string> = new Set(NUTRITION_TOOL_NAMES);

export function isNutritionTool(name: string): name is NutritionToolName {
  return NUTRITION_TOOL_SET.has(name);
}

export const nutritionTools: Anthropic.Tool[] = [
  {
    name: "search_foods",
    description:
      "Search USDA FoodData Central for foods matching a query. Returns up to 10 results with macros per 100g. Use this to find FDC IDs for specific ingredients.",
    input_schema: {
      type: "object",
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
      type: "object",
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
      type: "object",
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
      type: "object",
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
];

export interface SearchFoodsInput {
  query: string;
  dataType?: string[];
}

export interface FdcIdInput {
  fdcId: number;
}

export interface ScaleInput {
  fdcId: number;
  amountGrams: number;
}

export type NutritionToolInput = SearchFoodsInput | FdcIdInput | ScaleInput;

export async function executeNutritionTool(
  cache: NutritionCache,
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
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
