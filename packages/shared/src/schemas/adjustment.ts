import { z } from "zod";

export const adjustmentTypeEnum = z.enum([
  "calorie_increase",
  "calorie_decrease",
  "phase_transition",
  "deload",
  "tdee_recalculation",
  "protein_recalculation",
  "compliance_simplification",
]);

export type AdjustmentType = z.infer<typeof adjustmentTypeEnum>;

export const adjustmentResultSchema = z.object({
  triggers_fired: z.array(z.string()),
  adjustment_type: adjustmentTypeEnum.nullable(),
  adjustment_amount_kcal: z.number().int().nullable(),
  new_target_intake_kcal: z.number().int(),
  new_macros: z.object({
    protein_g: z.number(),
    fat_g: z.number(),
    carbs_g: z.number(),
  }),
  agents_re_run: z.array(z.string()),
  agents_unchanged: z.array(z.string()),
  notes: z.array(z.string()),
});

export type AdjustmentResult = z.infer<typeof adjustmentResultSchema>;
