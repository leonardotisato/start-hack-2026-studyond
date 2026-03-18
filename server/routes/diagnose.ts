import { Router } from "express";

import {
  conversationTurnSchema,
  diagnosisInputSchema,
} from "../../src/lib/contracts/diagnosis";
import { buildDiagnosisResult } from "../services/diagnosis-service";

export const diagnoseRouter = Router();

diagnoseRouter.post("/", async (request, response, next) => {
  try {
    const inputParse = diagnosisInputSchema.safeParse(request.body?.input);
    if (!inputParse.success) {
      response.status(400).json({
        error: "Invalid diagnosis input",
        details: inputParse.error.flatten(),
      });
      return;
    }

    const conversationRaw = request.body?.conversation ?? [];
    const conversation = Array.isArray(conversationRaw)
      ? conversationRaw
          .map((turn: unknown) => conversationTurnSchema.safeParse(turn))
          .filter((r: { success: boolean }) => r.success)
          .map((r: { success: true; data: unknown }) => r.data)
      : [];

    const result = await buildDiagnosisResult(inputParse.data, conversation);
    response.json(result);
  } catch (error) {
    next(error);
  }
});
