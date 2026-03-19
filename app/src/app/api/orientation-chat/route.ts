import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getTopics, getCompanies, getFields } from "@/lib/data";
import { sortByMatch } from "@/lib/matching";
import type { Topic, Company, Field } from "@/types";

const client = new Anthropic();

const SYSTEM_PROMPT_PREFIX = `You are an orientation advisor for university students starting their thesis journey. Help them discover fields, compare thesis vs job options, and find direction.

FORMATTING RULES:
- Write plain text only. No markdown headings, no bold, no italic, no bullet lists.
- Keep answers short: 2-4 short paragraphs max.
- Use natural conversational sentences, not structured documents.
- When referencing topics, use this link format: [Topic Title](topic:topic-id)
- Be specific and concrete, referencing actual topics and companies from the context.`;

function serializeTopics(
  topics: (Topic & { match: { score: number } })[],
): string {
  return topics
    .map(
      (t) =>
        `<topic id="${t.id}" type="${t.type}" score="${t.match.score.toFixed(2)}">
  <title>${t.title}</title>
  <description>${t.description}</description>
  <fields>${t.fieldIds.join(", ")}</fields>
  <degrees>${t.degrees.join(", ")}</degrees>
  ${t.companyId ? `<companyId>${t.companyId}</companyId>` : ""}
</topic>`,
    )
    .join("\n");
}

function serializeCompanies(companies: Company[]): string {
  return companies
    .map(
      (c) =>
        `<company id="${c.id}">
  <name>${c.name}</name>
  <description>${c.description}</description>
  <domains>${c.domains.join(", ")}</domains>
</company>`,
    )
    .join("\n");
}

function serializeFields(fields: Field[]): string {
  return fields.map((f) => `<field id="${f.id}">${f.name}</field>`).join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { messages, student, fieldIds, query } = await req.json();

    const [allTopics, allCompanies, allFields] = await Promise.all([
      getTopics(),
      getCompanies(),
      getFields(),
    ]);

    // Filter by field if specified
    let filteredTopics: Topic[] = allTopics;
    if (fieldIds && fieldIds.length > 0) {
      filteredTopics = allTopics.filter((t) =>
        t.fieldIds.some((fid: string) => fieldIds.includes(fid)),
      );
    }

    // Filter by keyword if present
    if (query) {
      const q = query.toLowerCase();
      filteredTopics = filteredTopics.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      );
    }

    // If filters produced no results, fall back to all topics
    if (filteredTopics.length === 0) {
      filteredTopics = allTopics;
    }

    // Sort by match to student fields and cap
    const rankedTopics = sortByMatch(
      filteredTopics,
      student?.fieldIds ?? [],
      (t: Topic) => t.fieldIds,
    ).slice(0, 30);

    // Keep companies referenced by remaining topics
    const topicCompanyIds = new Set(
      rankedTopics.map((t) => t.companyId).filter(Boolean),
    );
    const relevantCompanies = allCompanies
      .filter((c) => topicCompanyIds.has(c.id))
      .slice(0, 10);

    // Relevant fields
    const relevantFieldIds = new Set(rankedTopics.flatMap((t) => t.fieldIds));
    const relevantFields = allFields.filter((f) => relevantFieldIds.has(f.id));

    const systemPrompt = `${SYSTEM_PROMPT_PREFIX}

<student>
  <name>${student?.firstName ?? "Student"} ${student?.lastName ?? ""}</name>
  <degree>${student?.degree ?? "unknown"}</degree>
  <skills>${student?.skills?.join(", ") ?? "none listed"}</skills>
  <objectives>${student?.objectives?.join(", ") ?? "none listed"}</objectives>
  <about>${student?.about ?? "No info"}</about>
</student>

<available-fields>
${serializeFields(relevantFields)}
</available-fields>

<available-topics>
${serializeTopics(rankedTopics)}
</available-topics>

<available-companies>
${serializeCompanies(relevantCompanies)}
</available-companies>`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("Orientation chat failed:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 },
    );
  }
}
