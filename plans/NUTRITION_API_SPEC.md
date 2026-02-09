# USDA FoodData Central Integration Spec

**Status**: Proposed
**Date**: 2026-02-09
**Scope**: Nutrition data API integration for deterministic macro validation in CHEF and DIETITIAN agents

---

## 1. Problem Statement

All macro data in MO is hardcoded in markdown artifacts. CHEF creates recipes with manually estimated totals. DIETITIAN specifies slot targets without ingredient-level validation. No mechanism verifies that a recipe's ingredients sum to claimed macros.

This spec introduces a USDA FoodData Central integration so that every ingredient reference resolves to real, government-sourced nutritional data. Secondary benefits: grocery list generation, inventory tracking, cost estimation, picture-based tracking (future).

---

## 2. USDA FDC API Integration

### 2.1 API Details

| Parameter | Value |
|-----------|-------|
| Base URL | `https://api.nal.usda.gov/fdc/v1` |
| Auth | Query param `api_key` from env var `USDA_FDC_API_KEY` |
| Rate limit | 1000 requests/hour |
| Cost | Free |
| Maintainer | USDA Agricultural Research Service |

### 2.2 Datasets

| Dataset | Foods | Quality | Use |
|---------|-------|---------|-----|
| Foundation Foods | ~370 | Highest (multi-lab, documented methods) | Primary lookup |
| SR Legacy | ~7800 | High (USDA standard reference) | Fallback when Foundation has no match |

Search queries filter by `dataType` in this order: `Foundation` first, `SR Legacy` fallback.

### 2.3 Endpoints

**Search**: `GET /v1/foods/search`

```
?query=chicken+breast&dataType=Foundation,SR%20Legacy&pageSize=5&api_key={key}
```

Response fields used: `fdcId`, `description`, `dataType`, `foodNutrients[]`.

**Detail**: `GET /v1/food/{fdcId}`

```
?api_key={key}
```

Response fields used: `fdcId`, `description`, `foodCategory`, `foodNutrients[]`, `foodPortions[]`.

### 2.4 Nutrient IDs

| Nutrient | FDC Nutrient ID | Unit | Category | Clinical Relevance |
|----------|----------------|------|----------|-------------------|
| Energy | 1008 | kcal | Macro | Caloric balance |
| Protein | 1003 | g | Macro | MPS, lean mass |
| Total Fat | 1004 | g | Macro | Hormonal function (Mumford 2016) |
| Carbohydrates | 1005 | g | Macro | Training fuel |
| Fiber | 1079 | g | Macro | GI health |
| Calcium | 1087 | mg | Micro | Bone density (underweight risk) |
| Iron | 1089 | mg | Micro | Deficiency prevalence in young women |
| Vitamin D | 1114 | ug | Micro | Bone health, hormonal |
| Vitamin B12 | 1178 | ug | Micro | Energy metabolism, neurological |
| Folate DFE | 1190 | ug | Micro | Reproductive health |

Micros selected for clinical relevance to underweight women (iron deficiency, bone density, hormonal function, reproductive health).

### 2.5 Client Implementation

Location: `packages/agents/src/clients/usda-fdc.ts`

Thin custom wrapper (~100 lines). No npm package dependency.

```typescript
interface USDAClientConfig {
  apiKey: string;
  baseUrl?: string;
}

interface FoodSearchResult {
  fdc_id: number;
  description: string;
  data_type: string;
  macros_per_100g: MacrosPer100g;
}

interface FoodDetail {
  fdc_id: number;
  description: string;
  category: string;
  data_type: string;
  macros_per_100g: MacrosPer100g;
  micros_per_100g: MicrosPer100g;
  portions: FoodPortion[];
}

interface FoodPortion {
  description: string;
  gram_weight: number;
}
```

Methods:

| Method | Signature | Returns |
|--------|-----------|---------|
| `searchFoods` | `(query: string, pageSize?: number) => Promise<FoodSearchResult[]>` | Top N results with per-100g macros |
| `getFoodDetail` | `(fdcId: number) => Promise<FoodDetail>` | Full detail with macros, micros, portions |

Default `pageSize`: 5.

**Rate limiter**: In-process sliding window. Tracks request timestamps in an array, rejects if >1000 in the trailing 3600s window. No external dependency.

