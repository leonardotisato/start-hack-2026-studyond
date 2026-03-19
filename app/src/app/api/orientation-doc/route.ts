import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert academic and career orientation advisor for university students.
Generate a structured orientation guide for the given topic, helping the student understand whether this is the right direction for them.

Your response MUST use this exact markdown structure:

## Summary
A 2-3 sentence high-level summary of this topic and how well it fits the student. This should give the student a quick sense of whether to read further.

## Topic Overview
2-3 paragraphs explaining the topic, its relevance in the field, and what working on it involves day-to-day.

## Required Skills
A bulleted list of 6-8 specific technical and soft skills needed, noting which the student already has.

## Profile Fit Analysis
Compare the student's background, skills, and objectives against what this topic requires. Be honest about strengths and gaps.

## Thesis vs Industry Path
Compare pursuing this as a thesis topic versus as a job/industry role. Highlight differences in scope, expectations, timeline, and outcomes for each path.

## Related Topics
Briefly mention the provided related topics and how they connect, so the student can explore adjacent options.

## Next Steps
3-5 concrete action items the student should take if they want to pursue this direction (e.g., courses, readings, people to contact, skills to build).`;

export async function POST(req: NextRequest) {
  try {
    const {
      topic,
      company,
      student,
      studentFields,
      topicFields,
      relatedTopics,
    } = await req.json();

    const userMessage = `Topic: ${topic.title}
Type: ${topic.type === "job" ? "Job/Industry Role" : "Thesis Topic"}
Description: ${topic.description}
Employment: ${topic.employment ?? "Not specified"}
Employment Type: ${topic.employmentType ?? "Not specified"}
Workplace: ${topic.workplaceType ?? "Not specified"}
Required Degrees: ${topic.degrees?.join(", ") ?? "Not specified"}
Fields: ${topicFields.join(", ")}

${
  company
    ? `Company: ${company.name}
Company Description: ${company.description ?? "Not available"}
Company About: ${company.about ?? "Not available"}
Industry Domains: ${company.domains?.join(", ") ?? "Not specified"}`
    : "This is a university-based topic (no company)."
}

Student's Current Skills: ${student.skills?.join(", ") ?? "Not listed"}
Student's Degree: ${student.degree ?? "Not specified"}
Student's Fields: ${studentFields.join(", ")}
Student's Objectives: ${student.objectives?.join(", ") ?? "Not specified"}
Student's About: ${student.about ?? "Not provided"}

Related Topics:
${relatedTopics?.map((t: { title: string; type: string }) => `- ${t.title} (${t.type})`).join("\n") ?? "None"}

Generate a comprehensive orientation guide to help this student decide if this topic is right for them.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return NextResponse.json({ guide: text });
  } catch (error) {
    console.error("Orientation doc generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate orientation guide" },
      { status: 500 },
    );
  }
}
