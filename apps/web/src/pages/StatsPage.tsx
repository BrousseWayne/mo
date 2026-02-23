import { useQuery } from "../hooks/use-query";
import { LoadingState, ErrorState } from "../components/LoadingState";
import { AgentBadge } from "../components/AgentBadge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const AGENT_COLORS: Record<string, string> = {
  SCIENTIST: "#457B9D",
  NUTRITIONIST: "#2A9D8F",
  DIETITIAN: "#F4A261",
  CHEF: "#E9C46A",
  COACH: "#9B5DE5",
  PHYSICIAN: "#E63946",
};

interface Stats {
  pipeline: { total_runs: number; completed: number; failed: number; avg_duration_ms: number | null };
  agents: { agent_name: string; total_tokens: number; avg_duration_ms: number | null }[];
  active_programs: number;
}

interface CostData {
  agents: { agent_name: string; total_tokens: number; run_count: number; estimated_cost_usd: number }[];
  total_estimated_cost_usd: number;
}

export function StatsPage() {
  const stats = useQuery<Stats>("/admin/stats");
  const costs = useQuery<CostData>("/admin/costs");

  if (stats.loading) return <LoadingState />;
  if (stats.error) return <ErrorState message={stats.error} />;

  const s = stats.data!;
  const errorRate = s.pipeline.total_runs > 0 ? ((s.pipeline.failed / s.pipeline.total_runs) * 100).toFixed(1) : "0";

  return (
    <div>
      <h1 className="page-title">Stats & Costs</h1>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Active Programs</div>
          <div className="kpi-value">{s.active_programs}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Runs</div>
          <div className="kpi-value">{s.pipeline.total_runs}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Error Rate</div>
          <div className="kpi-value" style={{ color: Number(errorRate) > 10 ? "var(--c-error)" : "var(--c-text)" }}>{errorRate}%</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Avg Duration</div>
          <div className="kpi-value">{s.pipeline.avg_duration_ms ? `${(s.pipeline.avg_duration_ms / 1000).toFixed(1)}s` : "—"}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Cost</div>
          <div className="kpi-value">${costs.data?.total_estimated_cost_usd?.toFixed(4) ?? "—"}</div>
        </div>
      </div>

      {s.agents.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Token Usage by Agent</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={s.agents}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
              <XAxis dataKey="agent_name" stroke="var(--c-text-dim)" fontSize={11} />
              <YAxis stroke="var(--c-text-dim)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 4, fontSize: 12 }} />
              <Bar dataKey="total_tokens" radius={[4, 4, 0, 0]}>
                {s.agents.map((entry) => (
                  <Cell key={entry.agent_name} fill={AGENT_COLORS[entry.agent_name] ?? "#8b8d97"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {s.agents.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Agent Duration (avg)</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={s.agents.filter((a) => a.avg_duration_ms)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
              <XAxis dataKey="agent_name" stroke="var(--c-text-dim)" fontSize={11} />
              <YAxis stroke="var(--c-text-dim)" fontSize={11} label={{ value: "ms", position: "insideTopLeft", fill: "var(--c-text-dim)", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 4, fontSize: 12 }} />
              <Bar dataKey="avg_duration_ms" radius={[4, 4, 0, 0]}>
                {s.agents.filter((a) => a.avg_duration_ms).map((entry) => (
                  <Cell key={entry.agent_name} fill={AGENT_COLORS[entry.agent_name] ?? "#8b8d97"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {costs.data && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Cost Breakdown</div>
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Runs</th>
                <th>Total Tokens</th>
                <th>Estimated Cost</th>
              </tr>
            </thead>
            <tbody>
              {costs.data.agents.map((a) => (
                <tr key={a.agent_name}>
                  <td><AgentBadge name={a.agent_name} /></td>
                  <td>{a.run_count}</td>
                  <td>{a.total_tokens.toLocaleString()}</td>
                  <td>${a.estimated_cost_usd.toFixed(4)}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 600 }}>
                <td colSpan={3}>Total</td>
                <td>${costs.data.total_estimated_cost_usd.toFixed(4)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
