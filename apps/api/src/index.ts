import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import Anthropic from "@anthropic-ai/sdk";
import { createDb, type Database } from "@mo/database";
import { registerRoutes } from "./routes/index.js";
import { registerErrorHandler } from "./errors.js";
import { createPipelineQueue } from "./jobs/queue.js";
import { createPipelineWorker } from "./jobs/pipeline-worker.js";
import type { Queue } from "bullmq";
import type { PipelineJobData } from "./jobs/queue.js";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
    anthropic: Anthropic;
    queue: Queue<PipelineJobData>;
  }
}

const app = Fastify({ logger: true });

await app.register(cors);

const db = createDb(process.env.DATABASE_URL!);
app.decorate("db", db);

const anthropic = new Anthropic();
app.decorate("anthropic", anthropic);

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

const queue = createPipelineQueue(redisUrl);
app.decorate("queue", queue);

createPipelineWorker(redisUrl, db, anthropic);

registerErrorHandler(app);
await registerRoutes(app);

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