**Error handling**:
- Missing `USDA_FDC_API_KEY`: throw on construction (fail fast)
- HTTP 429 or 5xx: retry once after 1s delay, then throw
- 0 search results: return empty array (not an error)
- Network timeout: 10s per request

---

## 3. Database Schema

### 3.1 `foods` Table

Location: `packages/database/src/schema/foods.ts`

```typescript
import { pgTable, integer, text, decimal, jsonb, timestamp, index } from "drizzle-orm/pg-core";

export const foods = pgTable("foods", {
  fdc_id: integer("fdc_id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  data_type: text("data_type").notNull(),

  calories_kcal: decimal("calories_kcal", { precision: 7, scale: 2 }).notNull(),
  protein_g: decimal("protein_g", { precision: 7, scale: 2 }).notNull(),
  fat_g: decimal("fat_g", { precision: 7, scale: 2 }).notNull(),
  carbs_g: decimal("carbs_g", { precision: 7, scale: 2 }).notNull(),
  fiber_g: decimal("fiber_g", { precision: 7, scale: 2 }).notNull(),

  calcium_mg: decimal("calcium_mg", { precision: 7, scale: 2 }),
  iron_mg: decimal("iron_mg", { precision: 7, scale: 2 }),
  vitamin_d_ug: decimal("vitamin_d_ug", { precision: 7, scale: 3 }),
  vitamin_b12_ug: decimal("vitamin_b12_ug", { precision: 7, scale: 3 }),
  folate_dfe_ug: decimal("folate_dfe_ug", { precision: 7, scale: 2 }),

  portions: jsonb("portions").notNull().default([]),
  fetched_at: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameSearchIdx: index("idx_foods_name_gin").using("gin", table.name),
}));
```

Design decisions:

- **`fdc_id` as integer PK**: USDA's own identifier. Not a UUID. Avoids mapping layer.
- **All macros per 100g, NOT NULL**: Every USDA food has these. Enforces data quality.
- **Micros nullable**: Not all USDA entries have complete micro data.
- **`portions` JSONB**: Array of `{ description, gram_weight }` from USDA `foodPortions`. Common serving sizes.
- **`fetched_at` timestamp**: Tracks data freshness. USDA data is stable; no automatic expiry.
- **GIN index on `name`**: Full-text search fallback when querying locally cached foods.

### 3.2 Recipe-Foods Link

The existing `recipes.ingredients` JSONB (defined in `DATABASE_SCHEMA.md` section 2.5) gains an optional `fdc_id` field per ingredient:

```json
{
  "item": "chicken thigh, skin-on",
  "amount_g": 150,
  "prep_notes": "from batch cook",
  "fdc_id": 171477
}
```

No foreign key constraint (JSONB limitation). Validated at application level: when `fdc_id` is present, the food must exist in the `foods` table.

---

## 4. Redis Cache Layer

### 4.1 Key Patterns

| Key Pattern | Value | TTL | Rationale |
|-------------|-------|-----|-----------|
| `fdc:food:{fdcId}` | `FoodDetail` JSON | 30 days | USDA data is stable; long TTL reduces API calls |
| `fdc:search:{sha256(query)}` | `FoodSearchResult[]` JSON | 7 days | Search results may update as USDA adds foods |

Search cache key uses SHA-256 hash of the lowercased, trimmed query string.

### 4.2 Lookup Cascade

```
Request → Redis → PostgreSQL → USDA API
```

Each level backfills the one above on miss:
1. Check Redis for cached result
2. On Redis miss: check PostgreSQL `foods` table
3. On PostgreSQL miss: call USDA API, write to PostgreSQL, write to Redis

TTL-based expiry only. No manual invalidation needed (USDA data is stable).

### 4.3 Cache Implementation

Location: `packages/agents/src/clients/nutrition-cache.ts`

```typescript
interface NutritionCacheConfig {
  redis: Redis;
  db: Database;
  usdaClient: USDAClient;
}
```

The cache layer wraps `USDAClient` and adds the two-tier lookup. Consumers interact with the cache layer, not `USDAClient` directly.

---

## 5. Tool Definitions

Location: `packages/agents/src/tools/nutrition.ts`

Three tools following the existing SCIENTIST tool pattern (`packages/agents/src/tools/scientist.ts`):

### 5.1 `search_food`

