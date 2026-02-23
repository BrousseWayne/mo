import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useQuery } from "../hooks/use-query";
import { LoadingState, ErrorState, EmptyState } from "../components/LoadingState";
import { JsonViewer } from "../components/JsonViewer";

interface TableInfo {
  name: string;
  count: number;
}

interface TableDataResponse {
  rows: Record<string, unknown>[];
  total: number;
  limit: number;
  offset: number;
}

export function DataExplorerPage() {
  const { tableName } = useParams();
  const navigate = useNavigate();
  const tables = useQuery<TableInfo[]>("/admin/tables");
  const [page, setPage] = useState(0);
  const limit = 30;

  const tableData = useQuery<TableDataResponse>(
    tableName ? `/admin/tables/${tableName}?limit=${limit}&offset=${page * limit}` : null,
  );

  if (tables.loading) return <LoadingState />;
  if (tables.error) return <ErrorState message={tables.error} />;

  return (
    <div>
      <h1 className="page-title">Data Explorer</h1>

      {!tableName ? (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Table</th>
                <th>Rows</th>
              </tr>
            </thead>
            <tbody>
              {(tables.data ?? []).map((t) => (
                <tr key={t.name} onClick={() => navigate(`/explorer/${t.name}`)} style={{ cursor: "pointer" }}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{t.name}</td>
                  <td>{t.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 16, fontSize: 13 }}>
            <Link to="/explorer">Tables</Link> / {tableName}
          </div>

          {tableData.loading && <LoadingState />}
          {tableData.error && <ErrorState message={tableData.error} />}

          {tableData.data && tableData.data.rows.length === 0 && <EmptyState message="No rows" />}

          {tableData.data && tableData.data.rows.length > 0 && (
            <>
              <div className="card" style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      {Object.keys(tableData.data.rows[0]).map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.data.rows.map((row, i) => (
                      <tr key={i}>
                        {Object.entries(row).map(([col, val]) => (
                          <td key={col} style={{ maxWidth: 300, overflow: "hidden" }}>
                            {val === null ? (
                              <span style={{ color: "var(--c-text-dim)" }}>null</span>
                            ) : typeof val === "object" ? (
                              <JsonViewer data={val} defaultExpanded={0} />
                            ) : (
                              <span style={{ fontSize: 12 }}>{String(val)}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
                <span style={{ padding: "6px 12px", fontSize: 12, color: "var(--c-text-dim)" }}>
                  {page * limit + 1}–{Math.min((page + 1) * limit, tableData.data.total)} of {tableData.data.total}
                </span>
                <button disabled={(page + 1) * limit >= tableData.data.total} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
