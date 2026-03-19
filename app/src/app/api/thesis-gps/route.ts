import { NextRequest, NextResponse } from "next/server";
import { runGpsAgent } from "@/lib/gps-agent";
import { mockAgentProposal } from "@/lib/gps-mock";
import { getProject, getStudent, getTopic, getSupervisor } from "@/lib/data";
import { DEFAULT_GRAPH } from "@/lib/gps-defaults";
import type { GpsAgentRequest, GpsAgentResponse } from "@/types/gps";

export async function POST(req: NextRequest) {
  const body: GpsAgentRequest = await req.json();
  const { graph, projectId, userMessage } = body;

  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const [student, topic, supervisor] = await Promise.all([
    getStudent(project.studentId),
    project.topicId ? getTopic(project.topicId) : null,
    project.supervisorIds.length > 0
      ? getSupervisor(project.supervisorIds[0])
      : null,
  ]);

  const currentGraph =
    graph.nodes.length > 0 ? graph : DEFAULT_GRAPH;

  try {
    const proposal = await runGpsAgent({
      graph: currentGraph,
      project,
      student,
      topic,
      supervisor,
      userMessage,
    });

    const response: GpsAgentResponse = { proposal };
    return NextResponse.json(response);
  } catch (err: unknown) {
    console.error("GPS agent error, falling back to mock:", err instanceof Error ? err.message : err);
    const proposal = mockAgentProposal(userMessage ?? "");
    const response: GpsAgentResponse = { proposal };
    return NextResponse.json(response);
  }
}
