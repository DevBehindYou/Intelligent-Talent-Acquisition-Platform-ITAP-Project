import { forwardRef } from "react";
import clsx from "clsx";

const Textarea = forwardRef(function Textarea({ label, error, id, className = "", rows = 4, ...rest }, ref) {
  const inputId = id || rest.name;
  return (
    <div className="flex flex-col gap-xs">
      {label && (
        <label htmlFor={inputId} className="font-label-caps text-label-caps text-on-surface-variant uppercase">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={clsx(
          "w-full rounded border bg-paper text-body-md font-body-md text-on-surface outline-none transition-colors p-sm resize-y",
          "placeholder:text-outline-variant focus:border-prussian",
          error ? "border-danger" : "border-outline-variant/60",
          className
        )}
        {...rest}
      />
      {error && <span className="text-body-sm text-danger">{error}</span>}
    </div>
  );
});

export default Textarea;
