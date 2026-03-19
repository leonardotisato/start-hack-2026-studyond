"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeMouseHandler,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { gpsNodeTypes, type GpsNodeData } from "./gps-node";
import { NodeDetailPanel } from "./node-detail-panel";
import { GpsChatPanel, type ChatMessage } from "./gps-chat-panel";
import type { GpsGraph, GpsNode, GpsEdge, GpsProposal, Recommendation } from "@/types/gps";
import {
  computeNodeStates,
  layoutGraph,
  isBranchNode,
  getNodeProgress,
  isNodeInteractable,
} from "@/lib/gps-graph-utils";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface ThesisGpsViewProps {
  projectId: string;
  graph: GpsGraph;
  onGraphChange: (g: GpsGraph, addedNodeIds?: string[]) => void;
  completedSubtasks: Record<string, number[]>;
  onToggleSubtask: (nodeId: string, index: number) => void;
  onCompleteSubtasks: (completions: Record<string, number[]>) => void;
  onChooseBranch: (chosenNodeId: string) => void;
  messages: ChatMessage[];
  onMessagesChange: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  recentlyAdded: Set<string>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toFlowNodes(
  computedNodes: GpsNode[],
  positions: Map<string, { x: number; y: number }>,
  completedSubtasks: Record<string, number[]>,
  graph: GpsGraph,
  recentlyAdded: Set<string>,
  proposal?: GpsProposal | null
): Node[] {
  const addedIds = new Set(proposal?.addNodes.map((n) => n.id) ?? []);
  const removedIds = new Set(proposal?.removeNodeIds ?? []);
  const updatedIds = new Set(proposal?.updateNodes.map((u) => u.id) ?? []);

  const allComputed = [...computedNodes];
  if (proposal) {
    for (const n of proposal.addNodes) {
      if (!allComputed.find((existing) => existing.id === n.id)) {
        allComputed.push(n);
      }
    }
  }

  const pos = proposal?.addNodes.length
    ? layoutGraph(
        [...graph.nodes, ...proposal.addNodes],
        [...graph.edges, ...(proposal.addEdges ?? [])]
      )
    : positions;

  return allComputed.map((node) => {
    const nodePos = pos.get(node.id) ?? { x: 0, y: 0 };
    const { done, total, fraction } = getNodeProgress(node, completedSubtasks);

    return {
      id: node.id,
      type: "gpsNode",
      position: nodePos,
      data: {
        label: node.label,
        state: node.state,
        description: node.description,
        estimatedDate: node.estimatedDate,
        subtasks: node.subtasks,
        progress: fraction,
        progressLabel: total > 0 ? `${done}/${total}` : undefined,
        isBranch: isBranchNode(graph, node.id),
        isProposalAdd: addedIds.has(node.id),
        isProposalRemove: removedIds.has(node.id),
        isProposalUpdate: updatedIds.has(node.id),
        isRecentlyAdded: recentlyAdded.has(node.id),
      } satisfies GpsNodeData,
    };
  });
}

function toFlowEdges(
  edges: GpsEdge[],
  computedNodes: GpsNode[],
  proposal?: GpsProposal | null
): Edge[] {
  const removedIds = new Set(proposal?.removeEdgeIds ?? []);
  const allEdges = [...edges];
  if (proposal) {
    for (const e of proposal.addEdges) {
      if (!allEdges.find((existing) => existing.id === e.id)) {
        allEdges.push(e);
      }
    }
  }

  const stateMap = new Map(computedNodes.map((n) => [n.id, n.state]));

  return allEdges.map((edge) => {
    const sourceState = stateMap.get(edge.source);
    const targetState = stateMap.get(edge.target);
    const isActive =
      sourceState === "completed" &&
      (targetState === "active" || targetState === "completed");
    const isRemoved = removedIds.has(edge.id);
    const isSuggestion = edge.isSuggestion;

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      animated: isActive && !isRemoved,
      style: {
        stroke: isSuggestion
          ? "#f59e0b"
          : isRemoved
            ? "#ef4444"
            : isActive
              ? "#3b82f6"
              : "#d1d5db",
        strokeWidth: isActive ? 2 : 1.5,
        strokeDasharray: isSuggestion ? "5 5" : undefined,
        opacity: isRemoved ? 0.3 : 1,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: isActive ? "#3b82f6" : "#d1d5db",
      },
    };
  });
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

function ThesisGpsViewInner({
  projectId,
  graph,
  onGraphChange,
  completedSubtasks,
  onToggleSubtask,
  onCompleteSubtasks,
  onChooseBranch,
  messages,
  onMessagesChange,
  recentlyAdded,
}: ThesisGpsViewProps) {
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusSteps, setStatusSteps] = useState<string[]>([]);
  const [pendingProposal, setPendingProposal] = useState<GpsProposal | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [hasFitView, setHasFitView] = useState(false);
  const { fitView } = useReactFlow();

  // Compute states and layout
  const computedNodes = useMemo(
    () => computeNodeStates(graph, completedSubtasks),
    [graph, completedSubtasks]
  );

  const positions = useMemo(
    () => layoutGraph(graph.nodes, graph.edges),
    [graph.nodes, graph.edges]
  );

  // Sync ReactFlow state when graph or subtasks change
  useEffect(() => {
    if (!pendingProposal) {
      setNodes(toFlowNodes(computedNodes, positions, completedSubtasks, graph, recentlyAdded));
      setEdges(toFlowEdges(graph.edges, computedNodes));
    }
  }, [computedNodes, positions, completedSubtasks, graph, recentlyAdded, setNodes, setEdges, pendingProposal]);

  // Keep page scrolled to the graph when agent is working or proposal appears
  useEffect(() => {
    if ((isLoading || pendingProposal) && graphContainerRef.current) {
      graphContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isLoading, pendingProposal]);

  // Focus on proposal nodes when a proposal is previewed
  useEffect(() => {
    if (!pendingProposal || nodes.length === 0) return;
    const changedIds = new Set([
      ...pendingProposal.addNodes.map((n) => n.id),
      ...pendingProposal.updateNodes.map((u) => u.id),
    ]);
    const focusNodes = nodes.filter((n) => changedIds.has(n.id));
    if (focusNodes.length === 0) return;
    setTimeout(() => {
      fitView({ nodes: focusNodes, padding: 0.4, maxZoom: 1.2, duration: 500 });
    }, 50);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingProposal]);

  // Focus on recently changed nodes after accepting
  useEffect(() => {
    if (recentlyAdded.size === 0 || nodes.length === 0) return;
    const focusNodes = nodes.filter((n) => recentlyAdded.has(n.id));
    if (focusNodes.length === 0) return;
    setTimeout(() => {
      fitView({ nodes: focusNodes, padding: 0.4, maxZoom: 1.2, duration: 500 });
    }, 50);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentlyAdded]);

  // On first load, zoom in on the active node (the one currently due to complete)
  useEffect(() => {
    if (hasFitView || nodes.length === 0) return;
    const activeIds = computedNodes
      .filter((n) => n.state === "active")
      .map((n) => n.id);
    const focusNodes = activeIds.length > 0
      ? nodes.filter((n) => activeIds.includes(n.id))
      : nodes;
    setTimeout(() => {
      fitView({ nodes: focusNodes, padding: 0.25, maxZoom: 1.2, duration: 400 });
      setHasFitView(true);
    }, 50);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length > 0]);

  // Selected node with computed state
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return computedNodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [selectedNodeId, computedNodes]);

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handleToggle = useCallback(
    (index: number) => {
      if (!selectedNodeId) return;
      onToggleSubtask(selectedNodeId, index);
    },
    [selectedNodeId, onToggleSubtask]
  );

  const handleChooseBranch = useCallback(() => {
    if (!selectedNodeId) return;
    onChooseBranch(selectedNodeId);
    setSelectedNodeId(null);
  }, [selectedNodeId, onChooseBranch]);

  // --- Show toast then auto-hide ---
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  // --- Chat with agent (streaming) ---
  async function handleSendMessage(userMessage: string) {
    onMessagesChange((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setStatusSteps([]);

    try {
      const res = await fetch("/api/thesis-gps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph, projectId, userMessage, completedSubtasks, conversationHistory: messages }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let pendingRecs: Recommendation[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json) continue;

          let event: { type: string; text?: string; proposal?: GpsProposal; recommendations?: Recommendation[] };
          try { event = JSON.parse(json); } catch { continue; }

          if (event.type === "status" && event.text) {
            setStatusSteps((prev) => [...prev, event.text!]);
          } else if (event.type === "error") {
            onMessagesChange((prev) => [
              ...prev,
              { role: "agent", content: `Error: ${event.text ?? "Something went wrong."}` },
            ]);
          } else if (event.type === "recommendations" && event.recommendations) {
            // Store recommendations to attach to the agent's message when it arrives
            pendingRecs = event.recommendations;
          } else if (event.type === "done" && event.proposal) {
            const proposal = event.proposal;
            const hasChanges =
              proposal.addNodes.length > 0 ||
              proposal.updateNodes.length > 0 ||
              proposal.removeNodeIds.length > 0 ||
              proposal.addEdges.length > 0 ||
              proposal.removeEdgeIds.length > 0 ||
              (proposal.completeSubtasks?.length ?? 0) > 0;

            onMessagesChange((prev) => [
              ...prev,
              {
                role: "agent",
                content: proposal.message,
                hasProposal: hasChanges,
                recommendations: pendingRecs.length > 0 ? pendingRecs : undefined,
              },
            ]);

            if (hasChanges) {
              setPendingProposal(proposal);
              setNodes(toFlowNodes(computedNodes, positions, completedSubtasks, graph, recentlyAdded, proposal));
              setEdges(toFlowEdges(graph.edges, computedNodes, proposal));
            }
          }
        }
      }
    } catch {
      onMessagesChange((prev) => [
        ...prev,
        { role: "agent", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
      setStatusSteps([]);
    }
  }

  // --- Accept / reject proposal ---
  function handleAcceptProposal() {
    if (!pendingProposal) return;
    const newGraph = applyProposalToGraph(graph, pendingProposal);

    // Collect what changed for the toast
    const parts: string[] = [];
    if (pendingProposal.addNodes.length > 0) {
      const names = pendingProposal.addNodes.map((n) => n.label).join(", ");
      parts.push(`Added: ${names}`);
    }
    if (pendingProposal.updateNodes.length > 0) {
      const names = pendingProposal.updateNodes
        .map((u) => graph.nodes.find((n) => n.id === u.id)?.label ?? u.id)
        .join(", ");
      parts.push(`Updated: ${names}`);
    }
    if (pendingProposal.removeNodeIds.length > 0) {
      const names = pendingProposal.removeNodeIds
        .map((id) => graph.nodes.find((n) => n.id === id)?.label ?? id)
        .join(", ");
      parts.push(`Removed: ${names}`);
    }

    const changedIds = [
      ...pendingProposal.addNodes.map((n) => n.id),
      ...pendingProposal.updateNodes.map((u) => u.id),
    ];
    onGraphChange(newGraph, changedIds);

    // Apply subtask completions if the agent marked any
    if (pendingProposal.completeSubtasks && pendingProposal.completeSubtasks.length > 0) {
      const completionMap: Record<string, number[]> = {};
      for (const { nodeId, subtaskIndices } of pendingProposal.completeSubtasks) {
        completionMap[nodeId] = subtaskIndices;
      }
      onCompleteSubtasks(completionMap);
      if (pendingProposal.completeSubtasks.length > 0) {
        parts.push(`Completed subtasks in: ${pendingProposal.completeSubtasks.map((c) => graph.nodes.find((n) => n.id === c.nodeId)?.label ?? c.nodeId).join(", ")}`);
      }
    }

    setPendingProposal(null);

    if (parts.length > 0) {
      showToast(parts.join(" · "));
    }

    onMessagesChange((prev) => [
      ...prev,
      { role: "agent", content: "Changes applied to your graph." },
    ]);
  }

  function handleRejectProposal() {
    setPendingProposal(null);
    setNodes(toFlowNodes(computedNodes, positions, completedSubtasks, graph, recentlyAdded));
    setEdges(toFlowEdges(graph.edges, computedNodes));
    onMessagesChange((prev) => [
      ...prev,
      { role: "agent", content: "Changes discarded. The graph remains unchanged." },
    ]);
  }

  return (
    <div ref={graphContainerRef} className="flex gap-4 h-[520px]">
      {/* Graph */}
      <div className="flex-1 relative rounded-lg border bg-background overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={gpsNodeTypes}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
        </ReactFlow>

        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            onClose={() => setSelectedNodeId(null)}
            completedSubtasks={completedSubtasks[selectedNode.id] ?? []}
            onToggleSubtask={handleToggle}
            isLocked={!isNodeInteractable(graph, selectedNode.id, completedSubtasks)}
            isBranch={isBranchNode(graph, selectedNode.id)}
            onChooseBranch={handleChooseBranch}
          />
        )}

        {/* Toast notification */}
        {toast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-violet-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium max-w-md">
              {toast}
            </div>
          </div>
        )}
      </div>

      {/* Chat panel */}
      <div className="w-80 shrink-0">
        <GpsChatPanel
          messages={messages}
          onSend={handleSendMessage}
          isLoading={isLoading}
          statusSteps={statusSteps}
          pendingProposal={pendingProposal !== null}
          proposalDetail={pendingProposal}
          onAcceptProposal={handleAcceptProposal}
          onRejectProposal={handleRejectProposal}
        />
      </div>
    </div>
  );
}

export function ThesisGpsView(props: ThesisGpsViewProps) {
  return (
    <ReactFlowProvider>
      <ThesisGpsViewInner {...props} />
    </ReactFlowProvider>
  );
}
