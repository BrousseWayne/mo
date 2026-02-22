import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";

export async function disruptionRoutes(app: FastifyInstance) {
  app.get("/programs/:id/disruptions", async (request) => {
    const { id } = request.params as { id: string };
    const rows = await app.db.execute(sql`
      SELECT * FROM program_disruptions WHERE program_id = ${id}
      ORDER BY start_date DESC
    `);
    return { success: true, data: [...rows] };
  });

  app.post("/programs/:id/disruptions", async (request) => {
    const { id } = request.params as { id: string };
    const { type, start_date, end_date, notes } = request.body as {
      type: string;
      start_date: string;
      end_date: string;
      notes?: string;
    };

    const result = await app.db.execute(sql`
      INSERT INTO program_disruptions (program_id, type, start_date, end_date, notes)
      VALUES (${id}, ${type}, ${start_date}, ${end_date}, ${notes ?? null})
      RETURNING id, created_at
    `);
    const row = (result as unknown[])[0] as Record<string, unknown>;

    return { success: true, data: { id: row.id, created_at: row.created_at } };
  });

  app.delete("/disruptions/:id", async (request) => {
    const { id } = request.params as { id: string };
    await app.db.execute(sql`DELETE FROM program_disruptions WHERE id = ${id}`);
    return { success: true };
  });
}
