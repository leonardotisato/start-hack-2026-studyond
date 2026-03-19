"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ScoutMessage, GpsProposal } from "@/types/gps";

interface ScoutChatPanelProps {
  nodeLabel: string;
  messages: ScoutMessage[];
  onSend: (message: string) => void;
  onBack: () => void;
  isStreaming: boolean;
  statusSteps: string[];
  pendingProposal: GpsProposal | null;
  onAcceptProposal: () => void;
  onRejectProposal: () => void;
  onHeaderMouseDown?: (e: React.MouseEvent) => void;
}

export function ScoutChatPanel({
  nodeLabel,
  messages,
  onSend,
  onBack,
  isStreaming,
  statusSteps,
  pendingProposal,
  onAcceptProposal,
  onRejectProposal,
  onHeaderMouseDown,
}: ScoutChatPanelProps) {
  const [input, setInput] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming, statusSteps]);

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput("");
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b bg-violet-50 shrink-0 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={onHeaderMouseDown}
      >
        <button
          onClick={onBack}
          className="rounded-md p-1 hover:bg-violet-100 transition"
          title="Back to node details"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-1.5 min-w-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <span className="text-xs font-semibold text-violet-700 truncate">Scout — {nodeLabel}</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-2.5">
        <div className="space-y-2.5">
          {messages.length === 0 && !isStreaming && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Ask Scout for help with this milestone — find experts, resources, or request changes to your pipeline.
            </p>
          )}

          {messages.map((msg, i) => (
            <div key={i}>
              <div
                className={`rounded-lg px-2.5 py-2 text-xs whitespace-pre-wrap break-words ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground ml-4"
                    : "bg-violet-50 border border-violet-200 mr-4"
                }`}
              >
                {msg.content}
              </div>

              {/* Proposal buttons */}
              {msg.hasProposal && pendingProposal && i === messages.length - 1 && (
                <div className="flex gap-1.5 mt-1.5 mr-4">
                  <Button
                    size="sm"
                    className="text-xs h-7 bg-violet-600 hover:bg-violet-700"
                    onClick={() => setShowSummary(true)}
                  >
                    Review changes
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={onRejectProposal}>
                    Reject
                  </Button>
                </div>
              )}

              {/* Recommendations note — actual cards shown as graph nodes */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="mt-1.5 mr-4 flex items-center gap-1.5 rounded-md bg-violet-50 border border-violet-200 px-2.5 py-1.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                  </svg>
                  <span className="text-[10px] text-violet-700 font-medium">
                    {msg.recommendations.length} suggestion{msg.recommendations.length > 1 ? "s" : ""} shown on the graph
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Streaming status */}
          {isStreaming && (
            <div className="bg-violet-50 border border-violet-200 rounded-lg px-2.5 py-2 text-xs mr-4 space-y-1">
              {statusSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {i === statusSteps.length - 1 ? (
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse shrink-0" />
                  ) : (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  <span className={i === statusSteps.length - 1 ? "text-violet-700" : "text-muted-foreground line-through text-[10px]"}>
                    {step}
                  </span>
                </div>
              ))}
              {statusSteps.length === 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse shrink-0" />
                  <span className="text-violet-700">Starting...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Proposal summary overlay */}
      {showSummary && pendingProposal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 rounded-lg">
          <div className="bg-background border rounded-lg shadow-xl p-3 mx-2 max-h-[80%] overflow-y-auto w-full">
            <h4 className="font-semibold text-xs mb-2">Proposed Changes</h4>
            <div className="space-y-1.5">
              {pendingProposal.addNodes.map((n) => (
                <div key={n.id} className="flex items-start gap-1.5 border-l-4 border-green-500 bg-green-50 px-2 py-1.5 rounded-md">
                  <span className="text-green-600 text-xs font-bold shrink-0">+</span>
                  <div className="text-[10px]">
                    <p className="font-semibold text-green-900">{n.label}</p>
                    {n.subtasks?.map((s, i) => <p key={i} className="text-green-800/70">- {s}</p>)}
                  </div>
                </div>
              ))}
              {pendingProposal.updateNodes.map((u) => (
                <div key={u.id} className="flex items-start gap-1.5 border-l-4 border-indigo-500 bg-indigo-50 px-2 py-1.5 rounded-md">
                  <span className="text-indigo-600 text-xs font-bold shrink-0">~</span>
                  <p className="text-[10px] font-semibold text-indigo-900">{u.patch?.label ?? u.id}</p>
                </div>
              ))}
              {pendingProposal.removeNodeIds.map((id) => (
                <div key={id} className="flex items-center gap-1.5 border-l-4 border-red-500 bg-red-50 px-2 py-1.5 rounded-md">
                  <span className="text-red-600 text-xs font-bold shrink-0">-</span>
                  <p className="text-[10px] font-semibold text-red-900">{id}</p>
                </div>
              ))}
              {pendingProposal.addEdges.length > 0 && (
                <p className="text-[10px] text-blue-700 px-2">{pendingProposal.addEdges.length} new connection{pendingProposal.addEdges.length > 1 ? "s" : ""}</p>
              )}
              {(pendingProposal.completeSubtasks?.length ?? 0) > 0 && (
                <p className="text-[10px] text-emerald-700 px-2">
                  Completing subtasks in {pendingProposal.completeSubtasks.map((c) => c.nodeId).join(", ")}
                </p>
              )}
            </div>
            <div className="flex gap-1.5 mt-3">
              <Button
                size="sm"
                className="flex-1 text-xs h-7 bg-violet-600 hover:bg-violet-700"
                onClick={() => { setShowSummary(false); onAcceptProposal(); }}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs h-7"
                onClick={() => { setShowSummary(false); onRejectProposal(); }}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-2 shrink-0">
        <div className="flex gap-1.5">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about "${nodeLabel}"...`}
            className="min-h-[32px] max-h-[72px] resize-none text-xs"
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
            disabled={isStreaming || !input.trim()}
            className="shrink-0 h-8 px-2.5 bg-violet-600 hover:bg-violet-700"
            size="sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
