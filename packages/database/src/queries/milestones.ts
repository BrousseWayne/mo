import { eq, desc } from "drizzle-orm";
import type { Database } from "../client.js";
import { milestones } from "../schema.js";

export async function createMilestone(
  db: Database,
  data: { program_id: string; type: string; value?: number; achieved_at?: Date; metadata?: Record<string, unknown> }
) {
  const [inserted] = await db.insert(milestones).values(data).returning();
  return inserted;
}

export async function getMilestones(db: Database, programId: string) {
  return db
    .select()
    .from(milestones)
    .where(eq(milestones.program_id, programId))
    .orderBy(desc(milestones.achieved_at));
}
