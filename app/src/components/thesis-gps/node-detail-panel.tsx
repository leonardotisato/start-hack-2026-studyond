"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { GpsNode } from "@/types/gps";

interface NodeDetailPanelProps {
  node: GpsNode;
  onClose: () => void;
  completedSubtasks: number[];
  onToggleSubtask: (index: number) => void;
  isLocked: boolean;
  isBranch: boolean;
  onChooseBranch?: () => void;
  onAskSupport?: (nodeId: string, query: string) => void;
  isScoutLoading?: boolean;
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

export function NodeDetailPanel({
  node,
  onClose,
  completedSubtasks,
  onToggleSubtask,
  isLocked,
  isBranch,
  onChooseBranch,
  onAskSupport,
  isScoutLoading = false,
}: NodeDetailPanelProps) {
  const [showSupportInput, setShowSupportInput] = useState(false);
  const [supportQuery, setSupportQuery] = useState("");
  const stateInfo = STATE_LABELS[node.state] ?? STATE_LABELS.upcoming;
  const total = node.subtasks?.length ?? 0;
  const done = completedSubtasks.length;

  return (
    <div className="absolute right-4 top-4 w-80 bg-background border rounded-lg shadow-xl z-50 p-4">
      <div className="flex items-start justify-between mb-3">
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

      {/* Ask for support — Studyond Scout */}
      {onAskSupport && (
        <>
          <Separator className="my-3" />
          {!showSupportInput ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-2 border-violet-300 text-violet-700 hover:bg-violet-50"
              onClick={() => setShowSupportInput(true)}
              disabled={isScoutLoading}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              Ask for support
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
                <span className="text-xs font-semibold text-violet-700">Studyond Scout</span>
              </div>
              <Textarea
                value={supportQuery}
                onChange={(e) => setSupportQuery(e.target.value)}
                placeholder={`e.g. "I need funding for data collection" or "Find an expert in NLP"`}
                className="min-h-[60px] max-h-[100px] resize-none text-sm"
                rows={2}
                disabled={isScoutLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (supportQuery.trim() && !isScoutLoading) {
                      onAskSupport(node.id, supportQuery.trim());
                      setSupportQuery("");
                      setShowSupportInput(false);
                    }
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-violet-600 hover:bg-violet-700"
                  disabled={!supportQuery.trim() || isScoutLoading}
                  onClick={() => {
                    onAskSupport(node.id, supportQuery.trim());
                    setSupportQuery("");
                    setShowSupportInput(false);
                  }}
                >
                  {isScoutLoading ? "Searching..." : "Search"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setShowSupportInput(false); setSupportQuery(""); }}
                  disabled={isScoutLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {isScoutLoading && (
            <div className="mt-2 rounded-md bg-violet-50 border border-violet-200 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-violet-500 animate-pulse shrink-0" />
                <span className="text-xs font-medium text-violet-700">Studyond Scout is searching...</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
