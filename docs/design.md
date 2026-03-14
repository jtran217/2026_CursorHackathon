# Design & Style Guide

Design and style guide for the 2026 Cursor Hackathon productivity and wellness assistant. The app helps people work smarter when their brain feels overwhelmed by detecting cognitive overload and guiding them through short recovery flows.

---

## 1. Design Philosophy

- **Calm, not clinical** — The UI should feel supportive and reassuring, never alarming. Avoid stress-inducing visuals (e.g., aggressive reds, urgent flashing).
- **Low friction** — Every action (start session, request intervention, log journal) should feel lightweight. Few clicks, clear CTAs.
- **Desktop-first** — Optimized for a single window on a desktop/laptop. Dense but breathable layouts; no mobile-first constraints.
- **Progressive disclosure** — Show only what’s needed per screen. Home = overview; Focus = minimal + timer; Intervention = one clear flow at a time.

---

## 2. Visual Identity

### 2.1 Brand feel

- **Friendly and grounded** — “No Stress” / wellness assistant tone.
- **Trustworthy** — Data (heart rate, Focus Strain, session stats) should feel accurate and private.
- **Recovery-oriented** — Screens should support “reset → refocus → continue” rather than adding more tasks or guilt.

### 2.2 Naming and copy

- Avoid labeling the state “Overwhelmed” in the UI. Prefer neutral or supportive terms, e.g.:
  - “Focus strain,” “Recovery mode,” “Time to reset,” “Pause & reset,” “Need a break?”
- Use short, actionable microcopy for interventions: “Take a breath,” “Short walk,” “Clarify next step,” “Start a focus block.”

---

## 3. Color System

Use CSS custom properties so light/dark themes and future tweaks stay consistent.

### 3.1 Semantic palette

| Role | Light | Dark | Usage |
|------|--------|------|--------|
| **Background (primary)** | `#f8fafc` | `#0f172a` | Main app background |
| **Background (elevated)** | `#ffffff` | `#1e293b` | Cards, modals, popovers |
| **Text (primary)** | `#0f172a` | `#f1f5f9` | Headings, body |
| **Text (secondary)** | `#64748b` | `#94a3b8` | Labels, hints, metadata |
| **Accent (primary)** | `#0ea5e9` | `#38bdf8` | Primary actions, links, key metrics |
| **Accent (calm)** | `#10b981` | `#34d399` | Success, “recovered,” positive states |
| **Focus strain (caution)** | `#f59e0b` | `#fbbf24` | Elevated strain, “time to pause” |
| **Focus strain (high)** | `#dc2626` | `#f87171` | High strain — use sparingly, never pulsing/flashing |
| **Border** | `#e2e8f0` | `#334155` | Dividers, card borders |

### 3.2 Heart rate and strain

- **Heart rate** — Use accent primary for the numeric value; optional subtle gradient or icon (e.g., heart) in the same hue.
- **Focus Strain score** — Prefer a single color scale (e.g., accent → caution → high) or a simple “low / medium / high” label with the above semantic colors. No red-only overload indicator; pair with a supportive message (“Time for a short break”) rather than alarm.

---

## 4. Typography

- **Font stack**: Prefer a friendly, readable sans (e.g. `Inter`, `DM Sans`, or `Plus Jakarta Sans`) as in the codebase. Keep `Inter` for consistency with current `global.css` unless the team explicitly switches.
- **Weights**: Regular (400) for body, Medium (500) for labels and buttons, Semibold (600) for headings and key numbers.
- **Scale** (reference; implement with Tailwind or equivalent):
  - **Display / Hero**: ~2.5rem–3rem — e.g. current HR, big timer.
  - **H1**: ~1.5rem–1.75rem — Screen titles.
  - **H2**: ~1.25rem — Section titles (e.g. “Session summary”).
  - **Body**: ~1rem — Default copy.
  - **Small / caption**: ~0.875rem — Timestamps, labels, hints.

---

## 5. Layout & Spacing

- **Desktop-first**: Target min width ~1024px for main layout; ensure usable down to ~800px.
- **Spacing scale**: Use a consistent scale (e.g. 4, 8, 12, 16, 24, 32, 48 px). Generous padding on intervention and journal screens to keep them calm.
- **Containers**: Max content width ~720–900px for reading-heavy screens (e.g. Session Summary, Journal); full width acceptable for Home dashboard and Focus mode.

---

## 6. Screen-by-Screen Guidelines

### 6.1 Home

- **Purpose**: At-a-glance status and session control.
- **Elements**:
  - **Current HR** — Prominent number + optional small trend or “simulated” badge.
  - **Status** — One clear line for “Focus strain” or “Recovery” state (avoid “Overwhelmed”). Use semantic colors.
  - **Session** — Start / Stop primary control; current session duration visible when running.
- **Layout**: Card-based or clear sections; primary CTA (Start/Stop) obvious. Optional small chart or history strip for HR over time (P1).

### 6.2 Focus Mode (session state)

- **Purpose**: Minimal distraction; timer + optional manual intervention.
- **Style**: Minimal UI — large timer, subtle branding, one primary action “I need a break” or “Pause for intervention.”
- **Colors**: Muted background; accent only for timer and CTA. No extra cards unless necessary.

