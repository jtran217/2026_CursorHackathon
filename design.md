# Design System — Flow

> A desktop-first wellness and focus assistant. Detects cognitive overload. Guides recovery.

---

## Aesthetic Direction

**"Warm Obsidian"** — the precision of a medical device, the warmth of a journal, the restraint of Japanese minimalism.

Flow is not a productivity app. It's a recovery app. The design must never feel urgent, cluttered, or demanding. Every screen should feel like stepping into a quiet room.

The visual language draws from:
- **Oura Ring** — biometric precision, dark surfaces, quiet confidence
- **Arc Browser** — personality without noise, color as intention
- **Muji** — negative space is not emptiness, it is the point

**What this is NOT**: glassy cards, purple AI gradients, animated blob backgrounds, generic dashboard grids, neon on black.

---

## Color System

All colors defined as CSS variables on `:root`.

```css
:root {
  /* ── Base Surfaces ── */
  --color-bg-base:       #0C0A09;   /* warm near-black, the canvas */
  --color-bg-elevated:   #141210;   /* cards, panels */
  --color-bg-sunken:     #090807;   /* inset fields, data wells */
  --color-bg-overlay:    #1C1917;   /* modals, popovers */

  /* ── Borders ── */
  --color-border-subtle: #2A2522;   /* default borders */
  --color-border-muted:  #3D3733;   /* hover, active borders */
  --color-border-strong: #5C5550;   /* focus rings */

  /* ── Text ── */
  --color-text-primary:  #F5F0EB;   /* headings, key data */
  --color-text-secondary:#A89F98;   /* labels, supporting copy */
  --color-text-tertiary: #6B625C;   /* placeholders, timestamps */
  --color-text-inverse:  #0C0A09;   /* text on light accents */

  /* ── Accent: Ember (default / calm state) ── */
  --color-ember-50:      #FDF5EE;
  --color-ember-100:     #FAE3CC;
  --color-ember-200:     #F4C28E;
  --color-ember-300:     #EDA05A;   /* primary accent */
  --color-ember-400:     #E5832A;
  --color-ember-500:     #C06520;
  --color-ember-600:     #8A4616;

  /* ── State: Sage (calm / recovered) ── */
  --color-sage-300:      #8FB5A0;
  --color-sage-400:      #6A9B85;
  --color-sage-500:      #4D7F6A;

  /* ── State: Rose (elevated / attention) ── */
  --color-rose-300:      #D4867A;
  --color-rose-400:      #C26058;
  --color-rose-500:      #A34840;

  /* ── State: Clay (overload / intervention) ── */
  --color-clay-300:      #C4896A;
  --color-clay-400:      #B06B4A;
  --color-clay-500:      #8F5035;

  /* ── Data Visualization ── */
  --color-data-hr:       #EDA05A;   /* heart rate line */
  --color-data-strain:   #C26058;   /* strain / stress overlay */
  --color-data-focus:    #6A9B85;   /* focused / productive time */
  --color-data-idle:     #3D3733;   /* idle / background */
}
```

### State Color Mapping

| Cognitive State | Surface Tint | Accent | HR Indicator |
|---|---|---|---|
| **Calm** | base | `--color-sage-400` | green pulse |
| **Normal** | base | `--color-ember-300` | amber pulse |
| **Elevated** | base + warm tint | `--color-rose-400` | rose pulse |
| **Overload** | overlay | `--color-clay-400` | clay pulse + glow |

Transitions between states should take **1800ms** with an ease-in-out curve. State color shifts should never be abrupt.

---

## Typography

```css
/* Import in global CSS */
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist+Mono:wght@300;400;500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');
```

### Typeface Roles

| Role | Family | Use Case |
|---|---|---|
| **Display** | `Instrument Serif` | Screen titles, hero numbers (HR), session headers |
| **Data / Mono** | `Geist Mono` | Heart rate readout, timer, scores, timestamps |
| **UI / Body** | `DM Sans` | Labels, body copy, buttons, navigation |

### Scale

