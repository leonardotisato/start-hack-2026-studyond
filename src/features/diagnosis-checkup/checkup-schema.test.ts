import { describe, expect, it } from "vitest";

import { diagnosisCheckupSchema } from "@/features/diagnosis-checkup/checkup-schema";
import { diagnosisInputFixture } from "@/lib/fixtures/diagnosis-result";

describe("diagnosisCheckupSchema", () => {
  it("accepts the shared diagnosis fixture", () => {
    const result = diagnosisCheckupSchema.safeParse(diagnosisInputFixture);

    expect(result.success).toBe(true);
  });
});
