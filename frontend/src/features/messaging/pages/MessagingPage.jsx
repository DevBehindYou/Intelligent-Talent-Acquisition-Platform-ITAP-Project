import PageHeader from "../../../shared/components/PageHeader.jsx";
import Breadcrumbs from "../../../shared/components/Breadcrumbs.jsx";
import Input from "../../../shared/components/Input.jsx";
import Textarea from "../../../shared/components/Textarea.jsx";
import Button from "../../../shared/components/Button.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import HighlightedBody from "../components/HighlightedBody.jsx";
import { useMessagingViewModel } from "../hooks/useMessagingViewModel.js";

function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="inline-flex items-center bg-surface-container-low rounded p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-sm py-1 rounded text-body-sm transition-colors ${
            value === opt ? "bg-paper text-on-surface shadow-sm font-medium" : "text-on-surface-variant"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/**
 * Reproduces "personalized_ai_messaging": a 60/40 split — message composer on the left,
 * a dark "Copilot Reasoning" panel on the right with numbered, sourced insight blocks
 * (docs/design-reference/personalized_ai_messaging) instead of the plain two-line sidebar
 * this page originally shipped with.
 */
export default function MessagingPage() {
  const vm = useMessagingViewModel();

  return (
    <div>
      <PageHeader
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: "Candidates", to: "/candidates" },
              { label: vm.candidate?.fullName || "…", to: `/candidates/${vm.candidate?._id}` },
              { label: "Message" },
            ]}
          />
        }
        title="Personalized Messaging"
        subtitle={vm.candidate ? `To: ${vm.candidate.fullName} <${vm.candidate.email}>` : undefined}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-lg items-start">
        {/* Composer — 60% */}
        <div className="lg:col-span-3 rounded-xl border border-outline-variant/40 bg-paper flex flex-col">
          <div className="flex items-center justify-between gap-sm p-md hairline-b flex-wrap">
            <div className="flex items-center gap-md flex-wrap">
              <SegmentedControl options={vm.tones} value={vm.tone} onChange={vm.setTone} />
              <SegmentedControl options={vm.lengths} value={vm.length} onChange={vm.setLength} />
            </div>
            <Button size="sm" variant="secondary" leftIcon="auto_awesome" isLoading={vm.isDrafting} onClick={vm.generateDraft}>
              {vm.hasDraft ? "Regenerate Draft" : "Generate Draft"}
            </Button>
          </div>

          <div className="p-md flex flex-col gap-md">
            <Input label="Subject" value={vm.subject} onChange={(e) => vm.setSubject(e.target.value)} />

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Message</span>
                <button
                  onClick={() => vm.setIsEditing((v) => !v)}
                  className="text-body-sm text-prussian hover:underline flex items-center gap-1"
                >
                  <Icon name={vm.isEditing ? "visibility" : "edit"} size={14} />
                  {vm.isEditing ? "Preview" : "Edit"}
                </button>
              </div>

              {!vm.hasDraft ? (
                <p className="text-body-md text-on-surface-variant italic py-lg text-center">
                  Generate a draft to see AI-personalized content highlighted inline.
                </p>
              ) : vm.isEditing ? (
                <Textarea rows={12} value={vm.body} onChange={(e) => vm.setBody(e.target.value)} />
              ) : (
                <div className="rounded border border-outline-variant/30 p-md bg-surface-container-lowest">
                  <HighlightedBody body={vm.body} insertions={vm.insertions} />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-sm p-md hairline-b border-t mt-auto">
            <Button variant="ghost">Save Template</Button>
            <Button variant="secondary">Discard</Button>
            <Button leftIcon="send" isLoading={vm.isSending} disabled={!vm.hasDraft} onClick={() => vm.send()}>
              Send Message
            </Button>
          </div>
        </div>

        {/* Copilot Reasoning — 40%, the one dark surface on this page (docs/05 §6) */}
        <div className="lg:col-span-2 rounded-xl bg-ink text-white p-md flex flex-col gap-md lg:sticky lg:top-margin-desktop">
          <h2 className="font-display-sm text-display-sm flex items-center gap-2">
            <Icon name="auto_awesome" className="text-secondary-fixed-dim" size={18} />
            Copilot Reasoning
          </h2>

          {vm.insertions.length === 0 ? (
            <p className="text-body-sm text-white/50">Generate a draft to see what the AI personalized and why.</p>
          ) : (
            vm.insertions.map((insertion, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-data-mono text-data-mono text-secondary-fixed-dim">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-label-caps text-label-caps text-white/70 uppercase">{insertion.category}</span>
                </div>
                <p className="text-body-sm text-white italic">&ldquo;{insertion.text}&rdquo;</p>
                <p className="text-body-sm text-white/40 mt-1">Source: {insertion.source}</p>
              </div>
            ))
          )}

          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-auto flex items-center gap-2 bg-white/10 rounded px-sm py-2"
          >
            <input
              placeholder="Ask Copilot to refine…"
              className="flex-1 bg-transparent text-body-sm text-white placeholder:text-white/40 outline-none"
            />
            <button type="submit" aria-label="Send" className="text-secondary-fixed-dim">
              <Icon name="send" size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
