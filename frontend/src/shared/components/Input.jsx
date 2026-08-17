import { forwardRef } from "react";
import clsx from "clsx";
import Icon from "./Icon.jsx";

const Input = forwardRef(function Input(
  { label, error, hint, leftIcon, id, className = "", containerClassName = "", ...rest },
  ref
) {
  const inputId = id || rest.name;
  return (
    <div className={clsx("flex flex-col gap-xs", containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="font-label-caps text-label-caps text-on-surface-variant uppercase">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <Icon
            name={leftIcon}
            size={18}
            className="absolute left-sm top-1/2 -translate-y-1/2 text-outline pointer-events-none"
          />
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={clsx(
            "w-full h-9 rounded border bg-paper text-body-md font-body-md text-on-surface outline-none transition-colors",
            "placeholder:text-outline-variant focus:border-prussian",
            leftIcon ? "pl-[36px] pr-sm" : "px-sm",
            error ? "border-danger" : "border-outline-variant/60",
            className
          )}
          {...rest}
        />
      </div>
      {error ? (
        <span id={`${inputId}-error`} className="text-body-sm text-danger">
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className="text-body-sm text-on-surface-variant">
          {hint}
        </span>
      ) : null}
    </div>
  );
});

export default Input;
