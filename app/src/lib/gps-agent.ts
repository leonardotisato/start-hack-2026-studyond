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
- Subtask completion status showing which subtasks the student has checked off
- The student's project context (topic, supervisor, current state, skills, objectives)
- A message from the student

Your job is to understand what the student needs and respond appropriately. NOT every message requires graph changes.

You MUST respond with valid JSON matching this exact structure:

{
  "addNodes": [],
  "updateNodes": [],
  "removeNodeIds": [],
  "addEdges": [],
  "removeEdgeIds": [],
  "message": "Your response to the student."
}

When to modify the graph (use your judgment):
- The student explicitly asks to add, remove, or change steps ("add a step for X", "remove Y", "split this into two")
- The student describes a problem or gap best solved by restructuring the pipeline
- After a conversation, you spot a genuinely useful next step the student hasn't considered — proactively propose it

When NOT to modify the graph:
- The student asks a factual or advisory question ("how do I write an abstract?", "what should I focus on?")
- The student is sharing progress or chatting casually
- In these cases, return empty arrays for all change fields and answer conversationally in "message"

IMPORTANT: If the student explicitly asks you to add or change something in the graph, you MUST do it. Do not just describe what you would do — actually populate addNodes/updateNodes/addEdges.

Node schema for addNodes: { "id": "string", "label": "string", "state": "upcoming", "description": "string", "estimatedDate": "YYYY-MM-DD", "subtasks": ["string"] }
Schema for updateNodes: { "id": "string", "patch": { "label": "string", "description": "string", "subtasks": ["string"], "estimatedDate": "YYYY-MM-DD" } }
Schema for addEdges: { "id": "string", "source": "string", "target": "string", "label": "string" }

Graph integrity rules (CRITICAL — follow exactly):
- Every new node MUST connect to the existing graph via at least one edge in addEdges. Never add a floating node.
- Every new node MUST have a "subtasks" array with at least 2-3 concrete, actionable subtasks.
- When inserting a node between two existing nodes A → B: add edges A → newNode and newNode → B, and remove edge A → B in removeEdgeIds.
- When appending a node after an existing leaf node A: add edge A → newNode.
- Node states are computed automatically — do NOT set "state" in patches. Always use "upcoming" for new nodes.
- When updating a node's subtasks, include the FULL subtask list (existing + new).
- Keep the graph manageable: 5-12 nodes total.

Branching rules:
- A branch occurs when ONE existing node has outgoing edges to TWO OR MORE sibling nodes. The student then picks which path to follow — the others get removed.
- To create a branch: add 2+ new nodes, then add edges from the SAME existing source node to each of them. Example: source → option-A and source → option-B.
- Both branch options must also connect to a downstream node (or be the last step), so the graph remains a valid pipeline after the student picks one.
- Only use branching when there are genuinely alternative paths (e.g. "qualitative vs. quantitative methodology"). Do NOT branch for sequential steps.
- Never create a branch with only one option — that's just a regular node.

Edge rules:
- Edges define dependencies: a node becomes active only when ALL its predecessors are completed.
- Connections must be logical: the source node's completion must be a natural prerequisite for the target.
- Do not add redundant edges (if A → B and B → C already exist, do not add A → C unless truly needed).

Style:
- Be specific: reference the student's actual topic, skills, and context — not generic advice.
- Keep the "message" concise (2-3 sentences). Answer directly, skip motivational filler.
- If you proactively suggest a graph change, briefly say why it helps.

