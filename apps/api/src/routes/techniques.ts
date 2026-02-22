import type { FastifyInstance } from "fastify";
import { lookupTechnique, listTechniques } from "@mo/agents";

export async function techniqueRoutes(app: FastifyInstance) {
  app.get("/techniques", async () => {
    return { success: true, data: listTechniques() };
  });

  app.get<{ Params: { name: string } }>(
    "/techniques/:name",
    async (request, reply) => {
      const technique = lookupTechnique(request.params.name);
      if (!technique) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: `Technique '${request.params.name}' not found` },
        });
      }
      return { success: true, data: { name: request.params.name, ...technique } };
    }
  );
}
