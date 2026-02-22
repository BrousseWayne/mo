import { eq, desc } from "drizzle-orm";
import type { Database } from "../client.js";
import { pantryItems } from "../schema.js";

type PantryInsert = typeof pantryItems.$inferInsert;

export async function addPantryItem(db: Database, data: Omit<PantryInsert, "id" | "added_at">) {
  const [inserted] = await db.insert(pantryItems).values(data).returning();
  return inserted;
}

export async function getPantryItems(db: Database) {
  return db.select().from(pantryItems).orderBy(desc(pantryItems.added_at));
}

export async function updatePantryItem(db: Database, id: string, data: Partial<PantryInsert>) {
  const [updated] = await db.update(pantryItems).set(data).where(eq(pantryItems.id, id)).returning();
  return updated;
}

export async function deletePantryItem(db: Database, id: string) {
  const [deleted] = await db.delete(pantryItems).where(eq(pantryItems.id, id)).returning();
  return deleted;
}
