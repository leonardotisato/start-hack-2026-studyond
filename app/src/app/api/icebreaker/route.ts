import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a networking coach for university students.
Generate brief, natural conversation starters. Be specific, not generic. Keep each item to 1-2 sentences max.

Use this exact markdown structure:

## Icebreakers
2 casual openers referencing their shared fields.

## Questions to Ask
3 sharp, specific questions showing genuine interest in the expert's work.

## Common Ground
One sentence on what connects them.`;

export async function POST(req: NextRequest) {
  const { student, expert } = await req.json();

  const userMessage = `Student: ${student.name}, ${student.degree}, fields: ${student.fields.join(", ")}, skills: ${student.skills.slice(0, 5).join(", ")}.
Expert: ${expert.name}, ${expert.title} at ${expert.company ?? "Independent"}, fields: ${expert.fields.join(", ")}.`;

  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
