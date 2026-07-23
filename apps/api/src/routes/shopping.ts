import type { FastifyInstance } from "fastify";
import { getProgramById, getLatestAgentEnvelope } from "@mo/database";
import { generateShoppingList } from "@mo/agents";

function chefPayload(envelope: unknown): Record<string, unknown> | null {
  return envelope && typeof envelope === "object" && "payload" in envelope
    ? ((envelope as { payload: Record<string, unknown> }).payload ?? null)
    : null;
}

export async function shoppingRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string }; Querystring: { week?: string } }>(
    "/programs/:id/shopping-list",
    async (request, reply) => {
      const program = await getProgramById(app.db, request.params.id);
      if (!program) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Program not found" },
        });
      }

      const payload = chefPayload(await getLatestAgentEnvelope(app.db, program.id, "CHEF"));
      if (!payload) {
        return { success: true, data: [] };
      }

      const recipes = (payload.recipes ?? payload.weekly_recipes ?? []) as Parameters<typeof generateShoppingList>[0];
      const shoppingList = generateShoppingList(recipes);

      return { success: true, data: shoppingList };
    }
  );

  app.get<{ Params: { id: string }; Querystring: { week?: string } }>(
    "/programs/:id/batch-cooking-plan",
    async (request, reply) => {
      const program = await getProgramById(app.db, request.params.id);
      if (!program) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Program not found" },
        });
      }

      const payload = chefPayload(await getLatestAgentEnvelope(app.db, program.id, "CHEF"));

      return {
        success: true,
        data: payload?.batch_cooking_plan ?? payload?.batch_cooking ?? null,
      };
    }
  );
}
