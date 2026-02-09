import { z } from "zod";

export const pipelineStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "paused",
]);

export type PipelineStatus = z.infer<typeof pipelineStatusSchema>;

export const pipelineRunRequestSchema = z.object({
  user_id: z.string().uuid(),
  intake_response_id: z.string().uuid(),
  agents: z.array(z.string()).default(["SCIENTIST"]),
});

export type PipelineRunRequest = z.infer<typeof pipelineRunRequestSchema>;
