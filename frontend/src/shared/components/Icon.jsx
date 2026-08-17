/**
 * Thin wrapper around Material Symbols Outlined — the icon system used throughout the
 * supplied design (see docs — every screen in the Stitch export uses
 * <span class="material-symbols-outlined">name</span>). Using the same set here instead of
 * a separate icon library (e.g. lucide-react) keeps the built app visually identical to the
 * approved mockups.
 */
export default function Icon({ name, className = "", size, filled = false, style, ...rest }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size ? `${size}px` : undefined,
        fontVariationSettings: filled ? "'FILL' 1" : undefined,
        ...style,
      }}
      aria-hidden="true"
      {...rest}
    >
      {name}
    </span>
  );
}
