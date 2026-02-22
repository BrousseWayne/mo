import { eq, desc } from "drizzle-orm";
import type { Database } from "../client.js";
import { physicianQueries } from "../schema.js";

type PhysicianQueryInsert = typeof physicianQueries.$inferInsert;
type PhysicianQuerySelect = typeof physicianQueries.$inferSelect;

export async function createPhysicianQuery(
  db: Database,
  data: Omit<PhysicianQueryInsert, "id" | "created_at">
): Promise<PhysicianQuerySelect> {
  const [entry] = await db.insert(physicianQueries).values(data).returning();
  return entry;
}

export async function getPhysicianQueries(
  db: Database,
  programId: string
): Promise<PhysicianQuerySelect[]> {
  return db
    .select()
    .from(physicianQueries)
    .where(eq(physicianQueries.program_id, programId))
    .orderBy(desc(physicianQueries.created_at));
}
