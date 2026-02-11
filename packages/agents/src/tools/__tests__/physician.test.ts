import { describe, test, expect } from "vitest";
import {
  classifyRedFlag,
  lookupSupplementSafety,
  assessRefeedingRisk,
} from "../physician.js";

describe("classifyRedFlag", () => {
  test("amenorrhea 100 days → urgent, gynecologist, pause", () => {
    const result = classifyRedFlag({
      symptom: "amenorrhea",
      duration_days: 100,
      bmi: 18.5,
      training_weeks: 6,
    });
    expect(result.urgency).toBe("urgent");
    expect(result.referral_target).toBe(
      "gynecologist or reproductive endocrinologist"
    );
    expect(result.pipeline_action).toBe("pause");
  });

  test("knee pain 3 days → routine, null referral, continue", () => {
    const result = classifyRedFlag({
      symptom: "knee pain",
      duration_days: 3,
      bmi: 18.5,
      training_weeks: 4,
    });
    expect(result.urgency).toBe("routine");
    expect(result.referral_target).toBeNull();
    expect(result.pipeline_action).toBe("continue");
  });

  test("knee pain 10 days → soon, physiotherapist, continue", () => {
    const result = classifyRedFlag({
      symptom: "knee pain",
      duration_days: 10,
      bmi: 18.5,
      training_weeks: 8,
    });
    expect(result.urgency).toBe("soon");
    expect(result.referral_target).toBe("physiotherapist");
    expect(result.pipeline_action).toBe("continue");
  });

  test("eating disorder signs → urgent, psychologist, pause", () => {
    const result = classifyRedFlag({
      symptom: "eating disorder signs",
      duration_days: 30,
      bmi: 17.5,
      training_weeks: 2,
    });
    expect(result.urgency).toBe("urgent");
    expect(result.referral_target).toBe(
      "psychologist specializing in eating disorders"
    );
    expect(result.pipeline_action).toBe("pause");
  });

  test("cold intolerance → routine, GP thyroid, continue", () => {
    const result = classifyRedFlag({
      symptom: "cold intolerance",
      duration_days: 14,
      bmi: 18.5,
      training_weeks: 4,
    });
    expect(result.urgency).toBe("routine");
    expect(result.referral_target).toBe("GP for thyroid panel");
    expect(result.pipeline_action).toBe("continue");
  });
});

describe("lookupSupplementSafety", () => {
  test("creatine → excellent, 3-5g/day", () => {
    const result = lookupSupplementSafety({ supplement_name: "creatine" });
    expect(result.safety_profile).toBe("excellent");
    expect(result.dose_range).toBe("3-5g/day");
  });

  test("ashwagandha → moderate, thyroid interaction", () => {
    const result = lookupSupplementSafety({ supplement_name: "ashwagandha" });
    expect(result.safety_profile).toBe("moderate");
    expect(result.interactions).toContain("thyroid medications");
  });

  test("unknown supplement → unknown safety", () => {
    const result = lookupSupplementSafety({
      supplement_name: "unknown_supplement",
    });
    expect(result.safety_profile).toBe("unknown");
    expect(result.dose_range).toBe("consult healthcare provider");
  });
});

describe("assessRefeedingRisk", () => {
  test("BMI 18.5, normal → low", () => {
    const result = assessRefeedingRisk({
      bmi: 18.5,
      recent_intake_pattern: "normal",
    });
    expect(result.risk_level).toBe("low");
    expect(result.protocol).toBe("standard ramp-up safe");
    expect(result.monitoring).toHaveLength(0);
  });

  test("BMI 15, severe restriction → high", () => {
    const result = assessRefeedingRisk({
      bmi: 15,
      recent_intake_pattern: "severe_restriction",
    });
    expect(result.risk_level).toBe("high");
    expect(result.protocol).toBe("inpatient medical supervision recommended");
    expect(result.monitoring).toContain("cardiac monitoring");
  });
});
