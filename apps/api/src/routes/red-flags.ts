import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  getRedFlags,
  updateRedFlagStatus,
} from "@mo/database";

export async function redFlagRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>(
    "/programs/:id/red-flags",
    async (request) => {
      const flags = await getRedFlags(app.db, request.params.id);
      return { success: true, data: flags };
    }
  );

  app.patch<{ Params: { id: string }; Body: { status: string } }>(
    "/red-flags/:id",
    async (request, reply) => {
      const validStatuses = z.enum(["acknowledged", "resolved", "referred"]);
      const parsed = validStatuses.safeParse(request.body?.status);

      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid status. Must be acknowledged, resolved, or referred" },
        });
      }

      try {
        const updated = await updateRedFlagStatus(app.db, request.params.id, parsed.data);
        return { success: true, data: updated };
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
