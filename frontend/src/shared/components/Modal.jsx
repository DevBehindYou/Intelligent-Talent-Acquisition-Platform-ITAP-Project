import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon.jsx";

export default function Modal({ title, isOpen, onClose, size = "md", footer, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    // Capture the element focused *when the modal opens* (not at first render) so focus
    // can be restored to it on close. Held in a local so the cleanup closes over a stable
    // value rather than reading a ref that may have changed (react-hooks/exhaustive-deps).
    const previouslyFocused = document.activeElement;
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" }[size];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-md" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${widthClass} bg-paper rounded-xl shadow-md outline-none`}
      >
        <div className="flex items-center justify-between px-lg py-md hairline-b">
          <h2 className="font-display-sm text-display-sm text-on-surface">{title}</h2>
          <button onClick={onClose} aria-label="Close dialog" className="text-outline hover:text-on-surface">
            <Icon name="close" />
          </button>
        </div>
        <div className="px-lg py-md">{children}</div>
        {footer && <div className="flex justify-end gap-sm px-lg py-md hairline-b border-t">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
