import Anthropic from "@anthropic-ai/sdk";
import type { GpsGraph, GpsProposal } from "@/types/gps";
import type { ThesisProject, Student, Topic, Supervisor } from "@/types";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a Thesis GPS agent — a proactive academic advisor that guides students through their thesis journey.

You receive:
- The current thesis pipeline graph (nodes and edges in JSON)
- The student's project context (topic, supervisor, current state)
- An optional message from the student

Your job is to analyze the graph, detect issues, and propose changes. You MUST respond with valid JSON matching this exact structure:

{
  "addNodes": [{ "id": "string", "label": "string", "state": "upcoming", "description": "string", "estimatedDate": "YYYY-MM-DD", "subtasks": ["string"] }],
  "updateNodes": [{ "id": "string", "patch": { "state": "completed" | "active" | "upcoming" | "blocked", "label": "string", ... } }],
  "removeNodeIds": ["string"],
  "addEdges": [{ "id": "string", "source": "string", "target": "string", "label": "string", "isSuggestion": true }],
  "removeEdgeIds": ["string"],
  "message": "Your explanation to the student — be encouraging, specific, and actionable."
}

Rules:
- Node states: "completed" (done), "active" (current step), "upcoming" (future), "blocked" (can't proceed until dependency is resolved)
- Only ONE node should be "active" at a time
- Edges define dependencies: source must be completed before target can become active
- When suggesting alternative paths, set isSuggestion: true on those edges
- Be proactive: if the student seems stuck, suggest concrete next actions
- Be specific: reference the student's actual topic, not generic advice
- Keep the graph manageable: 5-12 nodes is the sweet spot
- Always include a "message" explaining what you changed and why

Respond with ONLY the JSON object, no markdown fences, no extra text.`;

interface AgentContext {
  graph: GpsGraph;
  project: ThesisProject;
  student?: Student | null;
  topic?: Topic | null;
  supervisor?: Supervisor | null;
  userMessage?: string;
}

function buildUserPrompt(ctx: AgentContext): string {
  const parts: string[] = [];

  parts.push("## Current Graph");
  parts.push(JSON.stringify(ctx.graph, null, 2));

  parts.push("\n## Project Context");
  parts.push(`- Title: ${ctx.project.title}`);
  parts.push(`- State: ${ctx.project.state}`);
  if (ctx.project.description) parts.push(`- Description: ${ctx.project.description}`);
  if (ctx.project.motivation) parts.push(`- Motivation: ${ctx.project.motivation}`);

  if (ctx.student) {
    parts.push(`\n## Student`);
    parts.push(`- Name: ${ctx.student.firstName} ${ctx.student.lastName}`);
    parts.push(`- Degree: ${ctx.student.degree}`);
    parts.push(`- Skills: ${ctx.student.skills.join(", ")}`);
  }

  if (ctx.topic) {
    parts.push(`\n## Topic`);
    parts.push(`- Title: ${ctx.topic.title}`);
    parts.push(`- Description: ${ctx.topic.description}`);
  }

  if (ctx.supervisor) {
    parts.push(`\n## Supervisor`);
    parts.push(`- Name: ${ctx.supervisor.firstName} ${ctx.supervisor.lastName}`);
    parts.push(`- Research Interests: ${ctx.supervisor.researchInterests.join(", ")}`);
  }

  if (ctx.userMessage) {
    parts.push(`\n## Student Message`);
    parts.push(ctx.userMessage);
  } else {
    parts.push(`\n## Task`);
    parts.push("Analyze the current graph and proactively suggest improvements or next steps.");
  }

  return parts.join("\n");
}

function parseProposal(text: string): GpsProposal {
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const parsed = JSON.parse(cleaned);

  return {
    addNodes: parsed.addNodes ?? [],
    updateNodes: parsed.updateNodes ?? [],
    removeNodeIds: parsed.removeNodeIds ?? [],
    addEdges: parsed.addEdges ?? [],
    removeEdgeIds: parsed.removeEdgeIds ?? [],
    message: parsed.message ?? "No explanation provided.",
  };
}

export async function runGpsAgent(ctx: AgentContext): Promise<GpsProposal> {
  const userPrompt = buildUserPrompt(ctx);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return parseProposal(text);
}

export function applyProposal(graph: GpsGraph, proposal: GpsProposal): GpsGraph {
  // Remove nodes
  const remainingNodes = graph.nodes.filter(
    (n) => !proposal.removeNodeIds.includes(n.id)
  );

  // Update nodes
  const updatedNodes = remainingNodes.map((node) => {
    const update = proposal.updateNodes.find((u) => u.id === node.id);
    if (!update) return node;
    return { ...node, ...update.patch };
  });

  // Add nodes
  const allNodes = [...updatedNodes, ...proposal.addNodes];

  // Remove edges
  const remainingEdges = graph.edges.filter(
    (e) => !proposal.removeEdgeIds.includes(e.id)
  );

  // Add edges
  const allEdges = [...remainingEdges, ...proposal.addEdges];

  return { nodes: allNodes, edges: allEdges };
}
