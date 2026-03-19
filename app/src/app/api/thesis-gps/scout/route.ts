import { NextRequest, NextResponse } from "next/server";
import { findRecommendations } from "@/lib/gps-recommend";
import type { RecommendationRequest } from "@/types/gps";

interface ScoutRequest {
  projectId: string;
  nodeId: string;
  query: string;
}

const STOP_WORDS = new Set([
  "need", "find", "help", "want", "looking", "search", "someone", "that",
  "with", "from", "about", "this", "have", "been", "would", "could",
  "should", "they", "their", "them", "what", "where", "which", "when",
  "some", "also", "like", "know", "good", "best", "does", "make", "give",
  "tell", "show", "more", "very", "much", "just", "only", "well", "into",
  "look", "there", "here", "than", "then", "each", "every",
]);

/**
 * Studyond Scout — searches ALL mock data for entities that can help
 * the student with a specific need tied to a graph node.
 */
export async function POST(req: NextRequest) {
  try {
    const body: ScoutRequest = await req.json();
    const { projectId, nodeId, query } = body;

    const request = parseQueryToRequest(query);
    const recommendations = await findRecommendations(request, projectId, 5);

    return NextResponse.json({
      nodeId,
      query,
      recommendations,
    });
  } catch (err) {
    console.error("Scout error:", err);
    return NextResponse.json(
      { error: "Scout search failed" },
      { status: 500 }
    );
  }
}

function parseQueryToRequest(query: string): RecommendationRequest {
  const lower = query.toLowerCase();

  // Extract keywords (words longer than 2 chars, excluding stop words)
  const keywords = query
    .split(/\s+/)
    .map((w) => w.replace(/[^\w]/g, "").toLowerCase())
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  // Determine type — default to "all" to search everywhere
  let type: RecommendationRequest["type"] = "all";

  if (lower.includes("supervisor") || lower.includes("professor") || lower.includes("academic advisor")) {
    type = "supervisor";
  } else if (lower.includes("company") || lower.includes("corporate") || lower.includes("sponsor") || lower.includes("partner")) {
    type = "company";
  } else if (lower.includes("topic") || lower.includes("thesis idea") || lower.includes("project idea")) {
    type = "topic";
  } else if (lower.includes("university") || lower.includes("institution") || lower.includes("school")) {
    type = "university";
  } else if (lower.includes("program") || lower.includes("master") || lower.includes("bachelor") || lower.includes("degree")) {
    type = "program";
  } else if (lower.includes("expert") || lower.includes("industry") || lower.includes("professional")) {
    type = "expert";
  }
  // If no specific type detected, "all" searches everything

  return {
    type,
    reason: query,
    keywords: keywords.length > 0 ? keywords : ["research"],
  };
}
