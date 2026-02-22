import type { FastifyInstance } from "fastify";
import { intakeRoutes } from "./intake.js";
import { pipelineRoutes } from "./pipeline.js";
import { agentsRoutes } from "./agents.js";
import { programRoutes } from "./programs.js";
import { checkinRoutes } from "./checkins.js";

export async function registerRoutes(app: FastifyInstance) {
  await app.register(intakeRoutes);
  await app.register(pipelineRoutes);
  await app.register(agentsRoutes);
  await app.register(programRoutes);
  await app.register(checkinRoutes);
}
