import type { FastifyInstance } from "fastify";
import {
  getProgramById,
  getRecentWeights,
  getRecentMeasurements,
  getSessionsForWeek,
  computeWeekNumber,
} from "@mo/database";

export async function chartRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>(
    "/programs/:id/charts/weight",
    async (request, reply) => {
      const program = await getProgramById(app.db, request.params.id);
      if (!program) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Program not found" },
        });
      }

      const weights = await getRecentWeights(app.db, program.id, 100);
      const data = weights.reverse().map((w) => ({
        week: w.week_number,
        date: w.created_at,
        weight_kg: w.weight_kg,
      }));

      return { success: true, data };
    }
  );

  app.get<{ Params: { id: string } }>(
    "/programs/:id/charts/strength",
    async (request, reply) => {
      const program = await getProgramById(app.db, request.params.id);
      if (!program) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Program not found" },
        });
      }

      const weekNumber = computeWeekNumber(program);
      const exerciseData = new Map<string, { week: number; weight_kg: number; reps: number }[]>();

      for (let w = 1; w <= weekNumber; w++) {
        const sessions = await getSessionsForWeek(app.db, program.id, w);
        for (const session of sessions) {
          const exercises = session.exercises as { name: string; actual?: { weight_kg: number; reps: number }[] }[];
          for (const ex of exercises) {
            if (!ex.actual?.length) continue;
            const best = ex.actual.reduce((a, b) => (a.weight_kg * a.reps > b.weight_kg * b.reps ? a : b));
            const points = exerciseData.get(ex.name) ?? [];
            points.push({ week: w, weight_kg: best.weight_kg, reps: best.reps });
            exerciseData.set(ex.name, points);
          }
        }
      }

      const data = [...exerciseData.entries()].map(([name, points]) => ({
        name,
        data_points: points,
      }));

      return { success: true, data };
    }
  );

  app.get<{ Params: { id: string } }>(
    "/programs/:id/charts/measurements",
    async (request, reply) => {
      const program = await getProgramById(app.db, request.params.id);
      if (!program) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Program not found" },
        });
      }

      const measurements = await getRecentMeasurements(app.db, program.id, 100);
      const data = measurements
        .filter((m) => m.waist_cm != null || m.hip_cm != null)
        .reverse()
        .map((m) => ({
          week: m.week_number,
          date: m.created_at,
          waist_cm: m.waist_cm,
          hip_cm: m.hip_cm,
          waist_hip_ratio: m.waist_cm && m.hip_cm
            ? Math.round((m.waist_cm / m.hip_cm) * 1000) / 1000
            : null,
        }));

      return { success: true, data };
    }
  );
}
