"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { GpsNode } from "@/types/gps";

interface NodeDetailPanelProps {
  node: GpsNode;
  onClose: () => void;
  completedSubtasks?: number[];
  onToggleSubtask?: (index: number) => void;
}

const STATE_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  completed: { label: "Completed", variant: "default" },
  active: { label: "Active", variant: "secondary" },
  upcoming: { label: "Upcoming", variant: "outline" },
  blocked: { label: "Blocked", variant: "destructive" },
};

export function NodeDetailPanel({ node, onClose, completedSubtasks = [], onToggleSubtask }: NodeDetailPanelProps) {
  const stateInfo = STATE_LABELS[node.state] ?? STATE_LABELS.upcoming;

  return (
    <div className="absolute right-4 top-4 w-80 bg-background border rounded-lg shadow-xl z-50 p-4">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-lg">{node.label}</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          x
        </Button>
      </div>

      <Badge variant={stateInfo.variant}>{stateInfo.label}</Badge>

      {node.estimatedDate && (
        <p className="text-sm text-muted-foreground mt-2">Due: {node.estimatedDate}</p>
      )}

      {node.description && (
        <>
          <Separator className="my-3" />
          <p className="text-sm">{node.description}</p>
        </>
      )}

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
                    onClick={() => onToggleSubtask?.(i)}
                    className={`mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center transition ${
                      isDone
                        ? "bg-emerald-500 border-emerald-600 text-white"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {isDone && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <span className={isDone ? "line-through text-muted-foreground" : ""}>
                    {task}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
