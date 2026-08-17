import axios from "axios";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

// Thin HTTP client to the Python AI microservice (docs/01-technical-architecture.md §1.3).
// Every method degrades gracefully if the AI service is unreachable, so the rest of the
// platform (CRUD, pipeline management) keeps working even if AI features are temporarily
// down — docs/01-technical-architecture.md §7 ("Availability").
// #24: 5s timeout for inline user-facing requests. Background queue jobs that tolerate
// longer waits (e.g. resume parsing) pass { timeout: 15000 } in their axios config.
const client = axios.create({
  baseURL: env.aiServiceUrl,
  timeout: 5000,
  // Shared-secret header so the AI service can reject anything that isn't this API. Only sent
  // when configured, so local dev without a token still works (see ai-service verify_service_token).
  headers: env.aiServiceToken ? { "X-AI-Service-Token": env.aiServiceToken } : {},
});

export const aiServiceClient = {
  async parseResume({ fileBase64, fileType, text, _timeoutOverride }) {
    try {
      const { data } = await client.post("/parse", { fileBase64, fileType, text }, {
        ...((_timeoutOverride) ? { timeout: _timeoutOverride } : {}),
      });
      return data;
    } catch (err) {
      logger.warn({ err: err.message }, "AI service parse() unavailable — falling back to null result");
      return null;
    }
  },

  async embed(text) {
    try {
      const { data } = await client.post("/embed", { text });
      return data.vector;
    } catch (err) {
      logger.warn({ err: err.message }, "AI service embed() unavailable");
      return null;
    }
  },

  async explain({ candidate, job, scores }) {
    try {
      const prompt = `Explain why ${candidate.fullName} scored ${scores?.overallScore}/100 for the role of ${job ? job.title : 'an open position'}. Be brief (2-3 sentences).`;
      const ollamaResponse = await axios.post("https://ollama.com/api/chat", {
        model: "gpt-oss:20b",
        messages: [{ role: "user", content: prompt }],
        stream: false
      }, {
        headers: { "Authorization": "Bearer 9cffcf0547d942a397050dd9536c98cb.jVGnoigkh517T0IeuyBZleHz" },
        timeout: 10000
      });
      return ollamaResponse.data.message.content;
    } catch (err) {
      logger.warn({ err: err.message }, "AI service explain() unavailable — using template fallback");
      return null;
    }
  },

  async generateInterviewQuestions({ candidate, job }) {
    try {
      const prompt = `Generate 3 interview questions for ${candidate.fullName} interviewing for ${job ? job.title : 'a role'}. 
Candidate skills: ${candidate.skills?.map(s => s.name).join(', ')}.
Return ONLY a JSON array of objects, each with "question" (string) and "category" (string: 'technical', 'behavioral', or 'problem_solving').`;
      const ollamaResponse = await axios.post("https://ollama.com/api/chat", {
        model: "gpt-oss:20b",
        messages: [{ role: "user", content: prompt }],
        format: "json",
        stream: false
      }, {
        headers: { "Authorization": "Bearer 9cffcf0547d942a397050dd9536c98cb.jVGnoigkh517T0IeuyBZleHz" },
        timeout: 15000
      });
      return JSON.parse(ollamaResponse.data.message.content);
    } catch (err) {
      logger.warn({ err: err.message }, "AI service interview-questions unavailable");
      return [];
    }
  },

  async draftMessage({ candidate, job, tone }) {
    try {
      const prompt = `Write a ${tone} recruiting email to ${candidate.fullName} for the role of ${job ? job.title : 'an open position'}. 
Candidate skills: ${candidate.skills?.map(s => s.name).join(', ')}.
Return ONLY a JSON object with "subject" and "body" keys.`;
      
      const ollamaResponse = await axios.post("https://ollama.com/api/chat", {
        model: "gpt-oss:20b",
        messages: [{ role: "user", content: prompt }],
        format: "json",
        stream: false
      }, {
        headers: { "Authorization": "Bearer 9cffcf0547d942a397050dd9536c98cb.jVGnoigkh517T0IeuyBZleHz" },
        timeout: 15000
      });
      return JSON.parse(ollamaResponse.data.message.content);
    } catch (err) {
      logger.warn({ err: err.message }, "AI service draft-message unavailable — using template fallback");
      return null;
    }
  },

  async parseSearchQuery(query) {
    try {
      const { data } = await client.post("/llm/parse-search-query", { query });
      return data;
    } catch (err) {
      logger.warn({ err: err.message }, "AI service parse-search-query unavailable — using keyword fallback");
      return null;
    }
  },

  async answerCopilotQuestion({ context, question }) {
    try {
      const ollamaResponse = await axios.post("https://ollama.com/api/chat", {
        model: "gpt-oss:20b",
        messages: [
          { role: "system", content: "You are ITAP's recruiting Copilot. Answer the recruiter's question about a candidate using only the context given, in 2-4 sentences. If you don't have enough context, say so plainly." },
          { role: "user", content: `Context: ${JSON.stringify(context)}\nQuestion: ${question}` }
        ],
        stream: false
      }, {
        headers: { "Authorization": "Bearer 9cffcf0547d942a397050dd9536c98cb.jVGnoigkh517T0IeuyBZleHz" },
        timeout: 10000
      });
      return ollamaResponse.data.message.content;
    } catch (err) {
      logger.warn({ err: err.message }, "AI service copilot unavailable");
      return null;
    }
  },
};
