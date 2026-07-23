import type { FastifyInstance } from "fastify";
import { getProgramById, getLatestAgentEnvelope } from "@mo/database";

function envelopePayload(envelope: unknown): unknown {
  return envelope && typeof envelope === "object" && "payload" in envelope
    ? (envelope as { payload: unknown }).payload
    : null;
}

export async function mealPlanRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string }; Querystring: { week?: string } }>(
    "/programs/:id/meal-plan",
    async (request, reply) => {
      const program = await getProgramById(app.db, request.params.id);
      if (!program) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Program not found" },
        });
      }

      const dietitian = await getLatestAgentEnvelope(app.db, program.id, "DIETITIAN");
      const chef = await getLatestAgentEnvelope(app.db, program.id, "CHEF");

      if (!dietitian && !chef) {
        return { success: true, data: null };
      }

      return {
        success: true,
        data: {
          template: envelopePayload(dietitian),
          recipes: envelopePayload(chef),
        },
      };
    }
  );
}
