"use client";

import { useState, useCallback, useMemo } from "react";
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

interface ThesisGpsViewProps {
  projectId: string;
}

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

export function ThesisGpsView({ projectId }: ThesisGpsViewProps) {
  const [graph, setGraph] = useState<GpsGraph | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<GpsNode | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
        setMessages([{ role: "agent", content: `Error: ${data.error ?? "Failed to initialize the graph."}` }]);
        return;
      }
      const newGraph: GpsGraph = data.graph;
      setGraph(newGraph);
      updateFlowFromGraph(newGraph);
      setMessages([{ role: "agent", content: data.message }]);
    } catch {
      setMessages([{ role: "agent", content: "Failed to initialize the graph. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  }

  // --- Chat with agent ---
  async function handleSendMessage(userMessage: string) {
    if (!graph) return;

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/thesis-gps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph, projectId, userMessage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [
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

      setMessages((prev) => [
        ...prev,
        { role: "agent", content: proposal.message, hasProposal: hasChanges },
      ]);

      if (hasChanges) {
        setPendingProposal(proposal);
        // Show preview with proposal diff styling
        const preview = applyProposalToGraph(graph, proposal);
        setPreviewGraph(preview);
        updateFlowFromGraph(graph, proposal);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "agent", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // --- Accept/reject proposals ---
  function handleAcceptProposal() {
    if (!previewGraph) return;
    setGraph(previewGraph);
    updateFlowFromGraph(previewGraph);
    setPendingProposal(null);
    setPreviewGraph(null);
    setMessages((prev) => [...prev, { role: "agent", content: "Changes applied to your graph." }]);
  }

  function handleRejectProposal() {
    if (!graph) return;
    updateFlowFromGraph(graph);
    setPendingProposal(null);
    setPreviewGraph(null);
    setMessages((prev) => [...prev, { role: "agent", content: "Changes discarded. The graph remains unchanged." }]);
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

  // --- Not initialized yet ---
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
