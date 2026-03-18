# Team Guide — Where to Work

## Project Structure

```
app/src/
├── app/                          # Pages (routes)
│   ├── layout.tsx                # SHARED — root layout + nav bar
│   ├── page.tsx                  # SHARED — home page
│   ├── globals.css               # SHARED — global styles
│   ├── profile/page.tsx          # Member 1
│   ├── network/page.tsx          # Member 2
│   ├── interview/page.tsx        # Member 2
│   ├── planner/page.tsx          # Member 4
│   ├── thesis-gps/page.tsx       # Member 3 + Member 4
│   └── api/
│       └── chat/route.ts         # SHARED — AI endpoint (all members may add routes)
├── components/
│   ├── ui/                       # SHARED — shadcn components (don't edit, add new via `npx shadcn@latest add <name>`)
│   ├── profile/                  # Member 1
│   ├── network/                  # Member 2
│   ├── interview/                # Member 2
│   ├── planner/                  # Member 4
│   └── thesis-gps/               # Member 3 + Member 4
├── lib/
│   ├── data.ts                   # SHARED — JSON database (read/write helpers)
│   └── utils.ts                  # SHARED — utility functions
└── types/
    └── index.ts                  # SHARED — all entity types
```

---

## Member 1 — Student Profile & Portfolio

### Owns

| Path | What to do |
|---|---|
| `src/app/profile/page.tsx` | Main profile page — loads student data, passes to components |
| `src/components/profile/` | All profile components go here |

### What to build

- **Profile header** — student info, avatar, university, degree, bio
- **Project/experience widgets** — card-based layout showing each project with title, description, state, skills used
- **Relevance sorting** — given a target role or field, reorder the widgets so the most relevant projects appear first. Call `/api/chat` with the student's projects + target role and ask Claude to return a sorted list of project IDs
- **Viewer mode** — when someone else views the profile (e.g. a company), the layout adapts to emphasize what matters to them

### Data you need

From `src/lib/data.ts`:
- `getStudents()`, `getStudent(id)` — student profiles
- `getProjects()` — thesis projects linked via `studentId`
- `getFields()` — field names for tags
- `getStudyPrograms()`, `getUniversities()` — program/university display
- `getTopics()` — to show what topic a project is linked to

### New files to create

- `src/components/profile/project-widget.tsx` — single project card
- `src/components/profile/skills-section.tsx` — skills display
- `src/components/profile/relevance-sorter.tsx` — client component that calls the AI to sort

---

## Member 2 — Industry Connection (Referral & Networking + Interview Prep)

### Owns

| Path | What to do |
|---|---|
| `src/app/network/page.tsx` | Networking/referral page |
| `src/app/interview/page.tsx` | Interview prep page |
| `src/components/network/` | Networking components |
| `src/components/interview/` | Interview prep components |

### What to build

**Networking:**
- **Matching UI** — show experts/supervisors matched to the student's `fieldIds` and `objectives`
- **Expert cards** — display name, title, company, fields, and whether they offer interviews
- **Referral request flow** — a form/dialog to request an introduction

**Interview Prep:**
- **Role selector** — student picks a job-type topic they want to prepare for
- **AI prep guide** — call `/api/chat` with the topic description + company info + student skills, ask Claude to generate: key topics to study, behavioral questions, technical questions, and a preparation strategy
- **Guide display** — render the AI response in a structured, readable format

### Data you need

From `src/lib/data.ts`:
- `getExperts()` — industry experts, check `offerInterviews` and `objectives`
- `getCompanies()` — company details for context
- `getSupervisors()` — academic mentors
- `getTopics()` — filter by `type: "job"` for interview prep
- `getFields()` — for matching logic
- `getStudents()` — current student's profile for gap analysis

### New files to create

- `src/components/network/expert-card.tsx`
- `src/components/network/matching-engine.tsx` — client component with field-based filtering
- `src/components/interview/role-selector.tsx`
- `src/components/interview/prep-guide.tsx` — displays the AI-generated guide
- `src/app/api/interview-prep/route.ts` — dedicated API route with interview-specific system prompt

---

## Member 3 — Thesis GPS (Agent + Data Model)

### Owns

| Path | What to do |
|---|---|
| `src/app/thesis-gps/page.tsx` | Main GPS page (shared with Member 4) |
| `src/components/thesis-gps/` | GPS components (shared with Member 4) |
| `src/app/api/thesis-gps/` | API routes for the GPS agent |
| `src/lib/gps-agent.ts` | Agent logic — graph manipulation, proposals |

### What to build

