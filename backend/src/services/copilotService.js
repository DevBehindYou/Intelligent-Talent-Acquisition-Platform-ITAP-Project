import { Candidate } from "../models/Candidate.js";
import { MatchScore } from "../models/MatchScore.js";
import { aiServiceClient } from "./aiServiceClient.js";

export const copilotService = {
  async ask(organizationId, { context, question }) {
    const candidate = context?.candidateId
      ? await Candidate.findOne({ _id: context.candidateId, organizationId }).lean()
      : null;
    const score = context?.candidateId && context?.jobId
      ? await MatchScore.findOne({ candidateId: context.candidateId, jobId: context.jobId }).lean()
      : null;

    const answer = await aiServiceClient.answerCopilotQuestion({ context: { candidate, score }, question });
    if (answer) return { answer };

    // Template fallback keeps the Copilot drawer useful with no LLM provider configured.
    if (score) {
      return {
        answer: `${candidate?.fullName || "This candidate"} scored ${score.overallScore}/100 — ${score.explanation}`,
      };
    }
    return { answer: "I don't have enough context yet to answer that. Try opening Copilot from a specific candidate." };
  },
};
