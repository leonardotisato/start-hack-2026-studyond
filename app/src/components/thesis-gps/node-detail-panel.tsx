"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { GpsNode } from "@/types/gps";

interface NodeDetailPanelProps {
  node: GpsNode;
  onClose: () => void;
}

const STATE_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  completed: { label: "Completed", variant: "default" },
  active: { label: "Active", variant: "secondary" },
  upcoming: { label: "Upcoming", variant: "outline" },
  blocked: { label: "Blocked", variant: "destructive" },
};

export function NodeDetailPanel({ node, onClose }: NodeDetailPanelProps) {
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
          <ul className="space-y-1">
            {node.subtasks.map((task, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground mt-0.5">-</span>
                <span>{task}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
