import type { FastifyInstance } from "fastify";
import { intakeSchema } from "@mo/shared";
import { users, intakeResponses } from "@mo/database";

export async function intakeRoutes(app: FastifyInstance) {
  app.post("/intake", async (request, reply) => {
    const parsed = intakeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid intake data",
          details: parsed.error.flatten(),
        },
      });
    }

    const [user] = await app.db.insert(users).values({}).returning();
    const [intake] = await app.db
      .insert(intakeResponses)
      .values({ user_id: user.id, data: parsed.data })
      .returning();

    return {
      success: true,
      data: { user_id: user.id, intake_response_id: intake.id },
    };
  });
}
