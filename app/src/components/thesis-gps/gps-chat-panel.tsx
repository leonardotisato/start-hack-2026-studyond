"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatMessage {
  role: "user" | "agent";
  content: string;
  hasProposal?: boolean;
}

interface GpsChatPanelProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  isLoading: boolean;
  pendingProposal: boolean;
  onAcceptProposal: () => void;
  onRejectProposal: () => void;
}

export function GpsChatPanel({
  messages,
  onSend,
  isLoading,
  pendingProposal,
  onAcceptProposal,
  onRejectProposal,
}: GpsChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput("");
  }

  return (
    <div className="flex flex-col h-full border rounded-lg bg-background overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b shrink-0">
        <h3 className="font-semibold text-sm">Thesis GPS Agent</h3>
        <p className="text-xs text-muted-foreground">Ask questions or request changes</p>
      </div>

      {/* Messages — scrollable area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              Ask the agent to modify your thesis pipeline, add steps, or get advice.
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i}>
              <div
                className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground ml-6"
                    : "bg-muted mr-6"
                }`}
              >
                {msg.content}
              </div>
              {msg.hasProposal && pendingProposal && i === messages.length - 1 && (
                <div className="flex gap-2 mt-2 mr-6">
                  <Button size="sm" onClick={onAcceptProposal}>
                    Accept changes
                  </Button>
                  <Button size="sm" variant="outline" onClick={onRejectProposal}>
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="bg-muted rounded-lg px-3 py-2 text-sm mr-6 animate-pulse">
              Thinking...
            </div>
          )}
          <div ref={scrollEndRef} />
        </div>
      </div>

      {/* Input — pinned to bottom */}
      <div className="border-t p-3 shrink-0">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the agent..."
            className="min-h-[40px] max-h-[100px] resize-none text-sm"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="shrink-0"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { ChatMessage };
