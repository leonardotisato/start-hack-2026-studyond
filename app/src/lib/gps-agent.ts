import Anthropic from "@anthropic-ai/sdk";
import type { GpsGraph, GpsProposal } from "@/types/gps";
import type { ThesisProject, Student, Topic, Supervisor } from "@/types";

const client = new Anthropic();

const INIT_SYSTEM_PROMPT = `You are a Thesis GPS agent that creates an initial thesis pipeline graph based on a professor's instructions.

You receive:
- A professor's prompt describing the thesis structure, milestones, and requirements
- The student's project context (topic, skills, current state)

Your job is to create a complete thesis pipeline graph. You MUST respond with valid JSON matching this exact structure:

{
  "graph": {
    "nodes": [{ "id": "string", "label": "string", "state": "upcoming" | "active" | "completed", "description": "string", "estimatedDate": "YYYY-MM-DD", "subtasks": ["string"] }],
    "edges": [{ "id": "string", "source": "string", "target": "string", "label": "string" }]
  },
  "message": "Your explanation of the graph structure to the student."
}

Rules:
- Create 6-12 nodes based on the professor's instructions
- The first uncompleted node should be "active", earlier ones "completed", later ones "upcoming"
- Edges define the dependency order — a node's dependencies must be completed before it can become active
- You can create branching paths where appropriate (e.g., parallel workstreams)
- Each node should have a clear description and relevant subtasks
- Use realistic node IDs (kebab-case, descriptive)
- The message should welcome the student and explain the journey ahead

Respond with ONLY the JSON object, no markdown fences, no extra text.`;

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

interface InitContext {
  professorPrompt: string;
  project: ThesisProject;
  student?: Student | null;
  topic?: Topic | null;
  supervisor?: Supervisor | null;
}

function buildInitPrompt(ctx: InitContext): string {
  const parts: string[] = [];

  parts.push("## Professor's Instructions");
  parts.push(ctx.professorPrompt);

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

  return parts.join("\n");
}

export async function initGpsGraph(ctx: InitContext): Promise<{ graph: GpsGraph; message: string }> {
  const userPrompt = buildInitPrompt(ctx);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: INIT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const parsed = JSON.parse(cleaned);

  return {
    graph: {
      nodes: parsed.graph?.nodes ?? [],
      edges: parsed.graph?.edges ?? [],
    },
    message: parsed.message ?? "Your thesis graph has been created.",
  };
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