```css
:root {
  /* Display — Instrument Serif */
  --text-display-xl:  clamp(56px, 8vw, 96px);   /* hero HR number */
  --text-display-lg:  clamp(36px, 5vw, 56px);   /* screen titles */
  --text-display-md:  clamp(24px, 3vw, 36px);   /* section headers */

  /* Mono — Geist Mono */
  --text-mono-lg:     28px;    /* timer, score readout */
  --text-mono-md:     18px;    /* secondary data */
  --text-mono-sm:     13px;    /* axis labels, metadata */

  /* UI — DM Sans */
  --text-ui-lg:       17px;    /* card titles, action labels */
  --text-ui-md:       15px;    /* body, descriptions */
  --text-ui-sm:       13px;    /* captions, timestamps */
  --text-ui-xs:       11px;    /* status chips, fine print */

  /* Line Heights */
  --leading-tight:    1.1;
  --leading-snug:     1.3;
  --leading-normal:   1.5;
  --leading-relaxed:  1.7;

  /* Letter Spacing */
  --tracking-tight:   -0.03em;
  --tracking-normal:   0em;
  --tracking-wide:     0.08em;
  --tracking-widest:   0.15em;
}
```

### Typography Rules

- **Heart rate number**: `Instrument Serif`, `--text-display-xl`, `--color-text-primary`, `--tracking-tight`
- **Timer**: `Geist Mono`, `--text-mono-lg`, `--color-text-secondary`, tabular-nums
- **Focus Strain Score**: `Geist Mono`, `--text-mono-md`, colored by state
- **Screen titles**: `Instrument Serif` italic, `--text-display-md`
- **Labels / Caps**: `DM Sans`, `--text-ui-xs`, `--tracking-widest`, uppercase, `--color-text-tertiary`
- **Body / descriptions**: `DM Sans`, `--text-ui-md`, `--leading-relaxed`

---

## Spacing System

An 8px base grid. All spacing values are multiples of 4px.

```css
:root {
  --space-1:   4px;
  --space-2:   8px;
  --space-3:   12px;
  --space-4:   16px;
  --space-5:   20px;
  --space-6:   24px;
  --space-8:   32px;
  --space-10:  40px;
  --space-12:  48px;
  --space-16:  64px;
  --space-20:  80px;
  --space-24:  96px;
  --space-32:  128px;

  /* Layout */
  --sidebar-width:      220px;
  --content-max-width:  760px;
  --panel-padding:      var(--space-8);
  --card-padding:       var(--space-6);
  --card-padding-sm:    var(--space-4);
}
```

### Spatial Principles

- Screens should breathe. Default to **more space** than feels necessary.
- Primary data (HR, timer, score) should be **isolated** with generous surrounding space — never crowded by supporting elements.
- Cards and panels use a **1px warm border** (`--color-border-subtle`) rather than shadows.
- Shadows are reserved for **overlays and modals** only.

---

## Border Radius

```css
:root {
  --radius-sm:   4px;    /* chips, small badges */
  --radius-md:   8px;    /* buttons, inputs */
  --radius-lg:   12px;   /* cards, panels */
  --radius-xl:   20px;   /* large cards, overlays */
  --radius-full: 9999px; /* pill buttons, avatars */
}
```

---

## Component Patterns

### Cards

Cards are the primary container unit. They sit on `--color-bg-elevated`, bordered with `--color-border-subtle`.

```css
.card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--card-padding);
}

.card:hover {
  border-color: var(--color-border-muted);
  transition: border-color 200ms ease;
}

/* Data well — sunken inset inside cards */
.data-well {
  background: var(--color-bg-sunken);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
}
```

### Buttons

```css
/* Primary — filled amber */
.btn-primary {
  font-family: 'DM Sans', sans-serif;
  font-size: var(--text-ui-md);
  font-weight: 500;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  background: var(--color-ember-300);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-8);
  cursor: pointer;
  transition: background 150ms ease, transform 100ms ease;
}
.btn-primary:hover  { background: var(--color-ember-400); }
.btn-primary:active { transform: scale(0.98); }

/* Ghost — outlined */
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-muted);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  transition: border-color 150ms ease, color 150ms ease;
}
.btn-ghost:hover {
  border-color: var(--color-border-strong);
  color: var(--color-text-primary);
}

/* Danger — for "I'm Overwhelmed" manual trigger */
.btn-signal {
  background: transparent;
  color: var(--color-rose-300);
  border: 1px solid var(--color-rose-500);
  border-radius: var(--radius-full);
  padding: var(--space-3) var(--space-8);
  font-size: var(--text-ui-sm);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  transition: all 200ms ease;
}
.btn-signal:hover {
  background: rgba(194, 96, 88, 0.08);
  border-color: var(--color-rose-400);
  color: var(--color-rose-300);
}
```

