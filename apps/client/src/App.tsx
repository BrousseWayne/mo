import { BrowserRouter, Routes, Route } from "react-router";
import { ProgramProvider } from "./context/ProgramContext";
import { ClientLayout } from "./layouts/ClientLayout";
import { IntakeWizardPage } from "./pages/intake/IntakeWizardPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CheckinPage } from "./pages/CheckinPage";
import { MealPlanPage } from "./pages/MealPlanPage";
import { TrainingWeekPage } from "./pages/TrainingWeekPage";
import { TrainingSessionPage } from "./pages/TrainingSessionPage";
import { GlossaryPage } from "./pages/GlossaryPage";
import { PhysicianPage } from "./pages/PhysicianPage";
import { SettingsPage } from "./pages/SettingsPage";

export function App() {
  return (
    <ProgramProvider>
      <BrowserRouter>
        <Routes>
          <Route path="intake" element={<IntakeWizardPage />} />
          <Route element={<ClientLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="checkin" element={<CheckinPage />} />
            <Route path="meals" element={<MealPlanPage />} />
            <Route path="training" element={<TrainingWeekPage />} />
            <Route path="training/:sessionId" element={<TrainingSessionPage />} />
            <Route path="glossary" element={<GlossaryPage />} />
            <Route path="health" element={<PhysicianPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProgramProvider>
  );
}
