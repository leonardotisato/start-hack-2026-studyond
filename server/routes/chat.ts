import { Router } from "express";

import type { ConversationTurn } from "../../src/lib/contracts/diagnosis";
import { generateMentorReply } from "../services/chat-mentor-service";

export const chatRouter = Router();

chatRouter.post("/", async (request, response, next) => {
  try {
    const messages = (request.body?.messages ?? []) as ConversationTurn[];
    const reply = await generateMentorReply(messages);
    response.json({ reply });
  } catch (error) {
    next(error);
  }
});