### Status Indicator / Pulse Dot

The living signal that the app is actively monitoring.

```css
.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  position: relative;
}
.pulse-dot::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1px solid currentColor;
  opacity: 0;
  animation: pulse-ring 2s ease-out infinite;
}
@keyframes pulse-ring {
  0%   { opacity: 0.6; transform: scale(0.8); }
  100% { opacity: 0;   transform: scale(2.2); }
}

/* State variants */
.pulse-dot--calm     { color: var(--color-sage-400); }
.pulse-dot--normal   { color: var(--color-ember-300); }
.pulse-dot--elevated { color: var(--color-rose-400); animation-duration: 1.2s; }
.pulse-dot--overload { color: var(--color-clay-400); animation-duration: 0.8s; }
```

### Heart Rate Display

The primary data element. Should feel like a precision instrument.

```css
.hr-display {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
}
.hr-display__label {
  font-family: 'DM Sans', sans-serif;
  font-size: var(--text-ui-xs);
  font-weight: 400;
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}
.hr-display__value {
  font-family: 'Instrument Serif', serif;
  font-size: var(--text-display-xl);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--color-text-primary);
  /* tabular-nums equivalent for serif */
  font-variant-numeric: tabular-nums;
}
.hr-display__unit {
  font-family: 'Geist Mono', monospace;
  font-size: var(--text-mono-sm);
  color: var(--color-text-tertiary);
  letter-spacing: var(--tracking-wide);
  margin-left: var(--space-1);
}
```

### Focus Strain Score

A compound metric. Shows a number 0–100 colored by zone.

```css
.strain-score {
  font-family: 'Geist Mono', monospace;
  font-size: var(--text-mono-md);
  font-weight: 500;
  letter-spacing: -0.02em;
}
.strain-score--low      { color: var(--color-sage-400); }
.strain-score--moderate { color: var(--color-ember-300); }
.strain-score--high     { color: var(--color-rose-400); }
.strain-score--critical { color: var(--color-clay-400); }
```

### Sparkline / HR Chart

Minimal inline chart. No axes, no gridlines by default — just the signal.

```
Visual: a single continuous line on a dark field.
- Line color: --color-data-hr
- Filled area below line: rgba of --color-data-hr at 8% opacity
- Line weight: 1.5px
- No tick marks, no labels on the chart itself
- Optional: subtle vertical marker for intervention events (1px, --color-border-muted)
- Aspect ratio: wide and short — approximately 4:1
```

### Navigation (Sidebar)

Left sidebar, 220px wide. Icon + label. Minimalist.

```
- Background: --color-bg-base (flush with canvas, no border, no elevation)
- Separator: 1px right border, --color-border-subtle
- Nav items: DM Sans, --text-ui-sm, --color-text-tertiary default
- Active: --color-text-primary, left accent bar 2px --color-ember-300
- Icon: 16px, line style (not filled)
- No hover backgrounds — only color transitions
```

### Chip / Badge

```css
.chip {
  font-family: 'DM Sans', sans-serif;
  font-size: var(--text-ui-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}
.chip--calm     { color: var(--color-sage-400);  border-color: var(--color-sage-500);  background: rgba(74, 155, 133, 0.08); }
.chip--elevated { color: var(--color-rose-300);  border-color: var(--color-rose-500);  background: rgba(194, 96, 88, 0.08);  }
.chip--focus    { color: var(--color-ember-300); border-color: var(--color-ember-500); background: rgba(237, 160, 90, 0.08); }
```

---

## Motion & Animation Principles

### Philosophy

Flow's animations should feel **biological, not mechanical**. Ease curves should mimic breathing or a heartbeat — slow in, slow out, with organic imprecision. Nothing should snap or bounce.

### Core Curves

