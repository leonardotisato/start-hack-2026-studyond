"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput("");
  }

  return (
    <div className="flex flex-col h-full border rounded-lg bg-background">
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold">Thesis GPS Agent</h3>
        <p className="text-xs text-muted-foreground">Ask questions or request changes to your graph</p>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i}>
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground ml-8"
                    : "bg-muted mr-8"
                }`}
              >
                {msg.content}
              </div>
              {msg.hasProposal && pendingProposal && i === messages.length - 1 && (
                <div className="flex gap-2 mt-2 mr-8">
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
            <div className="bg-muted rounded-lg px-3 py-2 text-sm mr-8 animate-pulse">
              Thinking...
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator />

      <div className="p-3">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the agent..."
            className="min-h-[40px] max-h-[120px] resize-none text-sm"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button onClick={handleSubmit} disabled={isLoading || !input.trim()} className="shrink-0">
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { ChatMessage };
