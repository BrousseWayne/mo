import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  getRecipeById,
  searchRecipes,
  updateRecipeRating,
  getProgramById,
  getLatestAgentEnvelope,
  getRecentRecipeNames,
  getRecipeRatings,
  upsertRecipe,
  intakeResponses,
  pipelineRuns,
  agentOutputs,
} from "@mo/database";
import { dietitianOutputSchema, intakeSchema } from "@mo/shared";
import {
  scaleRecipe,
  generateVerifiedRecipes,
  createLlmClient,
  buildEnvelope,
} from "@mo/agents";

const generateSchema = z.object({
  count: z.number().int().min(1).max(6).optional(),
  slots: z.array(z.enum(["breakfast", "lunch", "snack", "dinner", "presleep"])).optional(),
});

export async function recipeRoutes(app: FastifyInstance) {
  app.post<{ Params: { id: string } }>(
    "/programs/:id/recipes/generate",
    async (request, reply) => {
      const program = await getProgramById(app.db, request.params.id);
      if (!program) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Program not found" },
        });
      }

      const parsed = generateSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid request", details: parsed.error.flatten() },
        });
      }

      const envelope = await getLatestAgentEnvelope(app.db, program.id, "DIETITIAN");
      const dietitianPayload =
        envelope && typeof envelope === "object" && "payload" in envelope
          ? dietitianOutputSchema.safeParse((envelope as { payload: unknown }).payload)
          : null;
      if (!dietitianPayload?.success) {
        return reply.status(422).send({
          success: false,
          error: { code: "NO_MEAL_PLAN", message: "No valid DIETITIAN output stored for this program" },
        });
      }

      const [intakeRow] = await app.db
        .select()
        .from(intakeResponses)
        .where(eq(intakeResponses.id, program.intake_response_id))
        .limit(1);
      const intake = intakeRow ? intakeSchema.safeParse(intakeRow.data) : null;

      const slotNames = parsed.data.slots ?? ["lunch", "dinner"];
      const template = dietitianPayload.data.weekly_template;
      const day = template.monday ?? Object.values(template)[0];
      const slots = slotNames
        .map((slot) => {
          const spec = day?.[slot as keyof typeof day]?.slot_spec;
          return spec
            ? { slot, protein_g: spec.protein_g, calories: spec.calories, constraints: spec.constraints }
            : null;
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);

      if (slots.length === 0) {
        return reply.status(422).send({
          success: false,
          error: { code: "NO_SLOT_SPECS", message: "No slot specs found in the meal template" },
        });
      }

      const result = await generateVerifiedRecipes(createLlmClient(), {
        slots,
        count: parsed.data.count ?? 3,
        foodAversions: intake?.success ? intake.data.food_aversions : ["peanut_butter", "nut_butters"],
        recentRecipes: await getRecentRecipeNames(app.db, program.id, 4),
        ratedRecipes: await getRecipeRatings(app.db, program.id),
      });

      let runId: string | null = null;
      const recipeIds: string[] = [];

      if (result.recipes.length > 0) {
        const now = new Date();
        const [run] = await app.db
          .insert(pipelineRuns)
          .values({
            user_id: program.user_id,
            intake_response_id: program.intake_response_id,
            program_id: program.id,
            trigger: "manual",
            status: "completed",
            agents_requested: ["CHEF"],
            started_at: now,
            completed_at: now,
          })
          .returning();
        runId = run.id;

        await app.db.insert(agentOutputs).values({
          pipeline_run_id: run.id,
          agent_name: "CHEF",
          envelope: buildEnvelope("CHEF", "USER", "recipes", { recipes: result.recipes }, run.id),
        });

        for (let i = 0; i < result.recipes.length; i++) {
          const recipe = result.recipes[i];
          const saved = await upsertRecipe(app.db, {
            recipe_name: recipe.recipe_name,
            cuisine: recipe.cuisine,
            meal_pattern: recipe.meal_pattern,
            servings: recipe.servings,
            ingredients: recipe.ingredients,
            macros_per_serving: recipe.macros_per_serving,
            instructions: recipe.instructions,
            time_prep: recipe.time.prep_min,
            time_cook: recipe.time.cook_min,
            batch_notes: recipe.batch_notes ?? null,
            storage: recipe.storage ?? null,
            source_run_id: run.id,
            verified: true,
            usda_verification_result: result.verifications[i],
            rating: null,
          });
          recipeIds.push(saved.id);
        }
      }

      return {
        success: true,
        data: {
          recipes_created: result.recipes.length,
          recipe_ids: recipeIds,
          pipeline_run_id: runId,
          rejected: result.rejected.map((v) => ({
            recipe_name: v.recipe_name,
            deviations: v.deviations,
          })),
        },
      };
    }
  );

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

  app.get<{ Params: { id: string }; Querystring: { factor?: string } }>(
    "/recipes/:id/scaled",
    async (request, reply) => {
      const recipe = await getRecipeById(app.db, request.params.id);
      if (!recipe) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Recipe not found" },
        });
      }
      const factor = request.query.factor ? Number(request.query.factor) : 2;
      const scaled = scaleRecipe(recipe as any, factor);
      return { success: true, data: scaled };
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
