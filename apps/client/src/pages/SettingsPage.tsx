import { useNavigate } from "react-router";
import { useProgramId } from "../context/ProgramContext";
import { useQuery } from "../hooks/use-query";
import { useMutation } from "../hooks/use-mutation";
import type { Program } from "../api/types";

export function SettingsPage() {
  const { programId, setProgramId } = useProgramId();
  const navigate = useNavigate();
  const { data: program, refetch } = useQuery<Program>(programId ? `/programs/${programId}` : null);
  const { mutate, loading, error } = useMutation<Program>();

  if (!program) return <div className="page-loading">Loading…</div>;

  const setStatus = async (status: string) => {
    await mutate(`/programs/${program.id}/status`, "PATCH", { status });
    refetch();
  };

  const cancelAndRestart = async () => {
    const confirmed = window.confirm(
      "Cancel this program and start a fresh intake? Progress history stays in the database, but the program will no longer be active."
    );
    if (!confirmed) return;
    await mutate(`/programs/${program.id}/status`, "PATCH", { status: "cancelled" });
    setProgramId(null);
    navigate("/intake", { replace: true });
  };

  return (
    <>
      <h1>Program settings</h1>
      <p className="page-sub">You are the admin here — manage the program directly.</p>
      {error ? <div className="error-box">{error}</div> : null}

      <div className="card">
        <h2>Current program</h2>
        <ul className="plain">
          <li>Status: <strong>{program.status}</strong></li>
          <li>Started: {new Date(program.started_at).toLocaleDateString()}</li>
          <li>Week {program.current_week} · {program.current_phase.replace("_", " ")} · {program.current_tier.replace("_", " ")}</li>
          <li>{program.target_intake_kcal} kcal/day (+{program.surplus_kcal} surplus)</li>
          <li>{program.current_weight_kg} kg → {program.target_weight_kg} kg</li>
        </ul>
      </div>

      <div className="card">
        <h2>Actions</h2>
        {program.status === "active" ? (
          <button type="button" className="btn secondary" disabled={loading} onClick={() => setStatus("paused")} style={{ marginBottom: 10 }}>
            Pause program
          </button>
        ) : null}
        {program.status === "paused" ? (
          <button type="button" className="btn" disabled={loading} onClick={() => setStatus("active")} style={{ marginBottom: 10 }}>
            Resume program
          </button>
        ) : null}
        <button type="button" className="btn secondary" disabled={loading} onClick={cancelAndRestart}>
          Cancel program and restart intake
        </button>
        <p className="muted" style={{ marginTop: 8, fontSize: "0.8rem" }}>
          Cancelling keeps all history in the database and sends you back to the intake wizard to start a new program.
        </p>
      </div>
    </>
  );
}
