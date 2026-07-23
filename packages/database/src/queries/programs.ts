import { eq, desc } from "drizzle-orm";
import type { Database } from "../client.js";
import { programs } from "../schema.js";

type ProgramInsert = typeof programs.$inferInsert;
type ProgramSelect = typeof programs.$inferSelect;

const VALID_TRANSITIONS: Record<string, string[]> = {
  active: ["paused", "completed", "cancelled"],
  paused: ["active", "cancelled"],
};

export async function createProgram(
  db: Database,
  data: Omit<ProgramInsert, "id" | "created_at" | "updated_at" | "started_at" | "status">
): Promise<ProgramSelect> {
  const [program] = await db
    .insert(programs)
    .values(data)
    .returning();
  return program;
}

export async function getActiveProgram(
  db: Database,
  userId: string
): Promise<ProgramSelect | undefined> {
  const [program] = await db
    .select()
    .from(programs)
    .where(eq(programs.user_id, userId))
    .orderBy(desc(programs.created_at))
    .limit(1);
  return program?.status === "active" ? program : undefined;
}

export async function getProgramById(
  db: Database,
  id: string
): Promise<ProgramSelect | undefined> {
  const [program] = await db
    .select()
    .from(programs)
    .where(eq(programs.id, id))
    .limit(1);
  return program;
}

export async function updateProgramTargets(
  db: Database,
  id: string,
  targets: {
    target_intake_kcal?: number;
    protein_g?: number;
    fat_g?: number;
    carbs_g?: number;
    surplus_kcal?: number;
    current_weight_kg?: number;
    current_week?: number;
    current_tier?: "tier_0" | "tier_1" | "tier_2";
    current_phase?: "phase_0" | "phase_1" | "phase_2";
    last_recalc_weight_kg?: number;
    last_protein_recalc_at?: Date;
  }
): Promise<ProgramSelect> {
  const [updated] = await db
    .update(programs)
    .set({ ...targets, updated_at: new Date() })
    .where(eq(programs.id, id))
    .returning();
  return updated;
}

export async function transitionStatus(
  db: Database,
  id: string,
  newStatus: "active" | "paused" | "completed" | "cancelled"
): Promise<ProgramSelect> {
  const program = await getProgramById(db, id);
  if (!program) throw new Error(`Program ${id} not found`);

  const allowed = VALID_TRANSITIONS[program.status];
  if (!allowed?.includes(newStatus)) {
    throw new Error(
      `Invalid transition: ${program.status} → ${newStatus}`
    );
  }

  const [updated] = await db
    .update(programs)
    .set({ status: newStatus, updated_at: new Date() })
    .where(eq(programs.id, id))
    .returning();
  return updated;
}

export async function listPrograms(db: Database) {
  return db.select().from(programs).orderBy(desc(programs.created_at));
}
