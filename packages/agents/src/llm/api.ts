import Anthropic from "@anthropic-ai/sdk";
import { extractJson, retryPrompt, type LlmJsonClient, type LlmJsonRequest } from "./types.js";

export class ApiLlmClient implements LlmJsonClient {
  private client: Anthropic;

  constructor(client?: Anthropic) {
    this.client = client ?? new Anthropic();
  }

  async generateJson<T>(request: LlmJsonRequest<T>): Promise<T> {
    let prompt = request.prompt;
    let lastError = "";

    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await this.client.messages.create({
        model: request.model,
        max_tokens: request.maxTokens ?? 8192,
        ...(request.system ? { system: request.system } : {}),
        messages: [{ role: "user", content: prompt }],
      });

      const textBlock = response.content.find(
        (b): b is Anthropic.TextBlock => b.type === "text"
      );
      if (!textBlock) {
        throw new Error("No text block in API response");
      }

      try {
        const raw = extractJson(textBlock.text);
        const validated = request.schema.safeParse(raw);
        if (validated.success) return validated.data;
        lastError = JSON.stringify(validated.error.issues.slice(0, 10));
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
      prompt = retryPrompt(request.prompt, lastError);
    }

    throw new Error(`API LLM output failed validation after retry: ${lastError}`);
  }
}
