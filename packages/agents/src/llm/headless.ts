import { spawn } from "node:child_process";
import { extractJson, retryPrompt, type LlmJsonClient, type LlmJsonRequest } from "./types.js";

const DEFAULT_TIMEOUT_MS = 300_000;

interface HeadlessResultEvent {
  type: string;
  subtype?: string;
  is_error?: boolean;
  result?: string;
}

function buildEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.CLAUDECODE;
  delete env.CLAUDE_CODE_ENTRYPOINT;
  delete env.ANTHROPIC_API_KEY;
  return env;
}

function runClaudePrint(
  prompt: string,
  model: string,
  timeoutMs: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "claude",
      ["-p", "--output-format", "json", "--model", model, "--strict-mcp-config"],
      { env: buildEnv(), stdio: ["pipe", "pipe", "pipe"] }
    );

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      settled = true;
      child.kill("SIGKILL");
      reject(new Error(`claude -p timed out after ${timeoutMs} ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`Failed to spawn claude CLI: ${err.message}`));
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`claude -p exited with code ${code}: ${stderr.slice(0, 500) || stdout.slice(0, 500)}`));
        return;
      }
      resolve(stdout);
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

function extractResultText(stdout: string): string {
  const parsed: unknown = JSON.parse(stdout);
  const events: HeadlessResultEvent[] = Array.isArray(parsed)
    ? (parsed as HeadlessResultEvent[])
    : [parsed as HeadlessResultEvent];
  const result = [...events].reverse().find((e) => e.type === "result");
  if (!result) {
    throw new Error(`No result event in claude -p output: ${stdout.slice(0, 300)}`);
  }
  if (result.is_error || result.subtype !== "success" || typeof result.result !== "string") {
    throw new Error(`claude -p returned an error result: ${JSON.stringify(result).slice(0, 500)}`);
  }
  return result.result;
}

export class HeadlessLlmClient implements LlmJsonClient {
  async generateJson<T>(request: LlmJsonRequest<T>): Promise<T> {
    const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const basePrompt = request.system
      ? `${request.system}\n\n${request.prompt}`
      : request.prompt;

    let prompt = basePrompt;
    let lastError = "";

    for (let attempt = 0; attempt < 2; attempt++) {
      const stdout = await runClaudePrint(prompt, request.model, timeoutMs);
      const text = extractResultText(stdout);
      try {
        const raw = extractJson(text);
        const validated = request.schema.safeParse(raw);
        if (validated.success) return validated.data;
        lastError = JSON.stringify(validated.error.issues.slice(0, 10));
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
      prompt = retryPrompt(basePrompt, lastError);
    }

    throw new Error(`Headless LLM output failed validation after retry: ${lastError}`);
  }
}
