import { useEffect, useRef, useState } from "react";

import type { ConversationTurn } from "@/lib/contracts/diagnosis";

type ChatPanelProps = {
  messages: ConversationTurn[];
  isLoading: boolean;
  onSend: (content: string) => void;
};

export function ChatPanel({ messages, isLoading, onSend }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput("");
  }

  return (
    <section className="flex flex-col rounded-lg border border-border bg-card">
      <div className="flex-1 space-y-3 overflow-y-auto p-5" style={{ maxHeight: "24rem" }}>
        {messages.map((message, index) => (
          <article
            key={`${message.role}-${index}`}
            className={[
              "rounded-lg p-3 text-sm",
              message.role === "user"
                ? "ml-8 bg-primary/10 text-foreground"
                : "mr-8 bg-secondary text-foreground",
            ].join(" ")}
          >
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {message.role === "user" ? "You" : "Thesis Mentor"}
            </p>
            <p>{message.content}</p>
          </article>
        ))}
        {isLoading && (
          <div className="mr-8 rounded-lg bg-secondary p-3 text-sm text-muted-foreground">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider">
              Thesis Mentor
            </p>
            <p className="animate-pulse">Thinking...</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-border p-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe what feels uncertain about your thesis..."
          disabled={isLoading}
          className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
}