### 6.3 Intervention Screen (session state)

- **Purpose**: Decompress, suggest a break, encourage reflection, then re-engage.
- **Flow**: Single focus per step: e.g. “Take a breath” → “Short walk?” → “What are you working on? What’s the one next step?” → “Re-initialize timer.”
- **Style**: One main message or question per view; big, tappable options (e.g. “Breathing exercise,” “Clarify my next step”). Soft backgrounds and plenty of whitespace. Clear “Done / Continue” to return to Focus or Home.

### 6.4 Session Summary (session complete)

- **Purpose**: Breakdown of the session without overwhelming.
- **Elements**: Duration, HR summary (min/avg/max if available), number of interventions, optional Focus Strain over time. Short, scannable list or table.
- **Style**: Elevated card/section; secondary text for labels. Optional “Add to journal” or “Start next session” CTA.

### 6.5 Journal

- **Purpose**: Entries, logs, HR history, history of cognitive overload events.
- **Elements**: List or timeline of entries; each entry can show date, snippet, HR, and “overload” or “intervention” tags.
- **Style**: Readable list or cards; filters (e.g. by date, by type) if needed. Calm, document-like layout; avoid dashboard clutter.

---

## 7. Components

### 7.1 Buttons

- **Primary**: Accent background (e.g. `#0ea5e9` light / `#38bdf8` dark), white text, rounded (e.g. 8px). Used for Start/Stop, “Begin intervention,” “Continue.”
- **Secondary**: Border only, transparent or elevated background; same radius. Used for “Skip,” “Later,” “Manual break.”
- **Ghost**: No border, subtle hover background. Used for low-emphasis actions (e.g. “Add to journal”).
- **States**: Clear hover and focus (e.g. outline or ring); disabled state with reduced opacity.

### 7.2 Cards & panels

- **Background**: Elevated background token; border optional (border token).
- **Radius**: 8–12px.
- **Padding**: 16–24px for content; use for status blocks, session summary blocks, journal entries.

### 7.3 Status indicators

- **HR / Strain**: Numeric value + optional dot or pill with semantic color (e.g. green / amber / red for strain level). Keep the palette consistent with Section 3.
- **Session state**: Small label or badge (“Focus,” “Paused,” “Recovery”) with matching color.

### 7.4 Timer

- **Focus mode**: Large, clear type (e.g. `tabular-nums`), accent or primary text. Optional progress ring or bar for session length.

### 7.5 Inputs (Journal, forms)

- **Text fields**: Subtle border, same radius as buttons; focus ring in accent. Placeholder and helper text in secondary color.
- **Labels**: Above or left of field, small/caption size, secondary color.

---

## 8. Motion & Feedback

- **Transitions**: Short (150–250ms) for hover, focus, and panel open/close. Prefer `ease-out` or a mild ease.
- **Intervention flow**: Optional gentle fade or slide between steps; avoid fast or distracting motion.
- **Reduced motion**: Respect `prefers-reduced-motion` (disable or simplify animations).
- **Loading**: Subtle spinner or skeleton for HR or session data; avoid busy or alarming loaders.

---

## 9. Accessibility

- **Contrast**: Ensure text and interactive elements meet WCAG AA (e.g. 4.5:1 for normal text).
- **Focus**: Visible focus ring (e.g. 2px accent outline) on all interactive elements.
- **Labels**: All inputs and icon buttons have accessible names (aria-label or visible text).
- **Status changes**: Important status changes (e.g. “Intervention suggested”) can be announced via live region if needed.

---

## 10. Technical Notes

- **Stack**: Tailwind CSS in use; extend theme in `tailwind.config` with the color and spacing tokens above.
- **Theming**: Current `global.css` uses `color-scheme: light dark` and media query for light/dark. Align new CSS variables with `:root` and `@media (prefers-color-scheme: light)` so all screens support both modes.
- **Python HR server**: No direct impact on visual design; ensure payload (e.g. HR, timestamps) is reflected in the UI with the same semantic colors and components (e.g. “Current HR” on Home, optional history in Journal).

---

## 11. Summary Checklist

- [ ] Use semantic color tokens for background, text, accent, and strain levels.
- [ ] Avoid “Overwhelmed” in UI; use “Focus strain,” “Recovery,” “Time to reset,” etc.
- [ ] Home: HR + status + session Start/Stop clearly visible.
- [ ] Focus mode: Minimal UI, large timer, one main “need a break” action.
- [ ] Intervention: One clear step per view, big CTAs, calm layout.
- [ ] Session Summary & Journal: Scannable, document-like, elevated cards where needed.
- [ ] Buttons: Primary / secondary / ghost with clear states.
- [ ] Motion: Short, subtle; respect reduced motion.
- [ ] Accessibility: Contrast, focus rings, labels.
- [ ] Align Tailwind and `global.css` with this palette and typography.

This design guide is the single source of truth for visual and interaction design for the MVP and can be updated as features (e.g. P1 desktop/browser activity, session stats, demo modes) are added.
