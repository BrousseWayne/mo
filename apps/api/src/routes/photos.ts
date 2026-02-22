import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";

export async function photoRoutes(app: FastifyInstance) {
  app.get("/programs/:id/photos", async (request) => {
    const { id } = request.params as { id: string };
    const rows = await app.db.execute(sql`
      SELECT id, program_id, week_number, photo_type, file_path, metadata, created_at
      FROM progress_photos WHERE program_id = ${id}
      ORDER BY week_number DESC, created_at DESC
    `);
    return { success: true, data: [...rows] };
  });

  app.post("/programs/:id/photos", async (request) => {
    const { id } = request.params as { id: string };
    const { week_number, photo_type, file_path, metadata } = request.body as {
      week_number: number;
      photo_type: string;
      file_path: string;
      metadata?: Record<string, unknown>;
    };

    const result = await app.db.execute(sql`
      INSERT INTO progress_photos (program_id, week_number, photo_type, file_path, metadata)
      VALUES (${id}, ${week_number}, ${photo_type}, ${file_path}, ${JSON.stringify(metadata ?? {})})
      RETURNING id, created_at
    `);
    const row = (result as unknown[])[0] as Record<string, unknown>;

    return { success: true, data: { id: row.id, created_at: row.created_at } };
  });
}