```css
:root {
  --ease-flow:    cubic-bezier(0.4, 0, 0.2, 1);   /* standard */
  --ease-emerge:  cubic-bezier(0.0, 0, 0.2, 1);   /* things appearing */
  --ease-recede:  cubic-bezier(0.4, 0, 1, 1);     /* things disappearing */
  --ease-breath:  cubic-bezier(0.45, 0.05, 0.55, 0.95); /* breathing animations */
}
```

### Duration Scale

```css
:root {
  --duration-instant:     80ms;   /* hover states, checkbox ticks */
  --duration-fast:        150ms;  /* button feedback, chip appearance */
  --duration-normal:      300ms;  /* panel reveals, card transitions */
  --duration-slow:        600ms;  /* screen transitions, state changes */
  --duration-deliberate: 1200ms;  /* breathing guide, state escalation */
  --duration-state:      1800ms;  /* full cognitive state color shift */
}
```

### Key Animations

**Screen Transitions**: Crossfade with subtle upward drift (8px translate Y). Duration: 300ms.

**Cognitive State Shift**: When the app detects a state change (calm → elevated → overload), the entire UI's accent color transitions over 1800ms. Subtle background tint shifts. The HR number "breathes" — its opacity pulses once at 60% to signal the change.

**Intervention Entry**: The intervention panel slides in from the bottom (24px translate Y → 0) with a simultaneous background dimming of the parent screen. Duration: 600ms, `--ease-emerge`.

**Breathing Guide**: A circular element that expands and contracts on a 4-second inhale / 4-second exhale cycle. Uses `transform: scale()` between 0.85 and 1.15. Timing: `--ease-breath`, running forever.

**Timer Tick**: Each second, the timer number fades to 85% opacity then returns to 100% over 400ms. Subtle — confirms time is passing.

**Session Start**: Staggered reveal. Status dot fades in first (0ms), then HR display (150ms delay), then supporting data (300ms delay). Each fades in with a 12px upward drift.

---

## Iconography

- **Style**: Lucide icons (line, not filled). 16px for UI, 20px for nav.
- **Stroke width**: 1.5px
- **Color**: Inherit from parent context (`currentColor`)
- **No icon-only buttons** without tooltips

---

## Screen-Specific Design Notes

### Home Screen

The resting state. Most time will be spent here.

```
Layout:
  - Left sidebar navigation
  - Main content area: two-column grid
    Left (wider): HR display + sparkline + state chip
    Right: Session card + strain score + session start/stop

Design Intent:
  - The HR number should be the largest element on screen
  - Session control (start/stop) is a single clear CTA
  - "I'm Overwhelmed" button lives here but doesn't compete visually
    — ghost style, positioned below primary session actions
  - Sparkline shows last 30 minutes of HR data inline beneath the number

HR Number Typography:
  - Instrument Serif, display-xl, white
  - Animated: when value changes, old number fades out (100ms)
    and new number fades in with a 4px upward drift (150ms)
```

### Focus Mode Screen

Minimal. Almost nothing. The user is working.

```
Layout:
  - Full screen. No sidebar.
  - Centered vertically and horizontally.
  - Only elements visible:
      1. Session timer (Geist Mono, --text-mono-lg, centered)
      2. A single tiny pulse dot top-right (confirms monitoring is active)
      3. A barely-visible "End Session" text link bottom-center

Design Intent:
  - Background: --color-bg-base. Nothing else.
  - The timer is the only thing on screen.
  - Intervention button is hidden — but a subtle "●●●" overflow menu appears
    on mouse movement, fades out after 3 seconds of inactivity.
  - If cognitive state is elevated, a very subtle warm tint enters the
    background (rgba of --color-rose-500 at 3% opacity). User may not notice
    consciously — that is intentional.
```

### Intervention Screen

The most emotionally critical screen. Must feel safe, not alarming.

```
Layout:
  - Slides over Focus Mode (Focus Mode dims to 40% opacity behind it)
  - Centered modal — not full screen. Max width 480px.
  - Three sequential phases (shown one at a time):
      Phase 1: Acknowledge   — "Let's take a moment."
      Phase 2: Decompress    — Breathing exercise with animated guide
      Phase 3: Refocus       — Ask what user is working on + suggest next step

Design Intent:
  - Background: --color-bg-overlay with 2px border --color-border-muted
  - Rounded corners: --radius-xl
  - No red. No alarming language. No urgency.
  - Headline: Instrument Serif italic. Large. Calm.
  - Breathing circle: 120px diameter, border only (no fill), expands/contracts
    with --ease-breath on 8s cycle
  - Progress through phases: a 3-dot stepper at the top
  - "Refocus" phase uses a textarea with warm placeholder text,
    and Claude API generates a one-sentence reentry suggestion
  - CTA at each phase: single primary button, right-aligned
    Phase 1: "I'm ready"
    Phase 2: "That helped" / skip option
    Phase 3: "Let's go"
```

