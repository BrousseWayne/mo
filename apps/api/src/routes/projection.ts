import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";
import { projectTrajectory } from "@mo/agents";

export async function projectionRoutes(app: FastifyInstance) {
  app.get("/programs/:id/projection", async (request, reply) => {
    const { id } = request.params as { id: string };

    const programRows = await app.db.execute(sql`
      SELECT target_weight_kg, current_weight_kg, started_at, current_week, target_intake_kcal
      FROM programs WHERE id = ${id}
    `);
    const program = (programRows as unknown[])[0] as Record<string, unknown> | undefined;
    if (!program) {
      reply.code(404);
      return { success: false, error: { code: "NOT_FOUND", message: "Program not found" } };
    }

    const weightRows = await app.db.execute(sql`
      SELECT week_number, weight_kg FROM progress_entries
      WHERE program_id = ${id} ORDER BY week_number ASC
    `);
    const weights = [...weightRows].map((r: Record<string, unknown>) => ({
      week_number: Number(r.week_number),
      weight_kg: Number(r.weight_kg),
    }));

    const targetWeight = Number(program.target_weight_kg);
    const trajectory = projectTrajectory(weights, targetWeight, 26);

    return {
      success: true,
      data: {
        current_weight_kg: Number(program.current_weight_kg),
        target_weight_kg: targetWeight,
        current_week: Number(program.current_week),
        target_intake_kcal: Number(program.target_intake_kcal),
        trajectory,
      },
    };
  });
}
