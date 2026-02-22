import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getRecipeById, searchRecipes, updateRecipeRating } from "@mo/database";

export async function recipeRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>(
    "/recipes/:id",
    async (request, reply) => {
      const recipe = await getRecipeById(app.db, request.params.id);
      if (!recipe) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Recipe not found" },
        });
      }
      return { success: true, data: recipe };
    }
  );

  app.get<{ Querystring: { cuisine?: string; maxPrepMin?: string; limit?: string } }>(
    "/recipes",
    async (request) => {
      const recipes = await searchRecipes(app.db, {
        cuisine: request.query.cuisine,
        maxPrepMin: request.query.maxPrepMin ? Number(request.query.maxPrepMin) : undefined,
        limit: request.query.limit ? Number(request.query.limit) : 50,
      });
      return { success: true, data: recipes };
    }
  );

  app.post<{ Params: { id: string } }>(
    "/recipes/:id/feedback",
    async (request, reply) => {
      const schema = z.object({
        rating: z.number().int().min(1).max(5),
        cook_difficulty: z.number().int().min(1).max(5).optional(),
        time_accuracy: z.boolean().optional(),
        notes: z.string().optional(),
      });

      const parsed = schema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid feedback", details: parsed.error.flatten() },
        });
      }

      try {
        const updated = await updateRecipeRating(app.db, request.params.id, parsed.data.rating);
        return { success: true, data: updated };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: msg } });
      }
    }
  );
}