Respond with ONLY the JSON object, no markdown fences, no extra text.`;

interface ConversationMessage {
  role: "user" | "agent";
  content: string;
}

interface AgentContext {
  graph: GpsGraph;
  project: ThesisProject;
  student?: Student | null;
  topic?: Topic | null;
  supervisor?: Supervisor | null;
  userMessage?: string;
  completedSubtasks?: Record<string, number[]>;
  conversationHistory?: ConversationMessage[];
}

function buildUserPrompt(ctx: AgentContext): string {
  const parts: string[] = [];

  parts.push("## Current Graph");
  parts.push(JSON.stringify(ctx.graph, null, 2));

  // Explicit pipeline structure so the agent reasons correctly about connections
  parts.push("\n## Current Pipeline Structure (node-id: label)");
  for (const node of ctx.graph.nodes) {
    parts.push(`- ${node.id}: "${node.label}"`);
  }
  parts.push("\n## Current Edges (source → target)");
  for (const edge of ctx.graph.edges) {
    parts.push(`- ${edge.source} → ${edge.target}${edge.label ? ` [${edge.label}]` : ""}`);
  }

  // Include subtask completion status so the agent knows progress
  const completed = ctx.completedSubtasks ?? {};
  if (Object.keys(completed).length > 0) {
    parts.push("\n## Subtask Completion Status");
    for (const node of ctx.graph.nodes) {
      if (!node.subtasks || node.subtasks.length === 0) continue;
      const doneIndices = completed[node.id] ?? [];
      const doneCount = doneIndices.length;
      const total = node.subtasks.length;
      const status = doneCount >= total ? "COMPLETED" : doneCount > 0 ? "IN PROGRESS" : "NOT STARTED";
      parts.push(`- **${node.label}** (${node.id}): ${doneCount}/${total} subtasks done [${status}]`);
      for (let i = 0; i < node.subtasks.length; i++) {
        const check = doneIndices.includes(i) ? "[x]" : "[ ]";
        parts.push(`  ${check} ${node.subtasks[i]}`);
      }
    }
  }

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
    if (ctx.student.about) parts.push(`- About: ${ctx.student.about}`);
    if (ctx.student.objectives.length > 0) parts.push(`- Objectives: ${ctx.student.objectives.join(", ")}`);
  }

  if (ctx.topic) {
    parts.push(`\n## Topic`);
    parts.push(`- Title: ${ctx.topic.title}`);
    parts.push(`- Description: ${ctx.topic.description}`);
    if (ctx.topic.degrees.length > 0) parts.push(`- Target degrees: ${ctx.topic.degrees.join(", ")}`);
  }

  if (ctx.supervisor) {
    parts.push(`\n## Supervisor`);
    parts.push(`- Name: ${ctx.supervisor.firstName} ${ctx.supervisor.lastName}`);
    parts.push(`- Title: ${ctx.supervisor.title}`);
    parts.push(`- Research Interests: ${ctx.supervisor.researchInterests.join(", ")}`);
    if (ctx.supervisor.about) parts.push(`- About: ${ctx.supervisor.about}`);
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
  const contextPrompt = buildUserPrompt(ctx);
  const history = ctx.conversationHistory ?? [];

  // Build multi-turn messages: context first, then conversation history, then current message
  const messages: Anthropic.MessageParam[] = [];

  // First turn: graph + project context (always included)
  if (history.length > 0) {
    // Inject context as the first user message with a brief acknowledgement
    messages.push({ role: "user", content: contextPrompt });
    messages.push({ role: "assistant", content: JSON.stringify({ addNodes: [], updateNodes: [], removeNodeIds: [], addEdges: [], removeEdgeIds: [], message: "Understood. I've reviewed your graph and context." }) });

    // Replay conversation history (skip the last user message — it's the current one)
    const historyToReplay = history.slice(0, -1);
    for (const msg of historyToReplay) {
      if (msg.role === "user") {
        messages.push({ role: "user", content: msg.content });
      } else {
        // Wrap agent messages back into JSON format so the model stays consistent
        messages.push({ role: "assistant", content: JSON.stringify({ addNodes: [], updateNodes: [], removeNodeIds: [], addEdges: [], removeEdgeIds: [], message: msg.content }) });
      }
    }

    // Final user message (current)
    if (ctx.userMessage) {
      messages.push({ role: "user", content: ctx.userMessage });
    }
  } else {
    messages.push({ role: "user", content: contextPrompt });
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages,
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
