import { forwardRef } from "react";
import clsx from "clsx";
import Icon from "./Icon.jsx";

const Select = forwardRef(function Select({ label, error, options = [], id, className = "", ...rest }, ref) {
  const inputId = id || rest.name;
  return (
    <div className="flex flex-col gap-xs">
      {label && (
        <label htmlFor={inputId} className="font-label-caps text-label-caps text-on-surface-variant uppercase">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          className={clsx(
            "w-full h-9 rounded border bg-paper text-body-md font-body-md text-on-surface outline-none appearance-none pl-sm pr-8 transition-colors",
            "focus:border-prussian",
            error ? "border-danger" : "border-outline-variant/60",
            className
          )}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <Icon
          name="expand_more"
          size={18}
          className="absolute right-sm top-1/2 -translate-y-1/2 text-outline pointer-events-none"
        />
      </div>
      {error && <span className="text-body-sm text-danger">{error}</span>}
    </div>
  );
});

export default Select;
