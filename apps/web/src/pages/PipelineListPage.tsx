import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "../hooks/use-query";
import { LoadingState, ErrorState, EmptyState } from "../components/LoadingState";
import { AgentBadge } from "../components/AgentBadge";
import { StatusBadge } from "../components/StatusBadge";

interface PipelineRun {
  id: string;
  program_id: string | null;
  trigger: string;
  status: string;
  agents_requested: string[];
  agents_completed: string[];
  duration_ms: number | null;
  created_at: string;
}

interface PipelineRunsResponse {
  rows: PipelineRun[];
  total: number;
  limit: number;
  offset: number;
}

export function PipelineListPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [trigger, setTrigger] = useState("");
  const [page, setPage] = useState(0);
  const limit = 30;

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (trigger) params.set("trigger", trigger);
  params.set("limit", String(limit));
  params.set("offset", String(page * limit));

  const { data, loading, error } = useQuery<PipelineRunsResponse>(`/admin/pipeline-runs?${params}`);

  return (
    <div>
      <h1 className="page-title">Pipeline Runs</h1>

      <div className="filter-bar">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <select value={trigger} onChange={(e) => { setTrigger(e.target.value); setPage(0); }}>
          <option value="">All triggers</option>
          <option value="initial">Initial</option>
          <option value="weekly_checkin">Weekly Check-in</option>
          <option value="adjustment">Adjustment</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && data.rows.length === 0 && <EmptyState message="No pipeline runs found" />}

      {data && data.rows.length > 0 && (
        <>
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Run ID</th>
                  <th>Program</th>
                  <th>Trigger</th>
                  <th>Status</th>
                  <th>Agents</th>
                  <th>Duration</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((run) => (
                  <tr key={run.id} onClick={() => navigate(`/pipeline/${run.id}`)} style={{ cursor: "pointer" }}>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{run.id.slice(0, 8)}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{run.program_id?.slice(0, 8) ?? "—"}</td>
                    <td>{run.trigger ?? "—"}</td>
                    <td><StatusBadge status={run.status} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {(run.agents_completed ?? []).map((a: string) => (
                          <AgentBadge key={a} name={a} />
                        ))}
                      </div>
                    </td>
                    <td>{run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : "—"}</td>
                    <td style={{ fontSize: 12, color: "var(--c-text-dim)" }}>{new Date(run.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
            <span style={{ padding: "6px 12px", fontSize: 12, color: "var(--c-text-dim)" }}>
              {page * limit + 1}–{Math.min((page + 1) * limit, data.total)} of {data.total}
            </span>
            <button disabled={(page + 1) * limit >= data.total} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}
