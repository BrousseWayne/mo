import type { FastifyInstance } from "fastify";
import {
  getProgramById,
  getProgressHistory,
  getSessionsForWeek,
  computeWeekNumber,
} from "@mo/database";
import { computeCompliance } from "@mo/agents";

export async function complianceRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>(
    "/programs/:id/compliance",
    async (request, reply) => {
      const program = await getProgramById(app.db, request.params.id);
      if (!program) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Program not found" },
        });
      }

      const entries = await getProgressHistory(app.db, program.id, { limit: 52 });
      const weekNumber = computeWeekNumber(program);

      const allSessions = [];
      for (let w = 1; w <= weekNumber; w++) {
        const sessions = await getSessionsForWeek(app.db, program.id, w);
        allSessions.push(
          ...sessions.map((s) => ({ status: s.status, week_number: s.week_number }))
        );
      }

      const report = computeCompliance(
        entries.map((e) => ({
          minimum_viable_days_count: e.minimum_viable_days_count,
          week_number: e.week_number,
        })),
        allSessions
      );

      return { success: true, data: report };
    }
  );
}
