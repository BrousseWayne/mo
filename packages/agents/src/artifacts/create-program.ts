import { randomUUID } from "node:crypto";
import {
  agentEnvelopeSchema,
  type AgentEnvelope,
  type IntakeData,
} from "@mo/shared";
import {
  programs,
  pipelineRuns,
  agentOutputs,
  createSessionsFromCoachOutput,
  type Database,
} from "@mo/database";
import { parseMealTemplate } from "./parse-meal-template.js";
import { parseTrainingProgram } from "./parse-training-program.js";
import { buildScientistPayload } from "./scientist-payload.js";

export interface CreateProgramFromArtifactsInput {
  userId: string;
  intakeResponseId: string;
  intake: IntakeData;
  mealTemplateMd: string;
  trainingProgramMd: string;
}

function buildEnvelope(
  from: string,
  to: string,
  dataType: string,
  payload: Record<string, unknown>,
  runId: string
): AgentEnvelope {
  return agentEnvelopeSchema.parse({
    message_id: randomUUID(),
    from_agent: from,
    to_agent: to,
    data_type: dataType,
    payload,
    pipeline_run_id: runId,
    timestamp: new Date().toISOString(),
    version: "1.0",
  });
}

export async function createProgramFromArtifacts(
  db: Database,
  input: CreateProgramFromArtifactsInput
) {
  const scientistPayload = buildScientistPayload(input.intake);
  const dietitianPayload = parseMealTemplate(input.mealTemplateMd);
  const coachPayload = parseTrainingProgram(input.trainingProgramMd);

  const [program] = await db
    .insert(programs)
    .values({
      user_id: input.userId,
      intake_response_id: input.intakeResponseId,
      target_weight_kg: input.intake.target_weight_kg,
      current_weight_kg: input.intake.current_weight_kg,
      target_intake_kcal: scientistPayload.target_intake_kcal,
      protein_g: scientistPayload.macros.protein_g,
      fat_g: scientistPayload.macros.fat_g,
      carbs_g: scientistPayload.macros.carbs_g,
      surplus_kcal: scientistPayload.surplus_kcal,
    })
    .returning();

  const now = new Date();
  const [run] = await db
    .insert(pipelineRuns)
    .values({
      user_id: input.userId,
      intake_response_id: input.intakeResponseId,
      program_id: program.id,
      trigger: "initial",
      status: "completed",
      agents_requested: ["SCIENTIST", "DIETITIAN", "COACH"],
      started_at: now,
      completed_at: now,
    })
    .returning();

  const envelopes = [
    buildEnvelope("SCIENTIST", "NUTRITIONIST", "macro_targets", scientistPayload, run.id),
    buildEnvelope("DIETITIAN", "CHEF", "weekly_meal_plan", dietitianPayload, run.id),
    buildEnvelope("COACH", "USER", "training_program", coachPayload, run.id),
  ];
  for (const envelope of envelopes) {
    await db.insert(agentOutputs).values({
      pipeline_run_id: run.id,
      agent_name: envelope.from_agent,
      envelope,
    });
  }

  const sessions = await createSessionsFromCoachOutput(db, program.id, 1, coachPayload);

  return { program, run, scientistPayload, sessionsCount: sessions.length };
}
