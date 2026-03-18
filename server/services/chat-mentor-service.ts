import type { ConversationTurn } from "../../src/lib/contracts/diagnosis";
import { getFields, getTopics } from "../repositories/mock-data-repository";

type MentorPattern = {
  keywords: string[];
  reply: string;
};

const mentorPatterns: MentorPattern[] = [
  {
    keywords: ["lost", "confused", "no idea", "don't know where"],
    reply: "That feeling is completely normal at the start. Let's break it down: what part feels most unclear — the topic itself, the process of writing a thesis, or who to ask for help?",
  },
  {
    keywords: ["topic", "choose", "pick", "decide", "narrow"],
    reply: "Choosing a topic is often the hardest step. Instead of finding the perfect topic, try listing three questions you'd genuinely want to spend time on. Which one could you explain to a friend in two sentences?",
  },
  {
    keywords: ["supervisor", "professor", "advisor", "contact"],
    reply: "A good first step is a short email: introduce yourself, mention one specific thing from the professor's recent work, and ask if they'd be open to a 15-minute chat. Most supervisors appreciate initiative over perfection.",
  },
  {
    keywords: ["company", "industry", "applied", "practical", "real-world"],
    reply: "Company-connected theses can be great because they give you constraints that make the scope clearer. Think about what kind of data or problem access a company could give you that a purely academic thesis could not.",
  },
  {
    keywords: ["writing", "write", "structure", "draft"],
    reply: "A thesis has a clear structure: introduction, literature review, methodology, results, discussion. Start with the introduction and conclusion — they frame your argument and help you see whether your story holds together.",
  },
  {
    keywords: ["method", "methodology", "quantitative", "qualitative", "research design"],
    reply: "Your method should follow from your research question. Ask yourself: am I trying to measure something (quantitative), understand something in depth (qualitative), or build something (design science)? That narrows the options quickly.",
  },
  {
    keywords: ["deadline", "time", "schedule", "late", "behind"],
    reply: "Time pressure is real, but it also clarifies priorities. What's the one thing that, if you did it this week, would move you closest to a concrete thesis direction?",
  },
  {
    keywords: ["skill", "gap", "learn", "not good enough", "ability"],
    reply: "Skill gaps are expected — a thesis is a learning experience. Identify the one skill that would unblock you most (e.g., academic writing, a specific tool, or statistics), and invest a focused week on it before diving into the full thesis.",
  },
  {
    keywords: ["afraid", "anxious", "scared", "overwhelm", "stress"],
    reply: "Thesis anxiety often comes from seeing the whole mountain at once. Try to focus only on the very next step — not the finished thesis, just the next small action. Progress builds confidence faster than planning does.",
  },
  {
    keywords: ["data", "dataset", "collect", "survey"],
    reply: "Data availability often shapes the thesis more than the topic does. Before committing, ask: can I actually get the data I need? If not, can I scope down to what's accessible?",
  },
];

const fallbackReplies = [
  "That's an interesting point. Can you tell me more about what specifically feels uncertain right now?",
  "I hear you. Let's try to identify the single biggest blocker between you and a clearer thesis direction.",
  "That helps me understand your situation better. What would you say is the first thing you'd want to resolve — the topic, the supervision, or the method?",
  "Thank you for sharing that. Let me ask: if you could solve just one thing about your thesis situation this week, what would it be?",
];

function matchPattern(text: string): string | null {
  const lower = text.toLowerCase();
  for (const pattern of mentorPatterns) {
    if (pattern.keywords.some((kw) => lower.includes(kw))) {
      return pattern.reply;
    }
  }
  return null;
}

async function buildTopicAwareReply(text: string): Promise<string | null> {
  const lower = text.toLowerCase();
  const topics = await getTopics();
  const fields = await getFields();

  // Check if the user mentions a specific field
  const mentionedField = fields.find((f) => lower.includes(f.name.toLowerCase()));
  if (mentionedField) {
    const relatedTopics = topics
      .filter((t) => t.fieldIds.includes(mentionedField.id))
      .slice(0, 2);

    if (relatedTopics.length > 0) {
      return `Since you're interested in ${mentionedField.name}, here are some directions to consider: "${relatedTopics[0].title}"${relatedTopics.length > 1 ? ` and "${relatedTopics[1].title}"` : ""}. Would either of these resonate with what you're looking for?`;
    }
  }

  return null;
}

export async function generateMentorReply(
  messages: ConversationTurn[],
): Promise<string> {
  const userMessages = messages.filter((m) => m.role === "user");
  const lastMessage = userMessages.at(-1)?.content ?? "";

  // Try pattern matching first
  const patternReply = matchPattern(lastMessage);
  if (patternReply) return patternReply;

  // Try topic-aware reply
  const topicReply = await buildTopicAwareReply(lastMessage);
  if (topicReply) return topicReply;

  // Fallback based on conversation length for variety
  const fallbackIndex = userMessages.length % fallbackReplies.length;
  return fallbackReplies[fallbackIndex];
}
