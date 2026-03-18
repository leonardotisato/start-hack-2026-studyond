export const checkupQuestions = [
  {
    id: "process_confusion",
    title: "Process clarity",
    description:
      "Understand how much the student knows about the thesis process, timing, and expectations.",
    prompt: "What part of the thesis process feels most unclear right now?",
  },
  {
    id: "direction_confusion",
    title: "Thesis direction",
    description:
      "Capture field interests and whether the student has narrowed down any topic directions yet.",
    prompt: "Which topics or fields are you currently drawn to?",
  },
  {
    id: "people_confusion",
    title: "People and approvals",
    description:
      "Check whether the student has identified a supervisor, company partner, or first outreach target.",
    prompt: "Do you already know who you would like to contact first?",
  },
  {
    id: "readiness",
    title: "Skills and confidence",
    description:
      "Surface missing skills, low confidence, and the practical support the student still needs.",
    prompt: "Which skills make you feel least ready to start your thesis?",
  },
] as const;
