"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { gpsNodeTypes, type GpsNodeData } from "./gps-node";
import { NodeDetailPanel } from "./node-detail-panel";
import { GpsChatPanel, type ChatMessage } from "./gps-chat-panel";
import { GpsInitForm } from "./gps-init-form";
import type { GpsGraph, GpsNode, GpsEdge, GpsProposal } from "@/types/gps";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface ThesisGpsViewProps {
  projectId: string;
  graph: GpsGraph | null;
  onGraphChange: (g: GpsGraph | null) => void;
  messages: ChatMessage[];
  onMessagesChange: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  completedSubtasks: Record<string, number[]>;
  onToggleSubtask: (nodeId: string, index: number) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toFlowNodes(
  gpsNodes: GpsNode[],
  proposal?: GpsProposal | null
): Node[] {
  const addedIds = new Set(proposal?.addNodes.map((n) => n.id) ?? []);
  const removedIds = new Set(proposal?.removeNodeIds ?? []);
  const updatedIds = new Set(proposal?.updateNodes.map((u) => u.id) ?? []);

  const allNodes = [...gpsNodes];
  if (proposal) {
    for (const n of proposal.addNodes) {
      if (!allNodes.find((existing) => existing.id === n.id)) {
        allNodes.push(n);
      }
    }
  }

  const cols = new Map<number, number>();
  return allNodes.map((node, i) => {
    const col = Math.floor(i / 4);
    const row = cols.get(col) ?? 0;
    cols.set(col, row + 1);

    return {
      id: node.id,
      type: "gpsNode",
      position: { x: col * 280 + 50, y: row * 120 + 50 },
      data: {
        label: node.label,
        state: node.state,
        description: node.description,
        estimatedDate: node.estimatedDate,
        subtasks: node.subtasks,
        isProposalAdd: addedIds.has(node.id),
        isProposalRemove: removedIds.has(node.id),
        isProposalUpdate: updatedIds.has(node.id),
      } satisfies GpsNodeData,
    };
  });
}

function toFlowEdges(gpsEdges: GpsEdge[], proposal?: GpsProposal | null): Edge[] {
  const removedIds = new Set(proposal?.removeEdgeIds ?? []);
  const allEdges = [...gpsEdges];
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
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
  }));
}

function applyProposalToGraph(graph: GpsGraph, proposal: GpsProposal): GpsGraph {
  const remainingNodes = graph.nodes.filter(
    (n) => !proposal.removeNodeIds.includes(n.id)
  );
  const updatedNodes = remainingNodes.map((node) => {
    const update = proposal.updateNodes.find((u) => u.id === node.id);
    if (!update) return node;
    return { ...node, ...update.patch };
  });
  const allNodes = [...updatedNodes, ...proposal.addNodes];

  const remainingEdges = graph.edges.filter(
    (e) => !proposal.removeEdgeIds.includes(e.id)
  );
  const allEdges = [...remainingEdges, ...proposal.addEdges];

  return { nodes: allNodes, edges: allEdges };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ThesisGpsView({
  projectId,
  graph,
  onGraphChange,
  messages,
  onMessagesChange,
  completedSubtasks,
  onToggleSubtask,
}: ThesisGpsViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<GpsNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingProposal, setPendingProposal] = useState<GpsProposal | null>(null);
  const [previewGraph, setPreviewGraph] = useState<GpsGraph | null>(null);

  const updateFlowFromGraph = useCallback(
    (g: GpsGraph, proposal?: GpsProposal | null) => {
      setNodes(toFlowNodes(g.nodes, proposal));
      setEdges(toFlowEdges(g.edges, proposal));
    },
    [setNodes, setEdges]
  );

  // Sync flow when graph prop changes (e.g. loaded from localStorage)
  useEffect(() => {
    if (graph && !pendingProposal) {
      updateFlowFromGraph(graph);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  // --- Init from professor prompt ---
  async function handleInit(professorPrompt: string) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/thesis-gps/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, professorPrompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        onMessagesChange([{ role: "agent", content: `Error: ${data.error ?? "Failed to initialize."}` }]);
        return;
      }
      onGraphChange(data.graph);
      onMessagesChange([{ role: "agent", content: data.message }]);
    } catch {
      onMessagesChange([{ role: "agent", content: "Failed to initialize. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  }

  // --- Chat with agent ---
  async function handleSendMessage(userMessage: string) {
    if (!graph) return;
    onMessagesChange((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/thesis-gps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph, projectId, userMessage }),
      });
      const data = await res.json();
      if (!res.ok) {
        onMessagesChange((prev) => [
          ...prev,
          { role: "agent", content: `Error: ${data.error ?? "Something went wrong."}` },
        ]);
        return;
      }
      const proposal: GpsProposal = data.proposal;
      const hasChanges =
        proposal.addNodes.length > 0 ||
        proposal.updateNodes.length > 0 ||
        proposal.removeNodeIds.length > 0 ||
        proposal.addEdges.length > 0 ||
        proposal.removeEdgeIds.length > 0;

      onMessagesChange((prev) => [
        ...prev,
        { role: "agent", content: proposal.message, hasProposal: hasChanges },
      ]);

      if (hasChanges) {
        setPendingProposal(proposal);
        const preview = applyProposalToGraph(graph, proposal);
        setPreviewGraph(preview);
        updateFlowFromGraph(graph, proposal);
      }
    } catch {
      onMessagesChange((prev) => [
        ...prev,
        { role: "agent", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // --- Accept / reject ---
  function handleAcceptProposal() {
    if (!previewGraph) return;
    onGraphChange(previewGraph);
    setPendingProposal(null);
    setPreviewGraph(null);
    onMessagesChange((prev) => [...prev, { role: "agent", content: "Changes applied to your graph." }]);
  }

  function handleRejectProposal() {
    if (!graph) return;
    updateFlowFromGraph(graph);
    setPendingProposal(null);
    setPreviewGraph(null);
    onMessagesChange((prev) => [...prev, { role: "agent", content: "Changes discarded." }]);
  }

  // --- Node click ---
  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const currentGraph = previewGraph ?? graph;
      const gpsNode = currentGraph?.nodes.find((n) => n.id === node.id);
      if (gpsNode) setSelectedNode(gpsNode);
    },
    [graph, previewGraph]
  );

  // --- Not initialized ---
  if (!graph) {
    return <GpsInitForm onSubmit={handleInit} isLoading={isLoading} />;
  }

  // --- Main view ---
  return (
    <div className="flex gap-4 h-[600px]">
      {/* Graph */}
      <div className="flex-1 relative rounded-lg border bg-background overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={gpsNodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
        </ReactFlow>

        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            completedSubtasks={completedSubtasks[selectedNode.id] ?? []}
            onToggleSubtask={(index) => onToggleSubtask(selectedNode.id, index)}
          />
        )}
      </div>

      {/* Chat panel */}
      <div className="w-96 shrink-0">
        <GpsChatPanel
          messages={messages}
          onSend={handleSendMessage}
          isLoading={isLoading}
          pendingProposal={pendingProposal !== null}
          onAcceptProposal={handleAcceptProposal}
          onRejectProposal={handleRejectProposal}
        />
      </div>
    </div>
  );
}
