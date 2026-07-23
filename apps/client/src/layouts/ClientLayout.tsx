import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { useProgramId } from "../context/ProgramContext";
import { useQuery } from "../hooks/use-query";
import { BottomNav } from "../components/BottomNav";
import type { Program } from "../api/types";

export function ClientLayout() {
  const { programId, setProgramId } = useProgramId();
  const navigate = useNavigate();
  const { data: programs, loading } = useQuery<Program[]>("/programs");

  useEffect(() => {
    if (loading || programs === null) return;
    const stored = programs.find((p) => p.id === programId);
    if (stored?.status === "active") return;
    const active = programs.find((p) => p.status === "active");
    if (active) {
      setProgramId(active.id);
    } else {
      setProgramId(null);
      navigate("/intake", { replace: true });
    }
  }, [programId, programs, loading, setProgramId, navigate]);

  if (!programId) {
    return <div className="page-loading">Loading…</div>;
  }

  return (
    <div className="app-shell">
      <main className="app-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
