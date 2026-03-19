import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { appRoutes } from "@/app/router";

function renderRoute(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe("appRoutes", () => {
  it("exposes the three expected route paths", () => {
    expect(appRoutes.map((route) => route.path)).toEqual([
      "/",
      "/diagnosis",
      "/results",
    ]);
  });

  it("renders the landing page at /", () => {
    renderRoute("/");
    expect(screen.getByText(/thesis gps/i)).toBeInTheDocument();
  });

  it("renders the diagnosis page at /diagnosis", () => {
    renderRoute("/diagnosis");
    expect(screen.getByText(/diagnosis/i)).toBeInTheDocument();
  });

  it("renders the results page at /results", () => {
    renderRoute("/results");
    expect(screen.getByText(/results/i)).toBeInTheDocument();
  });

  it("renders the app header with navigation links on every route", () => {
    renderRoute("/");
    expect(screen.getByText("Studyond")).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Diagnosis")).toBeInTheDocument();
    expect(screen.getByText("Results")).toBeInTheDocument();
  });
});
