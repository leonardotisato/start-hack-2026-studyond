import { NextRequest } from "next/server";
import { runGpsAgent } from "@/lib/gps-agent";
import { mockAgentProposal } from "@/lib/gps-mock";
import { createToolSession, picksToRecommendations } from "@/lib/mcp-tools";
import { loadContextData } from "@/lib/context-loader";
import { getProject, getStudent, getTopic, getSupervisor } from "@/lib/data";
import { DEFAULT_GRAPH } from "@/lib/gps-defaults";
import type { GpsAgentRequest } from "@/types/gps";

function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const body: GpsAgentRequest = await req.json();
  const {
    graph,
    projectId,
    userMessage,
    completedSubtasks,
    conversationHistory,
    attachedContext,
    attachedScoutConversations,
  } = body;

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const enc = new TextEncoder();

  const emit = async (data: object) => {
    await writer.write(enc.encode(sseEvent(data)));
  };

  // Run async in background so we can return the stream immediately
  (async () => {
    try {
      await emit({ type: "status", text: "Reading your thesis pipeline..." });

      const project = await getProject(projectId);
      if (!project) {
        await emit({ type: "error", text: "Project not found." });
        return;
      }

      const [student, topic, supervisor] = await Promise.all([
        getStudent(project.studentId),
        project.topicId ? getTopic(project.topicId) : null,
        project.supervisorIds.length > 0
          ? getSupervisor(project.supervisorIds[0])
          : null,
      ]);

      await emit({
        type: "status",
        text: "Analyzing your progress and context...",
      });

      const currentGraph = graph.nodes.length > 0 ? graph : DEFAULT_GRAPH;

      let contextData = "";
      if (attachedContext && attachedContext.length > 0) {
        await emit({
          type: "status",
          text: `Loading ${attachedContext.length} data source${attachedContext.length > 1 ? "s" : ""}...`,
        });
        contextData = await loadContextData(attachedContext);
      }

      let scoutConversationData = "";
      if (attachedScoutConversations && attachedScoutConversations.length > 0) {
        await emit({
          type: "status",
          text: `Loading ${attachedScoutConversations.length} Scout conversation${attachedScoutConversations.length > 1 ? "s" : ""}...`,
        });
        scoutConversationData = attachedScoutConversations
          .map((conv) => {
            const lines = conv.messages.map(
              (m) =>
                `  ${m.role === "user" ? "Student" : "Scout"}: ${m.content}`,
            );
            return `## Scout Conversation: "${conv.nodeLabel}" (node: ${conv.nodeId})\n\n${lines.join("\n")}`;
          })
          .join("\n\n───────────────────────────────────────\n\n");
      }

      await new Promise((r) => setTimeout(r, 400));
      await emit({ type: "status", text: "Identifying areas to improve..." });

      const toolSession = createToolSession();

      const onToolCall = async (
        name: string,
        _input: Record<string, unknown>,
        _result: string,
      ) => {
        if (name === "search_database") {
          await emit({
            type: "status",
            text: "Studyond Scout: searching the database...",
          });
        } else if (name === "select_recommendations") {
          const picks = toolSession.getSelectedPicks();
          if (picks.length > 0) {
            const searchResults = toolSession.getLastSearchResults();
            const recommendations = picksToRecommendations(
              picks,
              searchResults,
            );
            if (recommendations.length > 0) {
              await emit({ type: "recommendations", recommendations });
            }
          }
        }
      };

      let proposal;
      try {
        await new Promise((r) => setTimeout(r, 300));
        await emit({
          type: "status",
          text: "Drafting changes to your graph...",
        });

        proposal = await runGpsAgent(
          {
            graph: currentGraph,
            project,
            student,
            topic,
            supervisor,
            userMessage,
            completedSubtasks: completedSubtasks ?? {},
            conversationHistory: conversationHistory ?? [],
            contextData,
            scoutConversationData,
          },
          toolSession,
          onToolCall,
        );
      } catch (err: unknown) {
        console.error(
          "GPS agent error, falling back to mock:",
          err instanceof Error ? err.message : err,
        );
        await emit({
          type: "status",
          text: "Finalizing with fallback suggestions...",
        });
        proposal = mockAgentProposal(userMessage ?? "");
      }

      await emit({ type: "status", text: "Preparing your response..." });
      await new Promise((r) => setTimeout(r, 200));
      await emit({ type: "done", proposal });
    } catch (err) {
      await emit({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
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
