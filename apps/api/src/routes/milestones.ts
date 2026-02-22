import type { FastifyInstance } from "fastify";
import { getProgramById, getMilestones } from "@mo/database";

export async function milestoneRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>(
    "/programs/:id/milestones",
    async (request, reply) => {
      const program = await getProgramById(app.db, request.params.id);
      if (!program) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Program not found" },
        });
      }

      const data = await getMilestones(app.db, program.id);
      return { success: true, data };
    }
  );
}
