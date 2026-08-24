---
name: MailOS Administration Terminal
colors:
  surface: '#0f1418'
  surface-dim: '#0f1418'
  surface-bright: '#353a3e'
  surface-container-lowest: '#0a0f13'
  surface-container-low: '#171c20'
  surface-container: '#1b2024'
  surface-container-high: '#252b2f'
  surface-container-highest: '#30353a'
  on-surface: '#dee3e9'
  on-surface-variant: '#bec8d2'
  inverse-surface: '#dee3e9'
  inverse-on-surface: '#2c3135'
  outline: '#88929b'
  outline-variant: '#3e4850'
  surface-tint: '#89ceff'
  primary: '#89ceff'
  on-primary: '#00344d'
  primary-container: '#0ea5e9'
  on-primary-container: '#003751'
  inverse-primary: '#006591'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#d88a00'
  on-tertiary-container: '#4a2c00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c9e6ff'
  primary-fixed-dim: '#89ceff'
  on-primary-fixed: '#001e2f'
  on-primary-fixed-variant: '#004c6e'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0f1418'
  on-background: '#dee3e9'
  surface-variant: '#30353a'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '450'
    lineHeight: 20px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 20px
  sidebar_width: 260px
---

## Brand & Style

This design system is engineered for high-density server environments where clarity, speed, and technical precision are paramount. The aesthetic follows a **Modern Corporate** approach with **Glassmorphism** and **Developer-Centric** influences. 

The personality is authoritative and calm. It prioritizes data integrity and system status through a "Command Center" visual metaphor. The UI utilizes deep layering, subtle transparency, and sharp iconography to create a sophisticated environment for systems administrators. The emotional response should be one of total control and absolute reliability.

## Colors

The palette is optimized for long-duration monitoring in low-light environments. 

- **Primary (Cloud Blue):** Used for primary actions, active navigation states, and focused input borders.
- **Success (Healthy Green):** Reserved for "Up" status, completed migrations, and secure connections.
- **Warning (Caution Yellow):** Used for non-critical resource spikes and pending updates.
- **Critical (Error Red):** High-visibility tone for service outages, unauthorized access attempts, and disk failures.
- **Neutrals:** The background utilizes **Slate-950** for the deepest layers, while **Neutral-900** is used for elevated surface containers to create a clear visual hierarchy.

## Typography

This design system employs a dual-typeface strategy to distinguish between UI orchestration and raw data.

- **Inter:** The primary workhorse for navigation, headings, and instructional text. It provides a modern, legible feel that balances the technical nature of the product.
- **JetBrains Mono:** Dedicated to technical variables, IP addresses, logs, and metric values. The increased x-height and distinct character shapes prevent reading errors in critical data strings.

For mobile, `display-lg` should scale down to 24px to ensure dashboard metrics remain visible without excessive scrolling.

## Layout & Spacing

The system uses a **Fixed-Fluid Hybrid** layout. 
- **Sidebar:** Fixed at 260px, providing a persistent anchor for global navigation.
- **Main Content:** A fluid 12-column grid that adapts to the viewport.
- **Dashboard Widgets:** Use a modular masonry-style layout. Widgets should span 3, 4, 6, or 12 columns depending on data complexity.

Spacing follows a 4px baseline grid. Dashboard views should utilize `lg` (24px) margins between major modules to prevent visual clutter and eye fatigue.

## Elevation & Depth

Depth is conveyed through **Tonal Layering** and **Glassmorphism** rather than traditional heavy shadows.

1.  **Level 0 (Base):** Slate-950. The canvas.
2.  **Level 1 (Cards/Widgets):** Neutral-900 with a 1px border of Slate-800.
3.  **Level 2 (Modals/Popovers):** Neutral-800 with a 40% opacity backdrop-blur (12px) to signify a temporary overlay.
4.  **Indicators:** Active states use a subtle inner-glow (0.5px) of the primary color to simulate an illuminated hardware LED.

Shadows, if used, must be ultra-diffused: `0 10px 30px -10px rgba(0,0,0,0.5)`.

## Shapes

The design system utilizes **Rounded** (0.5rem) corners for standard UI components. This softens the technical density of the dashboard while maintaining a professional structure.

- **Small Components:** Checkboxes and small badges use `rounded-sm` (2px).
- **Standard Elements:** Buttons, input fields, and widgets use `rounded-md` (8px).
- **Search Bars/Tags:** Often utilize `rounded-full` to distinguish them from structural data containers.

## Components

### Buttons
- **Primary:** Cloud Blue background, white text. No gradient.
- **Secondary:** Ghost style, 1px Slate-800 border, Slate-300 text.
- **Critical:** Rose-500 solid for "Delete Server" or "Stop Service" actions.

### Terminal Blocks
Containers with a solid black background, JetBrains Mono text in green or white. Must include a "Copy to Clipboard" utility in the top-right corner.

### Status Badges
Small, pill-shaped indicators. They use a 10% opacity background of the status color with a 100% opacity text and a 2px center-aligned dot (e.g., Green dot for "Online").

### Charts
High-contrast line and bar charts. Use Primary Blue for the main data stream. Grid lines should be Slate-800, barely visible, to keep the focus on the trend lines.

### Sidebar Navigation
The sidebar should be Neutral-900. Active links use a left-aligned 3px Cloud Blue vertical border and a subtle text highlight. Icons are essential for every nav item to ensure quick scanning.

### Cards & Widgets
Every card must have a header area with a title in `label-caps` and an optional "More" menu. Borders are consistently 1px Slate-800.