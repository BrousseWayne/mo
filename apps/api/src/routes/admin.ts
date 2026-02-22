import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";

export async function adminRoutes(app: FastifyInstance) {
  app.get("/admin/stats", async () => {
    const runStatsResult = await app.db.execute(sql`
      SELECT
        COUNT(*) as total_runs,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000)
          FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL) as avg_duration_ms
      FROM pipeline_runs
    `);
    const runStats = runStatsResult[0] as Record<string, unknown> | undefined;

    const tokensByAgent = await app.db.execute(sql`
      SELECT
        agent_name,
        COALESCE(SUM(llm_tokens_used), 0) as total_tokens,
        AVG(duration_ms) as avg_duration_ms
      FROM agent_outputs
      GROUP BY agent_name
    `);

    const programStatsResult = await app.db.execute(sql`
      SELECT COUNT(*) FILTER (WHERE status = 'active') as active_programs
      FROM programs
    `);
    const programStats = programStatsResult[0] as Record<string, unknown> | undefined;

    return {
      success: true,
      data: {
        pipeline: {
          total_runs: Number(runStats?.total_runs ?? 0),
          completed: Number(runStats?.completed ?? 0),
          failed: Number(runStats?.failed ?? 0),
          avg_duration_ms: runStats?.avg_duration_ms ? Math.round(Number(runStats.avg_duration_ms)) : null,
        },
        agents: [...tokensByAgent].map((r: Record<string, unknown>) => ({
          agent_name: r.agent_name,
          total_tokens: Number(r.total_tokens),
          avg_duration_ms: r.avg_duration_ms ? Math.round(Number(r.avg_duration_ms)) : null,
        })),
        active_programs: Number(programStats?.active_programs ?? 0),
      },
    };
  });
}
