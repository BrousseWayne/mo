import { describe, it, expect } from "vitest";
import {
  evaluateInsufficientGain,
  evaluateExcessiveGain,
  evaluateWaistHipFlag,
  evaluateTrainingStall,
  evaluateWeightMilestone,
  evaluateProteinRecalc,
  evaluateCompliance,
} from "../evaluators.js";

describe("evaluateInsufficientGain", () => {
  it("returns null during adaptation period", () => {
    const weights = [
      { weight_kg: 55.5, week_number: 3 },
      { weight_kg: 55.3, week_number: 2 },
      { weight_kg: 55.0, week_number: 1 },
    ];
    expect(evaluateInsufficientGain(weights, false)).toBeNull();
  });

  it("returns null with insufficient data", () => {
    const weights = [{ weight_kg: 55.5, week_number: 5 }];
    expect(evaluateInsufficientGain(weights, true)).toBeNull();
  });

  it("fires when gain is below threshold", () => {
    const weights = [
      { weight_kg: 55.2, week_number: 7 },
      { weight_kg: 55.1, week_number: 6 },
      { weight_kg: 55.0, week_number: 5 },
    ];
    const result = evaluateInsufficientGain(weights, true);
    expect(result).not.toBeNull();
    expect(result!.trigger_type).toBe("insufficient_gain");
    expect(result!.adjustment_kcal).toBe(200);
  });

  it("returns null when gain is sufficient", () => {
    const weights = [
      { weight_kg: 56.0, week_number: 7 },
      { weight_kg: 55.7, week_number: 6 },
      { weight_kg: 55.0, week_number: 5 },
    ];
    expect(evaluateInsufficientGain(weights, true)).toBeNull();
  });
});

describe("evaluateExcessiveGain", () => {
  it("fires when gain exceeds threshold", () => {
    const weights = [
      { weight_kg: 57.0, week_number: 7 },
      { weight_kg: 56.0, week_number: 6 },
      { weight_kg: 55.0, week_number: 5 },
    ];
    const result = evaluateExcessiveGain(weights, true);
    expect(result).not.toBeNull();
    expect(result!.trigger_type).toBe("excessive_gain");
    expect(result!.adjustment_kcal).toBe(-150);
  });

  it("returns null within threshold", () => {
    const weights = [
      { weight_kg: 55.5, week_number: 7 },
      { weight_kg: 55.2, week_number: 6 },
      { weight_kg: 55.0, week_number: 5 },
    ];
    expect(evaluateExcessiveGain(weights, true)).toBeNull();
  });
});

describe("evaluateWaistHipFlag", () => {
  it("returns null with insufficient measurements", () => {
    const measurements = [
      { waist_cm: 70, hip_cm: 90, week_number: 1 },
      { waist_cm: 70.5, hip_cm: 90, week_number: 2 },
    ];
    expect(evaluateWaistHipFlag(measurements)).toBeNull();
  });

  it("returns null when null measurements present", () => {
    const measurements = [
      { waist_cm: null, hip_cm: null, week_number: 1 },
      { waist_cm: null, hip_cm: null, week_number: 2 },
      { waist_cm: null, hip_cm: null, week_number: 3 },
      { waist_cm: null, hip_cm: null, week_number: 4 },
    ];
    expect(evaluateWaistHipFlag(measurements)).toBeNull();
  });

  it("fires on consistently increasing waist-hip ratio", () => {
    const measurements = [
      { waist_cm: 73, hip_cm: 90, week_number: 4 },
      { waist_cm: 72, hip_cm: 90, week_number: 3 },
      { waist_cm: 71, hip_cm: 90, week_number: 2 },
      { waist_cm: 70, hip_cm: 90, week_number: 1 },
    ];
    const result = evaluateWaistHipFlag(measurements);
    expect(result).not.toBeNull();
    expect(result!.trigger_type).toBe("waist_hip_flag");
  });
});

describe("evaluateTrainingStall", () => {
  it("returns null with insufficient sessions", () => {
    const sessions = [
      {
        exercises: [{ name: "squat", actual: [{ weight_kg: 40, reps: 8 }] }],
        status: "completed",
        week_number: 1,
      },
    ];
    expect(evaluateTrainingStall(sessions)).toBeNull();
  });

  it("fires when lifts stall across sessions", () => {
    const sessions = Array.from({ length: 3 }, (_, i) => ({
      exercises: [
        { name: "squat", actual: [{ weight_kg: 40, reps: 8 }] },
        { name: "bench", actual: [{ weight_kg: 30, reps: 8 }] },
      ],
      status: "completed",
      week_number: i + 1,
    }));
    const result = evaluateTrainingStall(sessions);
    expect(result).not.toBeNull();
    expect(result!.trigger_type).toBe("training_stall");
  });

  it("returns null when lifts progress", () => {
    const sessions = [
      {
        exercises: [
          { name: "squat", actual: [{ weight_kg: 45, reps: 8 }] },
          { name: "bench", actual: [{ weight_kg: 35, reps: 8 }] },
        ],
        status: "completed",
        week_number: 3,
      },
      {
        exercises: [
          { name: "squat", actual: [{ weight_kg: 42.5, reps: 8 }] },
          { name: "bench", actual: [{ weight_kg: 32.5, reps: 8 }] },
        ],
        status: "completed",
        week_number: 2,
      },
      {
        exercises: [
          { name: "squat", actual: [{ weight_kg: 40, reps: 8 }] },
          { name: "bench", actual: [{ weight_kg: 30, reps: 8 }] },
        ],
        status: "completed",
        week_number: 1,
      },
    ];
    expect(evaluateTrainingStall(sessions)).toBeNull();
  });
});

describe("evaluateWeightMilestone", () => {
  it("fires at 5kg milestone", () => {
    const result = evaluateWeightMilestone(55, 60.5, null);
    expect(result).not.toBeNull();
    expect(result!.trigger_type).toBe("weight_milestone");
  });

  it("returns null below milestone", () => {
    expect(evaluateWeightMilestone(55, 58, null)).toBeNull();
  });

  it("returns null when milestone already processed", () => {
    expect(evaluateWeightMilestone(55, 60.5, 60)).toBeNull();
  });
});

describe("evaluateProteinRecalc", () => {
  it("returns null when no previous recalc", () => {
    expect(evaluateProteinRecalc(null, new Date())).toBeNull();
  });

  it("fires after 30 days", () => {
    const lastRecalc = new Date();
    lastRecalc.setDate(lastRecalc.getDate() - 31);
    const result = evaluateProteinRecalc(lastRecalc, new Date());
    expect(result).not.toBeNull();
    expect(result!.trigger_type).toBe("protein_recalc");
  });

  it("returns null within 30 days", () => {
    const lastRecalc = new Date();
    lastRecalc.setDate(lastRecalc.getDate() - 15);
    expect(evaluateProteinRecalc(lastRecalc, new Date())).toBeNull();
  });
});

describe("evaluateCompliance", () => {
  it("returns null with insufficient data", () => {
    expect(evaluateCompliance([3])).toBeNull();
  });

  it("fires when MVD average is low", () => {
    const result = evaluateCompliance([1, 1, 1]);
    expect(result).not.toBeNull();
    expect(result!.trigger_type).toBe("compliance");
  });

  it("returns null when compliance is adequate", () => {
    expect(evaluateCompliance([5, 4, 3])).toBeNull();
  });
});
