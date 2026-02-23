import { useState } from "react";
import { useParams, Link } from "react-router";
import { useQuery } from "../hooks/use-query";
import { LoadingState, ErrorState } from "../components/LoadingState";
import { AgentBadge } from "../components/AgentBadge";
import { StatusBadge } from "../components/StatusBadge";
import { JsonViewer } from "../components/JsonViewer";

const AGENT_ORDER = ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF", "COACH"];

interface AgentOutput {
  id: string;
  agent_name: string;
  envelope: unknown;
  duration_ms: number | null;
  llm_tokens_used: number | null;
  llm_trace: unknown;
  created_at: string;
}

interface PipelineRun {
  id: string;
  program_id: string | null;
  trigger: string;
  status: string;
  agents_requested: string[];
  current_agent: string | null;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface TraceData {
  run: PipelineRun;
  outputs: AgentOutput[];
}

export function PipelineDetailPage() {
  const { runId } = useParams();
  const { data, loading, error } = useQuery<TraceData>(`/admin/pipeline-runs/${runId}/trace`);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const { run, outputs } = data;
  const requested = (run.agents_requested as string[]) ?? [];
  const outputMap = new Map(outputs.map((o) => [o.agent_name, o]));
  const selected = selectedAgent ? outputMap.get(selectedAgent) : null;

  const totalTokens = outputs.reduce((s, o) => s + (o.llm_tokens_used ?? 0), 0);
  const totalDuration = run.started_at && run.completed_at
    ? new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()
    : null;

  return (
    <div>
      <div style={{ marginBottom: 16, fontSize: 13 }}>
        <Link to="/pipeline">Pipeline Runs</Link> / {run.id.slice(0, 8)}
      </div>

      <h1 className="page-title">Pipeline Run</h1>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Status</div>
          <div style={{ marginTop: 4 }}><StatusBadge status={run.status} /></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Trigger</div>
          <div className="kpi-value" style={{ fontSize: 18 }}>{run.trigger ?? "—"}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Duration</div>
          <div className="kpi-value" style={{ fontSize: 18 }}>{totalDuration ? `${(totalDuration / 1000).toFixed(1)}s` : "—"}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Tokens</div>
          <div className="kpi-value" style={{ fontSize: 18 }}>{totalTokens.toLocaleString()}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Agents</div>
          <div className="kpi-value" style={{ fontSize: 18 }}>{outputs.length}/{requested.length}</div>
        </div>
      </div>

      {run.error && (
        <div className="error-state" style={{ marginBottom: 16 }}>{run.error}</div>
      )}

      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Agent Flow</div>
        <div className="agent-flow">
          {AGENT_ORDER.map((name, i) => {
            const output = outputMap.get(name);
            const isRequested = requested.includes(name);
            const isCached = !isRequested;
            return (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {i > 0 && <span className="agent-flow-arrow">&rarr;</span>}
                <div
                  className={`agent-node ${selectedAgent === name ? "selected" : ""} ${isCached ? "cached" : ""}`}
                  onClick={() => setSelectedAgent(selectedAgent === name ? null : name)}
                  style={{ borderColor: output ? undefined : "var(--c-border)" }}
                >
                  <div className="agent-node-name"><AgentBadge name={name} /></div>
                  {output ? (
                    <div className="agent-node-meta">
                      {output.duration_ms ? `${(output.duration_ms / 1000).toFixed(1)}s` : "—"}
                      {" · "}
                      {output.llm_tokens_used?.toLocaleString() ?? 0} tok
                    </div>
                  ) : (
                    <div className="agent-node-meta">{isCached ? "cached" : "pending"}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="trace-panel">
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              <AgentBadge name={selected.agent_name} /> Trace
            </div>
            <div style={{ fontSize: 12, color: "var(--c-text-dim)" }}>
              {selected.duration_ms ? `${(selected.duration_ms / 1000).toFixed(1)}s` : "—"}
              {" · "}
              {selected.llm_tokens_used?.toLocaleString() ?? 0} tokens
            </div>
          </div>

          <TraceMessages trace={selected.llm_trace} />

          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--c-border)" }}>
            <details>
              <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--c-text-dim)" }}>
                Agent Output (envelope)
              </summary>
              <div style={{ marginTop: 8 }}>
                <JsonViewer data={selected.envelope} defaultExpanded={2} />
              </div>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}

function TraceMessages({ trace }: { trace: unknown }) {
  if (!trace || !Array.isArray(trace)) {
    return <div style={{ padding: 16, color: "var(--c-text-dim)", fontSize: 13 }}>No trace data available</div>;
  }

  return (
    <div>
      {trace.map((msg: { role?: string; content?: unknown }, i: number) => (
        <div key={i} className="trace-message">
          <div className={`trace-role ${msg.role ?? ""}`}>{msg.role ?? "unknown"}</div>
          {typeof msg.content === "string" ? (
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, fontFamily: "var(--font-mono)" }}>{msg.content.length > 2000 ? msg.content.slice(0, 2000) + "..." : msg.content}</pre>
          ) : (
            <JsonViewer data={msg.content} defaultExpanded={1} />
          )}
        </div>
      ))}
    </div>
  );
}
