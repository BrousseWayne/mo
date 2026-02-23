import { Link } from "react-router";
import { useQuery } from "../hooks/use-query";
import { LoadingState, ErrorState } from "../components/LoadingState";

interface Stats {
  pipeline: { total_runs: number; completed: number; failed: number; avg_duration_ms: number | null };
  agents: { agent_name: string; total_tokens: number; avg_duration_ms: number | null }[];
  active_programs: number;
}

interface Program {
  id: string;
  status: string;
  current_weight_kg: number;
  target_weight_kg: number;
  current_phase: string;
  current_tier: string;
  created_at: string;
}

export function HomePage() {
  const stats = useQuery<Stats>("/admin/stats");
  const programs = useQuery<Program[]>("/programs");

  if (stats.loading) return <LoadingState />;
  if (stats.error) return <ErrorState message={stats.error} />;

  const s = stats.data!;

  return (
    <div>
      <h1 className="page-title">MO Admin Dashboard</h1>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Active Programs</div>
          <div className="kpi-value">{s.active_programs}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Pipeline Runs</div>
          <div className="kpi-value">{s.pipeline.total_runs}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Completed</div>
          <div className="kpi-value" style={{ color: "var(--c-success)" }}>{s.pipeline.completed}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Failed</div>
          <div className="kpi-value" style={{ color: "var(--c-error)" }}>{s.pipeline.failed}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Avg Duration</div>
          <div className="kpi-value">{s.pipeline.avg_duration_ms ? `${(s.pipeline.avg_duration_ms / 1000).toFixed(1)}s` : "—"}</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Programs</h2>
        {programs.data && programs.data.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Weight</th>
                <th>Target</th>
                <th>Phase</th>
                <th>Tier</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {programs.data.map((p) => (
                <tr key={p.id}>
                  <td><Link to={`/programs/${p.id}/timeline`}>{p.id.slice(0, 8)}</Link></td>
                  <td><span className={`status-${p.status}`}>{p.status}</span></td>
                  <td>{p.current_weight_kg} kg</td>
                  <td>{p.target_weight_kg} kg</td>
                  <td>{p.current_phase}</td>
                  <td>{p.current_tier}</td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No programs yet</div>
        )}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Quick Links</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link to="/pipeline">Pipeline Explorer</Link>
          <Link to="/triggers">Trigger Dashboard</Link>
          <Link to="/explorer">Data Explorer</Link>
          <Link to="/stats">Stats & Costs</Link>
        </div>
      </div>
    </div>
  );
}
