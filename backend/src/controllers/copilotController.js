import { copilotService } from "../services/copilotService.js";
import { ApiError } from "../middleware/errorHandler.js";

const MAX_QUESTION_LENGTH = 1000; // characters

export const copilotController = {
  async ask(req, res) {
    const { question } = req.body;
    // #17: reject oversized questions before they reach the AI service.
    if (!question || typeof question !== "string") {
      throw new ApiError(400, "VALIDATION_ERROR", "question is required and must be a string.");
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      throw new ApiError(400, "VALIDATION_ERROR", `question must be ${MAX_QUESTION_LENGTH} characters or fewer.`);
    }
    const data = await copilotService.ask(req.session.organizationId, req.body);
    res.json({ success: true, data });
  },
};
