import { HeadlessLlmClient } from "./headless.js";
import { ApiLlmClient } from "./api.js";
import type { LlmJsonClient } from "./types.js";

export type LlmMode = "headless" | "api";

export function createLlmClient(mode?: string): LlmJsonClient {
  const resolved = (mode ?? process.env.LLM_MODE ?? "headless") as LlmMode;
  if (resolved === "api") return new ApiLlmClient();
  return new HeadlessLlmClient();
}

export { HeadlessLlmClient } from "./headless.js";
export { ApiLlmClient } from "./api.js";
export { extractJson } from "./types.js";
export type { LlmJsonClient, LlmJsonRequest } from "./types.js";
