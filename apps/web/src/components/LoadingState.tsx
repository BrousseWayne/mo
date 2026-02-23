export function LoadingState() {
  return (
    <div className="loading-state">
      <div className="loading-spinner" />
      Loading...
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return <div className="error-state">{message}</div>;
}

export function EmptyState({ message }: { message?: string }) {
  return <div className="empty-state">{message ?? "No data"}</div>;
}
