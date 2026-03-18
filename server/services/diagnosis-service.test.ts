import { describe, expect, it } from "vitest";

import type { DiagnosisInput } from "../../src/lib/contracts/diagnosis";
import { diagnosisInputFixture } from "../../src/lib/fixtures/diagnosis-result";
import { buildDiagnosisResult } from "./diagnosis-service";

describe("buildDiagnosisResult", () => {
  it("returns a valid diagnosis from the shared fixture input", async () => {
    const result = await buildDiagnosisResult(diagnosisInputFixture, []);

    expect(result.stage).toBe("orientation");
    expect(result.readinessScore).toBeGreaterThan(0);
    expect(result.readinessScore).toBeLessThanOrEqual(100);
    expect(result.clarityLevel).toMatch(/^(low|medium|high)$/);
    expect(result.diagnosisSummary.length).toBeGreaterThan(20);
    expect(result.confidenceNote.length).toBeGreaterThan(10);
  });

  it("includes strengths and gaps based on input", async () => {
    const result = await buildDiagnosisResult(diagnosisInputFixture, []);

    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.gaps.length).toBeGreaterThan(0);
  });

  it("returns direction recommendations", async () => {
    const result = await buildDiagnosisResult(diagnosisInputFixture, []);

    expect(result.directions.length).toBeGreaterThan(0);
    for (const direction of result.directions) {
      expect(direction.kind).toBe("direction");
      expect(direction.title.length).toBeGreaterThan(0);
      expect(direction.rationale.length).toBeGreaterThan(0);
    }
  });

  it("returns next actions including stage-specific ones", async () => {
    const result = await buildDiagnosisResult(diagnosisInputFixture, []);

    expect(result.nextActions.length).toBeGreaterThan(0);
  });

  it("builds a full roadmap with all thesis stages", async () => {
    const result = await buildDiagnosisResult(diagnosisInputFixture, []);

    expect(result.roadmap.length).toBe(5);
    expect(result.roadmap[0].status).toBe("current"); // orientation is current
    expect(result.roadmap[1].status).toBe("next");
  });

  it("incorporates conversation context into the chat summary", async () => {
    const result = await buildDiagnosisResult(diagnosisInputFixture, [
      { role: "user", content: "I want to work with a company in logistics" },
      { role: "assistant", content: "Great, let me help you explore that." },
    ]);

    expect(result.chatSummary).toContain("logistics");
  });

  it("lowers readiness for students with many blockers and skill gaps", async () => {
    const struggling: DiagnosisInput = {
      ...diagnosisInputFixture,
      confidence: 1,
      skillGaps: ["statistics", "academic writing", "research design", "data analysis"],
      blockers: ["no idea what to write about", "no supervisor contact", "no time"],
      topicStatus: "none",
    };

    const result = await buildDiagnosisResult(struggling, []);
    expect(result.readinessScore).toBeLessThan(30);
    expect(result.clarityLevel).toBe("low");
  });

  it("raises readiness for students who are further along", async () => {
    const confident: DiagnosisInput = {
      ...diagnosisInputFixture,
      confidence: 5,
      skillGaps: [],
      blockers: [],
      topicStatus: "chosen",
      hasSupervisorInMind: true,
      expectationsClear: true,
      currentStage: "planning",
    };

    const result = await buildDiagnosisResult(confident, []);
    expect(result.readinessScore).toBeGreaterThan(70);
    expect(result.clarityLevel).toBe("high");
  });

  it("adapts roadmap status based on the student's current stage", async () => {
    const midStage: DiagnosisInput = {
      ...diagnosisInputFixture,
      currentStage: "planning",
    };

    const result = await buildDiagnosisResult(midStage, []);
    const statuses = result.roadmap.map((n) => n.status);

    expect(statuses[0]).toBe("done"); // orientation
    expect(statuses[1]).toBe("done"); // topic search
    expect(statuses[2]).toBe("current"); // planning
    expect(statuses[3]).toBe("next"); // execution
    expect(statuses[4]).toBe("blocked"); // writing
  });
});
