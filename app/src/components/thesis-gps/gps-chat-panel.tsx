"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type {
  GpsProposal,
  Recommendation,
  ContextSource,
  ScoutMessage,
} from "@/types/gps";
import { CONTEXT_SOURCE_META } from "@/types/gps";
import { Mic, ArrowUp, Square } from "lucide-react";
import { RecommendationCard } from "./recommendation-card";
import { formatBold } from "./format-bold";

interface ChatMessage {
  role: "user" | "agent";
  content: string;
  hasProposal?: boolean;
  recommendations?: Recommendation[];
}

interface ScoutConversationOption {
  nodeId: string;
  nodeLabel: string;
  messageCount: number;
}

interface GpsChatPanelProps {
  messages: ChatMessage[];
  onSend: (
    message: string,
    attachedContext: ContextSource[],
    attachedScoutNodeIds: string[],
  ) => void;
  isLoading: boolean;
  statusSteps: string[];
  pendingProposal: boolean;
  proposalDetail: GpsProposal | null;
  onAcceptProposal: () => void;
  onRejectProposal: () => void;
  scoutConversations?: ScoutConversationOption[];
}

const ALL_SOURCES: ContextSource[] = [
  "supervisors",
  "experts",
  "companies",
  "topics",
  "universities",
  "programs",
];

