# 🧭 Thesis GPS

> **A shared, living roadmap for every thesis — navigated by AI, owned by everyone on the journey.**

The Thesis GPS is a directed milestone graph that evolves with the student's progress. It is visible to the student, their supervisor, and relevant company partners simultaneously. The AI doesn't just chat — it proposes structural changes to the roadmap and activates the right people from the network at the right milestone.

---

## 🗺️ The Workspace

Each node is a milestone. Edges encode dependencies. The graph branches when multiple valid paths exist, shows blocked nodes when prerequisites are missing, and highlights the active milestone with live subtask progress.

![Thesis GPS planner](screenshots/planner.png)

The wide layout shows the full thesis journey alongside the Kanban task board and the AI chat panel — the complete picture in one view.

![Thesis GPS wide layout](screenshots/planner-wide.png)

What the graph looks like at runtime:

```mermaid
graph LR
    A([✅ Topic Confirmed]) --> B([✅ Literature Review])
    B --> C([⚡ Methodology Design])
    C --> D([🔒 Data Collection])
    C --> E([📅 Company Case Study])
    D --> F([📅 Analysis & Results])
    E --> F
    F --> G([📅 Final Write-up])

    style A fill:#22c55e,color:#fff,stroke:none
    style B fill:#22c55e,color:#fff,stroke:none
    style C fill:#3b82f6,color:#fff,stroke:none
    style D fill:#ef4444,color:#fff,stroke:none
    style E fill:#94a3b8,color:#fff,stroke:none
    style F fill:#94a3b8,color:#fff,stroke:none
    style G fill:#94a3b8,color:#fff,stroke:none
```

> ✅ completed · ⚡ active · 🔒 blocked · 📅 upcoming

---

## ⚙️ System Strengths

### 🤖 Multi-Agent, Stateful Architecture

Two coordinated Claude agents power the workspace:

```mermaid
flowchart TD
    Student(["👨‍🎓 Student"])
    Supervisor(["🧑‍🏫 Supervisor"])

    subgraph Workspace["🗺️ Thesis GPS Workspace"]
        Graph["📊 Graph View\nReact Flow\nNodes · Edges · Subtasks"]
        ChatPanel["💬 GPS Chat Panel"]
        GPS["🤖 GPS Agent\nFull graph state + history\nResponds with structured diffs"]
        Scout["🔍 Scout Agent\nPer-node scope\nNetwork recommendations"]
    end

    subgraph Knowledge["🧠 Knowledge Layer"]
        Brain["📚 Studyond Brain\n88+ atomic notes\nRAG context"]
        Network["🌐 Studyond Network\nSupervisors · Experts\nCompany Partners"]
    end

    Student -- "asks / accepts proposal" --> ChatPanel
    Supervisor -- "initializes graph via prompt" --> GPS
    ChatPanel --> GPS
    GPS -- "graph diff proposal" --> Graph
    GPS -- "opens node" --> Scout
    Scout -- "inline recommendations" --> ChatPanel
    GPS --> Brain
    Scout --> Network
```

**GPS Agent** — the primary advisor. On every turn it receives the full graph state and the complete conversation history. It responds with a **structured diff**: which nodes to add, update, or remove; which edges to rewire; which subtasks to mark complete. Nothing mutates until the student accepts the proposal.

**Scout Agent** — a sub-agent scoped to a single open node. When a student expands a milestone, Scout searches the full Studyond network and surfaces the specific supervisors, domain experts, and company partners most relevant to *that* step. Recommendations are embedded inline in the chat response.

Both agents are fully stateful — conversation history and graph state persist across the entire session. This is not a one-shot chatbot bolted onto a planner.

---

### 👥 One Roadmap, Three Stakeholders

The graph is the **single source of truth** shared between all parties:

```mermaid
flowchart LR
    Supervisor(["🧑‍🏫 Supervisor\nDefines structure\nvia natural language prompt"])
    Student(["👨‍🎓 Student\nNavigates milestones\naccepts/rejects proposals"])
    Company(["🏢 Company Partner\nSurfaced by Scout\nat relevant nodes"])

    GPS["🗺️ Thesis GPS Graph\n— single source of truth —"]

    Supervisor -- "initializes" --> GPS
    Student -- "drives" --> GPS
    GPS -- "activates at milestone" --> Company
```

