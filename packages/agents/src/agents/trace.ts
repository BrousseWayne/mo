import type Anthropic from "@anthropic-ai/sdk";

export interface LlmTurn {
  role: string;
  content: unknown;
  tokens_in?: number;
  tokens_out?: number;
}

export interface LlmTrace {
  agent: string;
  model: string;
  turns: LlmTurn[];
  total_input_tokens: number;
  total_output_tokens: number;
  duration_ms: number;
}

export function createTraceCollector(agent: string, model: string) {
  const turns: LlmTurn[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  const startTime = Date.now();

  return {
    recordRequest(messages: Anthropic.MessageParam[]) {
      for (const msg of messages) {
        turns.push({ role: msg.role, content: msg.content });
      }
    },

    recordResponse(response: Anthropic.Message) {
      const inputTokens = response.usage?.input_tokens ?? 0;
      const outputTokens = response.usage?.output_tokens ?? 0;
      totalInputTokens += inputTokens;
      totalOutputTokens += outputTokens;

      turns.push({
        role: "assistant",
        content: response.content,
        tokens_in: inputTokens,
        tokens_out: outputTokens,
      });
    },

    finalize(): LlmTrace {
      return {
        agent,
        model,
        turns,
        total_input_tokens: totalInputTokens,
        total_output_tokens: totalOutputTokens,
        duration_ms: Date.now() - startTime,
      };
    },
  };
}

export type TraceCollector = ReturnType<typeof createTraceCollector>;