Search USDA for an ingredient, return top 5 matches with per-100g macros.

```typescript
{
  name: "search_food",
  description: "Search USDA FoodData Central for a food ingredient. Returns top 5 matches with per-100g macros (calories, protein, fat, carbs, fiber). Use this to find the fdc_id for an ingredient before getting scaled macros.",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Food search query (e.g. 'chicken breast raw', 'jasmine rice cooked')" }
    },
    required: ["query"]
  }
}
```

Output:

```json
{
  "results": [
    {
      "fdc_id": 171477,
      "description": "Chicken, broilers or fryers, thigh, meat and skin, raw",
      "data_type": "SR Legacy",
      "macros_per_100g": {
        "calories_kcal": 211,
        "protein_g": 17.27,
        "fat_g": 15.25,
        "carbs_g": 0,
        "fiber_g": 0
      }
    }
  ],
  "total_hits": 42
}
```

### 5.2 `get_food_macros`

Get scaled macronutrients for a specific food at a specific gram amount.

```typescript
{
  name: "get_food_macros",
  description: "Get macronutrients for a specific food scaled to the given gram amount. Requires fdc_id from search_food. Returns calories, protein, fat, carbs, fiber for the specified weight.",
  input_schema: {
    type: "object",
    properties: {
      fdc_id: { type: "number", description: "USDA FDC food identifier" },
      amount_g: { type: "number", description: "Amount in grams to calculate macros for" }
    },
    required: ["fdc_id", "amount_g"]
  }
}
```

Output:

```json
{
  "fdc_id": 171477,
  "description": "Chicken, broilers or fryers, thigh, meat and skin, raw",
  "amount_g": 150,
  "calories_kcal": 316.5,
  "protein_g": 25.91,
  "fat_g": 22.88,
  "carbs_g": 0,
  "fiber_g": 0
}
```

Calculation: `(per_100g_value / 100) * amount_g`, rounded to 2 decimal places.

### 5.3 `get_food_micros`

Get scaled micronutrients for a specific food at a specific gram amount.

```typescript
{
  name: "get_food_micros",
  description: "Get micronutrients (calcium, iron, vitamin D, B12, folate) for a specific food scaled to the given gram amount. Use this to check micronutrient adequacy of recipes.",
  input_schema: {
    type: "object",
    properties: {
      fdc_id: { type: "number", description: "USDA FDC food identifier" },
      amount_g: { type: "number", description: "Amount in grams to calculate micros for" }
    },
    required: ["fdc_id", "amount_g"]
  }
}
```

Output:

```json
{
  "fdc_id": 171477,
  "description": "Chicken, broilers or fryers, thigh, meat and skin, raw",
  "amount_g": 150,
  "calcium_mg": 9.0,
  "iron_mg": 0.98,
  "vitamin_d_ug": 0.15,
  "vitamin_b12_ug": 0.44,
  "folate_dfe_ug": 9.0
}
```

Null micros returned as `null` (not 0) to distinguish "not present in USDA data" from "contains zero".

### 5.4 Key Differences from SCIENTIST Tools

SCIENTIST tools are **synchronous pure functions** (deterministic math). Nutrition tools are **async** (I/O bound: Redis, PostgreSQL, USDA API).

SCIENTIST tools are standalone: `toolExecutors` is a plain `Record<string, (input) => unknown>`.

Nutrition tools require injected context (client instances). Created via factory:

```typescript
interface NutritionToolContext {
  cache: NutritionCache;
}

function createNutritionToolDefinitions(): Anthropic.Tool[]

function createNutritionToolExecutors(
  ctx: NutritionToolContext
): Record<string, (input: Record<string, unknown>) => Promise<unknown>>
```

The pipeline runner creates `NutritionToolContext` once at startup and passes it when running CHEF and DIETITIAN agents.

---

## 6. Agent Tool Availability

| Agent | `search_food` | `get_food_macros` | `get_food_micros` |
|-------|:---:|:---:|:---:|
| SCIENTIST | - | - | - |
| NUTRITIONIST | - | - | - |
| DIETITIAN | Yes | Yes | - |
| CHEF | Yes | Yes | Yes |
| COACH | - | - | - |
| PHYSICIAN | - | - | - |