export function GpsChatPanel({
  messages,
  onSend,
  isLoading,
  statusSteps,
  pendingProposal,
  proposalDetail,
  onAcceptProposal,
  onRejectProposal,
  scoutConversations = [],
}: GpsChatPanelProps) {
  const [input, setInput] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [attachedContext, setAttachedContext] = useState<ContextSource[]>([]);
  const [attachedScoutNodeIds, setAttachedScoutNodeIds] = useState<string[]>(
    [],
  );
  const [showContextMenu, setShowContextMenu] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setShowContextMenu(false);
      }
    }
    if (showContextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showContextMenu]);

  // Scroll within the chat panel only (not the page)
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading, statusSteps]);

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed, attachedContext, attachedScoutNodeIds);
    setInput("");
  }

  function toggleContext(source: ContextSource) {
    setAttachedContext((prev) =>
      prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source],
    );
  }

  function toggleScoutConversation(nodeId: string) {
    setAttachedScoutNodeIds((prev) =>
      prev.includes(nodeId)
        ? prev.filter((id) => id !== nodeId)
        : [...prev, nodeId],
    );
  }

  const totalAttached = attachedContext.length + attachedScoutNodeIds.length;
  async function startRecording() {
    try {
      const capturedInput = input;
      const capturedContext = attachedContext;
      const capturedScoutIds = attachedScoutNodeIds;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (blob.size === 0) return;

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("file", blob, "recording.webm");
          const res = await fetch("/api/speech-to-text", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (data.text) {
            const combined = capturedInput
              ? capturedInput + " " + data.text
              : data.text;
            setInput("");
            onSend(combined, capturedContext, capturedScoutIds);
          }
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      // User denied microphone or not available
    }
  }

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  return (
    <div className="relative flex flex-col h-full border rounded-lg bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b shrink-0">
        <h3 className="font-semibold text-sm">Thesis GPS Agent</h3>
        <p className="text-xs text-muted-foreground">
          Ask questions or request changes
        </p>
      </div>

      {/* Messages — scrollable area */}
      <div
        ref={scrollAreaRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3"
      >
        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              Ask the agent to modify your thesis pipeline, add steps, or get
              advice.
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
                {formatBold(msg.content)}
              </div>
              {msg.hasProposal &&
                pendingProposal &&
                i === messages.length - 1 && (
                  <div className="flex gap-2 mt-2 mr-6">
                    <Button size="sm" onClick={() => setShowSummary(true)}>
                      Review changes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onRejectProposal}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="mt-2 mr-6 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground px-1">
                    Suggested contacts
                  </p>
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
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  <span
                    className={
                      i === statusSteps.length - 1
                        ? "text-foreground"
                        : "text-muted-foreground line-through text-xs"
                    }
                  >
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
                <div
                  key={n.id}
                  className="flex items-start gap-2 rounded-md border-l-4 border-green-500 bg-green-50 px-3 py-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 mt-0.5"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <div className="text-xs">
                    <p className="font-semibold text-green-900">{n.label}</p>
                    {n.subtasks && n.subtasks.length > 0 && (
                      <ul className="mt-1 space-y-0.5 text-green-800/70">
                        {n.subtasks.map((s, i) => (
                          <li key={i}>- {s}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}

              {proposalDetail.updateNodes.map((u) => (
                <div
                  key={u.id}
                  className="flex items-start gap-2 rounded-md border-l-4 border-indigo-500 bg-indigo-50 px-3 py-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 mt-0.5"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                  <div className="text-xs">
                    <p className="font-semibold text-indigo-900">
                      {u.patch?.label ?? u.id}
                    </p>
                    {u.patch?.subtasks && u.patch.subtasks.length > 0 && (
                      <ul className="mt-1 space-y-0.5 text-indigo-800/70">
                        {u.patch.subtasks.map((s, i) => (
                          <li key={i}>- {s}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}

              {proposalDetail.removeNodeIds.map((id) => (
                <div
                  key={id}
                  className="flex items-center gap-2 rounded-md border-l-4 border-red-500 bg-red-50 px-3 py-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <p className="text-xs font-semibold text-red-900">{id}</p>
                </div>
              ))}

              {proposalDetail.addEdges.length > 0 && (
                <div className="flex items-center gap-2 rounded-md border-l-4 border-blue-500 bg-blue-50 px-3 py-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                  <p className="text-xs font-semibold text-blue-900">
                    {proposalDetail.addEdges.length} new connection
                    {proposalDetail.addEdges.length > 1 ? "s" : ""}
                  </p>
                </div>
              )}

              {proposalDetail.addEvents?.length > 0 &&
                proposalDetail.addEvents.map((ev, i) => (
                  <div
                    key={`event-${i}`}
                    className="flex items-start gap-2 rounded-md border-l-4 border-blue-500 bg-blue-50 px-3 py-2"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 mt-0.5"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <div className="text-xs">
                      <p className="font-semibold text-blue-900">{ev.label}</p>
                      <p className="text-blue-800/70">
                        {ev.date} ·{" "}
                        <span className="capitalize">{ev.type}</span>
                        {ev.type === "meeting" && " (requires approval)"}
                      </p>
                      {ev.attendees && ev.attendees.length > 0 && (
                        <p className="text-blue-800/70">
                          With: {ev.attendees.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

              {proposalDetail.completeSubtasks?.length > 0 &&
                proposalDetail.completeSubtasks.map((c) => (
                  <div
                    key={c.nodeId}
                    className="flex items-start gap-2 rounded-md border-l-4 border-emerald-500 bg-emerald-50 px-3 py-2"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <div className="text-xs">
                      <p className="font-semibold text-emerald-900">
                        Mark {c.subtaskIndices.length} subtask
                        {c.subtaskIndices.length > 1 ? "s" : ""} done
                      </p>
                      <p className="text-emerald-800/70">{c.nodeId}</p>
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  setShowSummary(false);
                  onAcceptProposal();
                }}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowSummary(false);
                  onRejectProposal();
                }}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Context + Input — pinned to bottom */}
      <div className="border-t shrink-0">
        {/* Attached context chips */}
        {totalAttached > 0 && (
          <div className="px-3 pt-2 flex flex-wrap gap-1">
            {attachedContext.map((source) => {
              const meta = CONTEXT_SOURCE_META[source];
              return (
                <span
                  key={source}
                  className="inline-flex items-center gap-1 rounded-full bg-violet-100 border border-violet-200 text-violet-800 pl-1.5 pr-0.5 py-0.5 text-[11px] font-medium"
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                  <button
                    onClick={() => toggleContext(source)}
                    className="ml-0.5 rounded-full hover:bg-violet-200 p-0.5 transition"
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </span>
              );
            })}
            {attachedScoutNodeIds.map((nodeId) => {
              const conv = scoutConversations.find((c) => c.nodeId === nodeId);
              if (!conv) return null;
              return (
                <span
                  key={nodeId}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 border border-blue-200 text-blue-800 pl-1.5 pr-0.5 py-0.5 text-[11px] font-medium"
                >
                  <span>💬</span>
                  <span>{conv.nodeLabel}</span>
                  <button
                    onClick={() => toggleScoutConversation(nodeId)}
                    className="ml-0.5 rounded-full hover:bg-blue-200 p-0.5 transition"
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </span>
              );
            })}
          </div>
        )}

        <div className="p-3">
          {/* Context add button + dropdown */}
          <div className="relative mb-2" ref={contextMenuRef}>
            <button
              onClick={() => setShowContextMenu((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              {totalAttached > 0
                ? `${totalAttached} context source${totalAttached > 1 ? "s" : ""} attached`
                : "Attach context"}
            </button>

            {showContextMenu && (
              <div className="absolute bottom-full left-0 mb-1 w-64 bg-background border rounded-lg shadow-xl z-[100] py-1 max-h-[320px] overflow-y-auto">
                <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Studyond Data
                </p>
                {ALL_SOURCES.map((source) => {
                  const meta = CONTEXT_SOURCE_META[source];
                  const isActive = attachedContext.includes(source);
                  return (
                    <button
                      key={source}
                      onClick={() => toggleContext(source)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition hover:bg-muted ${
                        isActive ? "bg-violet-50" : ""
                      }`}
                    >
                      <span className="text-sm shrink-0">{meta.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{meta.label}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {meta.description}
                        </p>
                      </div>
                      {isActive && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#7c3aed"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="shrink-0"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}

                {scoutConversations.length > 0 && (
                  <>
                    <div className="border-t my-1" />
                    <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Scout Conversations
                    </p>
                    {scoutConversations.map((conv) => {
                      const isActive = attachedScoutNodeIds.includes(
                        conv.nodeId,
                      );
                      return (
                        <button
                          key={conv.nodeId}
                          onClick={() => toggleScoutConversation(conv.nodeId)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition hover:bg-muted ${
                            isActive ? "bg-blue-50" : ""
                          }`}
                        >
                          <span className="text-sm shrink-0">💬</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{conv.nodeLabel}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {conv.messageCount} messages
                            </p>
                          </div>
                          {isActive && (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#2563eb"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="shrink-0"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isTranscribing ? "Transcribing..." : "Ask the agent..."
              }
              className="min-h-[40px] max-h-[100px] resize-none text-sm"
              rows={1}
              disabled={isRecording || isTranscribing}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            {input.trim() ? (
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={isLoading}
                className="shrink-0 rounded-full size-9"
              >
                <ArrowUp className="size-4" />
              </Button>
            ) : isRecording ? (
              <Button
                size="icon"
                variant="destructive"
                onClick={stopRecording}
                className="shrink-0 rounded-full size-9 animate-pulse"
              >
                <Square className="size-3.5" />
              </Button>
            ) : (
              <Button
                size="icon"
                variant="outline"
                onClick={startRecording}
                disabled={isLoading || isTranscribing}
                className="shrink-0 rounded-full size-9"
              >
                <Mic className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export type { ChatMessage };
