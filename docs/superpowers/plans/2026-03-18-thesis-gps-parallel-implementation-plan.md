# Thesis GPS Parallel Implementation Plan

> **For contributors:** This plan is designed for either human teammates or coding agents working in parallel. If your tool supports separate agents or parallel sessions, assign one worker per task. Otherwise, treat each task as one teammate-owned workstream. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Thesis GPS prototype for lost students at the start of their thesis journey that diagnoses where they are, what they are missing, which thesis directions fit them, and what they should do next.

**Architecture:** Use a React/Vite frontend for the student experience and a thin TypeScript API for diagnosis synthesis and mock-data matching. Shared Zod contracts and fixtures decouple the four workstreams so each can ship independently and merge late.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Zustand, React Hook Form, Zod, Framer Motion, mock-data JSON, thin Node/TypeScript API, optional Vercel AI SDK for chat.

---

## Collaboration Note

- No special local skills are required to execute this plan.
- Claude Code, Codex, Cursor, Windsurf, or a human developer can follow the same task boundaries.
- If your environment supports subagents, parallel branches, or multiple sessions, use that capability to run the four tasks concurrently.
- If not, assign one task to each teammate and merge in the order described below.

## Shared Kickoff Before Parallel Work

This is not one of the four parallel tasks. Do this once in the first 30-45 minutes so the four workers do not block each other later.

- [ ] Agree on the app root: `src/` for frontend, `server/` for API, `docs/` for planning only.
- [ ] Agree on the route map:
  - `/` landing and concept entry
  - `/diagnosis` checkup + chat
  - `/results` Thesis GPS output
- [ ] Agree on the shared contracts in `src/lib/contracts/diagnosis.ts`:
  - `DiagnosisInput`
  - `ConversationTurn`
  - `DiagnosisResult`
  - `RoadmapNode`
  - `RecommendationCard`
- [ ] Create one fixture file `src/lib/fixtures/diagnosis-result.ts` with realistic sample output so Tasks 2, 3, and 4 can develop in parallel.
- [ ] Freeze ownership boundaries before coding. If a worker needs data from another task, they must use the shared fixture instead of waiting.

## File Structure Lock-In

These paths are the intended ownership boundaries for the prototype:

- `src/app/*` owns app bootstrap, router, and route-level composition.
- `src/components/*` owns reusable visual building blocks only.
- `src/features/diagnosis-checkup/*` owns the structured assessment flow.
- `src/features/mentor-chat/*` owns the conversational thesis-intake experience.
- `src/features/results/*` owns the Thesis GPS output experience.
- `src/lib/contracts/*` owns shared TypeScript and Zod contracts.
- `src/lib/mock-data/*` owns JSON loading and mapping helpers.
- `server/routes/*` owns API endpoints.
- `server/services/*` owns diagnosis and recommendation logic.
- `server/repositories/*` owns access to `mock-data/*.json`.

## Parallel Task 1: App Shell, Routing, and Shared Contracts

**Owner:** Worker 1

**Files:**
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/router.tsx`
- Create: `src/app/providers.tsx`
- Create: `src/routes/LandingPage.tsx`
- Create: `src/routes/DiagnosisPage.tsx`
- Create: `src/routes/ResultsPage.tsx`
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/AppHeader.tsx`
- Create: `src/lib/contracts/diagnosis.ts`
- Create: `src/lib/fixtures/diagnosis-result.ts`
- Create: `src/lib/mock-data/index.ts`
- Create: `src/app/App.test.tsx`

- [ ] Scaffold the Vite app root and route composition with placeholder pages only.
- [ ] Add the shared `diagnosis.ts` contract file and export stable types and Zod schemas for all other tasks to use.
- [ ] Add one realistic `diagnosis-result.ts` fixture based on the Thesis GPS idea in `ideas.md` and the thesis stages from `context/Thesis Journey.md`.
- [ ] Build the app shell and top-level layout using the Studyond brand guidance from `brand/setup.md` and `brand/components.md`.
- [ ] Keep route pages thin: each route page should render a feature entry component and nothing more.
- [ ] Add a smoke test that mounts the app router and confirms the three routes render without crashing.
- [ ] Run: `npm run test -- src/app/App.test.tsx`
- [ ] Run: `npm run build`
- [ ] Commit with: `git commit -m "feat: scaffold thesis gps app shell"`

**Acceptance Criteria:**
- Other workers can import contracts and fixtures without editing Task 1 files.
- The app has stable routes for landing, diagnosis, and results.
- No business logic lives in route files.

## Parallel Task 2: Structured Diagnosis Checkup

**Owner:** Worker 2

**Files:**
- Create: `src/features/diagnosis-checkup/DiagnosisCheckup.tsx`
- Create: `src/features/diagnosis-checkup/checkup-schema.ts`
- Create: `src/features/diagnosis-checkup/checkup-questions.ts`
- Create: `src/features/diagnosis-checkup/useDiagnosisCheckupStore.ts`
- Create: `src/features/diagnosis-checkup/components/CheckupIntro.tsx`
- Create: `src/features/diagnosis-checkup/components/QuestionStepper.tsx`
- Create: `src/features/diagnosis-checkup/components/ConfidenceScale.tsx`
- Create: `src/features/diagnosis-checkup/components/CheckupSummary.tsx`
- Create: `src/features/diagnosis-checkup/checkup-schema.test.ts`
- Modify: `src/routes/DiagnosisPage.tsx`

