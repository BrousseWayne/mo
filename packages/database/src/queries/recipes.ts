import { eq, and, ilike, lte, desc } from "drizzle-orm";
import type { Database } from "../client.js";
import { recipes } from "../schema.js";

type RecipeInsert = typeof recipes.$inferInsert;
type RecipeSelect = typeof recipes.$inferSelect;

export async function upsertRecipe(
  db: Database,
  data: Omit<RecipeInsert, "id" | "created_at">
): Promise<RecipeSelect> {
  const existing = await db
    .select()
    .from(recipes)
    .where(
      and(
        eq(recipes.recipe_name, data.recipe_name),
        eq(recipes.cuisine, data.cuisine)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(recipes)
      .set(data)
      .where(eq(recipes.id, existing[0].id))
      .returning();
    return updated;
  }

  const [inserted] = await db.insert(recipes).values(data).returning();
  return inserted;
}

export async function getRecipeById(
  db: Database,
  id: string
): Promise<RecipeSelect | undefined> {
  const [recipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1);
  return recipe;
}

export async function searchRecipes(
  db: Database,
  opts?: { cuisine?: string; maxPrepMin?: number; limit?: number }
): Promise<RecipeSelect[]> {
  const conditions = [];
  if (opts?.cuisine) conditions.push(ilike(recipes.cuisine, `%${opts.cuisine}%`));
  if (opts?.maxPrepMin) conditions.push(lte(recipes.time_prep, opts.maxPrepMin));

  let query = db.select().from(recipes).orderBy(desc(recipes.created_at)).$dynamic();
  if (conditions.length > 0) query = query.where(and(...conditions));
  if (opts?.limit) query = query.limit(opts.limit);
  return query;
}

export async function updateRecipeRating(
  db: Database,
  id: string,
  rating: number
): Promise<RecipeSelect> {
  const [updated] = await db
    .update(recipes)
    .set({ rating })
    .where(eq(recipes.id, id))
    .returning();
  if (!updated) throw new Error(`Recipe ${id} not found`);
  return updated;
}
