import { eq, desc, sql } from "drizzle-orm";
import type { Database } from "../client.js";
import { adjustments } from "../schema.js";

export async function recordAdjustmentOutcome(
  db: Database,
  adjustmentId: string,
  outcome: { weight_change_kg: number; expected_direction: "gain" | "loss" | "maintain"; success: boolean }
) {
  const [updated] = await db
    .update(adjustments)
    .set({
      new_values: sql`${adjustments.new_values} || ${JSON.stringify({ outcome })}::jsonb`,
    })
    .where(eq(adjustments.id, adjustmentId))
    .returning();
  return updated;
}

export async function getAdjustmentOutcomes(db: Database) {
  const rows = await db
    .select()
    .from(adjustments)
    .orderBy(desc(adjustments.created_at));

  const byTrigger = new Map<string, { total: number; success: number }>();
  for (const row of rows) {
    const outcome = (row.new_values as Record<string, unknown>)?.outcome as { success?: boolean } | undefined;
    if (!outcome) continue;

    const stats = byTrigger.get(row.trigger_type) ?? { total: 0, success: 0 };
    stats.total++;
    if (outcome.success) stats.success++;
    byTrigger.set(row.trigger_type, stats);
  }

  return [...byTrigger.entries()].map(([trigger_type, stats]) => ({
    trigger_type,
    total: stats.total,
    success: stats.success,
    success_rate: stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0,
  }));
}
