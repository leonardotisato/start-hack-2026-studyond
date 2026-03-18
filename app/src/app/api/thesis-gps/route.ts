import { NextRequest, NextResponse } from "next/server";
import { runGpsAgent } from "@/lib/gps-agent";
import { getProject, getStudent, getTopic, getSupervisor } from "@/lib/data";
import { buildDefaultGraph } from "@/lib/gps-defaults";
import type { GpsAgentRequest, GpsAgentResponse } from "@/types/gps";

export async function POST(req: NextRequest) {
  const body: GpsAgentRequest = await req.json();
  const { graph, projectId, userMessage } = body;

  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Load related entities
  const [student, topic, supervisor] = await Promise.all([
    getStudent(project.studentId),
    project.topicId ? getTopic(project.topicId) : null,
    project.supervisorIds.length > 0
      ? getSupervisor(project.supervisorIds[0])
      : null,
  ]);

  // Use provided graph or build a default one from project state
  const currentGraph =
    graph.nodes.length > 0 ? graph : buildDefaultGraph(project.state);

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
}
