import { eq, desc, sql } from "drizzle-orm";
import type { Database } from "../client.js";
import { progressEntries, programs } from "../schema.js";

type ProgressInsert = typeof progressEntries.$inferInsert;
type ProgressSelect = typeof progressEntries.$inferSelect;

export async function createProgressEntry(
  db: Database,
  data: Omit<ProgressInsert, "id" | "created_at">
): Promise<ProgressSelect> {
  const [entry] = await db.insert(progressEntries).values(data).returning();
  return entry;
}

export async function getLatestEntry(
  db: Database,
  programId: string
): Promise<ProgressSelect | undefined> {
  const [entry] = await db
    .select()
    .from(progressEntries)
    .where(eq(progressEntries.program_id, programId))
    .orderBy(desc(progressEntries.created_at))
    .limit(1);
  return entry;
}

export async function getProgressHistory(
  db: Database,
  programId: string,
  opts?: { limit?: number; offset?: number }
): Promise<ProgressSelect[]> {
  let query = db
    .select()
    .from(progressEntries)
    .where(eq(progressEntries.program_id, programId))
    .orderBy(desc(progressEntries.created_at))
    .$dynamic();

  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset) query = query.offset(opts.offset);

  return query;
}

export async function getRecentWeights(
  db: Database,
  programId: string,
  n: number
): Promise<{ weight_kg: number; week_number: number; created_at: Date }[]> {
  return db
    .select({
      weight_kg: progressEntries.weight_kg,
      week_number: progressEntries.week_number,
      created_at: progressEntries.created_at,
    })
    .from(progressEntries)
    .where(eq(progressEntries.program_id, programId))
    .orderBy(desc(progressEntries.created_at))
    .limit(n);
}

export async function getRecentMeasurements(
  db: Database,
  programId: string,
  n: number
): Promise<{ waist_cm: number | null; hip_cm: number | null; week_number: number; created_at: Date }[]> {
  return db
    .select({
      waist_cm: progressEntries.waist_cm,
      hip_cm: progressEntries.hip_cm,
      week_number: progressEntries.week_number,
      created_at: progressEntries.created_at,
    })
    .from(progressEntries)
    .where(eq(progressEntries.program_id, programId))
    .orderBy(desc(progressEntries.created_at))
    .limit(n);
}

export function computeWeekNumber(program: { started_at: Date }, now: Date = new Date()): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.floor((now.getTime() - program.started_at.getTime()) / msPerWeek) + 1;
}
