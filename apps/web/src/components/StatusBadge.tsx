export function StatusBadge({ status }: { status: string }) {
  const cls = `status-${status}`;
  return <span className={`badge ${cls}`}>{status}</span>;
}
