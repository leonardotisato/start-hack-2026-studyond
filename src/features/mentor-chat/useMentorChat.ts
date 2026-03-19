import { useCallback, useState } from "react";

import type { ConversationTurn } from "@/lib/contracts/diagnosis";

const starterMessages: ConversationTurn[] = [
  {
    role: "assistant",
    content:
      "Tell me what feels most confusing right now and I will help convert that uncertainty into a first thesis path.",
  },
];

type MentorChatState = {
  messages: ConversationTurn[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
};

export function useMentorChat(): MentorChatState {
  const [messages, setMessages] = useState<ConversationTurn[]>(starterMessages);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

      const userTurn: ConversationTurn = { role: "user", content: trimmed };
      const updatedMessages = [...messages, userTurn];
      setMessages(updatedMessages);
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: updatedMessages }),
        });

        if (!response.ok) {
          throw new Error("Chat request failed");
        }

        const data = (await response.json()) as { reply: string };
        const assistantTurn: ConversationTurn = {
          role: "assistant",
          content: data.reply,
        };
        setMessages((prev) => [...prev, assistantTurn]);
      } catch {
        const errorTurn: ConversationTurn = {
          role: "assistant",
          content:
            "I could not connect to the mentor service right now. Try describing your situation again and I will do my best to help.",
        };
        setMessages((prev) => [...prev, errorTurn]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading],
  );

  return { messages, isLoading, sendMessage };
}
