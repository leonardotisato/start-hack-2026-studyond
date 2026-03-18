import { describe, expect, it } from "vitest";

import {
  createDiagnosisPreviewResult,
  createResultsViewModel,
} from "@/features/results/results-view-model";
import {
  diagnosisInputFixture,
  diagnosisResultFixture,
} from "@/lib/fixtures/diagnosis-result";

describe("createResultsViewModel", () => {
  it("summarizes the shared diagnosis fixture", () => {
    const viewModel = createResultsViewModel(diagnosisResultFixture);

    expect(viewModel.roadmapCount).toBeGreaterThan(0);
    expect(viewModel.actionCount).toBeGreaterThan(0);
    expect(viewModel.directionCount).toBeGreaterThan(0);
    expect(viewModel.currentFocusTitle).toBe("Clarify thesis direction");
    expect(viewModel.blockedCount).toBe(1);
    expect(viewModel.readinessLabel).toMatch(/needs|gaining|ready/i);
    expect(viewModel.quickStats).toHaveLength(4);
  });

  it("personalizes the fixture result from the saved diagnosis input", () => {
    const personalizedResult = createDiagnosisPreviewResult(
      diagnosisInputFixture,
      diagnosisResultFixture,
    );

    expect(personalizedResult.stage).toBe(diagnosisInputFixture.currentStage);
    expect(personalizedResult.gaps[0]).toBe("academic writing");
    expect(personalizedResult.nextActions).toHaveLength(3);
  });
});
