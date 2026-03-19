import type {
  ConversationTurn,
  DiagnosisInput,
} from "../../src/lib/contracts/diagnosis";

export async function maybeGenerateAiSummary(
  input: DiagnosisInput,
  conversation: ConversationTurn[],
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }

  const latestMessage = conversation.at(-1)?.content ?? input.notes;
  return `AI summary placeholder based on: ${latestMessage}`;
}
