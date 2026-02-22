import { z } from "zod";

export const programStatusZod = z.enum(["active", "paused", "completed", "cancelled"]);
export type ProgramStatus = z.infer<typeof programStatusZod>;

export const programCreateSchema = z.object({
  user_id: z.string().uuid(),
  intake_response_id: z.string().uuid(),
});

export type ProgramCreate = z.infer<typeof programCreateSchema>;

export const programUpdateSchema = z.object({
  status: programStatusZod.optional(),
  current_weight_kg: z.number().positive().optional(),
  current_week: z.number().int().positive().optional(),
  target_intake_kcal: z.number().int().positive().optional(),
  protein_g: z.number().positive().optional(),
  fat_g: z.number().positive().optional(),
  carbs_g: z.number().positive().optional(),
  surplus_kcal: z.number().int().optional(),
});

export type ProgramUpdate = z.infer<typeof programUpdateSchema>;
