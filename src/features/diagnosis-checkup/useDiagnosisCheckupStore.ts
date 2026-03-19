import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { DiagnosisInput } from "@/lib/contracts/diagnosis";
import { diagnosisInputFixture } from "@/lib/fixtures/diagnosis-result";

type DiagnosisCheckupState = {
  draft: DiagnosisInput;
  lastSubmittedAt: string | null;
  setDraft: (updater: Partial<DiagnosisInput>) => void;
  markSubmitted: () => void;
  reset: () => void;
};

export const useDiagnosisCheckupStore = create<DiagnosisCheckupState>()(
  persist(
    (set) => ({
      draft: diagnosisInputFixture,
      lastSubmittedAt: null,
      setDraft: (updater) =>
        set((state) => ({
          draft: {
            ...state.draft,
            ...updater,
          },
        })),
      markSubmitted: () =>
        set({
          lastSubmittedAt: new Date().toISOString(),
        }),
      reset: () =>
        set({
          draft: diagnosisInputFixture,
          lastSubmittedAt: null,
        }),
    }),
    {
      name: "studyond-thesis-gps-diagnosis",
    },
  ),
);
