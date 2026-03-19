import { NextRequest } from "next/server";
import { runGpsAgent } from "@/lib/gps-agent";
import { mockAgentProposal } from "@/lib/gps-mock";
import { findRecommendations } from "@/lib/gps-recommend";
import { getProject, getStudent, getTopic, getSupervisor } from "@/lib/data";
import { DEFAULT_GRAPH } from "@/lib/gps-defaults";
import type { GpsAgentRequest } from "@/types/gps";

function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const body: GpsAgentRequest = await req.json();
  const { graph, projectId, userMessage, completedSubtasks, conversationHistory } = body;

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
        project.supervisorIds.length > 0 ? getSupervisor(project.supervisorIds[0]) : null,
      ]);

      await emit({ type: "status", text: "Analyzing your progress and context..." });

      const currentGraph = graph.nodes.length > 0 ? graph : DEFAULT_GRAPH;

      // Small delay so the user sees the step
      await new Promise((r) => setTimeout(r, 400));
      await emit({ type: "status", text: "Identifying areas to improve..." });

      let proposal;
      try {
        // Notify when about to call the model
        await new Promise((r) => setTimeout(r, 300));
        await emit({ type: "status", text: "Drafting changes to your graph..." });

        proposal = await runGpsAgent({
          graph: currentGraph,
          project,
          student,
          topic,
          supervisor,
          userMessage,
          completedSubtasks: completedSubtasks ?? {},
          conversationHistory: conversationHistory ?? [],
        });
      } catch (err: unknown) {
        console.error("GPS agent error, falling back to mock:", err instanceof Error ? err.message : err);
        await emit({ type: "status", text: "Finalizing with fallback suggestions..." });
        proposal = mockAgentProposal(userMessage ?? "");
      }

      // Run sub-agent if the agent requested recommendations
      if (proposal.recommend) {
        await emit({ type: "status", text: "Searching for people who can help..." });
        try {
          const recommendations = await findRecommendations(proposal.recommend, projectId);
          if (recommendations.length > 0) {
            await emit({ type: "recommendations", recommendations });
          }
        } catch (err) {
          console.error("Recommendation sub-agent error:", err);
        }
      }

      await emit({ type: "status", text: "Preparing your response..." });
      await new Promise((r) => setTimeout(r, 200));
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