Rationale:
- **CHEF** gets all three: builds recipes ingredient by ingredient, needs both macros and micros for complete nutritional profiles.
- **DIETITIAN** gets search + macros: validates protein assumptions for primary sources in slot specs. Does not need micros (not building ingredient-level breakdowns).
- **SCIENTIST** has no use: works with aggregate targets, not individual foods.
- **NUTRITIONIST** has no use: works with strategy and distribution, not individual foods.
- **COACH** has no use: training programming only.

---

## 7. Agent Prompt Updates

### 7.1 CHEF System Prompt Additions

Add to `agents/CHEF.md` system prompt:

```
NUTRITION DATA TOOLS:
You have access to 3 nutrition lookup tools. You MUST use these tools for every recipe you create.

Workflow for each recipe:
1. For each ingredient, call search_food to find the USDA entry
2. Select the best match (prefer Foundation Foods over SR Legacy)
3. Call get_food_macros with the fdc_id and exact gram amount
4. Sum all ingredient macros to compute recipe totals
5. Compare computed totals against DIETITIAN slot spec
6. Tolerance: computed macros must be within ±10% of slot spec for calories and protein
7. If outside tolerance: adjust ingredient amounts or substitute ingredients, then re-verify
8. Include fdc_id in each ingredient entry in the output

For micronutrient reporting:
- Call get_food_micros for key ingredients (protein sources, dairy, leafy greens)
- Include micro totals in recipe output when available

SEARCH TIPS:
- Search for the correct state: "chicken breast raw" vs "chicken breast cooked"
- Use specific terms: "jasmine rice cooked" not just "rice"
- If a search returns no results, try broader terms
- Foundation Foods entries are higher quality — prefer them when available
```

### 7.2 DIETITIAN System Prompt Additions

Add to `agents/DIETITIAN.md` system prompt:

```
NUTRITION DATA TOOLS:
You have access to 2 nutrition lookup tools (search_food, get_food_macros). Use them for VALIDATION only.

When to use:
- Verify per-100g protein content of primary protein sources in your slot assignments
- Confirm that a protein source can realistically hit the slot spec protein target at reasonable portion sizes
- Do NOT build ingredient-level breakdowns — that is CHEF's job

Example: if assigning "chicken thigh" as primary protein for a 30g protein slot, call search_food("chicken thigh raw") to verify per-100g protein, then confirm the required portion size is reasonable.
```

### 7.3 CHEF Output Schema Update

The existing CHEF output schema (`pipeline.md` section 4.5) `recipes[].ingredients[]` gains `fdc_id`:

```json
{
  "item": "chicken thigh, skin-on",
  "amount_g": 150,
  "prep_notes": "from batch cook",
  "fdc_id": 171477
}
```

The existing `macros_per_serving` field remains but is now computed from tool results rather than estimated.

---

## 8. Shared Package Updates

### 8.1 Zod Schemas

New file: `packages/shared/src/schemas/nutrition.ts`

```typescript
import { z } from "zod";

export const macrosPer100gSchema = z.object({
  calories_kcal: z.number(),
  protein_g: z.number(),
  fat_g: z.number(),
  carbs_g: z.number(),
  fiber_g: z.number(),
});

export type MacrosPer100g = z.infer<typeof macrosPer100gSchema>;

export const microsPer100gSchema = z.object({
  calcium_mg: z.number().nullable(),
  iron_mg: z.number().nullable(),
  vitamin_d_ug: z.number().nullable(),
  vitamin_b12_ug: z.number().nullable(),
  folate_dfe_ug: z.number().nullable(),
});

export type MicrosPer100g = z.infer<typeof microsPer100gSchema>;

export const foodPortionSchema = z.object({
  description: z.string(),
  gram_weight: z.number(),
});

export type FoodPortion = z.infer<typeof foodPortionSchema>;

export const foodSearchResultSchema = z.object({
  fdc_id: z.number(),
  description: z.string(),
  data_type: z.string(),
  macros_per_100g: macrosPer100gSchema,
});

export type FoodSearchResult = z.infer<typeof foodSearchResultSchema>;

export const foodDetailSchema = z.object({
  fdc_id: z.number(),
  description: z.string(),
  category: z.string(),
  data_type: z.string(),
  macros_per_100g: macrosPer100gSchema,
  micros_per_100g: microsPer100gSchema,
  portions: z.array(foodPortionSchema),
});

export type FoodDetail = z.infer<typeof foodDetailSchema>;

export const scaledMacrosSchema = z.object({
  fdc_id: z.number(),
  description: z.string(),
  amount_g: z.number(),
  calories_kcal: z.number(),
  protein_g: z.number(),
  fat_g: z.number(),
  carbs_g: z.number(),
  fiber_g: z.number(),
});

export type ScaledMacros = z.infer<typeof scaledMacrosSchema>;

export const scaledMicrosSchema = z.object({
  fdc_id: z.number(),
  description: z.string(),
  amount_g: z.number(),
  calcium_mg: z.number().nullable(),
  iron_mg: z.number().nullable(),
  vitamin_d_ug: z.number().nullable(),
  vitamin_b12_ug: z.number().nullable(),
  folate_dfe_ug: z.number().nullable(),
});

export type ScaledMicros = z.infer<typeof scaledMicrosSchema>;
```

