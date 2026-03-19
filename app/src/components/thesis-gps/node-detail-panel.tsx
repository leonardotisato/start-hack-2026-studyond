"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScoutChatPanel } from "./scout-chat-panel";
import type { GpsNode, ScoutMessage, GpsProposal } from "@/types/gps";

interface NodeDetailPanelProps {
  node: GpsNode;
  onClose: () => void;
  completedSubtasks: number[];
  onToggleSubtask: (index: number) => void;
  isLocked: boolean;
  isBranch: boolean;
  onChooseBranch?: () => void;
  scoutMessages: ScoutMessage[];
  onScoutMessage: (nodeId: string, message: string) => void;
  isScoutStreaming: boolean;
  scoutStatusSteps: string[];
  pendingScoutProposal: GpsProposal | null;
  onAcceptScoutProposal: () => void;
  onRejectScoutProposal: () => void;
}

const STATE_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  completed: { label: "Completed", variant: "default" },
  active: { label: "In Progress", variant: "secondary" },
  upcoming: { label: "Locked", variant: "outline" },
  blocked: { label: "Blocked", variant: "destructive" },
};

function useDraggable(initialX: number, initialY: number) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag from the header, not from buttons/inputs inside it
    if ((e.target as HTMLElement).closest("button, input, textarea, a")) return;
    dragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return;
      setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
    }
    function onMouseUp() {
      dragging.current = false;
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return { pos, onMouseDown };
}

export function NodeDetailPanel({
  node,
  onClose,
  completedSubtasks,
  onToggleSubtask,
  isLocked,
  isBranch,
  onChooseBranch,
  scoutMessages,
  onScoutMessage,
  isScoutStreaming,
  scoutStatusSteps,
  pendingScoutProposal,
  onAcceptScoutProposal,
  onRejectScoutProposal,
}: NodeDetailPanelProps) {
  const [showScoutChat, setShowScoutChat] = useState(false);
  const stateInfo = STATE_LABELS[node.state] ?? STATE_LABELS.upcoming;
  const total = node.subtasks?.length ?? 0;
  const done = completedSubtasks.length;

  // Reset drag position when node changes
  const { pos, onMouseDown } = useDraggable(0, 0);

  // Auto-open scout chat if there's existing conversation
  useEffect(() => {
    if (scoutMessages.length > 0) {
      setShowScoutChat(true);
    }
  }, [scoutMessages.length]);

  const dragStyle = pos.x !== 0 || pos.y !== 0
    ? { transform: `translate(${pos.x}px, ${pos.y}px)`, right: "16px", top: "16px" }
    : undefined;

  // Scout chat mode
  if (showScoutChat) {
    return (
      <div
        className="absolute right-4 top-4 bottom-4 w-80 bg-background border rounded-lg shadow-xl z-50 flex flex-col overflow-hidden"
        style={dragStyle}
      >
        <ScoutChatPanel
          nodeLabel={node.label}
          messages={scoutMessages}
          onSend={(msg) => onScoutMessage(node.id, msg)}
          onBack={() => setShowScoutChat(false)}
          isStreaming={isScoutStreaming}
          statusSteps={scoutStatusSteps}
          pendingProposal={pendingScoutProposal}
          onAcceptProposal={onAcceptScoutProposal}
          onRejectProposal={onRejectScoutProposal}
          onHeaderMouseDown={onMouseDown}
        />
      </div>
    );
  }

  // Normal detail view
  return (
    <div
      className="absolute right-4 top-4 w-80 bg-background border rounded-lg shadow-xl z-50 p-4"
      style={dragStyle}
    >
      {/* Draggable header */}
      <div
        className="flex items-start justify-between mb-3 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={onMouseDown}
      >
        <h3 className="font-semibold text-lg leading-tight">{node.label}</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          x
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Badge variant={stateInfo.variant}>{stateInfo.label}</Badge>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">
            {done}/{total} subtasks
          </span>
        )}
      </div>

      {node.estimatedDate && (
        <p className="text-sm text-muted-foreground">Due: {node.estimatedDate}</p>
      )}

      {node.description && (
        <>
          <Separator className="my-3" />
          <p className="text-sm">{node.description}</p>
        </>
      )}

      {/* Branch selection */}
      {isBranch && node.state === "active" && onChooseBranch && (
        <>
          <Separator className="my-3" />
          <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
            <p className="text-sm font-medium text-amber-800 mb-2">
              This is a decision point
            </p>
            <p className="text-xs text-amber-700 mb-3">
              Choosing this path will remove the alternative branch from your pipeline.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-400 text-amber-800 hover:bg-amber-100"
              onClick={onChooseBranch}
            >
              Choose this path
            </Button>
          </div>
        </>
      )}

      {/* Locked message */}
      {isLocked && (
        <>
          <Separator className="my-3" />
          <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
            <p className="text-sm text-gray-500">
              Complete the previous steps to unlock this stage.
            </p>
          </div>
        </>
      )}

      {/* Subtasks */}
      {node.subtasks && node.subtasks.length > 0 && (
        <>
          <Separator className="my-3" />
          <p className="text-sm font-medium mb-2">Subtasks</p>
          <ul className="space-y-1.5">
            {node.subtasks.map((task, i) => {
              const isDone = completedSubtasks.includes(i);
              return (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <button
                    onClick={() => !isLocked && onToggleSubtask(i)}
                    disabled={isLocked}
                    className={`mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center transition ${
                      isDone
                        ? "bg-emerald-500 border-emerald-600 text-white"
                        : isLocked
                          ? "border-gray-200 bg-gray-100 cursor-not-allowed"
                          : "border-gray-300 hover:border-gray-400 cursor-pointer"
                    }`}
                  >
                    {isDone && (
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
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <span
                    className={
                      isDone
                        ? "line-through text-muted-foreground"
                        : isLocked
                          ? "text-muted-foreground"
                          : ""
                    }
                  >
                    {task}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Ask for support — opens Scout chat */}
      <Separator className="my-3" />
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-2 border-violet-300 text-violet-700 hover:bg-violet-50"
        onClick={() => setShowScoutChat(true)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        {scoutMessages.length > 0 ? "Continue with Scout" : "Ask for support"}
      </Button>
    </div>
  );
}
