import { useParams, Link } from "react-router";
import { useQuery } from "../hooks/use-query";
import { LoadingState, ErrorState, EmptyState } from "../components/LoadingState";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface Program {
  id: string;
  status: string;
  current_weight_kg: number;
  target_weight_kg: number;
  current_phase: string;
  current_tier: string;
}

interface WeightEntry {
  week_number: number;
  weight_kg: number;
  created_at: string;
}

interface ChartData {
  weight_entries: WeightEntry[];
  milestones: { week_number: number; value: number; type: string }[];
  adjustments: { week_number: number; trigger_type: string }[];
}

interface CheckIn {
  id: string;
  week_number: number;
  weight_kg: number;
  waist_cm: number | null;
  hip_cm: number | null;
  cycle_phase: string | null;
  notes: string | null;
  created_at: string;
}

interface Message {
  id: string;
  event_type: string;
  actor: string;
  metadata: unknown;
  created_at: string;
}

export function ProgramTimelinePage() {
  const { programId } = useParams();
  const program = useQuery<Program>(`/programs/${programId}`);
  const chart = useQuery<ChartData>(`/programs/${programId}/charts/weight`);
  const checkins = useQuery<CheckIn[]>(`/programs/${programId}/checkins`);
  const messages = useQuery<Message[]>(`/programs/${programId}/messages`);

  if (program.loading) return <LoadingState />;
  if (program.error) return <ErrorState message={program.error} />;
  if (!program.data) return null;

  const p = program.data;

  const weightData = chart.data?.weight_entries ?? [];
  const milestones = chart.data?.milestones ?? [];
  const adjustmentWeeks = chart.data?.adjustments ?? [];

  const events: { type: string; date: string; summary: string; detail?: unknown; color: string }[] = [];

  (checkins.data ?? []).forEach((c) => {
    events.push({
      type: "check-in",
      date: c.created_at,
      summary: `Week ${c.week_number} check-in: ${c.weight_kg} kg${c.notes ? ` — ${c.notes}` : ""}`,
      color: "var(--c-accent)",
    });
  });

  milestones.forEach((m) => {
    events.push({
      type: "milestone",
      date: "",
      summary: `Milestone: ${m.type} (${m.value} kg) at week ${m.week_number}`,
      color: "var(--c-success)",
    });
  });

  adjustmentWeeks.forEach((a) => {
    events.push({
      type: "adjustment",
      date: "",
      summary: `Adjustment triggered: ${a.trigger_type} at week ${a.week_number}`,
      color: "var(--c-warning)",
    });
  });

  (messages.data ?? []).forEach((m) => {
    events.push({
      type: m.event_type,
      date: m.created_at,
      summary: `${m.event_type} by ${m.actor}`,
      detail: m.metadata,
      color: "var(--c-text-dim)",
    });
  });

  events.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <div>
      <div style={{ marginBottom: 16, fontSize: 13 }}>
        <Link to="/">Programs</Link> / {p.id.slice(0, 8)} / Timeline
      </div>

      <h1 className="page-title">Program Timeline</h1>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Current Weight</div>
          <div className="kpi-value">{p.current_weight_kg} kg</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Target Weight</div>
          <div className="kpi-value">{p.target_weight_kg} kg</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Phase</div>
          <div className="kpi-value" style={{ fontSize: 18 }}>{p.current_phase}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Tier</div>
          <div className="kpi-value" style={{ fontSize: 18 }}>{p.current_tier}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Status</div>
          <div className="kpi-value" style={{ fontSize: 18 }}>{p.status}</div>
        </div>
      </div>

      {weightData.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Weight Progress</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
              <XAxis dataKey="week_number" label={{ value: "Week", position: "bottom", fill: "var(--c-text-dim)", fontSize: 11 }} stroke="var(--c-text-dim)" fontSize={11} />
              <YAxis domain={["auto", "auto"]} stroke="var(--c-text-dim)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 4, fontSize: 12 }} />
              <Line type="monotone" dataKey="weight_kg" stroke="var(--c-accent)" strokeWidth={2} dot={{ r: 3 }} />
              <ReferenceLine y={p.target_weight_kg} stroke="var(--c-success)" strokeDasharray="3 3" label={{ value: "Target", fill: "var(--c-success)", fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Events ({events.length})</div>
        {events.length === 0 ? (
          <EmptyState message="No events yet" />
        ) : (
          <div>
            {events.map((ev, i) => (
              <div key={i} className="timeline-event">
                <div className="timeline-dot" style={{ background: ev.color }} />
                <div className="timeline-content">
                  <div className="timeline-date">
                    {ev.date ? new Date(ev.date).toLocaleString() : ""}
                    <span style={{ marginLeft: 8, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>{ev.type}</span>
                  </div>
                  <div className="timeline-summary">{ev.summary}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
