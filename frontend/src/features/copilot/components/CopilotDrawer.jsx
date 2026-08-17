import { useState } from "react";
import Icon from "../../../shared/components/Icon.jsx";
import CopilotMessage from "./CopilotMessage.jsx";
import { useCopilotViewModel } from "../hooks/useCopilotViewModel.js";

// The one deliberately dark surface in the product — docs/05-ui-ux-design-system.md §6.
// "Light = your data, dark = the AI thinking out loud."
export default function CopilotDrawer() {
  const { isOpen, context, messages, isThinking, suggestedQuestions, ask, close } = useCopilotViewModel();
  const [draft, setDraft] = useState("");

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    ask(draft);
    setDraft("");
  }

  return (
    <aside className="fixed top-0 right-0 h-full w-full sm:w-[380px] bg-ink text-white shadow-md z-40 flex flex-col animate-[slide-in_.25s_ease-out]">
      <div className="flex items-center justify-between px-md h-16 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Icon name="auto_awesome" className="text-secondary-fixed-dim" />
          <div>
            <p className="text-body-md font-medium">Copilot</p>
            {context?.candidateName && <p className="text-body-sm text-white/50">About: {context.candidateName}</p>}
          </div>
        </div>
        <button onClick={close} aria-label="Close Copilot" className="text-white/60 hover:text-white">
          <Icon name="close" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-md space-y-sm">
        {messages.length === 0 && (
          <div className="space-y-sm">
            <p className="text-body-sm text-white/50">Ask about this candidate&rsquo;s ranking, risks, or next steps.</p>
            <div className="flex flex-col gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  className="text-left text-body-sm bg-white/5 hover:bg-white/10 rounded-lg px-sm py-sm transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <CopilotMessage key={i} role={m.role} text={m.text} />
        ))}
        {isThinking && <p className="text-body-sm text-white/40">Copilot is thinking…</p>}
      </div>

      <form onSubmit={handleSubmit} className="p-sm border-t border-white/10 flex gap-2 flex-shrink-0">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask Copilot…"
          className="flex-1 bg-white/10 rounded px-sm py-sm text-body-md text-white placeholder:text-white/40 outline-none focus:ring-1 focus:ring-secondary-fixed-dim"
        />
        <button
          type="submit"
          aria-label="Send"
          className="w-9 h-9 rounded bg-secondary-fixed-dim text-ink flex items-center justify-center flex-shrink-0"
        >
          <Icon name="send" size={18} />
        </button>
      </form>
    </aside>
  );
}
