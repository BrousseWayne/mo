import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { UsdaFdcClient } from "../usda-fdc.js";

const MOCK_SEARCH_RESPONSE = {
  foods: [
    {
      fdcId: 171477,
      description: "Chicken, broilers or fryers, thigh, meat and skin, raw",
      dataType: "SR Legacy",
      foodNutrients: [
        { nutrientId: 1008, nutrientName: "Energy", value: 211 },
        { nutrientId: 1003, nutrientName: "Protein", value: 17.27 },
        { nutrientId: 1004, nutrientName: "Total lipid (fat)", value: 15.25 },
        { nutrientId: 1005, nutrientName: "Carbohydrate", value: 0 },
        { nutrientId: 1079, nutrientName: "Fiber", value: 0 },
      ],
    },
  ],
};

const MOCK_DETAIL_RESPONSE = {
  fdcId: 171477,
  description: "Chicken, broilers or fryers, thigh, meat and skin, raw",
  dataType: "SR Legacy",
  foodCategory: { description: "Poultry Products" },
  foodNutrients: [
    { nutrient: { id: 1008, name: "Energy" }, amount: 211 },
    { nutrient: { id: 1003, name: "Protein" }, amount: 17.27 },
    { nutrient: { id: 1004, name: "Total lipid (fat)" }, amount: 15.25 },
    { nutrient: { id: 1005, name: "Carbohydrate" }, amount: 0 },
    { nutrient: { id: 1079, name: "Fiber" }, amount: 0 },
    { nutrient: { id: 1087, name: "Calcium" }, amount: 9 },
    { nutrient: { id: 1089, name: "Iron" }, amount: 0.95 },
    { nutrient: { id: 1114, name: "Vitamin D" }, amount: 0.1 },
    { nutrient: { id: 1178, name: "Vitamin B-12" }, amount: 0.44 },
    { nutrient: { id: 1190, name: "Folate, DFE" }, amount: 6 },
  ],
  foodPortions: [
    { gramWeight: 125, modifier: "thigh" },
    { gramWeight: 85, modifier: "piece" },
  ],
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("UsdaFdcClient constructor", () => {
  test("throws if apiKey is empty", () => {
    expect(() => new UsdaFdcClient("")).toThrow("API key is required");
  });

  test("creates client with valid key", () => {
    const client = new UsdaFdcClient("test-key");
    expect(client).toBeDefined();
  });
});

describe("searchFoods", () => {
  test("returns mapped search results with macros", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(MOCK_SEARCH_RESPONSE),
    });

    const client = new UsdaFdcClient("test-key");
    const results = await client.searchFoods("chicken thigh");

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
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
    });
  });

  test("passes query and pageSize in URL", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ foods: [] }),
    });

    const client = new UsdaFdcClient("test-key");
    await client.searchFoods("rice");

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("query=rice");
    expect(url).toContain("pageSize=10");
    expect(url).toContain("api_key=test-key");
  });

  test("passes dataType filters", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ foods: [] }),
    });

    const client = new UsdaFdcClient("test-key");
    await client.searchFoods("rice", ["Foundation", "SR Legacy"]);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("dataType=Foundation");
    expect(url).toContain("dataType=SR+Legacy");
  });

  test("returns empty array when no foods match", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ foods: [] }),
    });

    const client = new UsdaFdcClient("test-key");
    const results = await client.searchFoods("nonexistent food xyz");
    expect(results).toEqual([]);
  });

  test("throws on HTTP error", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    const client = new UsdaFdcClient("test-key");
    await expect(client.searchFoods("rice")).rejects.toThrow(
      "USDA FDC search failed: 500 Internal Server Error"
    );
  });

  test("handles missing nutrient gracefully (defaults to 0)", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          foods: [
            {
              fdcId: 999,
              description: "Test food",
              dataType: "Foundation",
              foodNutrients: [
                { nutrientId: 1008, nutrientName: "Energy", value: 100 },
                { nutrientId: 1003, nutrientName: "Protein", value: 5 },
              ],
            },
          ],
        }),
    });

    const client = new UsdaFdcClient("test-key");
    const results = await client.searchFoods("test");
    expect(results[0].macros_per_100g.fat_g).toBe(0);
    expect(results[0].macros_per_100g.carbs_g).toBe(0);
    expect(results[0].macros_per_100g.fiber_g).toBe(0);
  });
});

describe("getFoodDetail", () => {
  test("returns full detail with macros, micros, portions", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(MOCK_DETAIL_RESPONSE),
    });

    const client = new UsdaFdcClient("test-key");
    const detail = await client.getFoodDetail(171477);

    expect(detail.fdc_id).toBe(171477);
    expect(detail.category).toBe("Poultry Products");
    expect(detail.macros_per_100g.protein_g).toBe(17.27);
    expect(detail.micros_per_100g.calcium_mg).toBe(9);
    expect(detail.micros_per_100g.iron_mg).toBe(0.95);
    expect(detail.micros_per_100g.vitamin_d_ug).toBe(0.1);
    expect(detail.portions).toEqual([
      { description: "thigh", gram_weight: 125 },
      { description: "piece", gram_weight: 85 },
    ]);
  });

  test("handles missing category", async () => {
    const response = { ...MOCK_DETAIL_RESPONSE, foodCategory: undefined };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(response),
    });

    const client = new UsdaFdcClient("test-key");
    const detail = await client.getFoodDetail(171477);
    expect(detail.category).toBe("");
  });

  test("handles missing portions", async () => {
    const response = { ...MOCK_DETAIL_RESPONSE, foodPortions: undefined };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(response),
    });

    const client = new UsdaFdcClient("test-key");
    const detail = await client.getFoodDetail(171477);
    expect(detail.portions).toEqual([]);
  });

  test("returns null for missing micros", async () => {
    const response = {
      ...MOCK_DETAIL_RESPONSE,
      foodNutrients: MOCK_DETAIL_RESPONSE.foodNutrients.filter(
        (n) => n.nutrient.id < 1087
      ),
    };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(response),
    });

    const client = new UsdaFdcClient("test-key");
    const detail = await client.getFoodDetail(171477);
    expect(detail.micros_per_100g.calcium_mg).toBeNull();
    expect(detail.micros_per_100g.iron_mg).toBeNull();
  });
});

describe("rate limiter", () => {
  test("allows requests within limit", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ foods: [] }),
    });

    const client = new UsdaFdcClient("test-key");
    await client.searchFoods("test1");
    await client.searchFoods("test2");
    await client.searchFoods("test3");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
