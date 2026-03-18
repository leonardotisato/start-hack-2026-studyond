"use client";

import { useState } from "react";
import type { GpsGraph, GpsProposal } from "@/types/gps";

interface ChatMessage {
  role: "user" | "agent";
  text: string;
}

interface GpsChatPanelProps {
  projectId: string;
  graph: GpsGraph;
  onProposal: (proposal: GpsProposal) => void;
}

export function GpsChatPanel({ projectId, graph, onProposal }: GpsChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/thesis-gps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph, projectId, userMessage: text }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();
      const proposal: GpsProposal = data.proposal;
      setMessages((prev) => [...prev, { role: "agent", text: proposal.message }]);
      onProposal(proposal);
    } catch {
      setMessages((prev) => [...prev, { role: "agent", text: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <h3 className="font-semibold text-sm px-4 py-3 border-b">Chat with Thesis GPS</h3>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Ask the GPS agent about your thesis journey — next steps, blockers, or advice.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm rounded-lg px-3 py-2 max-w-[85%] ${
              msg.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="bg-muted text-muted-foreground text-sm rounded-lg px-3 py-2 max-w-[85%] animate-pulse">
            Thinking...
          </div>
        )}
      </div>

      <div className="border-t p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about your thesis..."
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
