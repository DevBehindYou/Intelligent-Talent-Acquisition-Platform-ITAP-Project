import clsx from "clsx";
import Icon from "../../../shared/components/Icon.jsx";

export default function CopilotMessage({ role, text }) {
  const isUser = role === "user";
  return (
    <div className={clsx("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[85%] rounded-lg px-sm py-sm text-body-md leading-relaxed",
          isUser ? "bg-primary-container text-on-primary-container" : "bg-white/10 text-white"
        )}
      >
        {!isUser && (
          <span className="flex items-center gap-1 text-label-caps font-label-caps text-secondary-fixed-dim uppercase mb-1">
            <Icon name="auto_awesome" size={12} /> Copilot
          </span>
        )}
        {text}
      </div>
    </div>
  );
}
