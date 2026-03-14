# Design System — Flow

> A desktop-first wellness and focus assistant. Detects cognitive overload. Guides recovery.

---

## Aesthetic Direction

**"Warm Daylight"** — the warmth of a worn journal, the calm of afternoon light through linen, the clarity of a clear head.

Flow is not a productivity app. It's a recovery app. The design must never feel urgent, cluttered, or demanding. Every screen should feel like stepping into a quiet room.

The visual language draws from:
- **Oura Ring** — biometric precision, quiet confidence
- **Notion** — warm neutrals, readable at a glance
- **Muji** — negative space is not emptiness, it is the point

**What this is NOT**: glassy cards, dark mode dashboards, neon alerts, animated blob backgrounds, generic productivity grids.

---

## Color System

All colors defined as CSS variables on `:root`. Light-mode first.

The palette is built from warm earth tones: cream paper, terracotta gold, moss green, burnt sienna, and dusk violet.
No cool neutrals. No electric blue. No saturation above what nature produces.

```css
:root {
  /* === BRAND CORE === */
  --color-primary:         #BA7517; /* Terracotta gold — buttons, links, primary actions */
  --color-primary-light:   #FAC775; /* Honey — hover states, highlights */
  --color-primary-surface: #FAEEDA; /* Warm cream — app background */

  /* === STATE: CALM / RECOVERED === */
  --color-calm:            #639922; /* Moss green */
  --color-calm-surface:    #EAF3DE; /* Calm background surface */

  /* === STATE: GENTLE NUDGE === */
  --color-nudge:           #BA7517; /* Terracotta gold (reuse primary) */
  --color-nudge-surface:   #FAEEDA; /* Warm cream surface */

  /* === STATE: OVERLOAD ALERT === */
  --color-alert:           #D85A30; /* Burnt sienna */
  --color-alert-surface:   #FAECE7; /* Alert background surface */

  /* === STATE: INTERVENTION / BREATHING === */
  --color-focus:           #534AB7; /* Dusk violet */
  --color-focus-surface:   #EEEDFE; /* Intervention background surface */

  /* === NEUTRALS === */
  --color-bg:              #EDEBE6; /* App background (cool linen grey — quiet desk) */
  --color-bg-secondary:    #F4F2ED; /* Cards, secondary surfaces — lifted from bg */
  --color-border:          #B4B2A9; /* Borders, dividers (pebble) */
  --color-text-primary:    #2C2C2A; /* Body text (charcoal) */
  --color-text-secondary:  #5F5E5A; /* Muted / supporting text (flint) */
  --color-text-tertiary:   #B4B2A9; /* Hints, placeholders (pebble) */
}
```

### Semantic Color Map

| Situation | Background token | Text/icon token | When to use |
|---|---|---|---|
| App default | `--color-bg` | `--color-text-primary` | All idle screens |
| Card / panel | `--color-bg-secondary` | `--color-text-primary` | Containers, sidebar, panels |
| Calm state | `--color-calm-surface` | `--color-calm` | Post-recovery, positive biometric |
| Gentle nudge | `--color-nudge-surface` | `--color-nudge` | Mild signal, first check-in prompt |
| Overload alert | `--color-alert-surface` | `--color-alert` | Elevated HR, long sedentary stretch |
| Intervention | `--color-focus-surface` | `--color-focus` | Breathing, movement, reset flow |

### State Color Mapping

| Cognitive State | Surface | Accent | HR Indicator |
|---|---|---|---|
| **Calm** | `--color-calm-surface` | `--color-calm` | moss pulse |
| **Normal** | `--color-bg` | `--color-primary` | gold pulse |
| **Elevated** | `--color-nudge-surface` | `--color-nudge` | gold pulse (faster) |
| **Overload** | `--color-alert-surface` | `--color-alert` | sienna pulse + glow |

Transitions between states should take **1800ms** with an ease-in-out curve. State color shifts should never be abrupt.

### Quick Reference — Named Colors

