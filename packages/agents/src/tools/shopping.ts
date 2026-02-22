interface RecipeIngredient {
  item: string;
  amount_g: number;
}

interface Recipe {
  recipe_name: string;
  ingredients: RecipeIngredient[];
}

interface ShoppingItem {
  name: string;
  total_amount_g: number;
  unit: string;
  recipes: string[];
}

interface ShoppingCategory {
  category: string;
  items: ShoppingItem[];
}

const CATEGORY_MAP: Record<string, string> = {
  chicken_breast: "protein",
  chicken_thigh: "protein",
  salmon: "protein",
  tuna: "protein",
  shrimp: "protein",
  beef_lean: "protein",
  turkey_breast: "protein",
  egg: "protein",
  tofu: "protein",
  tempeh: "protein",
  greek_yogurt: "dairy",
  cottage_cheese: "dairy",
  mozzarella: "dairy",
  parmesan: "dairy",
  cheddar: "dairy",
  whole_milk: "dairy",
  butter: "dairy",
  cream_cheese: "dairy",
  white_rice: "pantry",
  brown_rice: "pantry",
  pasta: "pantry",
  oats: "pantry",
  quinoa: "pantry",
  bread_whole_wheat: "pantry",
  flour: "pantry",
  olive_oil: "pantry",
  coconut_oil: "pantry",
  honey: "pantry",
  tahini: "pantry",
  soy_sauce: "pantry",
  sweet_potato: "produce",
  potato: "produce",
  banana: "produce",
  avocado: "produce",
  broccoli: "produce",
  spinach: "produce",
  tomato: "produce",
  onion: "produce",
  garlic: "produce",
  lemon: "produce",
  bell_pepper: "produce",
  carrot: "produce",
  cucumber: "produce",
  lettuce: "produce",
  apple: "produce",
};

function categorize(ingredient: string): string {
  const normalized = ingredient.toLowerCase().replace(/\s+/g, "_");
  if (CATEGORY_MAP[normalized]) return CATEGORY_MAP[normalized];
  for (const [key, cat] of Object.entries(CATEGORY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) return cat;
  }
  if (/salt|pepper|cumin|paprika|oregano|basil|thyme|cinnamon|turmeric|chili|cayenne/.test(normalized)) return "spices";
  return "pantry";
}

export function generateShoppingList(recipes: Recipe[]): ShoppingCategory[] {
  const itemMap = new Map<string, { total_g: number; recipes: Set<string> }>();

  for (const recipe of recipes) {
    if (!recipe.ingredients) continue;
    const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    for (const ing of ingredients) {
      const key = ing.item.toLowerCase().trim();
      const entry = itemMap.get(key) ?? { total_g: 0, recipes: new Set<string>() };
      entry.total_g += ing.amount_g;
      entry.recipes.add(recipe.recipe_name);
      itemMap.set(key, entry);
    }
  }

  const categoryItems = new Map<string, ShoppingItem[]>();
  for (const [name, data] of itemMap) {
    const cat = categorize(name);
    const items = categoryItems.get(cat) ?? [];
    items.push({
      name,
      total_amount_g: Math.round(data.total_g),
      unit: "g",
      recipes: [...data.recipes],
    });
    categoryItems.set(cat, items);
  }

  const order = ["produce", "protein", "dairy", "pantry", "spices"];
  return order
    .filter((cat) => categoryItems.has(cat))
    .map((cat) => ({ category: cat, items: categoryItems.get(cat)! }))
    .concat(
      [...categoryItems.entries()]
        .filter(([cat]) => !order.includes(cat))
        .map(([category, items]) => ({ category, items }))
    );
}
