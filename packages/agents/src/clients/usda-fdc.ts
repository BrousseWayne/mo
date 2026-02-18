import {
  FDC_BASE_URL,
  FDC_NUTRIENT_IDS,
  FDC_RATE_LIMIT,
  FDC_RATE_WINDOW_MS,
} from "@mo/shared";
import type {
  FoodSearchResult,
  FoodDetail,
  MacrosPer100g,
  MicrosPer100g,
  FoodPortion,
} from "@mo/shared";

interface FdcSearchNutrient {
  nutrientId: number;
  nutrientName: string;
  value: number;
}

interface FdcDetailNutrient {
  nutrient: { id: number; name: string };
  amount?: number;
}

type FdcNutrient = FdcSearchNutrient | FdcDetailNutrient;

interface FdcPortion {
  gramWeight: number;
  modifier?: string;
  measureUnit?: { name: string };
  portionDescription?: string;
}

interface FdcSearchItem {
  fdcId: number;
  description: string;
  dataType: string;
  foodNutrients: FdcNutrient[];
}

interface FdcFoodDetail {
  fdcId: number;
  description: string;
  foodCategory?: { description: string };
  dataType: string;
  foodNutrients: FdcNutrient[];
  foodPortions?: FdcPortion[];
}

interface RateLimitState {
  requests: number[];
}

function getNutrientValue(nutrients: FdcNutrient[], targetId: number): number | undefined {
  for (const n of nutrients) {
    if ("nutrientId" in n && n.nutrientId === targetId) {
      return n.value;
    }
    if ("nutrient" in n && n.nutrient?.id === targetId) {
      return n.amount;
    }
  }
  return undefined;
}

class UsdaFdcClient {
  private apiKey: string;
  private rateLimitState: RateLimitState = { requests: [] };

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("USDA FDC API key is required");
    }
    this.apiKey = apiKey;
  }

  private checkRateLimit(): void {
    const now = Date.now();
    const windowStart = now - FDC_RATE_WINDOW_MS;

    this.rateLimitState.requests = this.rateLimitState.requests.filter(
      (timestamp) => timestamp > windowStart
    );

    if (this.rateLimitState.requests.length >= FDC_RATE_LIMIT) {
      const oldestRequest = this.rateLimitState.requests[0];
      const waitMs = oldestRequest + FDC_RATE_WINDOW_MS - now;
      throw new Error(
        `USDA FDC rate limit exceeded. Retry after ${Math.ceil(waitMs / 1000)}s`
      );
    }

    this.rateLimitState.requests.push(now);
  }

  private extractMacros(nutrients: FdcNutrient[]): MacrosPer100g {
    const energy =
      getNutrientValue(nutrients, FDC_NUTRIENT_IDS.energy) ??
      getNutrientValue(nutrients, FDC_NUTRIENT_IDS.energy_atwater_general) ??
      getNutrientValue(nutrients, FDC_NUTRIENT_IDS.energy_atwater_specific) ??
      0;

    return {
      calories_kcal: energy,
      protein_g: getNutrientValue(nutrients, FDC_NUTRIENT_IDS.protein) ?? 0,
      fat_g: getNutrientValue(nutrients, FDC_NUTRIENT_IDS.fat) ?? 0,
      carbs_g: Math.max(0, getNutrientValue(nutrients, FDC_NUTRIENT_IDS.carbs) ?? 0),
      fiber_g: getNutrientValue(nutrients, FDC_NUTRIENT_IDS.fiber) ?? 0,
    };
  }

  private extractMicros(nutrients: FdcNutrient[]): MicrosPer100g {
    return {
      calcium_mg: getNutrientValue(nutrients, FDC_NUTRIENT_IDS.calcium) ?? null,
      iron_mg: getNutrientValue(nutrients, FDC_NUTRIENT_IDS.iron) ?? null,
      vitamin_d_ug: getNutrientValue(nutrients, FDC_NUTRIENT_IDS.vitamin_d) ?? null,
      vitamin_b12_ug: getNutrientValue(nutrients, FDC_NUTRIENT_IDS.vitamin_b12) ?? null,
      folate_dfe_ug: getNutrientValue(nutrients, FDC_NUTRIENT_IDS.folate_dfe) ?? null,
    };
  }

  private extractPortions(portions?: FdcPortion[]): FoodPortion[] {
    if (!portions || portions.length === 0) return [];
    return portions.map((p) => ({
      description: p.modifier || p.portionDescription || p.measureUnit?.name || "",
      gram_weight: p.gramWeight,
    }));
  }

  async searchFoods(
    query: string,
    dataType?: string[]
  ): Promise<FoodSearchResult[]> {
    this.checkRateLimit();

    const params = new URLSearchParams({
      api_key: this.apiKey,
      query,
      pageSize: "10",
    });

    if (dataType && dataType.length > 0) {
      dataType.forEach((dt) => params.append("dataType", dt));
    }

    const response = await fetch(`${FDC_BASE_URL}/foods/search?${params}`);

    if (!response.ok) {
      throw new Error(
        `USDA FDC search failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const foods: FdcSearchItem[] = data.foods || [];

    return foods.map((food) => ({
      fdc_id: food.fdcId,
      description: food.description,
      data_type: food.dataType,
      macros_per_100g: this.extractMacros(food.foodNutrients),
    }));
  }

  async getFoodDetail(fdcId: number): Promise<FoodDetail> {
    this.checkRateLimit();

    const params = new URLSearchParams({
      api_key: this.apiKey,
    });

    const response = await fetch(`${FDC_BASE_URL}/food/${fdcId}?${params}`);

    if (!response.ok) {
      throw new Error(
        `USDA FDC food detail failed: ${response.status} ${response.statusText}`
      );
    }

    const food: FdcFoodDetail = await response.json();

    return {
      fdc_id: food.fdcId,
      description: food.description,
      category: food.foodCategory?.description || "",
      data_type: food.dataType,
      macros_per_100g: this.extractMacros(food.foodNutrients),
      micros_per_100g: this.extractMicros(food.foodNutrients),
      portions: this.extractPortions(food.foodPortions),
    };
  }
}

export function createUsdaFdcClient(): UsdaFdcClient {
  const apiKey = process.env.USDA_FDC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "USDA_FDC_API_KEY environment variable is required"
    );
  }
  return new UsdaFdcClient(apiKey);
}

export { UsdaFdcClient };
