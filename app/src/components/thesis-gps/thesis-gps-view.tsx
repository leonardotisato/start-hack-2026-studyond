"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { ThesisProject } from "@/types";
import type { GpsGraph, GpsProposal } from "@/types/gps";
import { gpsNodeTypes, type GpsNodeData } from "./gps-node";
import { GpsProposalDiff } from "./gps-proposal-diff";
import { GpsChatPanel } from "./gps-chat-panel";

function toFlowNodes(graph: GpsGraph, proposal?: GpsProposal | null): Node[] {
  const addedIds = new Set(proposal?.addNodes.map((n) => n.id) ?? []);
  const removedIds = new Set(proposal?.removeNodeIds ?? []);
  const updatedIds = new Set(proposal?.updateNodes.map((u) => u.id) ?? []);

  const allNodes = [...graph.nodes];
  if (proposal) {
    for (const n of proposal.addNodes) {
      if (!allNodes.find((existing) => existing.id === n.id)) {
        allNodes.push(n);
      }
    }
  }

  return allNodes.map((node, i) => {
    const row = Math.floor(i / 4);
    const col = i % 4;
    return {
      id: node.id,
      type: "gpsNode",
      position: { x: col * 260, y: row * 150 },
      data: {
        label: node.label,
        state: node.state,
        description: node.description,
        subtasks: node.subtasks,
        isProposalAdd: addedIds.has(node.id),
        isProposalRemove: removedIds.has(node.id),
        isProposalUpdate: updatedIds.has(node.id),
      } satisfies GpsNodeData,
    };
  });
}

function toFlowEdges(graph: GpsGraph, proposal?: GpsProposal | null): Edge[] {
  const removedIds = new Set(proposal?.removeEdgeIds ?? []);
  const allEdges = [...graph.edges];
  if (proposal) {
    for (const e of proposal.addEdges) {
      if (!allEdges.find((existing) => existing.id === e.id)) {
        allEdges.push(e);
      }
    }
  }

  return allEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: !removedIds.has(edge.id),
    style: {
      stroke: edge.isSuggestion ? "#f59e0b" : removedIds.has(edge.id) ? "#ef4444" : "#6b7280",
      strokeDasharray: edge.isSuggestion ? "5 5" : undefined,
      opacity: removedIds.has(edge.id) ? 0.3 : 1,
    },
  }));
}

interface ThesisGpsViewProps {
  project: ThesisProject;
  initialGraph: GpsGraph;
}

export function ThesisGpsView({ project, initialGraph }: ThesisGpsViewProps) {
  const [graph, setGraph] = useState<GpsGraph>(initialGraph);
  const [proposal, setProposal] = useState<GpsProposal | null>(null);

  const flowNodes = useMemo(() => toFlowNodes(graph, proposal), [graph, proposal]);
  const flowEdges = useMemo(() => toFlowEdges(graph, proposal), [graph, proposal]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Sync when flowNodes/flowEdges change
  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  const handleProposal = useCallback((p: GpsProposal) => {
    setProposal(p);
  }, []);

  const handleAccept = useCallback(() => {
    if (!proposal) return;
    // Apply the proposal to the graph (using same logic as gps-agent.ts applyProposal)
    const remainingNodes = graph.nodes.filter((n) => !proposal.removeNodeIds.includes(n.id));
    const updatedNodes = remainingNodes.map((node) => {
      const update = proposal.updateNodes.find((u) => u.id === node.id);
      if (!update) return node;
      return { ...node, ...update.patch };
    });
    const allNodes = [...updatedNodes, ...proposal.addNodes];
    const remainingEdges = graph.edges.filter((e) => !proposal.removeEdgeIds.includes(e.id));
    const allEdges = [...remainingEdges, ...proposal.addEdges];

    setGraph({ nodes: allNodes, edges: allEdges });
    setProposal(null);
  }, [graph, proposal]);

  const handleReject = useCallback(() => {
    setProposal(null);
  }, []);

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Graph area */}
      <div className="flex-1 rounded-lg border overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={gpsNodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      {/* Side panel */}
      <div className="w-[340px] flex flex-col gap-4 overflow-y-auto">
        {proposal && (
          <GpsProposalDiff
            proposal={proposal}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        )}
        <div className="flex-1 rounded-lg border overflow-hidden min-h-[300px]">
          <GpsChatPanel
            projectId={project.id}
            graph={graph}
            onProposal={handleProposal}
          />
        </div>
      </div>
    </div>
  );
}