| Token name | Hex | Name |
|---|---|---|
| `--color-primary` | `#BA7517` | Terracotta gold |
| `--color-primary-light` | `#FAC775` | Honey |
| `--color-primary-surface` | `#FAEEDA` | Warm cream |
| `--color-calm` | `#639922` | Moss |
| `--color-calm-surface` | `#EAF3DE` | Moss tint |
| `--color-alert` | `#D85A30` | Burnt sienna |
| `--color-alert-surface` | `#FAECE7` | Sienna tint |
| `--color-focus` | `#534AB7` | Dusk violet |
| `--color-focus-surface` | `#EEEDFE` | Violet tint |
| `--color-bg` | `#EDEBE6` | Linen grey |
| `--color-bg-secondary` | `#F4F2ED` | Lifted linen |
| `--color-border` | `#B4B2A9` | Pebble |
| `--color-text-primary` | `#2C2C2A` | Charcoal |
| `--color-text-secondary` | `#5F5E5A` | Flint |
| `--color-text-tertiary` | `#B4B2A9` | Pebble |

---

## Typography

```css
/* Import in global CSS */
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@400&display=swap');
```

### Typeface Roles

| Role | Family | Use Case |
|---|---|---|
| **Display** | `Lora` | Screen titles, hero numbers (HR), session headers, intervention headline |
| **Data / Mono** | `JetBrains Mono` | Heart rate readout, timer, scores, timestamps |
| **UI / Body** | `DM Sans` | Labels, body copy, buttons, navigation, captions |

### Scale

```css
:root {
  --text-xs:   11px;   /* status chips, fine print */
  --text-sm:   13px;   /* captions, timestamps, axis labels */
  --text-base: 15px;   /* body, descriptions */
  --text-lg:   18px;   /* card titles, action labels */
  --text-xl:   22px;   /* section headers */
  --text-2xl:  28px;   /* timer, score readout */
  --text-hero: clamp(48px, 8vw, 80px); /* hero HR number */

  /* Line Heights */
  --leading-tight:   1.1;
  --leading-snug:    1.3;
  --leading-normal:  1.5;
  --leading-relaxed: 1.7;

  /* Letter Spacing */
  --tracking-tight:   -0.02em;
  --tracking-normal:   0em;
  --tracking-wide:     0.06em;
  --tracking-widest:   0.12em;
}
```

### Typography Rules

- **Heart rate number**: `Lora`, `--text-hero`, `--color-text-primary`, `--tracking-tight`
- **Timer**: `JetBrains Mono`, `--text-2xl`, `--color-text-secondary`, tabular-nums
- **Focus Strain Score**: `JetBrains Mono`, `--text-lg`, colored by state
- **Screen titles**: `Lora`, `--text-xl`, optionally italic
- **Intervention headline**: `Lora` italic, `--text-xl`, `--color-focus`
- **Labels / Caps**: `DM Sans`, `--text-xs`, `--tracking-widest`, uppercase, `--color-text-tertiary`
- **Body / descriptions**: `DM Sans`, `--text-base`, `--leading-relaxed`

---

## Spacing System

```css
:root {
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  12px;
  --space-lg:  16px;
  --space-xl:  24px;
  --space-2xl: 40px;

  /* Layout */
  --sidebar-width:     220px;
  --content-max-width: 760px;
  --panel-padding:     var(--space-xl);
  --card-padding:      var(--space-xl);
  --card-padding-sm:   var(--space-lg);
}
```

### Spatial Principles

- Screens should breathe. Default to **more space** than feels necessary.
- Primary data (HR, timer, score) should be **isolated** with generous surrounding space — never crowded by supporting elements.
- Cards and panels use a **1px warm border** (`--color-border`) rather than heavy shadows.
- Use left-border accents on notification cards to signal state without alarming.

---

## Border Radius

```css
:root {
  --radius-sm:   6px;    /* chips, small badges */
  --radius-md:   10px;   /* buttons, inputs */
  --radius-lg:   16px;   /* cards, panels */
  --radius-pill: 99px;   /* pill buttons, badges */
}
```

---

## Component Patterns

### Cards

Cards are the primary container unit. They sit on `--color-bg-secondary`, bordered with `--color-border`.

```css
.card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--card-padding);
}

.card:hover {
  border-color: #9B9991;
  transition: border-color 200ms ease;
}
```

### Notification Cards (state-tinted)

Use a left border accent to communicate state without flooding the screen with color.

```css
.card--calm {
  background: var(--color-calm-surface);
  border-left: 3px solid var(--color-calm);
}
.card--alert {
  background: var(--color-alert-surface);
  border-left: 3px solid var(--color-alert);
}
.card--focus {
  background: var(--color-focus-surface);
  border-left: 3px solid var(--color-focus);
}
```

### Buttons

