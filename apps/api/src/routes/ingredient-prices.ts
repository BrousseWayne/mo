import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";

export async function ingredientPriceRoutes(app: FastifyInstance) {
  app.get("/ingredient-prices", async (request) => {
    const { ingredient } = request.query as { ingredient?: string };
    if (ingredient) {
      const rows = await app.db.execute(sql`
        SELECT * FROM ingredient_prices WHERE ingredient_name ILIKE ${"%" + ingredient + "%"}
        ORDER BY recorded_at DESC
      `);
      return { success: true, data: [...rows] };
    }
    const rows = await app.db.execute(sql`
      SELECT * FROM ingredient_prices ORDER BY ingredient_name ASC, recorded_at DESC
    `);
    return { success: true, data: [...rows] };
  });

  app.post("/ingredient-prices", async (request) => {
    const items = request.body as { ingredient_name: string; price_per_kg: number; store?: string }[];
    const inserted: unknown[] = [];
    for (const item of items) {
      const result = await app.db.execute(sql`
        INSERT INTO ingredient_prices (ingredient_name, price_per_kg, store)
        VALUES (${item.ingredient_name}, ${item.price_per_kg}, ${item.store ?? null})
        RETURNING id, ingredient_name, price_per_kg, store, recorded_at
      `);
      inserted.push((result as unknown[])[0]);
    }
    return { success: true, data: inserted };
  });

  app.delete("/ingredient-prices/:id", async (request) => {
    const { id } = request.params as { id: string };
    await app.db.execute(sql`DELETE FROM ingredient_prices WHERE id = ${id}`);
    return { success: true };
  });
}
