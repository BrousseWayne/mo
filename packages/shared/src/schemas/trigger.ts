import { z } from "zod";

export const triggerResultSchema = z.object({
  trigger_type: z.string(),
  adjustment_kcal: z.number().int().nullable(),
  affected_agents: z.array(z.string()),
  old_values: z.record(z.unknown()),
  new_values: z.record(z.unknown()),
  reason: z.string(),
});

export type TriggerResult = z.infer<typeof triggerResultSchema>;
