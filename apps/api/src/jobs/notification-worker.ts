import { Worker, type Job } from "bullmq";

interface NotificationJobData {
  type: "notification.send";
  programId: string;
  channel: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export function createNotificationWorker(redisUrl: string) {
  const worker = new Worker<NotificationJobData>(
    "notifications",
    async (job: Job<NotificationJobData>) => {
      console.log(`[notification] ${job.data.channel}: ${job.data.title} — ${job.data.body}`);
      return { sent: true, channel: job.data.channel, timestamp: new Date().toISOString() };
    },
    { connection: { url: redisUrl } }
  );

  return worker;
}