- [ ] Build a guided checkup that captures process confusion, topic confusion, people confusion, expectation confusion, confidence, and perceived skill gaps.
- [ ] Use React Hook Form plus Zod so the payload matches the shared `DiagnosisInput` contract exactly.
- [ ] Save progress locally in a small Zustand store so the student can move between steps without losing answers.
- [ ] End the flow with a structured summary card and a single handoff action into the mentor chat.
- [ ] Wire the page to use the shared fixture while the backend is unfinished.
- [ ] Add tests for schema validity and one happy-path submit.
- [ ] Run: `npm run test -- src/features/diagnosis-checkup/checkup-schema.test.ts`
- [ ] Commit with: `git commit -m "feat: add thesis diagnosis checkup flow"`

**Acceptance Criteria:**
- The checkup can run without the chat or backend being finished.
- The submitted payload is typed and valid against `DiagnosisInput`.
- The flow feels specifically about thesis start confusion, not generic onboarding.

## Parallel Task 3: Conversational Intake and Diagnosis API

**Owner:** Worker 3

**Files:**
- Create: `src/features/mentor-chat/ThesisMentorChat.tsx`
- Create: `src/features/mentor-chat/useMentorChat.ts`
- Create: `src/features/mentor-chat/components/ChatPanel.tsx`
- Create: `src/features/mentor-chat/components/PromptSuggestions.tsx`
- Create: `src/lib/api/diagnosis-client.ts`
- Create: `server/index.ts`
- Create: `server/routes/chat.ts`
- Create: `server/routes/diagnose.ts`
- Create: `server/services/diagnosis-service.ts`
- Create: `server/services/recommendation-service.ts`
- Create: `server/services/ai-service.ts`
- Create: `server/repositories/mock-data-repository.ts`
- Create: `server/services/diagnosis-service.test.ts`

- [ ] Build a lightweight mentor-chat experience that helps the student express uncertainty in natural language after the structured checkup.
- [ ] Implement a thin API route that accepts `DiagnosisInput` plus `ConversationTurn[]` and returns a `DiagnosisResult`.
- [ ] Use `mock-data/topics.json`, `mock-data/universities.json`, and other relevant datasets through one repository layer only.
- [ ] Keep AI optional: if no model key is present, return a deterministic fallback diagnosis so the demo still works offline.
- [ ] Add diagnosis logic that synthesizes readiness, likely thesis directions, first next actions, and route suggestions.
- [ ] Add unit tests for the deterministic diagnosis service and the mapping from mock data into recommendations.
- [ ] Run: `npm run test -- server/services/diagnosis-service.test.ts`
- [ ] Commit with: `git commit -m "feat: add thesis diagnosis api and mentor chat"`

**Acceptance Criteria:**
- The backend can return a believable result even without live AI.
- The chat UI can run independently from the results page by using local fixtures.
- All mock-data access goes through `mock-data-repository.ts`.

## Parallel Task 4: Results Experience and Thesis GPS Visualization

**Owner:** Worker 4

**Files:**
- Create: `src/features/results/ThesisGpsResults.tsx`
- Create: `src/features/results/components/StageMap.tsx`
- Create: `src/features/results/components/GapAnalysisCard.tsx`
- Create: `src/features/results/components/ThesisDirectionCards.tsx`
- Create: `src/features/results/components/NextActionsList.tsx`
- Create: `src/features/results/components/ConfidencePanel.tsx`
- Create: `src/features/results/results-view-model.ts`
- Create: `src/features/results/results-view-model.test.ts`
- Modify: `src/routes/ResultsPage.tsx`

- [ ] Build the full Thesis GPS output view against the shared `diagnosis-result.ts` fixture first.
- [ ] Show four things clearly: where the student is, what they are missing, which thesis directions fit them, and what to do next.
- [ ] Make the stage map feel like a directed thesis journey, not a generic progress bar.
- [ ] Add clear "why" explanations so students understand why a direction or action was suggested.
- [ ] Keep all display logic inside a results view-model so the page can switch from fixture data to API data with minimal changes.
- [ ] Add tests for the view-model transformation and empty-state handling.
- [ ] Run: `npm run test -- src/features/results/results-view-model.test.ts`
- [ ] Commit with: `git commit -m "feat: add thesis gps results experience"`

**Acceptance Criteria:**
- The results page is demoable before the backend is integrated.
- It communicates diagnosis, direction, and next steps in under 30 seconds.
- It looks and feels like a Studyond product surface, not a debugging view.

## Integration Rules

- Task 1 owns routing, contracts, and shared fixtures. Other workers should not change those files without agreement.
- Task 2 owns the structured checkup only. It must emit `DiagnosisInput` and stop there.
- Task 3 owns conversation capture, diagnosis synthesis, and API responses only.
- Task 4 owns rendering `DiagnosisResult` only. It must not reach directly into mock JSON or backend internals.
- Every worker should code against the contract and fixture first, then integrate late.

## Final Merge Sequence

- [ ] Merge Task 1 first because it defines the shared contract and route skeleton.
- [ ] Merge Task 2 and Task 4 in either order because both work against fixtures.
- [ ] Merge Task 3 last and replace fixture-backed wiring with real API calls.
- [ ] Run full verification: `npm run test`
- [ ] Run full build verification: `npm run build`
- [ ] Sanity-check the three demo paths:
  - student completes the checkup
  - student adds mentor-chat context
  - student lands on a useful Thesis GPS result page

## Why This Split Works

- Task 1 sets the boundaries once so the others do not collide repeatedly.
- Task 2 and Task 4 are purely frontend and can move fast with fixtures.
- Task 3 owns the only backend and AI touchpoints, which keeps risk localized.
- Every task maps to one product surface with a clean interface, so four people can work in parallel without constant coordination.