```css
/* Primary — filled terracotta gold */
.btn-primary {
  font-family: 'DM Sans', sans-serif;
  font-size: var(--text-base);
  font-weight: 500;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-md) var(--space-xl);
  cursor: pointer;
  transition: background 150ms ease, transform 100ms ease;
}
.btn-primary:hover  { background: #9E6210; }
.btn-primary:active { transform: scale(0.98); }

/* Ghost — outlined */
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-md) var(--space-xl);
  transition: border-color 150ms ease, color 150ms ease;
}
.btn-ghost:hover {
  border-color: #9B9991;
  color: var(--color-text-primary);
}

/* Signal — for "I'm Overwhelmed" manual trigger */
.btn-signal {
  background: transparent;
  color: var(--color-alert);
  border: 1px solid var(--color-alert);
  border-radius: var(--radius-pill);
  padding: var(--space-md) var(--space-xl);
  font-size: var(--text-sm);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  transition: all 200ms ease;
}
.btn-signal:hover {
  background: var(--color-alert-surface);
}
```

### State Badges

```css
.badge {
  display: inline-block;
  font-family: 'DM Sans', sans-serif;
  font-size: var(--text-xs);
  font-weight: 500;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
}

.badge--calm  { background: var(--color-calm);  color: #fff; }
.badge--nudge { background: var(--color-nudge); color: #fff; }
.badge--alert { background: var(--color-alert); color: #fff; }
.badge--focus { background: var(--color-focus); color: #fff; }
```

### Status Indicator / Pulse Dot

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

.pulse-dot--calm     { color: var(--color-calm); }
.pulse-dot--normal   { color: var(--color-primary); }
.pulse-dot--elevated { color: var(--color-nudge); animation-duration: 1.2s; }
.pulse-dot--overload { color: var(--color-alert); animation-duration: 0.8s; }
```

### Heart Rate Display

```css
.hr-display {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-xs);
}
.hr-display__label {
  font-family: 'DM Sans', sans-serif;
  font-size: var(--text-xs);
  font-weight: 400;
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}
.hr-display__value {
  font-family: 'Lora', serif;
  font-size: var(--text-hero);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}
