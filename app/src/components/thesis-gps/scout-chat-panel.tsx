"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, ArrowUp, Square } from "lucide-react";
import type { ScoutMessage, GpsProposal } from "@/types/gps";
import { formatBold } from "./format-bold";

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
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  async function startRecording() {
    try {
      const capturedInput = input;

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
            onSend(combined);
          }
        } finally {
          setIsTranscribing(false);
        }
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      // microphone not available or denied
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
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7c3aed"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-1.5 min-w-0">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7c3aed"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span className="text-xs font-semibold text-violet-700 truncate">
            Scout — {nodeLabel}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-2.5">
        <div className="space-y-2.5">
          {messages.length === 0 && !isStreaming && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Ask Scout for help with this milestone — find experts, resources,
              or request changes to your pipeline.
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
                {formatBold(msg.content)}
              </div>

              {/* Proposal buttons */}
              {msg.hasProposal &&
                pendingProposal &&
                i === messages.length - 1 && (
                  <div className="flex gap-1.5 mt-1.5 mr-4">
                    <Button
                      size="sm"
                      className="text-xs h-7 bg-violet-600 hover:bg-violet-700"
                      onClick={() => setShowSummary(true)}
                    >
                      Review changes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={onRejectProposal}
                    >
                      Reject
                    </Button>
                  </div>
                )}

              {/* Recommendations note — actual cards shown as graph nodes */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="mt-1.5 mr-4 flex items-center gap-1.5 rounded-md bg-violet-50 border border-violet-200 px-2.5 py-1.5">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <span className="text-[10px] text-violet-700 font-medium">
                    {msg.recommendations.length} suggestion
                    {msg.recommendations.length > 1 ? "s" : ""} shown on the
                    graph
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
                    <svg
                      width="8"
                      height="8"
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
                        ? "text-violet-700"
                        : "text-muted-foreground line-through text-[10px]"
                    }
                  >
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
                <div
                  key={n.id}
                  className="flex items-start gap-1.5 border-l-4 border-green-500 bg-green-50 px-2 py-1.5 rounded-md"
                >
                  <span className="text-green-600 text-xs font-bold shrink-0">
                    +
                  </span>
                  <div className="text-[10px]">
                    <p className="font-semibold text-green-900">{n.label}</p>
                    {n.subtasks?.map((s, i) => (
                      <p key={i} className="text-green-800/70">
                        - {s}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
              {pendingProposal.updateNodes.map((u) => (
                <div
                  key={u.id}
                  className="flex items-start gap-1.5 border-l-4 border-indigo-500 bg-indigo-50 px-2 py-1.5 rounded-md"
                >
                  <span className="text-indigo-600 text-xs font-bold shrink-0">
                    ~
                  </span>
                  <p className="text-[10px] font-semibold text-indigo-900">
                    {u.patch?.label ?? u.id}
                  </p>
                </div>
              ))}
              {pendingProposal.removeNodeIds.map((id) => (
                <div
                  key={id}
                  className="flex items-center gap-1.5 border-l-4 border-red-500 bg-red-50 px-2 py-1.5 rounded-md"
                >
                  <span className="text-red-600 text-xs font-bold shrink-0">
                    -
                  </span>
                  <p className="text-[10px] font-semibold text-red-900">{id}</p>
                </div>
              ))}
              {pendingProposal.addEdges.length > 0 && (
                <p className="text-[10px] text-blue-700 px-2">
                  {pendingProposal.addEdges.length} new connection
                  {pendingProposal.addEdges.length > 1 ? "s" : ""}
                </p>
              )}
              {(pendingProposal.completeSubtasks?.length ?? 0) > 0 && (
                <p className="text-[10px] text-emerald-700 px-2">
                  Completing subtasks in{" "}
                  {pendingProposal.completeSubtasks
                    .map((c) => c.nodeId)
                    .join(", ")}
                </p>
              )}
            </div>
            <div className="flex gap-1.5 mt-3">
              <Button
                size="sm"
                className="flex-1 text-xs h-7 bg-violet-600 hover:bg-violet-700"
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
                className="flex-1 text-xs h-7"
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

      {/* Input */}
      <div className="border-t p-2 shrink-0">
        <div className="flex items-end gap-1.5">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isTranscribing ? "Transcribing..." : `Ask about "${nodeLabel}"...`
            }
            className="min-h-[32px] max-h-[72px] resize-none text-xs"
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
              disabled={isStreaming}
              className="shrink-0 rounded-full size-8 bg-violet-600 hover:bg-violet-700"
            >
              <ArrowUp className="size-3.5" />
            </Button>
          ) : isRecording ? (
            <Button
              size="icon"
              variant="destructive"
              onClick={stopRecording}
              className="shrink-0 rounded-full size-8 animate-pulse"
            >
              <Square className="size-3" />
            </Button>
          ) : (
            <Button
              size="icon"
              variant="outline"
              onClick={startRecording}
              disabled={isStreaming || isTranscribing}
              className="shrink-0 rounded-full size-8"
            >
              <Mic className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
