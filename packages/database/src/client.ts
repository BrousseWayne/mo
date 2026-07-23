import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export function createDb(url: string) {
  const client = postgres(url);
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;

export async function closeDb(db: Database): Promise<void> {
  const client = (db as unknown as { $client: { end: () => Promise<void> } }).$client;
  await client.end();
}
