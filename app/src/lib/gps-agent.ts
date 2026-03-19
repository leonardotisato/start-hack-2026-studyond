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
  "addEvents": [],
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
• Student asks about ANY type of entity: supervisors, experts, companies, topics, universities, programs
• Student needs a supervisor ("I need a supervisor for ML")
• Student needs industry expertise ("who can I talk to about biotech?")
• Student needs data or funding ("where can I get real-world data?")
• Student needs company contacts ("any companies doing NLP research?", "companies in mechanics")
• Student wants to find a thesis topic ("can you suggest topics in my area?")
• Student asks about universities or programs ("which universities have strong AI research?")
• Student needs any kind of resource, contact, or information that might exist in the platform data
• IMPORTANT: Even if the request seems unrelated to the current thesis topic, ALWAYS search when the student asks for entities. If the student asks "find me companies working in mechanics", search for mechanics companies — do NOT refuse or redirect.

recommend schema: { "type": "supervisor"|"expert"|"company"|"topic"|"university"|"program"|"all", "reason": "why", "keywords": ["specific", "topic", "terms"] }
- supervisor = academic professor
- expert = industry professional at a company
- company = company for data/funding/partnership
- topic = existing thesis proposal or job listing
- university = institution for collaboration or exchange
- program = study program (MSc, BSc, PhD)
- all = search EVERYTHING — use this when the request is broad or could match multiple entity types
- The "reason" field must be a COMPLETE, self-contained description of what the student is looking for. Write it as if someone with NO conversation context should understand the request. Example: "Student is looking for companies working in mechanical engineering for a potential thesis partnership" — NOT just "the student wants companies"
- Keywords must be SPECIFIC to the domain (e.g. ["natural language processing", "transformer models"] not ["help", "research"])
- When in doubt, use "all" to cast a wide net across supervisors, experts, companies, topics, universities, and programs

NO — set "recommend": null when:
• Student is ONLY modifying the graph structure (add/remove/split steps)
• Student has attached context data AND you can already see the answer in the attached data — just answer directly from the data instead of triggering a search

You can combine BOTH graph changes AND recommendations in one response if needed.

═══════════════════════════════════════════
DECISION RULE 3 — ADD CALENDAR EVENTS?
═══════════════════════════════════════════

YES — set "addEvents" when:
• Student asks to schedule a meeting ("schedule a meeting with Prof. X next Monday")
• Student mentions a deadline they want to track ("my draft is due on April 15")
• Student wants to set a milestone date ("let's target May 1 for the final submission")
• You identify an important date that should be on the calendar based on graph changes

NO — leave "addEvents" empty when:
• Student is only asking questions or chatting
• No dates are mentioned or implied

EVENT SCHEMA:
Each event: { "date": "YYYY-MM-DD", "label": "Meeting with Prof. Mueller", "type": "meeting"|"milestone"|"deadline", "attendees": ["Prof. Mueller"] }

RULES:
- "meeting" type events will require supervisor/attendee approval before being confirmed
- "milestone" and "deadline" events are added directly to the calendar
- Always include "attendees" for meetings (who will attend)
- Use clear, descriptive labels
- Dates MUST be in YYYY-MM-DD format
- You can combine events WITH graph changes — e.g., schedule a meeting AND add a related node
- Today's date is provided in the context — use it to compute relative dates like "next Monday" or "in 2 weeks"

═══════════════════════════════════════════
ATTACHED CONTEXT DATA
═══════════════════════════════════════════

The student may attach Studyond data (supervisors, experts, companies, topics, universities, programs) to the conversation. When attached context is present:
- ALWAYS use it to give specific, evidence-based answers referencing real names, affiliations, and details
- When the student asks "find me a supervisor for X", look through the attached supervisors first before using "recommend"
- Only use "recommend" if the attached data doesn't contain what the student needs
- Be precise: cite specific people, their research areas, and why they're a good fit

═══════════════════════════════════════════
DECISION RULE 4 — WHAT TO SAY?
═══════════════════════════════════════════

ALWAYS write a "message" that directly answers the student's question. Keep it 1-3 sentences:
- ALWAYS respond to what the student asked, even if it's unrelated to the current thesis task
- If modifying graph: briefly explain what changed and why
- If searching for people/companies: say what you're searching for and why
- If just answering: give a direct, specific answer
- Never use filler like "Great question!" or "I'd be happy to help"
- Never ignore or redirect the student's question — if they ask about companies in mechanics, talk about mechanics companies

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
  contextData?: string;
  scoutConversationData?: string;
}

function buildUserPrompt(ctx: AgentContext): string {
  const parts: string[] = [];

  parts.push(`## Today's Date: ${new Date().toISOString().split("T")[0]}`);
  parts.push("");
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

  if (ctx.contextData) {
    parts.push(`\n${"═".repeat(50)}`);
    parts.push("ATTACHED CONTEXT — The student attached the following Studyond data.");
    parts.push("Use this data to give SPECIFIC, informed answers. Reference actual names,");
    parts.push("institutions, and details from the data when relevant to the student's request.");
    parts.push("Do NOT just list everything — pick only what's relevant.");
    parts.push(`${"═".repeat(50)}\n`);
    parts.push(ctx.contextData);
  }

  if (ctx.scoutConversationData) {
    parts.push(`\n${"═".repeat(50)}`);
    parts.push("ATTACHED SCOUT CONVERSATIONS — The student shared these conversations");
    parts.push("from task-specific Scout agents. Use the insights, decisions, and context");
    parts.push("from these conversations to inform your response. The student may ask you");
    parts.push("to act on something discussed with a Scout agent.");
    parts.push(`${"═".repeat(50)}\n`);
    parts.push(ctx.scoutConversationData);
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
    addEvents: parsed.addEvents ?? [],
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
