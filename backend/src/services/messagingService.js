import { Candidate } from "../models/Candidate.js";
import { Job } from "../models/Job.js";
import { aiServiceClient } from "./aiServiceClient.js";

const TONE_OPENERS = { Professional: "Dear", Casual: "Hey", Technical: "Hi" };

/**
 * Template fallback that mirrors the actual shape the "Personalized AI Messaging" design
 * needs: not just subject/body, but a list of `insertions` — the specific phrases the AI
 * personalized, each tagged with a category and a plausible source, so the frontend can
 * highlight them inline in the message body and list them in the Copilot Reasoning panel
 * (docs/design-reference/personalized_ai_messaging). The LLM path (aiServiceClient.draftMessage)
 * doesn't populate insertions in v1 — see docs/09-deployment-guide.md's LLM upgrade note.
 */
function templateDraft(candidate, job, tone, length) {
  const opener = TONE_OPENERS[tone] || "Hi";
  const firstName = candidate?.fullName?.split(" ")[0] || "there";
  const topSkill = candidate?.skills?.[0]?.name;
  const secondSkill = candidate?.skills?.[1]?.name;

  const experiencePhrase = candidate?.currentTitle
    ? `your work as ${candidate.currentTitle}${topSkill ? ` focused on ${topSkill}` : ""}`
    : "your background";
  const skillPhrase = [topSkill, secondSkill].filter(Boolean).join(" and ") || "your technical background";

  const insertions = [
    { text: experiencePhrase, category: "Experience Context", source: "Candidate profile (parsed resume)" },
    { text: skillPhrase, category: "Skill Match", source: "Extracted skills (resume parsing)" },
  ];

  const closing =
    length === "Long"
      ? "\n\nI'd love to hear more about what you're looking for next, even if the timing isn't right today — happy to be a resource either way.\n\nBest,\n"
      : length === "Short"
      ? "\n\nOpen to a quick chat?\n\nBest,\n"
      : "\n\nWould you be open to a short call this week to discuss?\n\nBest,\n";

  const body =
    `${opener} ${firstName},\n\n` +
    `I came across ${experiencePhrase} and think you'd be a strong fit for ${job?.title || "an open role"} on our team. ` +
    `Given ${skillPhrase}, I think there could be a strong mutual fit.` +
    closing;

  return {
    subject: job ? `Opportunities at our team — following up on ${experiencePhrase}` : "Following up",
    body,
    insertions,
  };
}

export const messagingService = {
  async draft(organizationId, { candidateId, jobId, tone = "Professional", length = "Medium" }) {
    const [candidate, job] = await Promise.all([
      Candidate.findOne({ _id: candidateId, organizationId }).lean(),
      jobId ? Job.findOne({ _id: jobId, organizationId }).lean() : null,
    ]);
    const drafted = await aiServiceClient.draftMessage({ candidate, job, tone });
    if (drafted) return { insertions: [], ...drafted };
    return templateDraft(candidate, job, tone, length);
  },

  // Sending is intentionally left as a stub — wiring a transactional email provider
  // (e.g. Resend, as used on the team's LegalCMS project) is a config-only change here.
  async send(organizationId, { candidateId, subject, body }) {
    // Log the message to the candidate's timeline so it appears in History
    await Candidate.updateOne(
      { _id: candidateId, organizationId },
      { $push: { timeline: { type: "message", description: `Sent message: "${subject}"`, date: new Date() } } }
    );
    
    return { candidateId, subject, body, sentAt: new Date(), status: "queued_for_delivery" };
  },
};
