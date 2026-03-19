import { createBrowserRouter } from "react-router-dom";

import { DiagnosisPage } from "@/routes/DiagnosisPage";
import { LandingPage } from "@/routes/LandingPage";
import { ResultsPage } from "@/routes/ResultsPage";

export const appRoutes = [
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/diagnosis",
    element: <DiagnosisPage />,
  },
  {
    path: "/results",
    element: <ResultsPage />,
  },
];

export const appRouter = createBrowserRouter(appRoutes);
