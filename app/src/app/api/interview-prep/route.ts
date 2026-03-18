import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert career coach and interview preparation specialist for university students.
Generate a structured interview preparation guide for the given role and company.

Your response MUST use this exact markdown structure:

## Company Overview
2-3 paragraphs about the company, their industry position, culture, and what they look for in candidates.

## Key Topics to Study
A bulleted list of 6-8 specific technical and domain topics the student should review before the interview.

## Skill Gap Analysis
Compare the student's current skills against what this role requires. Identify strengths to leverage and gaps to address.

## Behavioral Questions
5-6 behavioral interview questions tailored to this role, each with a brief tip on how to answer well.

## Technical Questions
5-6 technical questions specific to the role's domain, with hints on what the interviewer is looking for.

## Preparation Strategy
A prioritized 1-week preparation plan with daily focus areas.`;

export async function POST(req: NextRequest) {
  try {
    const { topic, company, studentSkills, studentFields, topicFields } =
      await req.json();

    const userMessage = `Role: ${topic.title}
Description: ${topic.description}
Employment Type: ${topic.employmentType ?? "Not specified"}
Workplace: ${topic.workplaceType ?? "Not specified"}
Required Degrees: ${topic.degrees?.join(", ") ?? "Not specified"}
Fields: ${topicFields.join(", ")}

Company: ${company?.name ?? "Not specified"}
Company Description: ${company?.description ?? "Not available"}
Company About: ${company?.about ?? "Not available"}
Industry Domains: ${company?.domains?.join(", ") ?? "Not specified"}

Student's Current Skills: ${studentSkills.join(", ")}
Student's Fields: ${studentFields.join(", ")}

Generate a comprehensive interview preparation guide for this student applying to this role.`;

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
    console.error("Interview prep generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate preparation guide" },
      { status: 500 }
    );
  }
}
