import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { DiagnosisCheckup } from "@/features/diagnosis-checkup/DiagnosisCheckup";
import { useDiagnosisCheckupStore } from "@/features/diagnosis-checkup/useDiagnosisCheckupStore";

describe("DiagnosisCheckup", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useDiagnosisCheckupStore.getState().reset();
  });

  it("saves a happy-path diagnosis and reveals the next handoff actions", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <DiagnosisCheckup />
      </MemoryRouter>,
    );

    await user.clear(screen.getByLabelText(/topic interests/i));
    await user.type(
      screen.getByLabelText(/topic interests/i),
      "Circular economy, supply chain",
    );
    await user.clear(screen.getByLabelText(/confidence level/i));
    await user.type(screen.getByLabelText(/confidence level/i), "4");
    await user.click(screen.getByRole("button", { name: /save diagnosis starter pack/i }));

    expect(screen.getByText(/continue to mentor chat/i)).toBeInTheDocument();
    expect(
      useDiagnosisCheckupStore.getState().draft.interests,
    ).toEqual(["Circular economy", "supply chain"]);
  });
});
