import clsx from "clsx";
import Icon from "./Icon.jsx";

const VARIANT_CLASSES = {
  primary: "bg-primary text-on-primary hover:bg-primary/90 disabled:bg-primary/40",
  secondary:
    "bg-transparent text-on-surface border border-slate/40 hover:bg-surface-container-low disabled:opacity-40",
  ghost: "bg-transparent text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40",
  danger: "bg-danger text-white hover:bg-danger/90 disabled:bg-danger/40",
};

const SIZE_CLASSES = {
  sm: "h-8 px-sm text-body-sm",
  md: "h-9 px-md text-body-sm",
  lg: "h-11 px-lg text-body-lg",
};

export default function Button({
  as: Component = "button",
  variant = "primary",
  size = "md",
  leftIcon,
  isLoading = false,
  disabled = false,
  className = "",
  children,
  ...rest
}) {
  return (
    <Component
      className={clsx(
        "inline-flex items-center justify-center gap-xs rounded font-body-sm font-medium transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-prussian",
        "disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <Icon name="progress_activity" className="animate-spin" size={16} />
      ) : (
        leftIcon && <Icon name={leftIcon} size={16} />
      )}
      {children}
    </Component>
  );
}
