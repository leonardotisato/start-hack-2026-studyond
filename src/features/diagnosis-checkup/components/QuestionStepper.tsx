import { checkupQuestions } from "@/features/diagnosis-checkup/checkup-questions";

type StepStatus = "done" | "current" | "upcoming";

type QuestionStepperProps = {
  completedStepCount: number;
};

export function QuestionStepper({ completedStepCount }: QuestionStepperProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="ds-label">Starter package progress</h3>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
          {completedStepCount}/{checkupQuestions.length} areas clarified
        </span>
      </div>
      <ol className="space-y-3 text-sm text-muted-foreground">
        {checkupQuestions.map((question, index) => {
          const status: StepStatus =
            index < completedStepCount
              ? "done"
              : index === completedStepCount
                ? "current"
                : "upcoming";

          return (
            <li
              key={question.id}
              className="rounded-lg bg-secondary p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-medium text-foreground">{question.title}</p>
                <span className="rounded-full border border-border px-3 py-1 text-xs capitalize">
                  {status}
                </span>
              </div>
              <p className="mb-2 text-sm">{question.description}</p>
              <p className="text-xs">{question.prompt}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
