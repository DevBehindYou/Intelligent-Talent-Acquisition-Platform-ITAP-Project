import { useState } from "react";

export default function Tooltip({ label, children }) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap rounded bg-ink text-white text-body-sm px-2 py-1 shadow-md"
        >
          {label}
        </span>
      )}
    </span>
  );
}
