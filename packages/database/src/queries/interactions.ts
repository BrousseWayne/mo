import { eq, desc } from "drizzle-orm";
import type { Database } from "../client.js";
import { interactionEvents } from "../schema.js";

type InteractionInsert = typeof interactionEvents.$inferInsert;
type InteractionSelect = typeof interactionEvents.$inferSelect;

export async function logInteraction(
  db: Database,
  data: Omit<InteractionInsert, "id" | "created_at">
): Promise<InteractionSelect> {
  const [event] = await db.insert(interactionEvents).values(data).returning();
  return event;
}

export async function getInteractionLog(
  db: Database,
  programId: string,
  opts?: { eventType?: string; limit?: number; offset?: number }
): Promise<InteractionSelect[]> {
  let query = db
    .select()
    .from(interactionEvents)
    .where(eq(interactionEvents.program_id, programId))
    .orderBy(desc(interactionEvents.created_at))
    .$dynamic();

  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset) query = query.offset(opts.offset);

  return query;
}
