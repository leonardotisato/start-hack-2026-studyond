import { AppShell } from "@/components/layout/AppShell";
import { DiagnosisCheckup } from "@/features/diagnosis-checkup/DiagnosisCheckup";
import { ThesisMentorChat } from "@/features/mentor-chat/ThesisMentorChat";

export function DiagnosisPage() {
  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <DiagnosisCheckup />
        <div id="mentor-chat">
          <ThesisMentorChat />
        </div>
      </div>
    </AppShell>
  );
}
