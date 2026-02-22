import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";

const startTime = Date.now();

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    const checks: Record<string, { status: string; latency_ms?: number }> = {};

    const dbStart = Date.now();
    try {
      await app.db.execute(sql`SELECT 1`);
      checks.database = { status: "ok", latency_ms: Date.now() - dbStart };
    } catch {
      checks.database = { status: "error", latency_ms: Date.now() - dbStart };
    }

    try {
      const queue = app.queue;
      const counts = await queue.getJobCounts("waiting", "active", "failed");
      checks.queue = {
        status: "ok",
        ...counts,
      } as any;
    } catch {
      checks.queue = { status: "error" };
    }

    const allOk = Object.values(checks).every((c) => c.status === "ok");

    return {
      status: allOk ? "healthy" : "degraded",
      uptime_s: Math.floor((Date.now() - startTime) / 1000),
      checks,
    };
  });
}
