import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseMealTemplate } from "../parse-meal-template.js";

const md = readFileSync(
  fileURLToPath(new URL("../../../../../agents/artifacts/dietitian-meal-template.md", import.meta.url)),
  "utf-8"
);

describe("parseMealTemplate", () => {
  const output = parseMealTemplate(md);

  it("produces all 7 days with 5 slots each", () => {
    const days = Object.keys(output.weekly_template);
    expect(days).toEqual([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]);
    for (const day of days) {
      expect(Object.keys(output.weekly_template[day])).toEqual([
        "breakfast",
        "lunch",
        "snack",
        "dinner",
        "presleep",
      ]);
    }
  });

  it("derives slot specs from the specifications table", () => {
    const breakfast = output.weekly_template.monday.breakfast;
    expect(breakfast.slot_spec.protein_g).toBe(28);
    expect(breakfast.slot_spec.calories).toBe(525);
    expect(breakfast.slot_spec.prep_time_max_min).toBe(10);
    const presleep = output.weekly_template.monday.presleep;
    expect(presleep.slot_spec.protein_g).toBe(35);
    expect(presleep.slot_spec.calories).toBe(325);
  });

  it("excludes peanut butter and nut butters in every slot spec", () => {
    for (const day of Object.values(output.weekly_template)) {
      for (const slot of Object.values(day)) {
        expect(slot.slot_spec.constraints).toContain("no_peanut_butter");
        expect(slot.slot_spec.constraints).toContain("no_nut_butters");
      }
    }
  });

  it("applies the protein rotation to lunch and dinner", () => {
    expect(output.weekly_template.monday.lunch.primary_protein).toBe("chicken");
    expect(output.weekly_template.monday.dinner.cuisine_preference).toBe("mediterranean");
    expect(output.weekly_template.thursday.lunch.primary_protein).toBe("beef");
    expect(output.rotation_schedule.tuesday).toEqual({ protein: "salmon", cuisine: "asian" });
  });

  it("keeps primary options and two alternatives per slot", () => {
    const dinner = output.weekly_template.monday.dinner;
    expect(dinner.primary_option).toBe("Mediterranean chicken + couscous");
    expect(dinner.alternatives).toHaveLength(2);
    expect(dinner.alternatives[0].option).toBe("Salmon teriyaki + rice");
  });

  it("marks presleep as the highest compliance risk slot", () => {
    expect(output.weekly_template.friday.presleep.compliance_risk).toBe("high");
    expect(output.weekly_template.friday.lunch.compliance_risk).toBe("low");
  });

  it("parses the batch schedule", () => {
    expect(output.batch_schedule.batch_a).toMatchObject({
      cook_day: "sunday",
      covers: "Mon-Wed",
    });
    expect(output.batch_schedule.batch_b).toMatchObject({ cook_day: "wednesday" });
    expect(output.batch_schedule.sunday_off).toBeTruthy();
  });

  it("includes the minimum viable day emergency protocol", () => {
    expect(output.emergency_protocol.name).toBe("minimum_viable_day");
    expect(output.emergency_protocol.total_calories).toBe(1800);
  });
});