### 8.2 Constants

Add to `packages/shared/src/constants.ts`:

```typescript
export const FDC_NUTRIENT_IDS = {
  energy: 1008,
  protein: 1003,
  fat: 1004,
  carbs: 1005,
  fiber: 1079,
  calcium: 1087,
  iron: 1089,
  vitamin_d: 1114,
  vitamin_b12: 1178,
  folate_dfe: 1190,
} as const;

export const FDC_MACRO_IDS = [1008, 1003, 1004, 1005, 1079] as const;
export const FDC_MICRO_IDS = [1087, 1089, 1114, 1178, 1190] as const;

export const FDC_BASE_URL = "https://api.nal.usda.gov/fdc/v1";
export const FDC_RATE_LIMIT = 1000;
export const FDC_RATE_WINDOW_MS = 3_600_000;
```

---

## 9. Pipeline Impact

### 9.1 No Flow Change

The pipeline sequence remains: SCIENTIST → NUTRITIONIST → DIETITIAN → CHEF → COACH. Tools are additive — they do not alter the data flow between agents.

### 9.2 AgentContext Extension

The `AgentContext` interface (`packages/agents/src/types.ts`) gains an optional field:

```typescript
export interface AgentContext {
  intake: IntakeData;
  previousOutputs: AgentEnvelope[];
  runId: string;
  nutritionTools?: NutritionToolContext;
}
```

The pipeline runner injects `nutritionTools` for CHEF and DIETITIAN only. Other agents receive `undefined`.

### 9.3 Agent Runner Modification

When running CHEF or DIETITIAN, the agent runner merges nutrition tool definitions and executors with any existing tools:

```typescript
const tools = [
  ...agentSpecificTools,
  ...(context.nutritionTools ? createNutritionToolDefinitions() : []),
];

const executors = {
  ...agentSpecificExecutors,
  ...(context.nutritionTools ? createNutritionToolExecutors(context.nutritionTools) : {}),
};
```

The tool-use loop in `runScientist` (handling `stop_reason === "tool_use"`) already supports async executors via the `Promise` return type. The same pattern extends to CHEF and DIETITIAN runners with `await` on executor calls.

### 9.4 Post-CHEF Verification

After CHEF completes, the pipeline runner performs a validation step:

1. For each recipe in CHEF output, sum `ingredients[].amount_g` macros (via `fdc_id` lookups in the `foods` table)
2. Compare summed macros against `macros_per_serving`
3. Log discrepancies >10% as warnings (do not fail the pipeline)

This catches cases where CHEF's tool-derived totals and its reported totals diverge.

---

## 10. Artifact Impact

| File | Change |
|------|--------|
| `agents/artifacts/chef-shake-recipes.md` | Becomes template/example only. Runtime macros sourced from API tool calls. Existing recipes serve as search query guidance for CHEF. |
| `agents/artifacts/chef-batch-cooking.md` | Unchanged. Cooking protocols, sauce rotation, and technique instructions are not affected by nutrition data. |
| `agents/artifacts/dietitian-meal-template.md` | Structure unchanged. Slot targets still flow from SCIENTIST → NUTRITIONIST. Template serves as structural reference for DIETITIAN. |

---

## 11. Implementation Phases

### Phase 1: Foundation

