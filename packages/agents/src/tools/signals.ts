interface ProgressEntry {
  week_number: number;
  weight_kg: number;
  subjective_markers?: { energy?: number; sleep_quality?: number; mood?: number; appetite?: number } | null;
}

interface TrainingSession {
  day_of_week: string;
  status: string;
  week_number: number;
}

export interface CrossAgentSignal {
  source: string;
  target_agents: string[];
  signal_type: string;
  message: string;
  confidence: "low" | "medium" | "high";
}

export function detectCrossAgentSignals(
  entries: ProgressEntry[],
  sessions: TrainingSession[]
): CrossAgentSignal[] {
  const signals: CrossAgentSignal[] = [];

  const recentEntries = entries.slice(0, 3);
  const lowSleep = recentEntries.filter(e => (e.subjective_markers?.sleep_quality ?? 10) < 4);
  if (lowSleep.length >= 2) {
    signals.push({
      source: "SCIENTIST",
      target_agents: ["COACH", "NUTRITIONIST"],
      signal_type: "poor_sleep",
      message: "Poor sleep reported for 2+ recent weeks. Consider reduced volume and sleep-supporting nutrition.",
      confidence: "medium",
    });
  }

  const mondaySessions = sessions.filter(s => s.day_of_week === "monday");
  const mondaySkips = mondaySessions.filter(s => s.status === "skipped");
  if (mondaySessions.length >= 3 && mondaySkips.length / mondaySessions.length > 0.5) {
    signals.push({
      source: "COACH",
      target_agents: ["DIETITIAN"],
      signal_type: "monday_underperformance",
      message: "Monday sessions frequently skipped. Weekend compliance may be an issue.",
      confidence: "medium",
    });
  }

  const lowEnergy = recentEntries.filter(e => (e.subjective_markers?.energy ?? 10) < 4);
  if (lowEnergy.length >= 2) {
    signals.push({
      source: "SCIENTIST",
      target_agents: ["NUTRITIONIST", "COACH"],
      signal_type: "low_energy",
      message: "Persistently low energy. Review calorie surplus adequacy and training load.",
      confidence: "high",
    });
  }

  return signals;
}
