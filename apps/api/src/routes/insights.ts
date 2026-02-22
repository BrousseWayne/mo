import type { FastifyInstance } from "fastify";
import { getProgramById, getProgressHistory, computeWeekNumber, getSessionsForWeek } from "@mo/database";
import { generateInsights } from "@mo/agents";

export async function insightRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>(
    "/programs/:id/insights",
    async (request, reply) => {
      const program = await getProgramById(app.db, request.params.id);
      if (!program) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Program not found" },
        });
      }

      const entries = await getProgressHistory(app.db, program.id, { limit: 20 });
      const weekNumber = computeWeekNumber(program);
      const allSessions: { week_number: number; day_of_week: string; status: string; exercises: unknown }[] = [];
      for (let w = Math.max(1, weekNumber - 8); w <= weekNumber; w++) {
        const ws = await getSessionsForWeek(app.db, program.id, w);
        for (const s of ws) allSessions.push({ week_number: s.week_number, day_of_week: s.day_of_week, status: s.status, exercises: s.exercises });
      }

      const insights = generateInsights(
        entries.map((e) => ({
          week_number: e.week_number,
          weight_kg: e.weight_kg,
          minimum_viable_days_count: e.minimum_viable_days_count,
          subjective_markers: e.subjective_markers as any,
        })),
        allSessions
      );

      return { success: true, data: insights };
    }
  );
}
