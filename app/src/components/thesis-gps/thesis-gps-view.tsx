"use client";

import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ThesisProject, ProjectState } from "@/types";

const STEPS: { id: ProjectState; label: string }[] = [
  { id: "proposed", label: "Topic Proposed" },
  { id: "applied", label: "Applied" },
  { id: "agreed", label: "Agreed" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
];

const STATE_ORDER: Record<ProjectState, number> = {
  proposed: 0,
  applied: 1,
  withdrawn: 1,
  rejected: 1,
  agreed: 2,
  in_progress: 3,
  canceled: 3,
  completed: 4,
};

function buildNodes(currentState: ProjectState): Node[] {
  const currentIdx = STATE_ORDER[currentState] ?? 0;

  return STEPS.map((step, i) => ({
    id: step.id,
    position: { x: i * 220, y: 100 },
    data: { label: step.label },
    style: {
      background: i < currentIdx ? "#22c55e" : i === currentIdx ? "#3b82f6" : "#e5e7eb",
      color: i <= currentIdx ? "#fff" : "#374151",
      border: i === currentIdx ? "2px solid #2563eb" : "1px solid #d1d5db",
      borderRadius: "8px",
      padding: "12px 20px",
      fontWeight: i === currentIdx ? 700 : 400,
    },
  }));
}

function buildEdges(): Edge[] {
  return STEPS.slice(0, -1).map((step, i) => ({
    id: `${step.id}-${STEPS[i + 1].id}`,
    source: step.id,
    target: STEPS[i + 1].id,
    animated: true,
  }));
}

interface ThesisGpsViewProps {
  project: ThesisProject;
}

export function ThesisGpsView({ project }: ThesisGpsViewProps) {
  const nodes = buildNodes(project.state);
  const edges = buildEdges();

  return (
    <div className="h-[400px] w-full rounded-lg border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