- **Graph data model** — define the node/edge types that represent the thesis pipeline. Extend beyond the basic `ProjectState` to include sub-steps (e.g., "Literature Review", "Methodology", "First Draft" within `in_progress`)
- **GPS agent** — the core AI logic. Takes the current graph state + student context, sends to Claude with a system prompt that instructs it to return structured JSON: `{ addNodes, updateNodes, removeNodes, addEdges, removeEdges, message }`
- **Proposal system** — when the agent suggests changes, store them as pending proposals. The student can accept/reject. On accept, write back to the JSON database
- **Proactive triggers** — detect when a student is stuck (node hasn't changed state in X days) and auto-generate suggestions
- **Chat interface** — student can ask the agent questions about their thesis journey

### Data you need

From `src/lib/data.ts`:
- `getProject(id)`, `updateProject()` — the active thesis project
- `getStudent(id)` — student context
- `getTopic(id)` — thesis topic details
- `getSupervisor(id)` — supervisor info for context

### New files to create

- `src/lib/gps-agent.ts` — agent logic: build prompt, parse Claude's response, validate graph changes
- `src/types/gps.ts` — GPS-specific types: `GpsNode`, `GpsEdge`, `GpsProposal`, `AgentResponse`
- `src/app/api/thesis-gps/route.ts` — API route for GPS agent interactions
- `src/app/api/thesis-gps/propose/route.ts` — API route for generating proposals

### How the agent-graph interaction works

1. Frontend sends current graph state + user message to `/api/thesis-gps`
2. `gps-agent.ts` builds a prompt with the graph JSON + project context
3. Claude returns structured JSON with proposed graph changes
4. API route validates the response against `GpsNode`/`GpsEdge` types
5. Returns the proposal to the frontend (Member 4 renders it)
6. On user accept, a second API call writes the changes to the JSON database

---

## Member 4 — Shared Planning Space + Thesis GPS Frontend

### Owns

| Path | What to do |
|---|---|
| `src/app/planner/page.tsx` | Planner page |
| `src/components/planner/` | Planner components |
| `src/components/thesis-gps/thesis-gps-view.tsx` | GPS graph rendering (already scaffolded) |
| `src/components/thesis-gps/` | GPS UI components (shared with Member 3) |

### What to build

**Shared Planning Space:**
- **Task board** — kanban-style board for team tasks (can be simple columns: To Do, In Progress, Done)
- **Milestone tracker** — visual timeline for thesis milestones with deadlines
- **Shared calendar** — display deadlines, meetings, milestones in a calendar view

**Thesis GPS Frontend:**
- **Enhance the graph** — the current `thesis-gps-view.tsx` is a basic linear flow. Extend it to support branching paths, custom node styles (completed = green, active = blue pulse, blocked = red), and zoom-to-detail
- **Proposal rendering** — when Member 3's agent proposes graph changes, show them as a visual diff: new nodes highlighted, removed nodes grayed out, with the agent's explanation in a side panel
- **Accept/reject UI** — buttons to accept or dismiss the agent's proposal
- **Chat panel** — a side panel where the student chats with the GPS agent (sends messages to Member 3's API route, displays responses)

### Data you need

From `src/lib/data.ts`:
- `getProjects()` — for milestone tracking
- `getStudents()` — for planner group context

From Member 3's API:
- `/api/thesis-gps` — sends chat messages, receives agent responses
- `/api/thesis-gps/propose` — receives graph change proposals

### New files to create

- `src/components/planner/task-board.tsx`
- `src/components/planner/milestone-tracker.tsx`
- `src/components/planner/calendar-view.tsx`
- `src/components/thesis-gps/gps-proposal-diff.tsx` — visual diff overlay for proposals
- `src/components/thesis-gps/gps-chat-panel.tsx` — chat sidebar
- `src/components/thesis-gps/gps-node.tsx` — custom React Flow node component with state-based styling

---

## Shared Files — Rules

These files are used by everyone. Coordinate before changing them:

| File | Rule |
|---|---|
| `src/types/index.ts` | Add new types, don't modify existing ones without team agreement |
| `src/lib/data.ts` | Add new getters/setters as needed, don't change existing function signatures |
| `src/app/layout.tsx` | Only touch the nav links array to add/rename routes |
| `src/app/page.tsx` | Only touch the features array to update descriptions |
| `src/app/globals.css` | Add styles at the bottom, don't modify existing ones |
| `src/components/ui/` | Don't edit — add new components via `npx shadcn@latest add <name>` |

## Adding New API Routes

Each feature can have its own API route:

```
src/app/api/
├── chat/route.ts              # Generic chat (shared)
├── interview-prep/route.ts    # Member 2
└── thesis-gps/
    ├── route.ts               # Member 3
    └── propose/route.ts       # Member 3
```

Each route uses the same Claude client pattern from `api/chat/route.ts` but with a different system prompt tailored to the feature.
