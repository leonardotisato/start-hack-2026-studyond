import { NextRequest, NextResponse } from "next/server";
import { initGpsGraph } from "@/lib/gps-agent";
import { mockInitGraph } from "@/lib/gps-mock";
import { getProject, getStudent, getTopic, getSupervisor } from "@/lib/data";
import type { GpsInitResponse } from "@/types/gps";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, professorPrompt } = body;

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

  try {
    const result = await initGpsGraph({
      professorPrompt,
      project,
      student,
      topic,
      supervisor,
    });

    const response: GpsInitResponse = result;
    return NextResponse.json(response);
  } catch (err: unknown) {
    console.error("GPS init error, falling back to mock:", err instanceof Error ? err.message : err);
    const result = mockInitGraph(professorPrompt);
    const response: GpsInitResponse = result;
    return NextResponse.json(response);
  }
}
