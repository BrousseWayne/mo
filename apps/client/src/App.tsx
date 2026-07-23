import { BrowserRouter, Routes, Route } from "react-router";
import { ProgramProvider } from "./context/ProgramContext";
import { ClientLayout } from "./layouts/ClientLayout";
import { IntakeWizardPage } from "./pages/intake/IntakeWizardPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CheckinPage } from "./pages/CheckinPage";
import { MealPlanPage } from "./pages/MealPlanPage";
import { TrainingWeekPage } from "./pages/TrainingWeekPage";
import { TrainingSessionPage } from "./pages/TrainingSessionPage";

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
          </Route>
        </Routes>
      </BrowserRouter>
    </ProgramProvider>
  );
}
