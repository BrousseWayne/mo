import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { addPantryItem, getPantryItems, updatePantryItem, deletePantryItem } from "@mo/database";

export async function pantryRoutes(app: FastifyInstance) {
  app.get("/pantry", async () => {
    const items = await getPantryItems(app.db);
    return { success: true, data: items };
  });

  app.post("/pantry", async (request, reply) => {
    const schema = z.object({
      name: z.string(),
      category: z.string(),
      quantity_g: z.number(),
      expires_at: z.string().optional(),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid item", details: parsed.error.flatten() },
      });
    }

    const item = await addPantryItem(app.db, {
      ...parsed.data,
      expires_at: parsed.data.expires_at ? new Date(parsed.data.expires_at) : undefined,
    });
    return { success: true, data: item };
  });

  app.patch<{ Params: { id: string } }>("/pantry/:id", async (request, reply) => {
    const schema = z.object({
      name: z.string().optional(),
      category: z.string().optional(),
      quantity_g: z.number().optional(),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid update", details: parsed.error.flatten() },
      });
    }

    const updated = await updatePantryItem(app.db, request.params.id, parsed.data);
    if (!updated) {
      return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Item not found" } });
    }
    return { success: true, data: updated };
  });

  app.delete<{ Params: { id: string } }>("/pantry/:id", async (request, reply) => {
    const deleted = await deletePantryItem(app.db, request.params.id);
    if (!deleted) {
      return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Item not found" } });
    }
    return { success: true, data: deleted };
  });
}
