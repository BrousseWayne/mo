import type { z } from "zod";

export interface LlmJsonRequest<T> {
  prompt: string;
  system?: string;
  schema: z.ZodType<T>;
  model: string;
  timeoutMs?: number;
  maxTokens?: number;
}

export interface LlmJsonClient {
  generateJson<T>(request: LlmJsonRequest<T>): Promise<T>;
}

export function extractJson(text: string): unknown {
  const match =
    text.match(/```json\s*\n([\s\S]*?)\n\s*```/) ?? text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error(`No JSON found in response: ${text.slice(0, 200)}`);
  }
  return JSON.parse(match[1] ?? match[0]);
}

export function retryPrompt(prompt: string, error: string): string {
  return `${prompt}\n\nYour previous attempt was rejected by schema validation:\n${error}\n\nReturn a corrected JSON object that fixes these issues. Output ONLY the JSON object, no additional text.`;
}