| Stakeholder | What they see | What they contribute |
|-------------|---------------|----------------------|
| **👨‍🎓 Student** | Milestone progress, upcoming steps, blocked paths | Completes tasks, steers the agent in conversation |
| **🧑‍🏫 Supervisor** | The same graph, initialized from their own prompt | Defines thesis structure and milestones at the start |
| **🏢 Company Partner** | Nodes where their domain is relevant | Surfaced by Scout at the right milestone, not cold-contacted |

The supervisor submits a natural language prompt describing requirements and milestones. The init agent translates it into the graph structure — no manual node creation, no spreadsheet handoff.

---

### 🌐 Network Exploitation at Every Milestone

The network — supervisors, domain experts, company thesis partners — is not a static directory to browse. The Scout agent **activates it contextually**:

```mermaid
flowchart TD
    Node["⚡ Active Milestone Node\ne.g. Methodology Design"]
    Scout["🔍 Scout Agent"]
    Node -- "student opens node" --> Scout

    Scout --> S["🧑‍🏫 Relevant Supervisors\nmatched by field"]
    Scout --> E["🎓 Domain Experts\nmatched by publication area"]
    Scout --> C["🏢 Company Partners\nwho hosted similar topics"]

    S --> Chat["💬 Inline in chat\nactionable, not a side tab"]
    E --> Chat
    C --> Chat
```

- At a *Literature Review* node → surfaces relevant academics and published supervisors
- At a *Company Case Study* node → surfaces partners who've hosted similar thesis topics
- At a *Methodology Design* node → surfaces experts whose work matches the student's approach

The network becomes a **proactive opportunity engine** embedded in the workflow, not a side tab the student forgets to visit.

---

### ✋ Proposal-First, Human-in-the-Loop UX

The GPS Agent never unilaterally mutates the graph. Every structural change is a **proposal** — a diff showing exactly which nodes and edges will be added, updated, or removed. The student reviews it in the chat panel and accepts or rejects. AI reasons, human decides.

```mermaid
sequenceDiagram
    actor Student
    participant Chat as 💬 GPS Chat Panel
    participant Agent as 🤖 GPS Agent
    participant Graph as 📊 Graph View

    Student->>Chat: "I've finished the literature review"
    Chat->>Agent: message + full graph state + history
    Agent-->>Chat: proposal diff (update node, add edge, suggest next)
    Chat-->>Student: shows diff preview
    Student->>Chat: ✅ Accept
    Chat->>Graph: apply mutation
    Graph-->>Student: graph updates live
```

---

### 🧠 RAG over the Studyond Brain

All agent calls are grounded in the **Studyond Brain** — 88+ interconnected atomic notes covering the thesis journey, domain model, student personas, and platform context. Context is injected selectively per call, keeping responses precise and grounded.

```mermaid
graph LR
    Call["🤖 Agent Call"] --> Loader["📂 Context Loader"]
    Loader --> B1["📄 Thesis Journey"]
    Loader --> B2["📄 Student Persona"]
    Loader --> B3["📄 Platform Overview"]
    Loader --> B4["📄 Domain Model"]
    B1 & B2 & B3 & B4 --> Prompt["📝 Enriched Prompt\n→ Claude"]
```

---

## 🏗️ Stack

**React 19 · TypeScript · React Flow · Tailwind CSS · shadcn/ui · Claude (Anthropic SDK) · Vercel AI SDK · Zustand · Next.js**

---

## ✨ Supporting Features

Profile & portfolio with AI relevance sorting, expert and supervisor matching network, conversational thesis orientation, and interview prep coach — all feeding into and out of the GPS workspace.

![Home](screenshots/home.png)
![Network](screenshots/network.png)
![Orientation](screenshots/orientation.png)
![Profile](screenshots/profile.png)
