import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a networking coach for university students approaching industry professionals.
Given the student and expert profiles, generate personalized conversation starters.

Your response MUST use this exact markdown structure:

## Icebreakers
3-4 casual, friendly openers that reference shared fields or interests. Each should feel natural, not scripted.

## Conversation Topics
4-5 substantive topics that bridge the student's research interests with the expert's domain. Be specific — reference their actual fields and expertise.

## Questions to Ask
3-4 thoughtful questions the student can ask that show genuine interest in the expert's work. Avoid generic questions.

## Common Ground
A brief paragraph (2-3 sentences) highlighting what connects these two people and why a conversation would be mutually valuable.`;

export async function POST(req: NextRequest) {
  try {
    const { student, expert } = await req.json();

    const userMessage = `Student Profile:
- Name: ${student.name}
- Degree: ${student.degree}
- Fields: ${student.fields.join(", ")}
- Skills: ${student.skills.join(", ")}
- About: ${student.about ?? "Not provided"}

Expert Profile:
- Name: ${expert.name}
- Title: ${expert.title}
- Company: ${expert.company ?? "Independent"}
- Fields: ${expert.fields.join(", ")}
- Objectives: ${expert.objectives.join(", ")}
- About: ${expert.about ?? "Not provided"}

Generate personalized conversation starters for the student to use when reaching out to this expert.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return NextResponse.json({ suggestions: text });
  } catch (error) {
    console.error("Icebreaker generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate conversation starters" },
      { status: 500 }
    );
  }
}
