import { useState } from "react";
import { useUiStore } from "../../../shared/store/uiStore.js";
import { copilotApi } from "../services/copilotApi.js";

const SUGGESTED_QUESTIONS = [
  "Why is this candidate ranked here?",
  "What are the biggest risks with this candidate?",
  "Draft an outreach message for this candidate",
];

export function useCopilotViewModel() {
  const { copilot, closeCopilot } = useUiStore();
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);

  async function ask(question) {
    if (!question.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setIsThinking(true);
    try {
      const result = await copilotApi.ask({ context: copilot.context, question });
      setMessages((prev) => [...prev, { role: "assistant", text: result.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "I couldn't reach the reasoning service. Try again in a moment." },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  return {
    isOpen: copilot.isOpen,
    context: copilot.context,
    messages,
    isThinking,
    suggestedQuestions: SUGGESTED_QUESTIONS,
    ask,
    close: closeCopilot,
  };
}
