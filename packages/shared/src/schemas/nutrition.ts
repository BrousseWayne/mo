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