- USDA client (`usda-fdc.ts`) with rate limiter
- `foods` table schema and migration
- Zod schemas (`nutrition.ts`) and constants
- Tool definitions and executors (`nutrition.ts`)
- Unit tests: client, rate limiter, tool executors with mocked API

### Phase 2: Cache + CHEF Integration

- Redis cache layer (`nutrition-cache.ts`)
- `AgentContext` extension with `NutritionToolContext`
- CHEF agent runner with nutrition tools injected
- CHEF system prompt update
- Integration test: CHEF recipe generation with real USDA data

### Phase 3: DIETITIAN Integration

- DIETITIAN agent runner with nutrition tools injected
- DIETITIAN system prompt update
- Post-CHEF verification step in pipeline runner
- Integration test: full DIETITIAN → CHEF flow with validation

### Phase 4: Micros + Utilities

- `get_food_micros` tool activation for CHEF
- Micronutrient reporting in recipe output
- Grocery list aggregation utility (collect `fdc_id` + `amount_g` across weekly plan, group by food, sum amounts)

---

## 12. Future Extensions

From `ideas.md` and related planning:

| Extension | Description | Depends On |
|-----------|-------------|------------|
| Grocery list aggregation | Collect `fdc_id` + `amount_g` across weekly plan, group by food, sum quantities, output shopping list | Phase 1 (foods table, fdc_id in ingredients) |
| Inventory tracking | `pantry_items` table tracking current stock. CHEF prefers in-stock ingredients. | Grocery list |
| Picture-based tracking | Vision model → food recognition → `search_food` → macros. Compliance tracking from photos. | Phase 1 (search_food tool) |
| Cost estimation | Price-per-kg data source, per-recipe and per-week cost calculation | Grocery list |

---

## 13. Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| USDA API down | Cannot look up new foods | Low (government service, high uptime) | PostgreSQL permanent cache serves all previously fetched foods. Pipeline only fails on never-seen foods during outage. |
| Rate limit hit (1000/hr) | API calls rejected | Very low | In-process sliding window limiter. Typical pipeline: ~30-50 food lookups, well under limit. Cache prevents repeated lookups. |
| Food not in USDA database | No match for uncommon ingredient | Medium | CHEF falls back to manual estimation with a logged warning. `fdc_id` omitted from that ingredient. Review queue for manual additions. |
| Raw vs cooked confusion | Wrong macro values (e.g., raw rice vs cooked rice) | Medium | System prompt explicitly instructs agents to search for the correct state. Search tips include examples. |
| Token cost increase | More tokens per pipeline run | Low impact | ~200 tokens per tool round-trip × ~30-50 calls = 6,000-10,000 extra tokens. At Sonnet 4.5 pricing: <$0.01/run. |
| Stale USDA data | Nutrition values change | Very low | USDA Foundation Foods are analytically determined and rarely change. `fetched_at` timestamp allows future staleness checks. |

---

## 14. Cost Impact

| Component | Per Pipeline Run | Monthly (100 users, 4 runs each) |
|-----------|-----------------|----------------------------------|
| USDA API calls | 30-50 (free) | ~20,000 (free, within limits) |
| Redis operations | 30-50 reads, ~5 writes | ~14,000 reads, ~2,000 writes |
| PostgreSQL queries | ~5 (cache misses only after warmup) | ~2,000 |
| LLM token overhead | ~6,000-10,000 tokens | ~2.4M-4M tokens |
| LLM cost overhead | <$0.01 | <$4.00 |

No infrastructure cost increase. Redis and PostgreSQL are already in the stack.

---

## 15. Verification Checklist

- [ ] `foods` table schema matches Drizzle conventions (`packages/database/src/schema.ts` patterns)
- [ ] Zod schemas match tool I/O (input → output type consistency)
- [ ] Tool definitions follow Anthropic `Tool` format (matches `scientist.ts` pattern)
- [ ] Tool executors follow factory pattern for async tools
- [ ] `AgentContext` extension is backwards-compatible (optional field)
- [ ] CHEF output schema still matches `pipeline.md` section 4.5 (additive `fdc_id` only)
- [ ] DIETITIAN output schema unchanged
- [ ] Redis key patterns do not conflict with existing keys (`DATABASE_SCHEMA.md` section 4)
- [ ] Rate limiter does not depend on Redis (in-process only)
- [ ] All constants in `@mo/shared` (no magic numbers in tool code)
