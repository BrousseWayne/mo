import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";

function formatICalDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export async function calendarRoutes(app: FastifyInstance) {
  app.get("/programs/:id/calendar.ics", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { weeks = "4" } = request.query as { weeks?: string };
    const numWeeks = Math.min(Number(weeks), 52);

    const programRows = await app.db.execute(sql`
      SELECT started_at, current_week FROM programs WHERE id = ${id}
    `);
    const program = (programRows as unknown[])[0] as { started_at: Date; current_week: number } | undefined;
    if (!program) {
      reply.code(404);
      return { success: false, error: { code: "NOT_FOUND", message: "Program not found" } };
    }

    const startedAt = new Date(program.started_at);
    const events: string[] = [];
    const now = new Date();

    for (let w = 0; w < numWeeks; w++) {
      const weekStart = addDays(startedAt, (program.current_week - 1 + w) * 7);
      if (weekStart < addDays(now, -7)) continue;

      const checkinDay = addDays(weekStart, 0);
      events.push(buildEvent(`Week ${program.current_week + w} Check-in`, checkinDay, "Weekly weigh-in and progress check"));

      if (w % 2 === 0) {
        events.push(buildEvent("Measurement Day", addDays(weekStart, 0), "Waist and hip measurements"));
      }

      const trainingDays = [1, 3, 5];
      for (const d of trainingDays) {
        events.push(buildEvent("Training Session", addDays(weekStart, d), "Scheduled workout"));
      }

      events.push(buildEvent("Batch Cooking", addDays(weekStart, 6), "Weekly meal prep"));
    }

    const ical = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//MO//Wellness Orchestrator//EN",
      ...events,
      "END:VCALENDAR",
    ].join("\r\n");

    reply.header("Content-Type", "text/calendar; charset=utf-8");
    reply.header("Content-Disposition", "attachment; filename=mo-schedule.ics");
    return ical;
  });
}

function buildEvent(summary: string, date: Date, description: string): string {
  const dtStart = formatICalDate(date);
  const uid = `${dtStart}-${summary.replace(/\s+/g, "-").toLowerCase()}@mo`;
  return [
    "BEGIN:VEVENT",
    `DTSTART:${dtStart}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `UID:${uid}`,
    "END:VEVENT",
  ].join("\r\n");
}
