export interface IngredientData {
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
  calories: number;
}

export const INGREDIENT_TABLE: Record<string, IngredientData> = {
  "chicken thigh": { protein_g: 19.5, fat_g: 10.9, carbs_g: 0, fiber_g: 0, calories: 177 },
  "chicken breast": { protein_g: 31, fat_g: 3.6, carbs_g: 0, fiber_g: 0, calories: 165 },
  "salmon": { protein_g: 20, fat_g: 13, carbs_g: 0, fiber_g: 0, calories: 208 },
  "beef": { protein_g: 26, fat_g: 15, carbs_g: 0, fiber_g: 0, calories: 250 },
  "ground beef": { protein_g: 17, fat_g: 20, carbs_g: 0, fiber_g: 0, calories: 254 },
  "eggs": { protein_g: 13, fat_g: 11, carbs_g: 1, fiber_g: 0, calories: 155 },
  "rice": { protein_g: 2.7, fat_g: 0.3, carbs_g: 28, fiber_g: 0.4, calories: 130 },
  "oats": { protein_g: 13.2, fat_g: 6.5, carbs_g: 67.7, fiber_g: 10.1, calories: 379 },
  "pasta": { protein_g: 5.8, fat_g: 0.9, carbs_g: 31, fiber_g: 1.8, calories: 157 },
  "potato": { protein_g: 2, fat_g: 0.1, carbs_g: 17, fiber_g: 2.2, calories: 77 },
  "sweet potato": { protein_g: 1.6, fat_g: 0.1, carbs_g: 20, fiber_g: 3, calories: 86 },
  "whole milk": { protein_g: 3.3, fat_g: 3.3, carbs_g: 4.8, fiber_g: 0, calories: 61 },
  "whey protein": { protein_g: 75, fat_g: 5, carbs_g: 10, fiber_g: 0, calories: 390 },
  "casein": { protein_g: 70, fat_g: 3, carbs_g: 15, fiber_g: 0, calories: 370 },
  "banana": { protein_g: 1.1, fat_g: 0.3, carbs_g: 23, fiber_g: 2.6, calories: 89 },
  "olive oil": { protein_g: 0, fat_g: 100, carbs_g: 0, fiber_g: 0, calories: 884 },
  "tahini": { protein_g: 17, fat_g: 53.8, carbs_g: 21.2, fiber_g: 9.3, calories: 595 },
  "sunflower seed butter": { protein_g: 17.3, fat_g: 51.5, carbs_g: 24, fiber_g: 5.6, calories: 617 },
  "greek yogurt": { protein_g: 10, fat_g: 5, carbs_g: 3.6, fiber_g: 0, calories: 97 },
  "cottage cheese": { protein_g: 11, fat_g: 4.3, carbs_g: 3.4, fiber_g: 0, calories: 98 },
  "avocado": { protein_g: 2, fat_g: 15, carbs_g: 9, fiber_g: 7, calories: 160 },
  "quinoa": { protein_g: 4.4, fat_g: 1.9, carbs_g: 21.3, fiber_g: 2.8, calories: 120 },
  "broccoli": { protein_g: 2.8, fat_g: 0.4, carbs_g: 7, fiber_g: 2.6, calories: 34 },
  "spinach": { protein_g: 2.9, fat_g: 0.4, carbs_g: 3.6, fiber_g: 2.2, calories: 23 },
  "bok choy": { protein_g: 1.5, fat_g: 0.2, carbs_g: 2.2, fiber_g: 1, calories: 13 },
  "coconut cream": { protein_g: 2.3, fat_g: 21, carbs_g: 6.6, fiber_g: 0, calories: 197 },
  "coconut milk": { protein_g: 2.3, fat_g: 24, carbs_g: 6, fiber_g: 0, calories: 230 },
  "honey": { protein_g: 0.3, fat_g: 0, carbs_g: 82, fiber_g: 0, calories: 304 },
  "cheddar cheese": { protein_g: 25, fat_g: 33, carbs_g: 1.3, fiber_g: 0, calories: 403 },
  "parmesan": { protein_g: 36, fat_g: 26, carbs_g: 3.2, fiber_g: 0, calories: 392 },
  "butter": { protein_g: 0.9, fat_g: 81, carbs_g: 0.1, fiber_g: 0, calories: 717 },
  "cream": { protein_g: 2.1, fat_g: 36, carbs_g: 2.8, fiber_g: 0, calories: 340 },
  "feta": { protein_g: 14, fat_g: 21, carbs_g: 4, fiber_g: 0, calories: 264 },
  "toast": { protein_g: 9, fat_g: 3.2, carbs_g: 49, fiber_g: 2.7, calories: 265 },
  "granola": { protein_g: 11, fat_g: 18, carbs_g: 64, fiber_g: 5, calories: 471 },
  "berries": { protein_g: 0.7, fat_g: 0.3, carbs_g: 14.5, fiber_g: 2, calories: 57 },
  "mango": { protein_g: 0.8, fat_g: 0.4, carbs_g: 15, fiber_g: 1.6, calories: 60 },
  "dates": { protein_g: 2.5, fat_g: 0.4, carbs_g: 75, fiber_g: 8, calories: 282 },
  "cocoa powder": { protein_g: 20, fat_g: 14, carbs_g: 58, fiber_g: 33, calories: 228 },
  "sesame seeds": { protein_g: 17, fat_g: 50, carbs_g: 23, fiber_g: 12, calories: 573 },
  "walnuts": { protein_g: 15, fat_g: 65, carbs_g: 14, fiber_g: 7, calories: 654 },
};

export function lookupIngredient(name: string): IngredientData | null {
  const lower = name.toLowerCase().trim();
  if (INGREDIENT_TABLE[lower]) return INGREDIENT_TABLE[lower];
  for (const [key, data] of Object.entries(INGREDIENT_TABLE)) {
    if (lower.includes(key) || key.includes(lower)) return data;
  }
  return null;
}
