import Anthropic from "@anthropic-ai/sdk";

const MAX_ITERATIONS = 5;

export type ToolExecutor = (
  name: string,
  input: Record<string, unknown>,
) => Promise<string>;

export type OnToolCall = (
  name: string,
  input: Record<string, unknown>,
  result: string,
  extra?: unknown,
) => Promise<void>;

interface RunWithToolsParams {
  client: Anthropic;
  model: string;
  maxTokens: number;
  system: string;
  messages: Anthropic.MessageParam[];
  tools: Anthropic.Tool[];
  toolExecutor: ToolExecutor;
  onToolCall?: OnToolCall;
}

export async function runWithTools({
  client,
  model,
  maxTokens,
  system,
  messages,
  tools,
  toolExecutor,
  onToolCall,
}: RunWithToolsParams): Promise<string> {
  let currentMessages = [...messages];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      messages: currentMessages,
      tools,
    });

    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );

    if (toolUseBlocks.length === 0) {
      return response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      const result = await toolExecutor(
        block.name,
        block.input as Record<string, unknown>,
      );
      if (onToolCall) {
        await onToolCall(
          block.name,
          block.input as Record<string, unknown>,
          result,
        );
      }
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: result,
      });
    }

    currentMessages = [
      ...currentMessages,
      { role: "assistant" as const, content: response.content },
      { role: "user" as const, content: toolResults },
    ];
  }

  // Safety: if we hit max iterations, extract whatever text we have from the last response
  const lastResponse = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: currentMessages,
    // No tools — force a text response
  });

  return lastResponse.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}
