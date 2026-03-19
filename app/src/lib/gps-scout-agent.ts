import Anthropic from "@anthropic-ai/sdk";
import type {
  GpsGraph,
  GpsNode,
  GpsProposal,
  ScoutMessage,
  ScoutSuggestionSummary,
} from "@/types/gps";
import type { ThesisProject, Student, Topic, Supervisor } from "@/types";
import { SEARCH_TOOLS, type ToolSession } from "@/lib/mcp-tools";
import { runWithTools, type OnToolCall } from "@/lib/tool-loop";

const client = new Anthropic();

function buildSystemPrompt(node: GpsNode, completedIndices: number[]): string {
  const subtaskStatus = (node.subtasks ?? [])
    .map((s, i) => `  ${completedIndices.includes(i) ? "[x]" : "[ ]"} ${s}`)
    .join("\n");

  return `You are Studyond Scout — a research assistant focused on helping a student with one specific milestone in their thesis pipeline.

FOCUS NODE: "${node.label}"
Description: ${node.description ?? "No description"}
Status: ${node.state}
${subtaskStatus ? `Subtasks:\n${subtaskStatus}` : "No subtasks"}

You MUST respond with ONLY a JSON object. You can do three things independently — decide for EACH:

1. SEARCH THE DATABASE — use the search_database tool to find supervisors, experts, companies, topics, universities, or programs
2. MODIFY THE GRAPH — propose changes using addNodes/updateNodes/removeNodeIds/addEdges/removeEdgeIds/completeSubtasks
3. ANSWER — give specific, contextual advice about this milestone

JSON response format (your FINAL response after any tool calls):
{
  "addNodes": [],
  "updateNodes": [],
  "removeNodeIds": [],
  "addEdges": [],
  "removeEdgeIds": [],
  "completeSubtasks": [],
  "message": "Your reply.",
  "dismissSuggestionIds": []
}

═══════════════════════════════════════════
WHEN TO SEARCH (use search_database tool)
═══════════════════════════════════════════

Use the search_database tool when the student asks about ANY entities — supervisors, experts, companies, topics, universities, or programs:
- "Find me a supervisor for X" → call search_database with entity_types: ["supervisor"]
- "Any companies working on X?" → call search_database with entity_types: ["company"]
- "Suggest thesis topics in X" → call search_database with entity_types: ["topic"]
- Broad requests → call search_database without entity_types to search all
- IMPORTANT: Even if the request is unrelated to the focus node "${node.label}", ALWAYS search when the student asks for entities.

After getting search results, you MUST call select_recommendations with the top 2-3 entities that CLOSELY match the student's request. Only pick entities that are genuinely relevant — if none truly fit, pass an empty array. Then mention your picks in your message with names and details.

═══════════════════════════════════════════
WHEN TO MODIFY THE GRAPH
═══════════════════════════════════════════

YES — modify when:
- Student asks to add/remove/split/restructure steps
- Student asks you to apply a suggestion you made
- Student says "add that to my pipeline"
- You identify a concrete gap that should be fixed

NO — do NOT modify when:
- Student asks questions or wants advice
- Student is exploring options
- Leave all arrays empty

GRAPH RULES:
- New nodes MUST have edges connecting to existing nodes
- New nodes MUST have 2-3 subtasks
- Node IDs: kebab-case (e.g. "data-collection")
- New nodes: always "state": "upcoming"
- Keep total nodes 5-12

COMPLETING SUBTASKS:
- When student says "I finished X", "mark X done" → identify node and subtask indices
- Schema: [{ "nodeId": "...", "subtaskIndices": [0, 2] }]

═══════════════════════════════════════════
MESSAGE RULES
═══════════════════════════════════════════

- Keep to 1-3 sentences (the UI panel is narrow)
- ALWAYS answer the student's actual question, even if unrelated to "${node.label}"
- Reference the student's actual context when relevant
- Never refuse or redirect the student — if they ask about mechanics companies, answer about mechanics companies
- No filler ("Great question!", "I'd be happy to help")

═══════════════════════════════════════════
CURRENT SUGGESTIONS ON GRAPH
═══════════════════════════════════════════

The student can see suggestion nodes on the graph from previous searches. These are listed below with their IDs. When the student asks to remove suggestions (e.g. "remove Prof. X", "hide that company", "clear all suggestions"), set "dismissSuggestionIds" to the IDs of the suggestion nodes to remove.

Example: student says "remove Prof. Mueller from the graph" and there's a suggestion with id "scout-lit-review-sup1" for Prof. Mueller → set "dismissSuggestionIds": ["scout-lit-review-sup1"]

To remove ALL suggestions, list all their IDs in "dismissSuggestionIds".

Respond with ONLY the JSON. No markdown, no extra text.`;
}

