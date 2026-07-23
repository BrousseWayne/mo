import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import {
  createDb,
  users,
  intakeResponses,
  programs,
  pipelineRuns,
  agentOutputs,
  createSessionsFromCoachOutput,
} from "@mo/database";
import { parseMealTemplate, parseTrainingProgram } from "@mo/agents";
import {
  agentEnvelopeSchema,
  intakeSchema,
  scientistOutputSchema,
  type AgentEnvelope,
} from "@mo/shared";

config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

function readRepoFile(relative: string): string {
  return readFileSync(fileURLToPath(new URL(`../${relative}`, import.meta.url)), "utf-8");
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

async function seedProgram() {
  const db = createDb(process.env.DATABASE_URL!);

  const active = await db.select().from(programs).where(eq(programs.status, "active"));
  if (active.length > 0 && !process.argv.includes("--force")) {
    console.error(`An active program already exists (${active[0].id}).`);
    console.error("Pass --force to seed another one anyway.");
    process.exit(1);
  }

  const intake = intakeSchema.parse(JSON.parse(readRepoFile("scripts/fixtures/reference-intake.json")));
  const scientistPayload = scientistOutputSchema.parse(
    JSON.parse(readRepoFile("scripts/fixtures/scientist-output.json")).payload
  );
  const dietitianPayload = parseMealTemplate(readRepoFile("agents/artifacts/dietitian-meal-template.md"));
  const coachPayload = parseTrainingProgram(readRepoFile("agents/artifacts/coach-training-program.md"));

  const [user] = await db.insert(users).values({}).returning();
  const [intakeRow] = await db
    .insert(intakeResponses)
    .values({ user_id: user.id, data: intake })
    .returning();

  const [program] = await db
    .insert(programs)
    .values({
      user_id: user.id,
      intake_response_id: intakeRow.id,
      target_weight_kg: intake.target_weight_kg,
      current_weight_kg: intake.current_weight_kg,
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
      user_id: user.id,
      intake_response_id: intakeRow.id,
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

  console.log("Seeded program from artifacts (no LLM pipeline):");
  console.log(`  user:             ${user.id}`);
  console.log(`  program:          ${program.id}`);
  console.log(`  pipeline run:     ${run.id} (completed)`);
  console.log(`  agent outputs:    SCIENTIST, DIETITIAN, COACH`);
  console.log(`  targets:          ${program.target_intake_kcal} kcal, P${program.protein_g} F${program.fat_g} C${program.carbs_g}, +${program.surplus_kcal} surplus`);
  console.log(`  training:         ${sessions.length} sessions (week 1, ${coachPayload.program.phase})`);
  process.exit(0);
}

seedProgram();
