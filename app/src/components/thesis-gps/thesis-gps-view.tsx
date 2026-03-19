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

import { gpsNodeTypes, type GpsNodeData, type ScoutNodeData } from "./gps-node";
import { NodeDetailPanel } from "./node-detail-panel";
import { GpsChatPanel, type ChatMessage } from "./gps-chat-panel";
import type { GpsGraph, GpsNode, GpsEdge, GpsProposal, ProposedEvent, Recommendation, ScoutMessage, ContextSource, ScoutConversationAttachment } from "@/types/gps";
import type { WorkspaceEvent } from "@/components/planner/workspace-view";
import {
  computeNodeStates,
  layoutGraph,
  isBranchNode,
  getNodeProgress,
  isNodeInteractable,
} from "@/lib/gps-graph-utils";
import { TaskBoard } from "@/components/planner/task-board";
import type { WorkspaceTask } from "@/components/planner/workspace-view";

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
  scoutConversations: Record<string, ScoutMessage[]>;
  onScoutConversationsChange: React.Dispatch<React.SetStateAction<Record<string, ScoutMessage[]>>>;
  scoutNodes: Node[];
  onScoutNodesChange: React.Dispatch<React.SetStateAction<Node[]>>;
  scoutEdges: Edge[];
  onScoutEdgesChange: React.Dispatch<React.SetStateAction<Edge[]>>;
  hiddenScoutIds: Set<string>;
  onHiddenScoutIdsChange: React.Dispatch<React.SetStateAction<Set<string>>>;
  studentName?: string;
  supervisorName?: string;
  tasks: WorkspaceTask[];
  onAddEvents?: (events: ProposedEvent[]) => void;
  pendingMeetings?: WorkspaceEvent[];
  onResolveMeeting?: (id: string, decision: "approved" | "rejected") => void;
  onPendingEventsChange?: (events: ProposedEvent[]) => void;
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
  scoutConversations,
  onScoutConversationsChange,
  scoutNodes,
  onScoutNodesChange: setScoutNodes,
  scoutEdges,
  onScoutEdgesChange: setScoutEdges,
  hiddenScoutIds,
  onHiddenScoutIdsChange: setHiddenScoutIds,
  studentName,
  supervisorName,
  tasks,
  onAddEvents,
  pendingMeetings = [],
  onResolveMeeting,
  onPendingEventsChange,
}: ThesisGpsViewProps) {
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<"graph" | "tasks">("graph");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusSteps, setStatusSteps] = useState<string[]>([]);
  const [pendingProposal, setPendingProposal] = useState<GpsProposal | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [hasFitView, setHasFitView] = useState(false);
  const [showSupervisorInbox, setShowSupervisorInbox] = useState(false);
  const supervisorInboxRef = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();

  // Scout streaming state
  const [isScoutStreaming, setIsScoutStreaming] = useState(false);
  const [scoutStatusSteps, setScoutStatusSteps] = useState<string[]>([]);
  const [pendingScoutProposal, setPendingScoutProposal] = useState<GpsProposal | null>(null);

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
      const visibleScoutNodes = scoutNodes
        .filter((n) => !hiddenScoutIds.has(n.id))
        .map((n) => ({
          ...n,
          data: {
            ...n.data,
            onDismiss: () => setHiddenScoutIds((prev) => new Set([...prev, n.id])),
          },
        }));
      const visibleScoutEdges = scoutEdges.filter((e) => !hiddenScoutIds.has(e.target));
      setNodes([...toFlowNodes(computedNodes, positions, completedSubtasks, graph, recentlyAdded), ...visibleScoutNodes]);
      setEdges([...toFlowEdges(graph.edges, computedNodes), ...visibleScoutEdges]);
    }
  }, [computedNodes, positions, completedSubtasks, graph, recentlyAdded, setNodes, setEdges, pendingProposal, scoutNodes, scoutEdges, hiddenScoutIds]);

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

  // On first load, zoom in on the active (current) node
  useEffect(() => {
    if (hasFitView || nodes.length === 0) return;
    const activeIds = computedNodes
      .filter((n) => n.state === "active")
      .map((n) => n.id);
    const focusNodes = activeIds.length > 0
      ? nodes.filter((n) => activeIds.includes(n.id))
      : nodes;
    setTimeout(() => {
      fitView({ nodes: focusNodes, padding: 0.5, maxZoom: 1.0, duration: 600 });
      setHasFitView(true);
    }, 80);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length > 0]);

  // Re-focus on active node when switching back to graph view
  useEffect(() => {
    if (activeView !== "graph" || nodes.length === 0) return;
    const activeIds = computedNodes
      .filter((n) => n.state === "active")
      .map((n) => n.id);
    const focusNodes = activeIds.length > 0
      ? nodes.filter((n) => activeIds.includes(n.id))
      : nodes;
    setTimeout(() => {
      fitView({ nodes: focusNodes, padding: 0.5, maxZoom: 1.0, duration: 400 });
    }, 50);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  // Notify parent of proposed events for calendar preview
  useEffect(() => {
    onPendingEventsChange?.(pendingProposal?.addEvents ?? []);
  }, [pendingProposal, onPendingEventsChange]);

  // Close supervisor inbox on click outside
  useEffect(() => {
    if (!showSupervisorInbox) return;
    function handleClick(e: MouseEvent) {
      if (supervisorInboxRef.current && !supervisorInboxRef.current.contains(e.target as globalThis.Node)) {
        setShowSupervisorInbox(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSupervisorInbox]);

  // Selected node with computed state
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return computedNodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [selectedNodeId, computedNodes]);

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    // Don't select scout result nodes — they're not part of the main graph
    if (node.id.startsWith("scout-")) return;
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

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  // --- Scout: conversational message ---
  async function handleScoutMessage(nodeId: string, message: string) {
    const currentMessages = scoutConversations[nodeId] ?? [];
    const updatedMessages: ScoutMessage[] = [...currentMessages, { role: "user", content: message }];
    onScoutConversationsChange((prev) => ({ ...prev, [nodeId]: updatedMessages }));

    setIsScoutStreaming(true);
    setScoutStatusSteps([]);

    try {
      const res = await fetch("/api/thesis-gps/scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          nodeId,
          userMessage: message,
          graph,
          completedSubtasks,
          conversationHistory: currentMessages,
          currentSuggestions: scoutNodes
            .filter((n) => n.id.startsWith(`scout-${nodeId}-`) && !hiddenScoutIds.has(n.id))
            .map((n) => ({
              id: n.id,
              name: (n.data as ScoutNodeData).name,
              type: (n.data as ScoutNodeData).type,
              affiliation: (n.data as ScoutNodeData).affiliation,
            })),
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let pendingRecs: Recommendation[] = [];
      let noResultsMessage = "";

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

          let event: { type: string; text?: string; proposal?: GpsProposal & { dismissSuggestionIds?: string[] }; recommendations?: Recommendation[]; searchType?: string; reason?: string };
          try { event = JSON.parse(json); } catch { continue; }

          if (event.type === "status" && event.text) {
            setScoutStatusSteps((prev) => [...prev, event.text!]);
          } else if (event.type === "error") {
            onScoutConversationsChange((prev) => ({
              ...prev,
              [nodeId]: [...(prev[nodeId] ?? []), { role: "user", content: message }, { role: "scout", content: `Error: ${event.text ?? "Something went wrong."}` }],
            }));
          } else if (event.type === "noResults") {
            noResultsMessage = `No matching ${event.searchType === "all" ? "results" : `${event.searchType}s`} found in the Studyond database for this request.`;
          } else if (event.type === "recommendations" && event.recommendations) {
            pendingRecs = event.recommendations;

            // Spawn scout recommendation nodes on the graph below the source node
            const sourceNodePos = positions.get(nodeId) ?? { x: 400, y: 200 };
            const occupiedAreas = [
              ...[...positions.entries()].map(([, pos]) => ({ x: pos.x, y: pos.y, w: 240, h: 120 })),
              ...scoutNodes.map((n) => ({ x: n.position.x, y: n.position.y, w: 260, h: 160 })),
            ];

            const scoutCardWidth = 260;
            const scoutGap = 20;
            const count = event.recommendations.length;
            const totalWidth = count * scoutCardWidth + (count - 1) * scoutGap;
            const startX = sourceNodePos.x - totalWidth / 2 + scoutCardWidth / 2;
            let baseY = sourceNodePos.y + 180;

            const wouldOverlap = (y: number) =>
              occupiedAreas.some(
                (area) =>
                  Math.abs(area.y - y) < 140 &&
                  startX < area.x + area.w &&
                  startX + totalWidth > area.x
              );
            while (wouldOverlap(baseY)) {
              baseY += 160;
            }

            const newScoutNodes: Node[] = event.recommendations.map((rec, i) => ({
              id: `scout-${nodeId}-${rec.id}`,
              type: "scoutResult",
              position: {
                x: startX + i * (scoutCardWidth + scoutGap),
                y: baseY,
              },
              data: {
                name: rec.name,
                title: rec.title,
                affiliation: rec.affiliation,
                email: rec.email,
                type: rec.type,
                matchScore: rec.matchScore,
                fieldNames: rec.fieldNames,
              } satisfies ScoutNodeData,
            }));

            const newScoutEdges: Edge[] = event.recommendations.map((rec) => ({
              id: `scout-edge-${nodeId}-${rec.id}`,
              source: nodeId,
              target: `scout-${nodeId}-${rec.id}`,
              sourceHandle: "scout-source",
              targetHandle: "scout-target",
              animated: true,
              style: { stroke: "#8b5cf6", strokeWidth: 1.5, strokeDasharray: "4 4" },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 14,
                height: 14,
                color: "#8b5cf6",
              },
            }));

            setScoutNodes((prev) => [...prev.filter((n) => !n.id.startsWith(`scout-${nodeId}-`)), ...newScoutNodes]);
            setScoutEdges((prev) => [...prev.filter((e) => !e.id.startsWith(`scout-edge-${nodeId}-`)), ...newScoutEdges]);

            // Focus on scout results
            setTimeout(() => {
              fitView({ nodes: newScoutNodes, padding: 0.3, maxZoom: 1.2, duration: 500 });
            }, 100);
          } else if (event.type === "done" && event.proposal) {
            const proposal = event.proposal;
            const hasChanges =
              proposal.addNodes.length > 0 ||
              proposal.updateNodes.length > 0 ||
              proposal.removeNodeIds.length > 0 ||
              proposal.addEdges.length > 0 ||
              proposal.removeEdgeIds.length > 0 ||
              (proposal.completeSubtasks?.length ?? 0) > 0;

            // Handle suggestion dismissals
            const dismissIds = proposal.dismissSuggestionIds ?? [];
            if (dismissIds.length > 0) {
              setHiddenScoutIds((prev) => {
                const next = new Set(prev);
                for (const id of dismissIds) next.add(id);
                return next;
              });
            }

            const finalMessage = noResultsMessage
              ? `${proposal.message}\n\n⚠️ ${noResultsMessage}`
              : proposal.message;

            const scoutMsg: ScoutMessage = {
              role: "scout",
              content: finalMessage,
              hasProposal: hasChanges,
              recommendations: pendingRecs.length > 0 ? pendingRecs : undefined,
            };

            onScoutConversationsChange((prev) => ({
              ...prev,
              [nodeId]: [...updatedMessages, scoutMsg],
            }));

            if (hasChanges) {
              setPendingScoutProposal(proposal);
              setNodes(toFlowNodes(computedNodes, positions, completedSubtasks, graph, recentlyAdded, proposal));
              setEdges(toFlowEdges(graph.edges, computedNodes, proposal));
            }
          }
        }
      }
    } catch {
      onScoutConversationsChange((prev) => ({
        ...prev,
        [nodeId]: [...updatedMessages, { role: "scout", content: "Something went wrong. Please try again." }],
      }));
    } finally {
      setIsScoutStreaming(false);
      setScoutStatusSteps([]);
    }
  }

  // --- Accept / reject Scout proposal ---
  function handleAcceptScoutProposal() {
    if (!pendingScoutProposal || !selectedNodeId) return;
    const newGraph = applyProposalToGraph(graph, pendingScoutProposal);

    const changedIds = [
      ...pendingScoutProposal.addNodes.map((n) => n.id),
      ...pendingScoutProposal.updateNodes.map((u) => u.id),
    ];
    onGraphChange(newGraph, changedIds);

    if (pendingScoutProposal.completeSubtasks && pendingScoutProposal.completeSubtasks.length > 0) {
      const completionMap: Record<string, number[]> = {};
      for (const { nodeId, subtaskIndices } of pendingScoutProposal.completeSubtasks) {
        completionMap[nodeId] = subtaskIndices;
      }
      onCompleteSubtasks(completionMap);
    }

    setPendingScoutProposal(null);
    showToast("Scout changes applied to your graph.");

    onScoutConversationsChange((prev) => ({
      ...prev,
      [selectedNodeId]: [...(prev[selectedNodeId] ?? []), { role: "scout", content: "Changes applied to your graph." }],
    }));
  }

  function handleRejectScoutProposal() {
    if (!selectedNodeId) return;
    setPendingScoutProposal(null);
    setNodes(toFlowNodes(computedNodes, positions, completedSubtasks, graph, recentlyAdded));
    setEdges(toFlowEdges(graph.edges, computedNodes));

    onScoutConversationsChange((prev) => ({
      ...prev,
      [selectedNodeId]: [...(prev[selectedNodeId] ?? []), { role: "scout", content: "Changes discarded." }],
    }));
  }

  // --- Chat with main agent (streaming) ---
  async function handleSendMessage(userMessage: string, attachedContext: ContextSource[], attachedScoutNodeIds: string[]) {
    onMessagesChange((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setStatusSteps([]);

    const scoutAttachments: ScoutConversationAttachment[] = attachedScoutNodeIds
      .filter((id) => scoutConversations[id]?.length > 0)
      .map((id) => ({
        nodeId: id,
        nodeLabel: graph.nodes.find((n) => n.id === id)?.label ?? id,
        messages: scoutConversations[id].map((m) => ({ role: m.role, content: m.content })),
      }));

    try {
      const res = await fetch("/api/thesis-gps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          graph,
          projectId,
          userMessage,
          completedSubtasks,
          conversationHistory: messages,
          attachedContext: attachedContext.length > 0 ? attachedContext : undefined,
          attachedScoutConversations: scoutAttachments.length > 0 ? scoutAttachments : undefined,
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let pendingRecs: Recommendation[] = [];
      let noResultsMessage = "";

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

          let event: { type: string; text?: string; proposal?: GpsProposal; recommendations?: Recommendation[]; searchType?: string; reason?: string };
          try { event = JSON.parse(json); } catch { continue; }

          if (event.type === "status" && event.text) {
            setStatusSteps((prev) => [...prev, event.text!]);
          } else if (event.type === "error") {
            onMessagesChange((prev) => [
              ...prev,
              { role: "agent", content: `Error: ${event.text ?? "Something went wrong."}` },
            ]);
          } else if (event.type === "noResults") {
            noResultsMessage = `No matching ${event.searchType === "all" ? "results" : `${event.searchType}s`} found in the Studyond database for this request.`;
          } else if (event.type === "recommendations" && event.recommendations) {
            pendingRecs = event.recommendations;

            const activeNode = computedNodes.find((n) => n.state === "active");
            const anchorId = activeNode?.id ?? computedNodes[0]?.id;
            const anchorPos = anchorId
              ? positions.get(anchorId) ?? { x: 400, y: 200 }
              : { x: 400, y: 200 };

            const occupiedAreas = [
              ...[...positions.entries()].map(([, pos]) => ({ x: pos.x, y: pos.y, w: 240, h: 120 })),
              ...scoutNodes.map((n) => ({ x: n.position.x, y: n.position.y, w: 260, h: 160 })),
            ];

            const cardW = 260;
            const gap = 20;
            const count = event.recommendations.length;
            const totalW = count * cardW + (count - 1) * gap;
            const startX = anchorPos.x - totalW / 2 + cardW / 2;
            let baseY = anchorPos.y + 180;

            const wouldOverlap = (y: number) =>
              occupiedAreas.some(
                (area) =>
                  Math.abs(area.y - y) < 140 &&
                  startX < area.x + area.w &&
                  startX + totalW > area.x,
              );
            while (wouldOverlap(baseY)) baseY += 160;

            const prefix = `gps-rec`;
            const newNodes: Node[] = event.recommendations.map((rec, i) => ({
              id: `${prefix}-${rec.id}`,
              type: "scoutResult",
              position: { x: startX + i * (cardW + gap), y: baseY },
              data: {
                name: rec.name,
                title: rec.title,
                affiliation: rec.affiliation,
                email: rec.email,
                type: rec.type,
                matchScore: rec.matchScore,
                fieldNames: rec.fieldNames,
              } satisfies ScoutNodeData,
            }));

            const newEdges: Edge[] = anchorId
              ? event.recommendations.map((rec) => ({
                  id: `gps-rec-edge-${rec.id}`,
                  source: anchorId,
                  target: `${prefix}-${rec.id}`,
                  sourceHandle: "scout-source",
                  targetHandle: "scout-target",
                  animated: true,
                  style: { stroke: "#3b82f6", strokeWidth: 1.5, strokeDasharray: "4 4" },
                  markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: "#3b82f6" },
                }))
              : [];

            setScoutNodes((prev) => [...prev.filter((n) => !n.id.startsWith(`${prefix}-`)), ...newNodes]);
            setScoutEdges((prev) => [...prev.filter((e) => !e.id.startsWith(`gps-rec-edge-`)), ...newEdges]);

            setTimeout(() => {
              fitView({ nodes: newNodes, padding: 0.3, maxZoom: 1.2, duration: 500 });
            }, 100);
          } else if (event.type === "done" && event.proposal) {
            const proposal = event.proposal;
            const hasGraphChanges =
              proposal.addNodes.length > 0 ||
              proposal.updateNodes.length > 0 ||
              proposal.removeNodeIds.length > 0 ||
              proposal.addEdges.length > 0 ||
              proposal.removeEdgeIds.length > 0 ||
              (proposal.completeSubtasks?.length ?? 0) > 0;
            const hasEvents = (proposal.addEvents?.length ?? 0) > 0;
            const hasChanges = hasGraphChanges || hasEvents;

            const finalMessage = noResultsMessage
              ? `${proposal.message}\n\n⚠️ ${noResultsMessage}`
              : proposal.message;

            onMessagesChange((prev) => [
              ...prev,
              {
                role: "agent",
                content: finalMessage,
                hasProposal: hasChanges,
                recommendations: pendingRecs.length > 0 ? pendingRecs : undefined,
              },
            ]);

            if (hasChanges) {
              setPendingProposal(proposal);
              if (hasGraphChanges) {
                setNodes(toFlowNodes(computedNodes, positions, completedSubtasks, graph, recentlyAdded, proposal));
                setEdges(toFlowEdges(graph.edges, computedNodes, proposal));
              }
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

  // --- Accept / reject main agent proposal ---
  function handleAcceptProposal() {
    if (!pendingProposal) return;
    const newGraph = applyProposalToGraph(graph, pendingProposal);

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

    if (pendingProposal.addEvents && pendingProposal.addEvents.length > 0 && onAddEvents) {
      onAddEvents(pendingProposal.addEvents);
      const eventLabels = pendingProposal.addEvents.map((e) => e.label).join(", ");
      parts.push(`Scheduled: ${eventLabels}`);
    }

    setPendingProposal(null);

    if (parts.length > 0) {
      showToast(parts.join(" · "));
    }

    onMessagesChange((prev) => [
      ...prev,
      { role: "agent", content: "Changes applied." },
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
      {/* Left panel: Graph or Tasks */}
      <div className="flex-1 relative rounded-lg border bg-background overflow-hidden flex flex-col">
        {/* Top bar: presence chip + view toggle */}
        <div className="flex items-center justify-between px-3 py-2 border-b bg-background z-10 shrink-0">
          {/* Presence chip */}
          <div className="flex items-center gap-1.5">
            <div className="relative group">
              <div className="size-7 rounded-full bg-violet-600 flex items-center justify-center text-[11px] font-semibold text-white ring-2 ring-green-400 ring-offset-1 ring-offset-background cursor-default">
                {(studentName ?? "S").split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-green-500 border-2 border-background" />
              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">
                <div className="bg-gray-900 text-white text-[11px] rounded-md px-2.5 py-1.5 shadow-lg">
                  <p className="font-medium">{studentName ?? "Student"}</p>
                  <p className="text-green-400 text-[10px]">Online now</p>
                </div>
              </div>
            </div>
            {supervisorName && (
              <div className="relative" ref={supervisorInboxRef}>
                <button
                  onClick={() => setShowSupervisorInbox((v) => !v)}
                  className="relative group"
                >
                  <div className="size-7 rounded-full bg-slate-500 flex items-center justify-center text-[11px] font-semibold text-white ring-2 ring-red-400 ring-offset-1 ring-offset-background cursor-pointer">
                    {supervisorName.replace(/^(Prof\.|Dr\.|Mr\.|Ms\.)\s*/i, "").split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-red-500 border-2 border-background" />
                  {pendingMeetings.length > 0 && (
                    <span className="absolute -top-1 -right-1 size-4 rounded-full bg-amber-500 border-2 border-background flex items-center justify-center text-[9px] font-bold text-white animate-pulse">
                      {pendingMeetings.length}
                    </span>
                  )}
                  <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">
                    <div className="bg-gray-900 text-white text-[11px] rounded-md px-2.5 py-1.5 shadow-lg">
                      <p className="font-medium">{supervisorName}</p>
                      <p className="text-red-400 text-[10px]">Last seen 2 hours ago</p>
                      {pendingMeetings.length > 0 && (
                        <p className="text-amber-400 text-[10px]">{pendingMeetings.length} pending request{pendingMeetings.length !== 1 ? "s" : ""} — click to open</p>
                      )}
                    </div>
                  </div>
                </button>

                {/* Supervisor inbox popover */}
                {showSupervisorInbox && (
                  <div className="absolute left-0 top-full mt-2 w-80 bg-background border rounded-lg shadow-xl z-[100] overflow-hidden">
                    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 border-b">
                      <div className="size-6 rounded-full bg-slate-600 flex items-center justify-center text-[10px] font-semibold text-white">
                        {supervisorName.replace(/^(Prof\.|Dr\.|Mr\.|Ms\.)\s*/i, "").split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{supervisorName}</p>
                        <p className="text-[10px] text-slate-500">Inbox — meeting requests</p>
                      </div>
                    </div>
                    {pendingMeetings.length === 0 ? (
                      <p className="px-3 py-4 text-xs text-muted-foreground text-center">No pending requests</p>
                    ) : (
                      <div className="divide-y max-h-64 overflow-y-auto">
                        {pendingMeetings.map((ev) => (
                          <div key={ev.id} className="px-3 py-2.5">
                            <p className="text-xs font-medium">{ev.label}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {ev.date}{ev.attendees && ev.attendees.length > 0 ? ` · ${ev.attendees.join(", ")}` : ""}
                            </p>
                            <div className="flex gap-1.5 mt-2">
                              <button
                                onClick={() => { onResolveMeeting?.(ev.id, "approved"); }}
                                className="flex-1 rounded-md bg-green-600 text-white text-[11px] font-medium py-1 hover:bg-green-700 transition"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => { onResolveMeeting?.(ev.id, "rejected"); }}
                                className="flex-1 rounded-md border border-gray-300 text-[11px] font-medium py-1 hover:bg-gray-100 transition"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="flex rounded-md border shadow-sm overflow-hidden">
            <button
              onClick={() => setActiveView("graph")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                activeView === "graph"
                  ? "bg-violet-100 text-violet-700"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="3" /><circle cx="18" cy="18" r="3" /><circle cx="18" cy="6" r="3" />
                <path d="M8.5 7.5 15.5 16.5" /><path d="M8.5 6 15.5 6" />
              </svg>
              Graph
            </button>
            <button
              onClick={() => setActiveView("tasks")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l ${
                activeView === "tasks"
                  ? "bg-violet-100 text-violet-700"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Tasks
            </button>
          </div>
        </div>

        {activeView === "graph" ? (
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
        ) : (
          <div className="flex-1 overflow-y-auto px-4 pb-4 pt-4">
            <TaskBoard tasks={tasks} onToggleSubtask={onToggleSubtask} />
          </div>
        )}

        {/* Scout controls */}
        {activeView === "graph" && scoutNodes.length > 0 && (
          <div className="absolute bottom-3 left-14 z-10 flex gap-1.5">
            {hiddenScoutIds.size < scoutNodes.length && (
              <button
                onClick={() => setHiddenScoutIds(new Set(scoutNodes.map((n) => n.id)))}
                className="flex items-center gap-1.5 rounded-md border bg-background border-gray-300 text-muted-foreground hover:bg-gray-100 px-2.5 py-1.5 text-xs font-medium shadow-sm transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
                </svg>
                Hide all
              </button>
            )}
            {hiddenScoutIds.size > 0 && (
              <button
                onClick={() => setHiddenScoutIds(new Set())}
                className="flex items-center gap-1.5 rounded-md border bg-violet-100 border-violet-300 text-violet-700 hover:bg-violet-200 px-2.5 py-1.5 text-xs font-medium shadow-sm transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
                Show all ({hiddenScoutIds.size})
              </button>
            )}
          </div>
        )}

        {selectedNode && activeView === "graph" && (
          <NodeDetailPanel
            node={selectedNode}
            onClose={() => setSelectedNodeId(null)}
            completedSubtasks={completedSubtasks[selectedNode.id] ?? []}
            onToggleSubtask={handleToggle}
            isLocked={!isNodeInteractable(graph, selectedNode.id, completedSubtasks)}
            isBranch={isBranchNode(graph, selectedNode.id)}
            onChooseBranch={handleChooseBranch}
            scoutMessages={scoutConversations[selectedNode.id] ?? []}
            onScoutMessage={handleScoutMessage}
            isScoutStreaming={isScoutStreaming}
            scoutStatusSteps={scoutStatusSteps}
            pendingScoutProposal={pendingScoutProposal}
            onAcceptScoutProposal={handleAcceptScoutProposal}
            onRejectScoutProposal={handleRejectScoutProposal}
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
          scoutConversations={
            Object.entries(scoutConversations)
              .filter(([, msgs]) => msgs.length > 0)
              .map(([nodeId, msgs]) => ({
                nodeId,
                nodeLabel: graph.nodes.find((n) => n.id === nodeId)?.label ?? nodeId,
                messageCount: msgs.length,
              }))
          }
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