### Session Summary Screen

Post-session debrief. Should feel like a thoughtful journal entry, not a dashboard.

```
Layout:
  - No sidebar (full-width, centered content)
  - Max content width: 640px, centered
  - Sections stacked vertically with generous space between:
      1. Session duration + date (Geist Mono, tertiary)
      2. Headline stat — Focus Quality score (display-lg, Instrument Serif)
      3. HR sparkline across full session (wider aspect ratio, 6:1)
      4. Three stat cards in a row: Avg HR / Peak Strain / Interventions
      5. AI-generated one-paragraph session reflection (DM Sans, leading-relaxed)
      6. CTA: "Save to Journal" (ghost) + "Start New Session" (primary)

Design Intent:
  - Stagger the reveal of elements on mount: each section animates in
    with 100ms delay between them
  - The "Focus Quality" number counts up from 0 to its value over 1.2s on load
  - The session reflection text streams in word-by-word (Claude API)
```

### Journal Screen

A chronological record. Calming and archival.

```
Layout:
  - Left sidebar navigation
  - List of session entries, reverse chronological
  - Each entry: date (mono), duration chip, focus quality score, 1-line excerpt
  - Clicking an entry expands it (inline, not a new screen) to full summary view

Design Intent:
  - Timeline feel: vertical line connects entries on the left
    (1px, --color-border-subtle)
  - Date headers group by week: "This Week", "Last Week", "March 2026"
    — displayed as floating labels, DM Sans, xs, widest tracking, tertiary color
  - Empty state: Instrument Serif italic "Your first session will appear here."
    — centered, tertiary color. Nothing else.
  - No graphs, no aggregate stats — this is the journal, not the dashboard.
    Stats live in Session Summary.
```

---

## Elevation Model

Flow uses a **flat elevation** model — no drop shadows for structure. Depth is created through:

1. **Background tones** — sunken < base < elevated < overlay
2. **Border opacity** — more visible border = more foreground
3. **Content density** — sparse elements read as closer
4. **Size** — larger type reads as primary

Shadows are reserved **only** for the Intervention modal overlay.

```css
.modal-shadow {
  box-shadow:
    0 0 0 1px var(--color-border-subtle),
    0 24px 80px rgba(0, 0, 0, 0.6);
}
```

---

## Accessibility Notes

- Minimum contrast ratio: 4.5:1 for body text, 3:1 for large display text
- All state changes communicated via both color AND shape/label — never color alone
- Focus rings: 2px, `--color-border-strong`, offset 2px
- Intervention screen keyboard-navigable: Escape dismisses to Focus Mode
- Breathing guide animation respects `prefers-reduced-motion` — falls back to text "Breathe in... Breathe out..."

```css
@media (prefers-reduced-motion: reduce) {
  .pulse-dot::after,
  .breathing-circle,
  [data-animate] {
    animation: none;
    transition: none;
  }
}
```

---

## Implementation Notes (Electron / React)

- Dark mode only. No light mode variant for MVP.
- Window: frameless, custom titlebar, `vibrancy: 'ultra-dark'` on macOS
- Minimum window size: 900×600px. Optimal: 1280×800px
- Sidebar is fixed; main content area scrolls independently
- Use CSS custom properties for all theming — state changes update variables on `:root`
- Font rendering: `-webkit-font-smoothing: antialiased` globally
- All transitions on `color`, `background-color`, `border-color` for smooth state shifts:

```css
* {
  -webkit-font-smoothing: antialiased;
  transition:
    color var(--duration-fast) var(--ease-flow),
    background-color var(--duration-fast) var(--ease-flow),
    border-color var(--duration-fast) var(--ease-flow);
}
```

---

*Design system version 1.0 — 2026 Cursor Hackathon*
