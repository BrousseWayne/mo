import type { FastifyInstance } from "fastify";
import { eq, desc } from "drizzle-orm";
import { getProgramById, adjustments } from "@mo/database";
import { generateExplanation } from "@mo/agents";

export async function adjustmentRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    "/programs/:id/adjustments",
    async (request, reply) => {
      const program = await getProgramById(app.db, request.params.id);
      if (!program) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Program not found" },
        });
      }

      const limit = request.query.limit ? Number(request.query.limit) : 20;
      const rows = await app.db
        .select()
        .from(adjustments)
        .where(eq(adjustments.program_id, program.id))
        .orderBy(desc(adjustments.created_at))
        .limit(limit);

      const data = rows.map((row) => ({
        ...row,
        explanation: generateExplanation(
          {
            trigger_type: row.trigger_type,
            old_values: (row.old_values ?? {}) as Record<string, unknown>,
            new_values: (row.new_values ?? {}) as Record<string, unknown>,
            reason: row.reason,
            affected_agents: (row.affected_agents ?? []) as string[],
            created_at: row.created_at,
          },
          program
        ),
      }));

      return { success: true, data };
    }
  );
}
