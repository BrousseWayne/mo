import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  getProgramById,
  getSessionsForWeek,
  logSessionActuals,
  markSessionComplete,
  markSessionSkipped,
} from "@mo/database";

const logSchema = z.object({
  actuals: z.array(
    z.object({
      exerciseName: z.string(),
      sets: z.array(
        z.object({
          weight_kg: z.number(),
          reps: z.number().int(),
          rpe: z.number().optional(),
        })
      ),
    })
  ),
});

export async function trainingRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string; week: string } }>(
    "/programs/:id/training/weeks/:week",
    async (request, reply) => {
      const program = await getProgramById(app.db, request.params.id);
      if (!program) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Program not found" },
        });
      }

      const weekNumber = Number(request.params.week);
      if (isNaN(weekNumber) || weekNumber < 1) {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid week number" },
        });
      }

      const sessions = await getSessionsForWeek(app.db, program.id, weekNumber);
      return { success: true, data: sessions };
    }
  );

  app.put<{ Params: { id: string } }>(
    "/training-sessions/:id/log",
    async (request, reply) => {
      const parsed = logSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid log data", details: parsed.error.flatten() },
        });
      }

      try {
        const session = await logSessionActuals(app.db, request.params.id, parsed.data.actuals);
        return { success: true, data: session };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: msg },
        });
      }
    }
  );

  app.patch<{ Params: { id: string } }>(
    "/training-sessions/:id/complete",
    async (_request, reply) => {
      try {
        const session = await markSessionComplete(app.db, _request.params.id);
        return { success: true, data: session };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: msg },
        });
      }
    }
  );

  app.patch<{ Params: { id: string }; Body: { reason?: string } }>(
    "/training-sessions/:id/skip",
    async (request, reply) => {
      try {
        const session = await markSessionSkipped(
          app.db,
          request.params.id,
          (request.body as { reason?: string })?.reason
        );
        return { success: true, data: session };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: msg },
        });
      }
    }
  );
}