.hr-display__unit {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  letter-spacing: var(--tracking-wide);
  margin-left: var(--space-xs);
}
```

### Focus Strain Score

```css
.strain-score {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-lg);
  font-weight: 400;
  letter-spacing: -0.01em;
}
.strain-score--low      { color: var(--color-calm); }
.strain-score--moderate { color: var(--color-primary); }
.strain-score--high     { color: var(--color-alert); }
.strain-score--critical { color: #993C1D; }
```

### Sparkline / HR Chart

```
Visual: a single continuous line on a warm-tinted field.
- Line color: --color-primary
- Filled area below line: rgba of --color-primary at 10% opacity
- Line weight: 1.5px
- No tick marks, no labels on the chart itself
- Optional: subtle vertical marker for intervention events (1px, --color-border)
- Aspect ratio: wide and short — approximately 4:1
```

### Navigation (Sidebar)

```
- Background: --color-bg-secondary (linen — slightly lifted from cream canvas)
- Separator: 1px right border, --color-border
- Nav items: DM Sans, --text-sm, --color-text-secondary default
- Active: --color-text-primary, left accent bar 2px --color-primary
- Icon: 16px, line style (not filled)
- No hover backgrounds — only color transitions
```

---

## Motion & Animation Principles

### Philosophy

Flow's animations should feel **biological, not mechanical**. Ease curves should mimic breathing — slow in, slow out, with organic imprecision. Nothing should snap or bounce.

### Core Curves

```css
:root {
  --ease-flow:    cubic-bezier(0.4, 0, 0.2, 1);
  --ease-emerge:  cubic-bezier(0.0, 0, 0.2, 1);
  --ease-recede:  cubic-bezier(0.4, 0, 1, 1);
  --ease-breath:  cubic-bezier(0.45, 0.05, 0.55, 0.95);
}
```

### Duration Scale

```css
:root {
  --duration-instant:    80ms;    /* hover states */
  --duration-fast:       150ms;   /* button feedback, badge appearance */
  --duration-normal:     300ms;   /* panel reveals, card transitions */
  --duration-slow:       600ms;   /* screen transitions, state changes */
  --duration-deliberate: 1200ms;  /* breathing guide, state escalation */
  --duration-state:      1800ms;  /* full cognitive state color shift */
}
```

### Key Animations

**Screen Transitions**: Crossfade with subtle upward drift (8px translate Y). Duration: 300ms.

**Cognitive State Shift**: When the app detects a state change, the surface background and accent color transitions over 1800ms. Never abrupt.

**Intervention Entry**: The intervention panel slides in from the bottom (24px → 0) with background dim. Duration: 600ms, `--ease-emerge`.

**Breathing Guide**: A circular element expands and contracts on a 4s inhale / 4s exhale cycle. `transform: scale()` between 0.85 and 1.15. Timing: `--ease-breath`, infinite.

**Timer Tick**: Each second, the timer fades to 85% opacity then returns over 400ms.

**Session Start**: Staggered reveal — pulse dot (0ms), HR display (150ms delay), supporting data (300ms delay). Each fades in with a 12px upward drift.

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
    Left (wider): HR display + sparkline + state badge
    Right: Session card + strain score + session start/stop

Design Intent:
  - The HR number should be the largest element on screen
  - Session control (start/stop) is a single clear CTA
  - "I'm Overwhelmed" button lives here but doesn't compete visually
    — signal style, positioned below primary session actions
  - Sparkline shows last 30 minutes of HR data inline beneath the number

HR Number Typography:
  - Lora, text-hero, charcoal
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
      1. Session timer (JetBrains Mono, --text-2xl, centered)
      2. A single tiny pulse dot top-right (confirms monitoring is active)
      3. A barely-visible "End Session" text link bottom-center

Design Intent:
  - Background: --color-bg. Nothing else.
  - The timer is the only thing on screen.
  - If cognitive state is elevated, a very subtle warm tint enters the
    background (rgba of --color-alert at 2% opacity). User may not notice
    consciously — that is intentional.
  - "●●●" overflow menu on mouse movement, fades after 3s inactivity.
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
  - Background: --color-focus-surface with 1px border --color-border
  - Rounded corners: 20px
  - No red. No alarming language. No urgency.
  - Headline: Lora italic. Large. The --color-focus (dusk violet).
  - Breathing circle: 120px diameter, border only (no fill), expands/contracts
    with --ease-breath on 8s cycle. Border color: --color-focus.
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
      1. Session duration + date (JetBrains Mono, tertiary)
      2. Headline stat — Focus Quality score (Lora, text-hero)
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
  - Each entry: date (mono), duration badge, focus quality score, 1-line excerpt
  - Clicking an entry expands it (inline, not a new screen) to full summary view

Design Intent:
  - Timeline feel: vertical line connects entries on the left
    (1px, --color-border)
  - Date headers group by week: "This Week", "Last Week", "March 2026"
    — DM Sans, xs, widest tracking, tertiary color
  - Empty state: Lora italic "Your first session will appear here."
    — centered, tertiary color. Nothing else.
  - No graphs, no aggregate stats — this is the journal, not the dashboard.
```

---

## Elevation Model

Flow uses a **warm flat** model. Depth is created through:

1. **Background tones** — `--color-bg` < `--color-bg-secondary` < state surface colors
2. **Border visibility** — more visible border = more foreground
3. **Left-border accents** — state cards use a 3px colored left border
4. **Content density** — sparse elements read as closer
5. **Size** — larger type reads as primary

Shadows are reserved **only** for the Intervention modal overlay.

```css
.modal-shadow {
  box-shadow:
    0 0 0 1px var(--color-border),
    0 16px 48px rgba(44, 44, 42, 0.12);
}
```

---

## Accessibility Notes

- Minimum contrast ratio: 4.5:1 for body text, 3:1 for large display text
- All state changes communicated via both color AND shape/label — never color alone
- Focus rings: 2px, `--color-primary`, offset 2px
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

- Light mode. The app background is warm cream — it works beautifully on macOS without vibrancy.
- Window: frameless, custom titlebar
- Minimum window size: 900×600px. Optimal: 1280×800px
- Sidebar is fixed; main content area scrolls independently
- Use CSS custom properties for all theming — state changes update variables on `:root`
- Font rendering: `-webkit-font-smoothing: antialiased` globally
- All transitions on `color`, `background-color`, `border-color` for smooth state shifts:

```css
* {
  -webkit-font-smoothing: antialiased;
  transition:
    color            var(--duration-fast) var(--ease-flow),
    background-color var(--duration-fast) var(--ease-flow),
    border-color     var(--duration-fast) var(--ease-flow);
}
```

---

*Design system version 2.0 — 2026 Cursor Hackathon*
