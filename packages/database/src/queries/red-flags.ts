import { eq, and, desc, ne } from "drizzle-orm";
import type { Database } from "../client.js";
import { redFlags } from "../schema.js";

type RedFlagInsert = typeof redFlags.$inferInsert;
type RedFlagSelect = typeof redFlags.$inferSelect;

export async function createRedFlag(
  db: Database,
  data: Omit<RedFlagInsert, "id" | "detected_at">
): Promise<RedFlagSelect> {
  const [flag] = await db.insert(redFlags).values(data).returning();
  return flag;
}

export async function getRedFlags(
  db: Database,
  programId: string
): Promise<RedFlagSelect[]> {
  return db
    .select()
    .from(redFlags)
    .where(eq(redFlags.program_id, programId))
    .orderBy(desc(redFlags.detected_at));
}

export async function getUnresolvedUrgentFlags(
  db: Database,
  programId: string
): Promise<RedFlagSelect[]> {
  return db
    .select()
    .from(redFlags)
    .where(
      and(
        eq(redFlags.program_id, programId),
        eq(redFlags.severity, "urgent"),
        eq(redFlags.status, "detected")
      )
    );
}

export async function updateRedFlagStatus(
  db: Database,
  flagId: string,
  status: "acknowledged" | "resolved" | "referred"
): Promise<RedFlagSelect> {
  const timestampField =
    status === "acknowledged"
      ? { acknowledged_at: new Date() }
      : status === "resolved"
        ? { resolved_at: new Date() }
        : { referred_at: new Date() };

  const [updated] = await db
    .update(redFlags)
    .set({ status, ...timestampField })
    .where(eq(redFlags.id, flagId))
    .returning();

  if (!updated) throw new Error(`Red flag ${flagId} not found`);
  return updated;
}
