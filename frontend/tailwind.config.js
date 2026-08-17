/** @type {import('tailwindcss').Config} */
// Tokens below are extracted verbatim from /docs (Document 5 — "Precision Instrument")
// and from the Stitch design export (stitch_itap_design_system/precision_instrument/DESIGN.md)
// that the design team supplied. One deliberate fix vs. the raw export: their `borderRadius.full`
// was set to 0.75rem, which would silently break every circular avatar (`rounded-full`) in the
// mockups. We leave Tailwind's native `full: 9999px` alone so avatars/pills stay circular, and
// keep DEFAULT/lg/xl as supplied. Everything else here is a direct, unmodified transcription.
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // --- Material-role palette (from the Stitch export, identical across all 7 screens) ---
        "surface-tint": "#356381",
        "on-background": "#0e1d2a",
        "on-error-container": "#93000a",
        error: "#ba1a1a",
        "surface-container-high": "#dbe9fd",
        "on-primary-container": "#92bfe0",
        outline: "#72787e",
        "on-secondary-fixed": "#291800",
        "surface-bright": "#f8f9ff",
        background: "#f8f9ff",
        "inverse-surface": "#243240",
        primary: "#003751",
        "on-surface": "#0e1d2a",
        "primary-container": "#1d4e6b",
        surface: "#f8f9ff",
        "surface-variant": "#d5e4f7",
        "surface-container-low": "#eef4ff",
        "on-error": "#ffffff",
        "on-primary-fixed-variant": "#194b68",
        "on-tertiary": "#ffffff",
        "on-tertiary-fixed": "#2a1700",
        "on-secondary-container": "#764e00",
        tertiary: "#4b2c00",
        "primary-fixed": "#c8e6ff",
        "secondary-fixed": "#ffddb0",
        "primary-fixed-dim": "#9fccee",
        "secondary-container": "#fec163",
        "on-tertiary-fixed-variant": "#633f0c",
        "on-surface-variant": "#41474d",
        "tertiary-fixed": "#ffddb8",
        "on-primary": "#ffffff",
        "error-container": "#ffdad6",
        "outline-variant": "#c1c7ce",
        "surface-dim": "#cddbef",
        "surface-container-highest": "#d5e4f7",
        "secondary-fixed-dim": "#f8bc5e", // Match Dial fill / "brass-dial"
        "surface-container-lowest": "#ffffff",
        "on-tertiary-container": "#e3b073",
        "surface-container": "#e4efff",
        "tertiary-container": "#66420f",
        "on-secondary": "#ffffff",
        "inverse-on-surface": "#e9f1ff",
        secondary: "#805600",
        "on-primary-fixed": "#001e2f",
        "tertiary-fixed-dim": "#f1bd7f",
        "inverse-primary": "#9fccee",
        "on-secondary-fixed-variant": "#614000",

        // --- Semantic aliases used throughout our own component code (Document 5 naming) ---
        ink: "#0e1d2a", // = on-background. Sidebar + Copilot drawer surface.
        canvas: "#f8f9ff", // = background/surface. App working-area background.
        paper: "#ffffff", // = surface-container-lowest. Cards, table rows, modals.
        prussian: "#1d4e6b", // = primary-container. Primary interactive accent.
        brass: "#b59e54", // AI-signal accent: icons, borders, AI-attributed text.
        slate: "#5b6b7c", // Secondary text, hairline borders, metadata.

        // Status colors (Document 5 §3 — kept distinct from brand tokens)
        success: "#2f7d5c",
        warning: "#c97a26",
        danger: "#c1443c",
        info: "#3e7ca6",
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        // `full` intentionally left as Tailwind's native 9999px — see note above.
      },
      spacing: {
        base: "4px",
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        gutter: "16px",
        "margin-mobile": "16px",
        "margin-desktop": "32px",
      },
      fontFamily: {
        "label-caps": ["Inter", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "display-sm": ["Space Grotesk", "sans-serif"],
        "display-md": ["Space Grotesk", "sans-serif"],
        "display-lg": ["Space Grotesk", "sans-serif"],
        "data-mono": ["IBM Plex Mono", "monospace"],
      },
      fontSize: {
        "label-caps": ["11px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "700" }],
        "body-sm": ["12px", { lineHeight: "18px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "display-sm": ["20px", { lineHeight: "28px", fontWeight: "500" }],
        "display-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "display-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "data-mono": ["13px", { lineHeight: "16px", letterSpacing: "0.01em", fontWeight: "500" }],
      },
    },
  },
  plugins: [],
};
