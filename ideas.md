# Studyond Ideas

## 1. Student Profile & Portfolio

An AI-generated student profile that acts as a dynamic portfolio. Projects and experiences appear as widgets — visual cards that showcase what the student has worked on, the skills involved, and the outcomes achieved. An AI agent analyzes the student's data and automatically sorts experiences by relevance: when a student targets a specific role or field, the most pertinent projects float to the top, while less relevant ones are de-emphasized. The profile replaces the traditional CV and cover letter — instead of generating documents, the student shares a living, contextualized profile that adapts to the viewer.

## 2. Referral & Networking System

A matching engine that connects students with alumni, mentors, and professionals within partner companies. Based on shared interests, study programs, and career goals, it suggests warm introductions and facilitates referral requests. Includes reputation tracking so active mentors get recognized.

## 3. Interview Prep Coach

An AI agent that analyzes the target role and company to help students prepare for interviews. It identifies key topics the student should know, generates plausible behavioral and technical questions, and produces a comprehensive preparation guide covering expected knowledge areas, common question patterns, and suggested answer strategies.

## 4. Shared Planning Space

A collaborative workspace where student teams can co-plan semester schedules, group projects, and study sessions. For thesis students, it also serves as a personal progress tracker with milestone planning, writing progress monitoring, and deadline alerts. Features include shared calendars, task boards, document collaboration, and integration with university course catalogs. Designed to reduce coordination overhead and keep groups aligned on deadlines and deliverables.

## 5. Thesis GPS (from tutor feedback)

A guided, end-to-end thesis navigation system that accompanies the student from topic selection all the way to final delivery. The core concept is a **dynamic directed graph** (not just a progress bar) that visualizes the thesis journey as a pipeline of steps.

### Core Mechanics

- **Steps as bottlenecks**: Each node in the graph is a milestone (e.g., "Topic Approved", "Literature Review Complete", "Methodology Defined", "First Draft"). A student cannot advance to the next node until prerequisites are satisfied — enforcing a structured progression.
- **Branching paths**: The graph represents multiple possible routes forward. For example, after "Literature Review", one path might lead through "Quantitative Analysis" while another suggests "Qualitative Approach". These branches are suggestions the agent proposes based on the student's context.
- **Proactive agent**: The agent doesn't just wait — it monitors progress, detects stalls, and proactively intervenes. If a student is stuck on a step for too long, it suggests how to unblock. If new information changes the best path forward, it restructures the graph and explains why.
- **Interactive**: The student can chat with the agent to ask "what should I do next?", "why is this step required?", or "can I skip this?". The agent responds with reasoning grounded in the student's specific thesis and timeline.

### Graph Behavior

- The graph adapts over time: completed nodes turn green, the current node pulses, future nodes show estimated dates.
- When the agent proposes a path change, both the old and new paths are visible so the student understands the trade-off.
- Blocked paths (e.g., missing supervisor approval) are visually distinct, with clear instructions on how to unblock.
- The student can zoom into any node to see sub-tasks, resources, and the sub-agent responsible for that phase.
