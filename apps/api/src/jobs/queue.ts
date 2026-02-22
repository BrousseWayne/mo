import { Queue } from "bullmq";

export type PipelineJobData =
  | {
      type: "pipeline.initial";
      runId: string;
      userId: string;
      intakeResponseId: string;
      agents: string[];
    }
  | {
      type: "pipeline.checkin";
      runId: string;
      userId: string;
      intakeResponseId: string;
      programId: string;
      agents: string[];
      cachedOutputs: unknown[];
    };

export const PIPELINE_QUEUE_NAME = "pipeline";

export function createPipelineQueue(redisUrl: string) {
  return new Queue<PipelineJobData>(PIPELINE_QUEUE_NAME, {
    connection: { url: redisUrl },
  });
}
