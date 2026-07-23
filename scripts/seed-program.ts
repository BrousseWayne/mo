import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { createDb, users, intakeResponses, programs } from "@mo/database";
import { createProgramFromArtifacts } from "@mo/agents";
import { intakeSchema } from "@mo/shared";

config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

function readRepoFile(relative: string): string {
  return readFileSync(fileURLToPath(new URL(`../${relative}`, import.meta.url)), "utf-8");
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

  const [user] = await db.insert(users).values({}).returning();
  const [intakeRow] = await db
    .insert(intakeResponses)
    .values({ user_id: user.id, data: intake })
    .returning();

  const { program, run, scientistPayload, sessionsCount } = await createProgramFromArtifacts(db, {
    userId: user.id,
    intakeResponseId: intakeRow.id,
    intake,
    mealTemplateMd: readRepoFile("agents/artifacts/dietitian-meal-template.md"),
    trainingProgramMd: readRepoFile("agents/artifacts/coach-training-program.md"),
  });

  console.log("Seeded program from artifacts (no LLM pipeline):");
  console.log(`  user:             ${user.id}`);
  console.log(`  program:          ${program.id}`);
  console.log(`  pipeline run:     ${run.id} (completed)`);
  console.log(`  agent outputs:    SCIENTIST, DIETITIAN, COACH`);
  console.log(`  targets:          ${program.target_intake_kcal} kcal, P${program.protein_g} F${program.fat_g} C${program.carbs_g}, +${program.surplus_kcal} surplus`);
  console.log(`  training:         ${sessionsCount} sessions (week 1, ${scientistPayload.training_phase})`);
  process.exit(0);
}

seedProgram();
