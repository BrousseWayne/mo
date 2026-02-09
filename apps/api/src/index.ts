import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import Anthropic from "@anthropic-ai/sdk";
import { createDb, type Database } from "@mo/database";
import { registerRoutes } from "./routes/index.js";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
    anthropic: Anthropic;
  }
}

const app = Fastify({ logger: true });

await app.register(cors);

const db = createDb(process.env.DATABASE_URL!);
app.decorate("db", db);

const anthropic = new Anthropic();
app.decorate("anthropic", anthropic);

await registerRoutes(app);

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
