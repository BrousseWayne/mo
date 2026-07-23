import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getProgramById, createPhysicianQuery, getPhysicianQueries } from "@mo/database";
import { askPhysician, createLlmClient } from "@mo/agents";

const askSchema = z.object({
  question: z.string().min(5).max(2000),
});

export async function physicianRoutes(app: FastifyInstance) {
  app.post<{ Params: { id: string } }>(
    "/programs/:id/physician/ask",
    async (request, reply) => {
      const program = await getProgramById(app.db, request.params.id);
      if (!program) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Program not found" },
        });
      }

      const parsed = askSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid question", details: parsed.error.flatten() },
        });
      }

      const payload = await askPhysician(createLlmClient(), parsed.data.question);

      const entry = await createPhysicianQuery(app.db, {
        program_id: program.id,
        pipeline_run_id: null,
        requesting_agent: "USER",
        query_type: "adhoc",
        query: parsed.data.question,
        response: payload,
        urgency: payload.urgency,
        pipeline_action: payload.pipeline_action,
      });

      return { success: true, data: { query_id: entry.id, ...payload } };
    }
  );

  app.get<{ Params: { id: string } }>(
    "/programs/:id/physician/queries",
    async (request, reply) => {
      const program = await getProgramById(app.db, request.params.id);
      if (!program) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Program not found" },
        });
      }
      const queries = await getPhysicianQueries(app.db, program.id);
      return { success: true, data: queries };
    }
  );
}
