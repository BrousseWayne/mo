import type { FastifyInstance } from "fastify";
import { getProgramById, computeWeekNumber } from "@mo/database";

export async function scheduleRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>(
    "/programs/:id/schedule",
    async (request, reply) => {
      const program = await getProgramById(app.db, request.params.id);
      if (!program) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Program not found" },
        });
      }

      const weekNumber = computeWeekNumber(program);
      const startDate = program.started_at ? new Date(program.started_at) : new Date(program.created_at);
      const daysSinceStart = weekNumber * 7;

      const nextCheckinDate = new Date(startDate);
      nextCheckinDate.setDate(nextCheckinDate.getDate() + daysSinceStart + 7);

      const nextMeasurementDate = new Date(startDate);
      const weeksUntilNextMeasurement = weekNumber % 2 === 0 ? 2 : 1;
      nextMeasurementDate.setDate(nextMeasurementDate.getDate() + daysSinceStart + (weeksUntilNextMeasurement * 7));

      return {
        success: true,
        data: {
          current_week: weekNumber,
          next_checkin_date: nextCheckinDate.toISOString(),
          next_measurement_date: nextMeasurementDate.toISOString(),
          training_days_this_week: [1, 3, 5],
          batch_cooking_day: 0,
        },
      };
    }
  );
}
