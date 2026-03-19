import type {
  ConversationTurn,
  DiagnosisInput,
  DiagnosisResult,
} from "@/lib/contracts/diagnosis";

type DiagnoseRequest = {
  input: DiagnosisInput;
  conversation: ConversationTurn[];
};

export async function requestDiagnosis(
  payload: DiagnoseRequest,
): Promise<DiagnosisResult> {
  const response = await fetch("/api/diagnose", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Diagnosis request failed.");
  }

  return (await response.json()) as DiagnosisResult;
}
