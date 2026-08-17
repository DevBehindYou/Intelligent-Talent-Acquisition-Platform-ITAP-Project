---
name: Precision Instrument
colors:
  surface: '#f8f9ff'
  surface-dim: '#cddbef'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e4efff'
  surface-container-high: '#dbe9fd'
  surface-container-highest: '#d5e4f7'
  on-surface: '#0e1d2a'
  on-surface-variant: '#41474d'
  inverse-surface: '#243240'
  inverse-on-surface: '#e9f1ff'
  outline: '#72787e'
  outline-variant: '#c1c7ce'
  surface-tint: '#356381'
  primary: '#003751'
  on-primary: '#ffffff'
  primary-container: '#1d4e6b'
  on-primary-container: '#92bfe0'
  inverse-primary: '#9fccee'
  secondary: '#805600'
  on-secondary: '#ffffff'
  secondary-container: '#fec163'
  on-secondary-container: '#764e00'
  tertiary: '#4b2c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#66420f'
  on-tertiary-container: '#e3b073'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c8e6ff'
  primary-fixed-dim: '#9fccee'
  on-primary-fixed: '#001e2f'
  on-primary-fixed-variant: '#194b68'
  secondary-fixed: '#ffddb0'
  secondary-fixed-dim: '#f8bc5e'
  on-secondary-fixed: '#291800'
  on-secondary-fixed-variant: '#614000'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#f1bd7f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#633f0c'
  background: '#f8f9ff'
  on-background: '#0e1d2a'
  surface-variant: '#d5e4f7'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  display-sm:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  data-mono:
    fontFamily: IBM Plex Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system is built on the philosophy of an "Instrument, Not a Dashboard." It avoids the fluff of modern consumer software in favor of high-density, high-utility interfaces designed for professional rigor. The visual narrative is disciplined, cool-toned, and functional, prioritizing the speed of data interpretation and the transparency of AI-driven insights.

The style is **Corporate Modern with a Technical Edge**, leaning into precision engineering aesthetics. It utilizes a restrained color palette, hairline dividers, and monospaced accents to create a sense of mechanical reliability. The atmosphere is calm and authoritative, ensuring that AI suggestions (highlighted in brass) feel like calibrated readings rather than intrusive interruptions.

## Colors
The palette is rooted in deep architectural tones. **Prussian Blue** serves as the primary interactive driver, used for actions and structural branding. **Ink** provides the heaviest weight for text and the global sidebar, creating a grounded "anchor" for the eye.

**Brass** is reserved exclusively as a functional signal for AI-derived data—scores, confidence intervals, and highlights—ensuring these elements are instantly discoverable without being garish. **Canvas** and **Paper** create a tiered light environment that reduces eye strain during long periods of data analysis. The **Slate** tone is used for low-level metadata and hairline structural borders, maintaining a high-density layout without visual clutter.

## Typography
Typography is organized by function:
- **Space Grotesk** is used for headers and display titles. Its geometric, slightly technical character reinforces the "instrument" theme.
- **Inter** is the workhorse for all body copy and UI controls, chosen for its exceptional legibility at small sizes and neutral tone.
- **IBM Plex Mono** is the "Data Font." It is used for all numerical values, Match IDs, system statuses, and AI confidence scores. Its fixed-width nature allows for easy vertical scanning of data tables.

All caps are used sparingly for category labels and table headers to create clear vertical segmentation.

## Layout & Spacing
The design system utilizes a **4px baseline grid** to achieve high data density. 
- **Desktop:** A 12-column fluid grid with 16px gutters. Margins are fixed at 32px.
- **Sidebars:** The primary navigation (Ink) is fixed at 240px. The Copilot drawer (Ink) is fixed at 360px on the right.
- **Density:** Padding within cards and table rows should lean toward "Compact," typically using 12px or 16px (3x or 4x base units).

Information density is prioritized over whitespace. Alignment should be rigorous, favoring flush-left alignment for text and tabular figures for numbers.

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **Hairline Outlines** rather than soft shadows.
- **Level 0 (Canvas):** The base application background (#F5F6F8).
- **Level 1 (Paper):** Content containers, cards, and data rows (#FFFFFF). These are defined by a 1px solid border in Slate (#5B6B7C at 20% opacity) rather than a shadow.
- **Level 2 (Active/Floating):** Modals or active dropdowns use a crisp 4px shadow with 10% opacity, tinted with the Ink color to maintain a cool temperature.
- **The Copilot Drawer:** A unique "inverted" surface using the Ink background. This creates a clear mental model: light surfaces are for user data/input, dark surfaces are for AI assistance and system-level intelligence.

## Shapes
The shape language is precise and architectural. A base **4px radius (Soft)** is used for small components like buttons, inputs, and tags. **8px (rounded-lg)** is the standard for cards and main content containers. This keeps the interface feeling "engineered" and sharp.

The signature element is the **Match Dial**, a semi-circular gauge that visualizes AI scores. It should use a 2px stroke weight with the "Brass" color for the value indicator and "Slate" (low opacity) for the track.

## Components
- **Buttons:** Primary buttons use Prussian Blue with white text. Secondary buttons use a Slate hairline border and Ink text. Text is 14px Inter Medium.
- **Inputs:** Fields are 32px or 36px in height with a 1px Slate border. On focus, the border transitions to Prussian Blue.
- **Match Dial:** A semi-circular gauge. The numerical value inside the dial must be rendered in IBM Plex Mono.
- **Data Rows:** Use 1px hairline dividers (#5B6B7C at 15%). Alternate row striping is not used; instead, use a subtle hover state change to #F5F6F8.
- **AI Highlighters:** Text or cells identified by AI should feature a subtle "Brass" left-edge accent (3px width) or a very pale Brass background tint (5-10% opacity).
- **Copilot Drawer:** Dark mode component (Ink background). All text within is white or Slate-tinted. Links within the drawer use a brightened version of Brass for visibility.
- **Chips/Tags:** Small, rectangular (4px radius), using IBM Plex Mono for the label. Backgrounds are Slate-light or Brass-light depending on whether the tag is system-generated or AI-generated.