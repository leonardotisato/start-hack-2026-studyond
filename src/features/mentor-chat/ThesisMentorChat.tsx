import { ChatPanel } from "@/features/mentor-chat/components/ChatPanel";
import { PromptSuggestions } from "@/features/mentor-chat/components/PromptSuggestions";
import { useMentorChat } from "@/features/mentor-chat/useMentorChat";

export function ThesisMentorChat() {
  const { messages, isLoading, sendMessage } = useMentorChat();

  return (
    <div className="space-y-4">
      <section className="space-y-2 rounded-lg border border-border bg-card p-5">
        <p className="ds-label text-ai-solid">Thesis mentor</p>
        <h2 className="header-sm">Talk through your uncertainty</h2>
        <p className="ds-small text-muted-foreground">
          The structured checkup captures the facts. This conversation helps you
          express what feels unclear and get personalised guidance.
        </p>
      </section>
      <PromptSuggestions onSelect={sendMessage} disabled={isLoading} />
      <ChatPanel messages={messages} isLoading={isLoading} onSend={sendMessage} />
    </div>
  );
}
