import type { FastifyInstance } from "fastify";

export async function wearableRoutes(app: FastifyInstance) {
  app.post("/programs/:id/wearable-data", async (_request, reply) => {
    reply.code(501);
    return { success: false, error: { code: "NOT_IMPLEMENTED", message: "Wearable integration not yet available" } };
  });

  app.get("/programs/:id/wearable-data", async (_request, reply) => {
    reply.code(501);
    return { success: false, error: { code: "NOT_IMPLEMENTED", message: "Wearable integration not yet available" } };
  });
}
