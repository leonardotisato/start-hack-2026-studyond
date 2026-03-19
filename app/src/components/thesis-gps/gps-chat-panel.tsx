"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { GpsProposal, Recommendation } from "@/types/gps";

interface ChatMessage {
  role: "user" | "agent";
  content: string;
  hasProposal?: boolean;
  recommendations?: Recommendation[];
}

interface GpsChatPanelProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  isLoading: boolean;
  statusSteps: string[];
  pendingProposal: boolean;
  proposalDetail: GpsProposal | null;
  onAcceptProposal: () => void;
  onRejectProposal: () => void;
}

export function GpsChatPanel({
  messages,
  onSend,
  isLoading,
  statusSteps,
  pendingProposal,
  proposalDetail,
  onAcceptProposal,
  onRejectProposal,
}: GpsChatPanelProps) {
  const [input, setInput] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Scroll within the chat panel only (not the page)
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading, statusSteps]);

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput("");
  }

  return (
    <div className="relative flex flex-col h-full border rounded-lg bg-background overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b shrink-0">
        <h3 className="font-semibold text-sm">Thesis GPS Agent</h3>
        <p className="text-xs text-muted-foreground">Ask questions or request changes</p>
      </div>

      {/* Messages — scrollable area */}
      <div ref={scrollAreaRef} className="flex-1 min-h-0 overflow-y-auto p-3">
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
                  <Button size="sm" onClick={() => setShowSummary(true)}>
                    Review changes
                  </Button>
                  <Button size="sm" variant="outline" onClick={onRejectProposal}>
                    Reject
                  </Button>
                </div>
              )}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="mt-2 mr-6 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground px-1">Suggested contacts</p>
                  {msg.recommendations.map((rec) => (
                    <RecommendationCard key={rec.id} rec={rec} />
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="bg-muted rounded-lg px-3 py-2 text-sm mr-6 space-y-1.5">
              {statusSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i === statusSteps.length - 1 ? (
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  <span className={i === statusSteps.length - 1 ? "text-foreground" : "text-muted-foreground line-through text-xs"}>
                    {step}
                  </span>
                </div>
              ))}
              {statusSteps.length === 0 && (
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                  <span>Starting...</span>
                </div>
              )}
            </div>
          )}
          <div ref={scrollEndRef} />
        </div>
      </div>

      {/* Proposal summary popup */}
      {showSummary && proposalDetail && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 rounded-lg">
          <div className="bg-background border rounded-lg shadow-xl p-4 mx-3 max-h-[80%] overflow-y-auto w-full">
            <h4 className="font-semibold text-sm mb-3">Proposed Changes</h4>

            <div className="space-y-2">
              {proposalDetail.addNodes.map((n) => (
                <div key={n.id} className="flex items-start gap-2 rounded-md border-l-4 border-green-500 bg-green-50 px-3 py-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <div className="text-xs">
                    <p className="font-semibold text-green-900">{n.label}</p>
                    {n.subtasks && n.subtasks.length > 0 && (
                      <ul className="mt-1 space-y-0.5 text-green-800/70">
                        {n.subtasks.map((s, i) => <li key={i}>- {s}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              ))}

              {proposalDetail.updateNodes.map((u) => (
                <div key={u.id} className="flex items-start gap-2 rounded-md border-l-4 border-indigo-500 bg-indigo-50 px-3 py-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                  <div className="text-xs">
                    <p className="font-semibold text-indigo-900">{u.patch?.label ?? u.id}</p>
                    {u.patch?.subtasks && u.patch.subtasks.length > 0 && (
                      <ul className="mt-1 space-y-0.5 text-indigo-800/70">
                        {u.patch.subtasks.map((s, i) => <li key={i}>- {s}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              ))}

              {proposalDetail.removeNodeIds.map((id) => (
                <div key={id} className="flex items-center gap-2 rounded-md border-l-4 border-red-500 bg-red-50 px-3 py-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <p className="text-xs font-semibold text-red-900">{id}</p>
                </div>
              ))}

              {proposalDetail.addEdges.length > 0 && (
                <div className="flex items-center gap-2 rounded-md border-l-4 border-blue-500 bg-blue-50 px-3 py-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                  </svg>
                  <p className="text-xs font-semibold text-blue-900">{proposalDetail.addEdges.length} new connection{proposalDetail.addEdges.length > 1 ? "s" : ""}</p>
                </div>
              )}

              {proposalDetail.completeSubtasks?.length > 0 && proposalDetail.completeSubtasks.map((c) => (
                <div key={c.nodeId} className="flex items-start gap-2 rounded-md border-l-4 border-emerald-500 bg-emerald-50 px-3 py-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <div className="text-xs">
                    <p className="font-semibold text-emerald-900">Mark {c.subtaskIndices.length} subtask{c.subtaskIndices.length > 1 ? "s" : ""} done</p>
                    <p className="text-emerald-800/70">{c.nodeId}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <Button size="sm" className="flex-1" onClick={() => { setShowSummary(false); onAcceptProposal(); }}>
                Accept
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => { setShowSummary(false); onRejectProposal(); }}>
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}

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

/* ------------------------------------------------------------------ */
/*  Recommendation card                                                */
/* ------------------------------------------------------------------ */

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  supervisor: { icon: "🎓", color: "border-blue-300 bg-blue-50" },
  expert: { icon: "💼", color: "border-indigo-300 bg-indigo-50" },
  company: { icon: "🏢", color: "border-green-300 bg-green-50" },
  topic: { icon: "📄", color: "border-violet-300 bg-violet-50" },
};

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const style = TYPE_ICONS[rec.type] ?? { icon: "👤", color: "border-gray-300 bg-gray-50" };
  const matchPercent = Math.round(rec.matchScore * 100);

  return (
    <div className={`rounded-lg border ${style.color} p-3 text-xs`}>
      <div className="flex items-start gap-2">
        <span className="text-base shrink-0">{style.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-foreground truncate">{rec.name}</p>
            <span className="text-[10px] font-medium text-muted-foreground shrink-0">{matchPercent}% match</span>
          </div>
          <p className="text-muted-foreground truncate">{rec.title}</p>
          <p className="text-muted-foreground">{rec.affiliation}</p>
          {rec.fieldNames.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {rec.fieldNames.map((f) => (
                <span key={f} className="rounded-full bg-violet-100 border border-violet-200 text-violet-800 px-1.5 py-0.5 text-[10px]">{f}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      {rec.email && (
        <a
          href={`mailto:${rec.email}`}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          Contact
        </a>
      )}
    </div>
  );
}

export type { ChatMessage };
