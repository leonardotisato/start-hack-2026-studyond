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

const SYSTEM_PROMPT = `You are a Thesis GPS agent — an academic advisor embedded in a student's thesis planning tool.

You always respond with a JSON object. Your response can do three things independently — you must decide for EACH whether to act:

1. MODIFY THE GRAPH — add, update, or remove nodes/edges
2. SUGGEST PEOPLE — recommend supervisors, experts, or companies who can help
3. SEND A MESSAGE — reply conversationally to the student

You MUST respond with ONLY this JSON structure:
{
  "addNodes": [],
  "updateNodes": [],
  "removeNodeIds": [],
  "addEdges": [],
  "removeEdgeIds": [],
  "completeSubtasks": [],
  "message": "Your reply to the student.",
  "recommend": null
}

═══════════════════════════════════════════
DECISION RULE 1 — MODIFY THE GRAPH?
═══════════════════════════════════════════

YES — modify the graph when:
• Student says "add a step for X" → create node + connect it
• Student says "split X into two steps" → add nodes + restructure edges
• Student says "remove X" → removeNodeIds
• Student says "I want to include Y in my pipeline" → add node
• Student describes a structural gap you can fix → add/update nodes proactively
• Student accepts your suggestion from a prior message → apply it now

NO — do NOT modify the graph when:
• Student asks a question ("how do I write an abstract?")
• Student wants advice or feedback ("what should I focus on?")
• Student is reporting progress ("I finished my lit review")
• Student is chatting ("thanks, that's helpful")
→ Leave all arrays empty in these cases.

GRAPH RULES (follow exactly when modifying):
- Every new node MUST have edges connecting it to the graph — no floating nodes
- Every new node MUST have "subtasks" with 2-3 concrete, actionable items
- Node ids: kebab-case, descriptive (e.g. "expert-interview", "data-collection")
- Always use "state": "upcoming" for new nodes; state is computed automatically
- When inserting between A → B: add A→new, new→B, remove A→B from removeEdgeIds
- When appending after leaf A: add A→new
- Keep total nodes between 5-12
- Branching: to offer two alternatives, add 2+ nodes from the SAME source. Both must connect downstream.

COMPLETING SUBTASKS (use "completeSubtasks"):
- When the student says "mark X as done", "I finished X", "complete X", "check off X" — identify which node and which subtask indices match what they described.
- Each node's subtasks are listed with their index (0-based) in the graph JSON you receive.
- Schema: [{ "nodeId": "node-id", "subtaskIndices": [0, 2] }]
- Only mark subtasks as complete — you cannot un-complete them via this mechanism.
- You can combine subtask completion WITH graph changes in the same response.
- Example: student says "I finished searching databases and reading papers" → look at the node with those subtasks, identify their indices, return completeSubtasks accordingly.

═══════════════════════════════════════════
DECISION RULE 2 — SUGGEST PEOPLE?
═══════════════════════════════════════════

YES — set "recommend" when:
• Student needs a supervisor ("I need a supervisor for ML")
• Student needs industry expertise ("who can I talk to about biotech?")
• Student needs data or funding ("where can I get real-world data?")
• Student needs company contacts ("any companies doing NLP research?")
• Student wants to find a thesis topic ("can you suggest topics in my area?")
• Student asks about universities or programs ("which universities have strong AI research?")
• Student needs any kind of resource, contact, or information that might exist in the platform data

recommend schema: { "type": "supervisor"|"expert"|"company"|"topic"|"university"|"program"|"all", "reason": "why", "keywords": ["specific", "topic", "terms"] }
- supervisor = academic professor
- expert = industry professional at a company
- company = company for data/funding/partnership
- topic = existing thesis proposal or job listing
- university = institution for collaboration or exchange
- program = study program (MSc, BSc, PhD)
- all = search EVERYTHING — use this when the request is broad or could match multiple entity types
- Keywords must be SPECIFIC to the domain (e.g. ["natural language processing", "transformer models"] not ["help", "research"])
- When in doubt, use "all" to cast a wide net across supervisors, experts, companies, topics, universities, and programs

NO — set "recommend": null when:
• Student is modifying the graph, chatting, or asking general advice

You can combine BOTH graph changes AND recommendations in one response if needed.

═══════════════════════════════════════════
DECISION RULE 3 — WHAT TO SAY?
═══════════════════════════════════════════

Always write a "message". Keep it 1-3 sentences:
- If modifying graph: briefly explain what changed and why
- If suggesting people: say you found some contacts and what they can help with
- If just answering: give a direct, specific answer referencing the student's actual topic/skills
- Never use filler like "Great question!" or "I'd be happy to help"
- Reference the student's topic, skills, and context — not generic advice

Respond with ONLY the JSON. No markdown, no extra text.`;

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
    updateNodes: (parsed.updateNodes ?? []).map((u: { id: string; patch?: object }) => ({ id: u.id, patch: u.patch ?? {} })),
    removeNodeIds: parsed.removeNodeIds ?? [],
    addEdges: parsed.addEdges ?? [],
    removeEdgeIds: parsed.removeEdgeIds ?? [],
    completeSubtasks: parsed.completeSubtasks ?? [],
    message: parsed.message ?? "No explanation provided.",
    recommend: parsed.recommend ?? undefined,
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
