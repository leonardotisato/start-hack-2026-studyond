import { z } from "zod";

export const thesisStageSchema = z.enum([
  "orientation",
  "topic_and_supervisor_search",
  "planning",
  "execution",
  "writing_and_finalization",
]);

export const clarityLevelSchema = z.enum(["low", "medium", "high"]);

export const recommendationKindSchema = z.enum([
  "direction",
  "action",
  "resource",
  "person",
]);

export const conversationTurnSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1),
});

export const diagnosisInputSchema = z.object({
  studentId: z.string().optional(),
  universityId: z.string().optional(),
  studyProgramId: z.string().optional(),
  degree: z.enum(["bsc", "msc", "phd"]).optional(),
  currentStage: thesisStageSchema.default("orientation"),
  topicStatus: z.enum(["none", "browsing", "shortlisted", "chosen"]).default("none"),
  interests: z.array(z.string()).default([]),
  blockers: z.array(z.string()).default([]),
  skillGaps: z.array(z.string()).default([]),
  confidence: z.number().min(1).max(5),
  deadlineWeeks: z.number().int().positive().nullable().default(null),
  expectationsClear: z.boolean().default(false),
  hasSupervisorInMind: z.boolean().default(false),
  notes: z.string().default(""),
});

export const roadmapNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  stage: thesisStageSchema,
  status: z.enum(["done", "current", "next", "blocked"]),
  description: z.string(),
  whyItMatters: z.string(),
  blockedBy: z.array(z.string()).default([]),
  suggestedWeek: z.number().int().positive().nullable().default(null),
});

export const recommendationCardSchema = z.object({
  id: z.string(),
  kind: recommendationKindSchema,
  title: z.string(),
  rationale: z.string(),
  ctaLabel: z.string(),
  ctaHref: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
});

export const diagnosisResultSchema = z.object({
  stage: thesisStageSchema,
  clarityLevel: clarityLevelSchema,
  readinessScore: z.number().min(0).max(100),
  diagnosisSummary: z.string(),
  chatSummary: z.string(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  roadmap: z.array(roadmapNodeSchema),
  directions: z.array(recommendationCardSchema),
  nextActions: z.array(recommendationCardSchema),
  confidenceNote: z.string(),
});

export type ThesisStage = z.infer<typeof thesisStageSchema>;
export type ClarityLevel = z.infer<typeof clarityLevelSchema>;
export type RecommendationKind = z.infer<typeof recommendationKindSchema>;
export type ConversationTurn = z.infer<typeof conversationTurnSchema>;
export type DiagnosisInput = z.infer<typeof diagnosisInputSchema>;
export type RoadmapNode = z.infer<typeof roadmapNodeSchema>;
export type RecommendationCard = z.infer<typeof recommendationCardSchema>;
export type DiagnosisResult = z.infer<typeof diagnosisResultSchema>;
