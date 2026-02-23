import { useQuery } from "../hooks/use-query";
import { LoadingState, ErrorState, EmptyState } from "../components/LoadingState";
import { AgentBadge } from "../components/AgentBadge";
import { JsonViewer } from "../components/JsonViewer";
import { useState } from "react";

interface TriggerSummary {
  trigger_type: string;
  count: number;
}

interface Adjustment {
  id: string;
  program_id: string;
  pipeline_run_id: string | null;
  trigger_type: string;
  old_values: unknown;
  new_values: unknown;
  affected_agents: string[];
  reason: string;
  created_at: string;
}

interface TriggersResponse {
  rows: Adjustment[];
  summary: TriggerSummary[];
}

interface Outcome {
  adjustment_id: string;
  trigger_type: string;
  weight_before: number | null;
  weight_after: number | null;
  weeks_elapsed: number;
}

export function TriggerDashboardPage() {
  const { data, loading, error } = useQuery<TriggersResponse>("/admin/triggers");
  const outcomes = useQuery<Outcome[]>("/admin/outcomes");
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <div>
      <h1 className="page-title">Trigger Dashboard</h1>

      <div className="kpi-grid">
        {data.summary.map((s) => (
          <div key={s.trigger_type} className="kpi">
            <div className="kpi-label">{s.trigger_type}</div>
            <div className="kpi-value">{Number(s.count)}</div>
          </div>
        ))}
        {data.summary.length === 0 && (
          <div className="kpi">
            <div className="kpi-label">Total Triggers</div>
            <div className="kpi-value">0</div>
          </div>
        )}
      </div>

      {data.rows.length === 0 ? (
        <EmptyState message="No adjustments triggered yet" />
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Trigger</th>
                <th>Program</th>
                <th>Affected Agents</th>
                <th>Reason</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((adj) => (
                <>
                  <tr key={adj.id} onClick={() => setExpanded(expanded === adj.id ? null : adj.id)} style={{ cursor: "pointer" }}>
                    <td><span className="badge" style={{ background: "var(--c-surface-2)" }}>{adj.trigger_type}</span></td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{adj.program_id.slice(0, 8)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {(adj.affected_agents ?? []).map((a: string) => (
                          <AgentBadge key={a} name={a} />
                        ))}
                      </div>
                    </td>
                    <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{adj.reason}</td>
                    <td style={{ fontSize: 12, color: "var(--c-text-dim)" }}>{new Date(adj.created_at).toLocaleString()}</td>
                  </tr>
                  {expanded === adj.id && (
                    <tr key={`${adj.id}-detail`}>
                      <td colSpan={5} style={{ background: "var(--c-surface-2)", padding: 16 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text-dim)", marginBottom: 4 }}>OLD VALUES</div>
                            <JsonViewer data={adj.old_values} defaultExpanded={2} />
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text-dim)", marginBottom: 4 }}>NEW VALUES</div>
                            <JsonViewer data={adj.new_values} defaultExpanded={2} />
                          </div>
                        </div>
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text-dim)", marginBottom: 4 }}>REASON</div>
                          <div style={{ fontSize: 13 }}>{adj.reason}</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
