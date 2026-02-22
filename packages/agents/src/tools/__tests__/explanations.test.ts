import { describe, it, expect } from "vitest";
import { generateExplanation } from "../explanations.js";

describe("generateExplanation", () => {
  const program = { current_weight_kg: 58, target_weight_kg: 65 };

  it("generates calorie adjustment explanation", () => {
    const adj = {
      trigger_type: "insufficient_gain",
      old_values: { target_intake_kcal: 2200 },
      new_values: { target_intake_kcal: 2400 },
      reason: "Weight gain below 0.25 kg/week for 3 consecutive weeks.",
      affected_agents: ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF"],
      created_at: new Date(),
    };
    const result = generateExplanation(adj, program);
    expect(result).toContain("Insufficient weight gain");
    expect(result).toContain("increased by 200 kcal");
    expect(result).toContain("2200 → 2400");
    expect(result).toContain("SCIENTIST");
  });

  it("generates protein recalc explanation", () => {
    const adj = {
      trigger_type: "protein_recalc",
      old_values: { protein_g: 88 },
      new_values: { protein_g: 96 },
      reason: "Monthly protein recalculation based on current weight.",
      affected_agents: ["NUTRITIONIST"],
      created_at: new Date(),
    };
    const result = generateExplanation(adj, program);
    expect(result).toContain("Protein intake recalculation");
    expect(result).toContain("88g to 96g");
  });

  it("handles unknown trigger type", () => {
    const adj = {
      trigger_type: "custom_trigger",
      old_values: {},
      new_values: {},
      reason: "Manual override.",
      affected_agents: [],
      created_at: new Date(),
    };
    const result = generateExplanation(adj, program);
    expect(result).toContain("custom_trigger");
    expect(result).toContain("Manual override");
  });
});
