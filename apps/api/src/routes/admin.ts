import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";
import { getAdjustmentOutcomes } from "@mo/database";

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

  app.get("/admin/costs", async () => {
    const PRICING = {
      SCIENTIST: { input: 3 / 1_000_000, output: 15 / 1_000_000 },
      NUTRITIONIST: { input: 3 / 1_000_000, output: 15 / 1_000_000 },
      DIETITIAN: { input: 3 / 1_000_000, output: 15 / 1_000_000 },
      CHEF: { input: 3 / 1_000_000, output: 15 / 1_000_000 },
      COACH: { input: 3 / 1_000_000, output: 15 / 1_000_000 },
      PHYSICIAN: { input: 0.80 / 1_000_000, output: 4 / 1_000_000 },
    } as Record<string, { input: number; output: number }>;

    const tokensByAgent = await app.db.execute(sql`
      SELECT
        agent_name,
        COALESCE(SUM(llm_tokens_used), 0) as total_tokens,
        COUNT(*) as run_count
      FROM agent_outputs
      GROUP BY agent_name
    `);

    const agents = [...tokensByAgent].map((r: Record<string, unknown>) => {
      const name = r.agent_name as string;
      const tokens = Number(r.total_tokens);
      const pricing = PRICING[name] ?? PRICING.SCIENTIST;
      const estimated_cost_usd = Math.round(tokens * ((pricing.input + pricing.output) / 2) * 10000) / 10000;
      return {
        agent_name: name,
        total_tokens: tokens,
        run_count: Number(r.run_count),
        estimated_cost_usd,
      };
    });

    const total_estimated_cost_usd = agents.reduce((sum, a) => sum + a.estimated_cost_usd, 0);

    return {
      success: true,
      data: { agents, total_estimated_cost_usd: Math.round(total_estimated_cost_usd * 10000) / 10000 },
    };
  });

  app.get("/admin/outcomes", async () => {
    const outcomes = await getAdjustmentOutcomes(app.db);
    return { success: true, data: outcomes };
  });

  app.get("/admin/export", async () => {
    const tables = await Promise.all([
      app.db.execute(sql`SELECT * FROM users`),
      app.db.execute(sql`SELECT * FROM programs`),
      app.db.execute(sql`SELECT * FROM progress_entries`),
      app.db.execute(sql`SELECT * FROM training_sessions`),
      app.db.execute(sql`SELECT * FROM adjustments`),
      app.db.execute(sql`SELECT * FROM recipes`),
      app.db.execute(sql`SELECT * FROM milestones`),
      app.db.execute(sql`SELECT * FROM pipeline_runs`),
    ]);

    return {
      success: true,
      data: {
        users: [...tables[0]],
        programs: [...tables[1]],
        progress_entries: [...tables[2]],
        training_sessions: [...tables[3]],
        adjustments: [...tables[4]],
        recipes: [...tables[5]],
        milestones: [...tables[6]],
        pipeline_runs: [...tables[7]],
        exported_at: new Date().toISOString(),
      },
    };
  });
}
