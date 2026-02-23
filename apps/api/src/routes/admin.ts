import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";
import { getAdjustmentOutcomes } from "@mo/database";

const TABLE_WHITELIST = [
  "users",
  "intake_responses",
  "programs",
  "pipeline_runs",
  "agent_outputs",
  "progress_entries",
  "training_sessions",
  "adjustments",
  "red_flags",
  "physician_queries",
  "recipes",
  "interaction_events",
  "milestones",
  "notification_preferences",
  "notification_log",
  "pantry_items",
  "ingredient_prices",
  "program_disruptions",
  "progress_photos",
  "foods",
];

export async function adminRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { status?: string; trigger?: string; limit?: string; offset?: string } }>(
    "/admin/pipeline-runs",
    async (request) => {
      const limit = Math.min(Number(request.query.limit) || 50, 200);
      const offset = Number(request.query.offset) || 0;
      const { status, trigger } = request.query;

      let where = sql`WHERE 1=1`;
      if (status) where = sql`${where} AND pr.status = ${status}`;
      if (trigger) where = sql`${where} AND pr.trigger = ${trigger}`;

      const rows = await app.db.execute(sql`
        SELECT
          pr.id, pr.program_id, pr.trigger, pr.status,
          pr.agents_requested, pr.current_agent, pr.error,
          pr.started_at, pr.completed_at, pr.created_at,
          EXTRACT(EPOCH FROM (pr.completed_at - pr.started_at)) * 1000 as duration_ms,
          COALESCE(
            (SELECT json_agg(ao.agent_name ORDER BY ao.created_at)
             FROM agent_outputs ao WHERE ao.pipeline_run_id = pr.id), '[]'
          ) as agents_completed
        FROM pipeline_runs pr
        ${where}
        ORDER BY pr.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      const countResult = await app.db.execute(sql`
        SELECT COUNT(*) as total FROM pipeline_runs pr ${where}
      `);
      const total = Number((countResult[0] as Record<string, unknown>)?.total ?? 0);

      return {
        success: true,
        data: { rows: [...rows], total, limit, offset },
      };
    },
  );

  app.get<{ Params: { id: string } }>(
    "/admin/pipeline-runs/:id/trace",
    async (request, reply) => {
      const { id } = request.params;

      const runResult = await app.db.execute(sql`
        SELECT * FROM pipeline_runs WHERE id = ${id}
      `);
      if (runResult.length === 0) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Pipeline run not found" },
        });
      }

      const outputs = await app.db.execute(sql`
        SELECT id, agent_name, envelope, duration_ms, llm_tokens_used, llm_trace, created_at
        FROM agent_outputs
        WHERE pipeline_run_id = ${id}
        ORDER BY created_at ASC
      `);

      return {
        success: true,
        data: { run: runResult[0], outputs: [...outputs] },
      };
    },
  );

  app.get<{ Querystring: { agent?: string; limit?: string; offset?: string } }>(
    "/admin/agent-outputs",
    async (request) => {
      const limit = Math.min(Number(request.query.limit) || 50, 200);
      const offset = Number(request.query.offset) || 0;
      const { agent } = request.query;

      let where = sql`WHERE 1=1`;
      if (agent) where = sql`${where} AND ao.agent_name = ${agent}`;

      const rows = await app.db.execute(sql`
        SELECT
          ao.id, ao.pipeline_run_id, ao.agent_name, ao.envelope,
          ao.duration_ms, ao.llm_tokens_used, ao.created_at,
          pr.trigger as run_trigger, pr.program_id
        FROM agent_outputs ao
        JOIN pipeline_runs pr ON pr.id = ao.pipeline_run_id
        ${where}
        ORDER BY ao.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      const countResult = await app.db.execute(sql`
        SELECT COUNT(*) as total FROM agent_outputs ao ${where}
      `);
      const total = Number((countResult[0] as Record<string, unknown>)?.total ?? 0);

      return {
        success: true,
        data: { rows: [...rows], total, limit, offset },
      };
    },
  );

  app.get("/admin/triggers", async () => {
    const rows = await app.db.execute(sql`
      SELECT
        a.id, a.program_id, a.pipeline_run_id, a.trigger_type,
        a.old_values, a.new_values, a.affected_agents, a.reason, a.created_at
      FROM adjustments a
      ORDER BY a.created_at DESC
      LIMIT 200
    `);

    const summary = await app.db.execute(sql`
      SELECT
        trigger_type,
        COUNT(*) as count
      FROM adjustments
      GROUP BY trigger_type
      ORDER BY count DESC
    `);

    return {
      success: true,
      data: { rows: [...rows], summary: [...summary] },
    };
  });

  app.get("/admin/tables", async () => {
    const counts = await Promise.all(
      TABLE_WHITELIST.map(async (name) => {
        const result = await app.db.execute(sql.raw(`SELECT COUNT(*) as count FROM "${name}"`));
        return { name, count: Number((result[0] as Record<string, unknown>)?.count ?? 0) };
      }),
    );
    return { success: true, data: counts };
  });

  app.get<{ Params: { name: string }; Querystring: { limit?: string; offset?: string } }>(
    "/admin/tables/:name",
    async (request, reply) => {
      const { name } = request.params;
      if (!TABLE_WHITELIST.includes(name)) {
        return reply.status(400).send({
          success: false,
          error: { code: "INVALID_TABLE", message: `Table "${name}" is not accessible` },
        });
      }

      const limit = Math.min(Number(request.query.limit) || 50, 200);
      const offset = Number(request.query.offset) || 0;

      const orderCol = name === "foods" ? "fetched_at" : name === "pantry_items" ? "added_at" : "created_at";
      const rows = await app.db.execute(
        sql.raw(`SELECT * FROM "${name}" ORDER BY "${orderCol}" DESC LIMIT ${limit} OFFSET ${offset}`),
      );

      const countResult = await app.db.execute(sql.raw(`SELECT COUNT(*) as count FROM "${name}"`));
      const total = Number((countResult[0] as Record<string, unknown>)?.count ?? 0);

      return {
        success: true,
        data: { rows: [...rows], total, limit, offset },
      };
    },
  );

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
