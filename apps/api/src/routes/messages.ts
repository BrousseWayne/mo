import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";

interface Message {
  type: string;
  content: string;
  source_agent?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export async function messageRoutes(app: FastifyInstance) {
  app.get("/programs/:id/messages", async (request) => {
    const { id } = request.params as { id: string };
    const { limit = "50", offset = "0" } = request.query as { limit?: string; offset?: string };

    const messages: Message[] = [];

    const [adjustmentRows, milestoneRows, redFlagRows, notificationRows] = await Promise.all([
      app.db.execute(sql`
        SELECT trigger_type, old_values, new_values, reason, affected_agents, created_at
        FROM adjustments WHERE program_id = ${id}
        ORDER BY created_at DESC
      `),
      app.db.execute(sql`
        SELECT type, value, achieved_at, metadata
        FROM milestones WHERE program_id = ${id}
        ORDER BY achieved_at DESC
      `),
      app.db.execute(sql`
        SELECT flag_type, severity, status, details, detected_at
        FROM red_flags WHERE program_id = ${id}
        ORDER BY detected_at DESC
      `),
      app.db.execute(sql`
        SELECT title, body, metadata, sent_at
        FROM notification_log WHERE program_id = ${id}
        ORDER BY sent_at DESC
      `),
    ]);

    for (const row of adjustmentRows as Iterable<Record<string, unknown>>) {
      messages.push({
        type: "adjustment",
        content: `${row.trigger_type}: ${row.reason}`,
        created_at: String(row.created_at),
        metadata: { old_values: row.old_values, new_values: row.new_values, affected_agents: row.affected_agents },
      });
    }

    for (const row of milestoneRows as Iterable<Record<string, unknown>>) {
      messages.push({
        type: "milestone",
        content: `Milestone achieved: ${row.type}${row.value ? ` (${row.value})` : ""}`,
        created_at: String(row.achieved_at),
        metadata: row.metadata as Record<string, unknown> | undefined,
      });
    }

    for (const row of redFlagRows as Iterable<Record<string, unknown>>) {
      messages.push({
        type: "health_advisory",
        content: `Health flag: ${row.flag_type} (${row.severity})`,
        source_agent: "PHYSICIAN",
        created_at: String(row.detected_at),
        metadata: row.details as Record<string, unknown> | undefined,
      });
    }

    for (const row of notificationRows as Iterable<Record<string, unknown>>) {
      messages.push({
        type: "notification",
        content: `${row.title}: ${row.body}`,
        created_at: String(row.sent_at),
        metadata: row.metadata as Record<string, unknown> | undefined,
      });
    }

    messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const start = Number(offset);
    const end = start + Number(limit);

    return {
      success: true,
      data: {
        messages: messages.slice(start, end),
        total: messages.length,
      },
    };
  });
}
