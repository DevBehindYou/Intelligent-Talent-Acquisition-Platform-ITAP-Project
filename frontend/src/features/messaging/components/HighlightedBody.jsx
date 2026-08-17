import Tooltip from "../../../shared/components/Tooltip.jsx";

/**
 * Renders the drafted message with each AI-personalized phrase highlighted inline —
 * matching personalized_ai_messaging/code.html's brass-tinted inline spans with a
 * source-attribution tooltip, rather than only describing the personalization in a sidebar.
 * Read-only view; MessagingPage swaps to a plain textarea for actual editing.
 */
export default function HighlightedBody({ body, insertions }) {
  if (!insertions || insertions.length === 0) {
    return <p className="whitespace-pre-wrap text-body-lg leading-relaxed text-on-surface">{body}</p>;
  }

  // Split on the first occurrence of each insertion phrase, left to right, so overlapping
  // matches don't double-highlight.
  let remaining = body;
  const parts = [];
  let cursor = 0;
  const sorted = [...insertions].sort((a, b) => body.indexOf(a.text) - body.indexOf(b.text));

  sorted.forEach((insertion) => {
    const idx = remaining.indexOf(insertion.text, cursor);
    if (idx === -1) return;
    parts.push({ type: "text", value: remaining.slice(cursor, idx) });
    parts.push({ type: "highlight", value: insertion.text, meta: insertion });
    cursor = idx + insertion.text.length;
  });
  parts.push({ type: "text", value: remaining.slice(cursor) });

  return (
    <p className="whitespace-pre-wrap text-body-lg leading-relaxed text-on-surface">
      {parts.map((part, i) =>
        part.type === "highlight" ? (
          <Tooltip key={i} label={`AI insertion: ${part.meta.category} — ${part.meta.source}`}>
            <span className="bg-brass/10 border-b border-brass text-on-surface rounded-sm px-0.5 cursor-help">
              {part.value}
            </span>
          </Tooltip>
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}
    </p>
  );
}
