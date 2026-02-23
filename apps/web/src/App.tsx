import { BrowserRouter, Routes, Route } from "react-router";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { HomePage } from "./pages/HomePage";
import { PipelineListPage } from "./pages/PipelineListPage";
import { PipelineDetailPage } from "./pages/PipelineDetailPage";
import { ProgramTimelinePage } from "./pages/ProgramTimelinePage";
import { AgentInspectorPage } from "./pages/AgentInspectorPage";
import { TriggerDashboardPage } from "./pages/TriggerDashboardPage";
import { DataExplorerPage } from "./pages/DataExplorerPage";
import { StatsPage } from "./pages/StatsPage";
import { SystemMapPage } from "./pages/SystemMapPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<HomePage />} />
          <Route path="system" element={<SystemMapPage />} />
          <Route path="pipeline" element={<PipelineListPage />} />
          <Route path="pipeline/:runId" element={<PipelineDetailPage />} />
          <Route path="programs/:programId/timeline" element={<ProgramTimelinePage />} />
          <Route path="agents/:agentName" element={<AgentInspectorPage />} />
          <Route path="triggers" element={<TriggerDashboardPage />} />
          <Route path="explorer" element={<DataExplorerPage />} />
          <Route path="explorer/:tableName" element={<DataExplorerPage />} />
          <Route path="stats" element={<StatsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
