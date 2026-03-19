import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useEffect } from "react";

import { CheckupIntro } from "@/features/diagnosis-checkup/components/CheckupIntro";
import { CheckupSummary } from "@/features/diagnosis-checkup/components/CheckupSummary";
import { ConfidenceScale } from "@/features/diagnosis-checkup/components/ConfidenceScale";
import { QuestionStepper } from "@/features/diagnosis-checkup/components/QuestionStepper";
import { diagnosisCheckupSchema } from "@/features/diagnosis-checkup/checkup-schema";
import { useDiagnosisCheckupStore } from "@/features/diagnosis-checkup/useDiagnosisCheckupStore";
import type { DiagnosisInput } from "@/lib/contracts/diagnosis";

function splitCommaSeparatedList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getCompletedStepCount(values: DiagnosisInput) {
  const completionChecks = [
    Boolean(values.currentStage) && (values.expectationsClear || values.deadlineWeeks !== null),
    values.interests.length > 0 || values.topicStatus !== "none",
    values.hasSupervisorInMind || values.blockers.length > 0,
    values.skillGaps.length > 0 || values.confidence >= 3,
  ];

  return completionChecks.filter(Boolean).length;
}

export function DiagnosisCheckup() {
  const draft = useDiagnosisCheckupStore((state) => state.draft);
  const lastSubmittedAt = useDiagnosisCheckupStore((state) => state.lastSubmittedAt);
  const setDraft = useDiagnosisCheckupStore((state) => state.setDraft);
  const markSubmitted = useDiagnosisCheckupStore((state) => state.markSubmitted);
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm<DiagnosisInput>({
    resolver: zodResolver(diagnosisCheckupSchema),
    defaultValues: {
      ...draft,
      deadlineWeeks: draft.deadlineWeeks ?? undefined,
    },
  });

  const watchedValues = watch();
  const normalizedValues: DiagnosisInput = {
    ...draft,
    ...watchedValues,
    interests: watchedValues.interests ?? draft.interests,
    blockers: watchedValues.blockers ?? draft.blockers,
    skillGaps: watchedValues.skillGaps ?? draft.skillGaps,
    confidence: watchedValues.confidence ?? draft.confidence,
    deadlineWeeks:
      watchedValues.deadlineWeeks === undefined
        ? draft.deadlineWeeks
        : watchedValues.deadlineWeeks,
    notes: watchedValues.notes ?? draft.notes,
  };
  const completedStepCount = getCompletedStepCount(normalizedValues);

  useEffect(() => {
    const subscription = watch((values) => {
      setDraft({
        ...values,
        interests: values.interests ?? [],
        blockers: values.blockers ?? [],
        skillGaps: values.skillGaps ?? [],
        deadlineWeeks: values.deadlineWeeks ?? null,
        notes: values.notes ?? "",
      });
    });

    return () => subscription.unsubscribe();
  }, [setDraft, watch]);

  function onSubmit(values: DiagnosisInput) {
    setDraft(values);
    markSubmitted();
  }

  return (
    <div className="space-y-4">
      <CheckupIntro />
      <QuestionStepper completedStepCount={completedStepCount} />
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <section className="grid gap-4 rounded-lg border border-border bg-card p-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="ds-label" htmlFor="current-stage">
              Current thesis stage
            </label>
            <select
              id="current-stage"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              {...register("currentStage")}
            >
              <option value="orientation">Orientation</option>
              <option value="topic_and_supervisor_search">
                Topic and supervisor search
              </option>
              <option value="planning">Planning</option>
              <option value="execution">Execution</option>
              <option value="writing_and_finalization">Writing and finalization</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="ds-label" htmlFor="topic-status">
              Topic status
            </label>
            <select
              id="topic-status"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              {...register("topicStatus")}
            >
              <option value="none">I have no topic yet</option>
              <option value="browsing">I am browsing</option>
              <option value="shortlisted">I have a shortlist</option>
              <option value="chosen">I picked one</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="ds-label" htmlFor="topic-interests">
              Topic interests
            </label>
            <Controller
              control={control}
              name="interests"
              render={({ field }) => (
                <textarea
                  id="topic-interests"
                  aria-label="Topic interests"
                  className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={(field.value ?? []).join(", ")}
                  onChange={(event) =>
                    field.onChange(splitCommaSeparatedList(event.target.value))
                  }
                  placeholder="Example: circular economy, sustainability, supply chain"
                />
              )}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="ds-label" htmlFor="current-blockers">
              What feels most unclear or blocked?
            </label>
            <Controller
              control={control}
              name="blockers"
              render={({ field }) => (
                <textarea
                  id="current-blockers"
                  className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={(field.value ?? []).join(", ")}
                  onChange={(event) =>
                    field.onChange(splitCommaSeparatedList(event.target.value))
                  }
                  placeholder="Example: I do not know which professor to contact, I do not know how to scope a thesis"
                />
              )}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="ds-label" htmlFor="skill-gaps">
              Skills or areas you feel least ready for
            </label>
            <Controller
              control={control}
              name="skillGaps"
              render={({ field }) => (
                <textarea
                  id="skill-gaps"
                  className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={(field.value ?? []).join(", ")}
                  onChange={(event) =>
                    field.onChange(splitCommaSeparatedList(event.target.value))
                  }
                  placeholder="Example: academic writing, statistics, literature review"
                />
              )}
            />
          </div>
          <div className="space-y-2">
            <label className="ds-label" htmlFor="deadline-weeks">
              Weeks until your thesis deadline
            </label>
            <input
              id="deadline-weeks"
              type="number"
              min={1}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              {...register("deadlineWeeks", {
                setValueAs: (value) => (value === "" ? null : Number(value)),
              })}
            />
          </div>
          <div className="space-y-2">
            <label className="ds-label" htmlFor="notes">
              Notes for the mentor
            </label>
            <textarea
              id="notes"
              className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Anything else that makes the thesis feel confusing or risky?"
              {...register("notes")}
            />
          </div>
          <div className="space-y-3 md:col-span-2">
            <ConfidenceScale
              value={normalizedValues.confidence}
              onChange={(value) => setValue("confidence", value, { shouldValidate: true })}
            />
          </div>
          <div className="flex flex-wrap gap-6 md:col-span-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" {...register("expectationsClear")} />
              I understand what my university expects from the thesis
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" {...register("hasSupervisorInMind")} />
              I already have a supervisor or first contact in mind
            </label>
          </div>
          {errors.confidence ? (
            <p className="text-sm text-destructive md:col-span-2">
              {errors.confidence.message}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground"
            >
              Save diagnosis starter pack
            </button>
            {(isSubmitted || lastSubmittedAt) ? (
              <span className="text-sm text-muted-foreground">
                Your answers are saved locally and ready for the mentor chat.
              </span>
            ) : null}
          </div>
        </section>
      </form>
      <CheckupSummary draft={draft} lastSubmittedAt={lastSubmittedAt} />
    </div>
  );
}
