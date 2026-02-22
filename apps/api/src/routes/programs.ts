import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { programCreateSchema, programStatusZod } from "@mo/shared";
import {
  intakeResponses,
  pipelineRuns,
  createProgram,
  getProgramById,
  listPrograms,
  transitionStatus,
} from "@mo/database";

export async function programRoutes(app: FastifyInstance) {
  app.post("/programs", async (request, reply) => {
    const parsed = programCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid request", details: parsed.error.flatten() },
      });
    }

    const { user_id, intake_response_id } = parsed.data;

    const [intakeRow] = await app.db
      .select()
      .from(intakeResponses)
      .where(eq(intakeResponses.id, intake_response_id))
      .limit(1);

    if (!intakeRow) {
      return reply.status(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "Intake response not found" },
      });
    }

    const intake = intakeRow.data as { current_weight_kg: number; target_weight_kg: number };

    const program = await createProgram(app.db, {
      user_id,
      intake_response_id,
      target_weight_kg: intake.target_weight_kg,
      current_weight_kg: intake.current_weight_kg,
      target_intake_kcal: 0,
      protein_g: 0,
      fat_g: 0,
      carbs_g: 0,
      surplus_kcal: 0,
    });

    const [run] = await app.db
      .insert(pipelineRuns)
      .values({
        user_id,
        intake_response_id,
        program_id: program.id,
        status: "pending",
        agents_requested: ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF", "COACH"],
        trigger: "initial",
      })
      .returning();

    await app.queue.add("pipeline.initial", {
      type: "pipeline.initial" as const,
      runId: run.id,
      userId: user_id,
      intakeResponseId: intake_response_id,
      agents: ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF", "COACH"],
    });

    return { success: true, data: { program_id: program.id, pipeline_run_id: run.id } };
  });

  app.get<{ Params: { id: string } }>("/programs/:id", async (request, reply) => {
    const program = await getProgramById(app.db, request.params.id);
    if (!program) {
      return reply.status(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "Program not found" },
      });
    }
    return { success: true, data: program };
  });

  app.get("/programs", async () => {
    const all = await listPrograms(app.db);
    return { success: true, data: all };
  });

  app.patch<{ Params: { id: string }; Body: { status: string } }>(
    "/programs/:id/status",
    async (request, reply) => {
      const parsed = programStatusZod.safeParse(request.body?.status);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid status" },
        });
      }

      try {
        const updated = await transitionStatus(app.db, request.params.id, parsed.data);
        return { success: true, data: updated };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (msg.includes("not found")) {
          return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: msg } });
        }
        return reply.status(400).send({ success: false, error: { code: "INVALID_TRANSITION", message: msg } });
      }
    }
  );
}
