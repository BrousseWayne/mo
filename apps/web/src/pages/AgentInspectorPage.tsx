import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "../hooks/use-query";
import { LoadingState, ErrorState, EmptyState } from "../components/LoadingState";
import { AgentBadge } from "../components/AgentBadge";
import { JsonViewer } from "../components/JsonViewer";

const ALL_AGENTS = ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF", "COACH", "PHYSICIAN"];

const AGENT_COLORS: Record<string, string> = {
  SCIENTIST: "#457B9D",
  NUTRITIONIST: "#2A9D8F",
  DIETITIAN: "#F4A261",
  CHEF: "#E9C46A",
  COACH: "#9B5DE5",
  PHYSICIAN: "#E63946",
};

interface AgentOutput {
  id: string;
  pipeline_run_id: string;
  agent_name: string;
  envelope: unknown;
  duration_ms: number | null;
  llm_tokens_used: number | null;
  created_at: string;
  run_trigger: string;
  program_id: string;
}

interface AgentOutputsResponse {
  rows: AgentOutput[];
  total: number;
}

export function AgentInspectorPage() {
  const { agentName } = useParams();
  const navigate = useNavigate();
  const [diffA, setDiffA] = useState<string | null>(null);
  const [diffB, setDiffB] = useState<string | null>(null);

  const agent = agentName ?? "SCIENTIST";
  const { data, loading, error } = useQuery<AgentOutputsResponse>(`/admin/agent-outputs?agent=${agent}&limit=100`);

  const outputs = data?.rows ?? [];
  const selectedA = outputs.find((o) => o.id === diffA);
  const selectedB = outputs.find((o) => o.id === diffB);

  function toggleDiff(id: string) {
    if (diffA === id) { setDiffA(null); return; }
    if (diffB === id) { setDiffB(null); return; }
    if (!diffA) { setDiffA(id); return; }
    if (!diffB) { setDiffB(id); return; }
    setDiffA(diffB);
    setDiffB(id);
  }

  return (
    <div>
      <h1 className="page-title">Agent Inspector</h1>

      <div className="agent-selector">
        {ALL_AGENTS.map((a) => (
          <button
            key={a}
            className={`agent-btn ${agent === a ? "active" : ""}`}
            style={{ borderColor: AGENT_COLORS[a] }}
            onClick={() => { navigate(`/agents/${a}`); setDiffA(null); setDiffB(null); }}
          >
            {a}
          </button>
        ))}
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {outputs.length === 0 && !loading && <EmptyState message={`No outputs for ${agent}`} />}

      {outputs.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 12, color: "var(--c-text-dim)", marginBottom: 8 }}>
            Select two outputs to compare (click to toggle)
          </div>
          <table>
            <thead>
              <tr>
                <th>Diff</th>
                <th>Run</th>
                <th>Trigger</th>
                <th>Duration</th>
                <th>Tokens</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {outputs.map((o) => {
                const isDiff = o.id === diffA || o.id === diffB;
                return (
                  <tr key={o.id} style={{ background: isDiff ? "var(--c-surface-2)" : undefined }}>
                    <td>
                      <input type="checkbox" checked={isDiff} onChange={() => toggleDiff(o.id)} />
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{o.pipeline_run_id.slice(0, 8)}</td>
                    <td>{o.run_trigger}</td>
                    <td>{o.duration_ms ? `${(o.duration_ms / 1000).toFixed(1)}s` : "—"}</td>
                    <td>{o.llm_tokens_used?.toLocaleString() ?? "—"}</td>
                    <td style={{ fontSize: 12, color: "var(--c-text-dim)" }}>{new Date(o.created_at).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(selectedA || selectedB) && (
        <div className="diff-container" style={{ marginTop: 12 }}>
          <div className="diff-side">
            <div className="diff-header">
              {selectedA ? (
                <>
                  <AgentBadge name={agent} /> Run {selectedA.pipeline_run_id.slice(0, 8)} — {new Date(selectedA.created_at).toLocaleString()}
                </>
              ) : "Select first output"}
            </div>
            {selectedA && <JsonViewer data={selectedA.envelope} defaultExpanded={2} />}
          </div>
          <div className="diff-side">
            <div className="diff-header">
              {selectedB ? (
                <>
                  <AgentBadge name={agent} /> Run {selectedB.pipeline_run_id.slice(0, 8)} — {new Date(selectedB.created_at).toLocaleString()}
                </>
              ) : "Select second output"}
            </div>
            {selectedB && <JsonViewer data={selectedB.envelope} defaultExpanded={2} />}
          </div>
        </div>
      )}
    </div>
  );
}
