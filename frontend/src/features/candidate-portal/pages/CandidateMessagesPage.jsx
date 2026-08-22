import { useState } from "react";
import clsx from "clsx";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Button from "../../../shared/components/Button.jsx";
import Textarea from "../../../shared/components/Textarea.jsx";
import EmptyState from "../../../shared/components/EmptyState.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import { formatDate } from "../../../shared/utils/format.js";
import {
  useCandidateConversationsViewModel,
  useCandidateThreadViewModel,
} from "../hooks/useCandidateMessagesViewModel.js";

function ConversationThread({ conversationId, onBack }) {
  const { conversation, messages, isLoading, send, isSending } = useCandidateThreadViewModel(conversationId);
  const [draft, setDraft] = useState("");

  function onSend() {
    const body = draft.trim();
    if (!body) return;
    send(body);
    setDraft("");
  }

  if (isLoading) return <SkeletonCard />;

  return (
    <div className="flex flex-col h-[70vh] rounded-xl border border-outline-variant/40 bg-paper">
      <div className="flex items-center gap-sm px-md py-sm hairline-b">
        <button onClick={onBack} className="md:hidden text-on-surface-variant" aria-label="Back">
          <Icon name="arrow_back" size={18} />
        </button>
        <span className="font-display-sm text-display-sm text-on-surface truncate">
          {conversation?.subject || "Conversation"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-md flex flex-col gap-sm">
        {messages.length === 0 && <p className="text-body-sm text-on-surface-variant text-center py-lg">No messages yet.</p>}
        {messages.map((m) => (
          <div
            key={m.id}
            className={clsx("max-w-[80%] rounded-lg px-md py-sm", m.senderType === "candidate" ? "self-end bg-primary text-on-primary" : "self-start bg-surface-container-high text-on-surface")}
          >
            <p className="text-body-md whitespace-pre-line">{m.body}</p>
            <p className={clsx("text-body-sm mt-1", m.senderType === "candidate" ? "text-on-primary/70" : "text-on-surface-variant")}>
              {m.senderType === "candidate" ? "You" : "Recruiter"} · {formatDate(m.createdAt)}
            </p>
          </div>
        ))}
      </div>

      <div className="p-md hairline-b border-t flex items-end gap-sm">
        <div className="flex-1">
          <Textarea rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message…" />
        </div>
        <Button leftIcon="send" isLoading={isSending} onClick={onSend} disabled={!draft.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}

export default function CandidateMessagesPage() {
  const { conversations, isLoading } = useCandidateConversationsViewModel();
  const [activeId, setActiveId] = useState(null);

  return (
    <div>
      <PageHeader title="Messages" subtitle="Secure messages between you and the hiring team." />

      {isLoading ? (
        <SkeletonCard />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon="chat"
          title="No messages yet"
          description="Start a conversation from one of your applications to reach the hiring team."
        />
      ) : (
        <div className="flex flex-col md:flex-row gap-md">
          {/* Conversation list */}
          <div className={clsx("md:w-80 flex-shrink-0", activeId ? "hidden md:block" : "block")}>
            <div className="flex flex-col gap-xs">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={clsx(
                    "text-left rounded-lg border p-md transition-colors",
                    activeId === c.id ? "border-primary/50 bg-primary/5" : "border-outline-variant/40 bg-paper hover:border-primary/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-sm">
                    <span className="text-body-md text-on-surface font-medium truncate">{c.subject || "Conversation"}</span>
                    {c.unread && <span className="w-2 h-2 rounded-full bg-danger flex-shrink-0" />}
                  </div>
                  <p className="text-body-sm text-on-surface-variant truncate">{c.lastMessagePreview || "—"}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Active thread */}
          <div className={clsx("flex-1 min-w-0", activeId ? "block" : "hidden md:block")}>
            {activeId ? (
              <ConversationThread conversationId={activeId} onBack={() => setActiveId(null)} />
            ) : (
              <div className="h-[70vh] rounded-xl border border-outline-variant/40 bg-paper flex items-center justify-center">
                <p className="text-body-md text-on-surface-variant">Select a conversation to view messages.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