interface ScoutAgentContext {
  node: GpsNode;
  graph: GpsGraph;
  project: ThesisProject;
  student?: Student | null;
  topic?: Topic | null;
  supervisor?: Supervisor | null;
  userMessage: string;
  completedSubtasks: Record<string, number[]>;
  conversationHistory: ScoutMessage[];
  currentSuggestions: ScoutSuggestionSummary[];
}

function buildUserPrompt(ctx: ScoutAgentContext): string {
  const parts: string[] = [];

  parts.push("## Pipeline Structure");
  for (const node of ctx.graph.nodes) {
    parts.push(`- ${node.id}: "${node.label}" [${node.state}]`);
  }

  parts.push("\n## Edges");
  for (const edge of ctx.graph.edges) {
    parts.push(`- ${edge.source} → ${edge.target}`);
  }

  parts.push("\n## Project");
  parts.push(`- Title: ${ctx.project.title}`);
  if (ctx.project.description)
    parts.push(`- Description: ${ctx.project.description}`);

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
    parts.push(
      `- Name: ${ctx.supervisor.firstName} ${ctx.supervisor.lastName}`,
    );
    parts.push(`- Research: ${ctx.supervisor.researchInterests.join(", ")}`);
  }

  if (ctx.currentSuggestions.length > 0) {
    parts.push(`\n## Current Suggestions Shown on Graph`);
    for (const s of ctx.currentSuggestions) {
      parts.push(`- ${s.name} (${s.type}, ${s.affiliation}) [id: ${s.id}]`);
    }
  }

  parts.push(`\n## Student Message`);
  parts.push(ctx.userMessage);

  return parts.join("\n");
}

interface ScoutProposal extends GpsProposal {
  dismissSuggestionIds: string[];
}

function parseProposal(text: string): ScoutProposal {
  const cleaned = text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
  const parsed = JSON.parse(cleaned);

  return {
    addNodes: parsed.addNodes ?? [],
    updateNodes: (parsed.updateNodes ?? []).map(
      (u: { id: string; patch?: object }) => ({
        id: u.id,
        patch: u.patch ?? {},
      }),
    ),
    removeNodeIds: parsed.removeNodeIds ?? [],
    addEdges: parsed.addEdges ?? [],
    removeEdgeIds: parsed.removeEdgeIds ?? [],
    completeSubtasks: parsed.completeSubtasks ?? [],
    addEvents: parsed.addEvents ?? [],
    message: parsed.message ?? "No explanation provided.",
    recommend: parsed.recommend ?? undefined,
    dismissSuggestionIds: parsed.dismissSuggestionIds ?? [],
  };
}

export type { ScoutProposal };

export async function runScoutAgent(
  ctx: ScoutAgentContext,
  toolSession: ToolSession,
  onToolCall?: OnToolCall,
): Promise<ScoutProposal> {
  const nodeCompletedIndices = ctx.completedSubtasks[ctx.node.id] ?? [];
  const systemPrompt = buildSystemPrompt(ctx.node, nodeCompletedIndices);
  const contextPrompt = buildUserPrompt(ctx);
  const history = ctx.conversationHistory;

  const messages: Anthropic.MessageParam[] = [];

  if (history.length > 0) {
    messages.push({ role: "user", content: contextPrompt });
    messages.push({
      role: "assistant",
      content: JSON.stringify({
        addNodes: [],
        updateNodes: [],
        removeNodeIds: [],
        addEdges: [],
        removeEdgeIds: [],
        completeSubtasks: [],
        message: `I'm ready to help with "${ctx.node.label}". What do you need?`,
      }),
    });

    for (const msg of history) {
      if (msg.role === "user") {
        messages.push({ role: "user", content: msg.content });
      } else {
        messages.push({
          role: "assistant",
          content: JSON.stringify({
            addNodes: [],
            updateNodes: [],
            removeNodeIds: [],
            addEdges: [],
            removeEdgeIds: [],
            completeSubtasks: [],
            message: msg.content,
          }),
        });
      }
    }

    messages.push({ role: "user", content: ctx.userMessage });
  } else {
    messages.push({ role: "user", content: contextPrompt });
  }

  const text = await runWithTools({
    client,
    model: "claude-sonnet-4-20250514",
    maxTokens: 2048,
    system: systemPrompt,
    messages,
    tools: SEARCH_TOOLS,
    toolExecutor: toolSession.executeToolCall,
    onToolCall,
  });

  return parseProposal(text);
}
