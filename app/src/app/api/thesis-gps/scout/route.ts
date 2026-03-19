import { NextRequest } from "next/server";
import { runScoutAgent } from "@/lib/gps-scout-agent";
import { findRecommendations } from "@/lib/gps-recommend";
import { getProject, getStudent, getTopic, getSupervisor } from "@/lib/data";
import type { ScoutAgentRequest } from "@/types/gps";

function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const body: ScoutAgentRequest = await req.json();
  const { projectId, nodeId, userMessage, graph, completedSubtasks, conversationHistory, currentSuggestions } = body;

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const enc = new TextEncoder();

  const emit = async (data: object) => {
    await writer.write(enc.encode(sseEvent(data)));
  };

  (async () => {
    try {
      const node = graph.nodes.find((n) => n.id === nodeId);
      if (!node) {
        await emit({ type: "error", text: "Node not found." });
        return;
      }

      await emit({ type: "status", text: `Focusing on "${node.label}"...` });

      const project = await getProject(projectId);
      if (!project) {
        await emit({ type: "error", text: "Project not found." });
        return;
      }

      const [student, topic, supervisor] = await Promise.all([
        getStudent(project.studentId),
        project.topicId ? getTopic(project.topicId) : null,
        project.supervisorIds.length > 0 ? getSupervisor(project.supervisorIds[0]) : null,
      ]);

      await emit({ type: "status", text: "Thinking..." });

      let proposal;
      try {
        await new Promise((r) => setTimeout(r, 300));
        proposal = await runScoutAgent({
          node,
          graph,
          project,
          student,
          topic,
          supervisor,
          userMessage,
          completedSubtasks: completedSubtasks ?? {},
          conversationHistory: conversationHistory ?? [],
          currentSuggestions: currentSuggestions ?? [],
        });
      } catch (err: unknown) {
        console.error("Scout agent error:", err instanceof Error ? err.message : err);
        await emit({
          type: "done",
          proposal: {
            addNodes: [],
            updateNodes: [],
            removeNodeIds: [],
            addEdges: [],
            removeEdgeIds: [],
            completeSubtasks: [],
            message: "Sorry, I had trouble processing that. Could you rephrase?",
          },
        });
        return;
      }

      if (proposal.recommend) {
        await emit({ type: "status", text: "Searching the database..." });
        try {
          const recommendations = await findRecommendations(proposal.recommend, projectId);
          if (recommendations.length > 0) {
            await emit({ type: "recommendations", recommendations });
          }
        } catch (err) {
          console.error("Scout recommendation error:", err);
        }
      }

      await emit({ type: "done", proposal });
    } catch (err) {
      await emit({ type: "error", text: "Something went wrong. Please try again." });
      console.error(err);
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
