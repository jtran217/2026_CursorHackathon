/**
 * Design system showcase (docs/design.md)
 * Typography, buttons, cards, status indicators, timer, inputs.
 */
function App() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Page title */}
        <header>
          <h1 className="text-h1 font-semibold leading-tight">
            No Stress — Design & component examples
          </h1>
          <p className="text-text-secondary text-body mt-2">
            Based on docs/design.md. Use these as reference for Home, Focus mode, Intervention, Session summary, and Journal.
          </p>
        </header>

        {/* 1. Typography */}
        <section className="space-y-4">
          <h2 className="text-h2 font-semibold text-text-primary">
            Typography
          </h2>
          <div className="bg-bg-elevated border border-border rounded-card p-6 space-y-4">
            <div>
              <p className="text-caption text-text-secondary mb-1">Display / Hero (2.5rem)</p>
              <p className="text-display font-semibold tabular-nums text-accent">
                72
              </p>
              <p className="text-caption text-text-secondary">e.g. current HR or big timer</p>
            </div>
            <div>
              <p className="text-h1 font-semibold">Screen title (H1)</p>
              <p className="text-caption text-text-secondary">1.5rem, semibold</p>
            </div>
            <div>
              <p className="text-h2 font-semibold">Section title (H2)</p>
              <p className="text-caption text-text-secondary">1.25rem</p>
            </div>
            <div>
              <p className="text-body">Body text — default copy at 1rem.</p>
            </div>
            <div>
              <p className="text-caption text-text-secondary">
                Small / caption — timestamps, labels, hints (0.875rem).
              </p>
            </div>
          </div>
        </section>

        {/* 2. Buttons */}
        <section className="space-y-4">
          <h2 className="text-h2 font-semibold text-text-primary">
            Buttons
          </h2>
          <div className="bg-bg-elevated border border-border rounded-card p-6 flex flex-wrap gap-4">
            <button
              type="button"
              className="bg-accent text-white font-medium px-5 py-2.5 rounded-button transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.98]"
            >
              Primary (Start session)
            </button>
            <button
              type="button"
              className="border-2 border-border bg-transparent text-text-primary font-medium px-5 py-2.5 rounded-button hover:bg-bg-primary transition-colors duration-200"
            >
              Secondary (Manual break)
            </button>
            <button
              type="button"
              className="text-text-primary font-medium px-5 py-2.5 rounded-button hover:bg-bg-primary transition-colors duration-200"
            >
              Ghost (Add to journal)
            </button>
            <button
              type="button"
              disabled
              className="bg-accent text-white font-medium px-5 py-2.5 rounded-button opacity-50 cursor-not-allowed"
            >
              Disabled
            </button>
          </div>
        </section>

        {/* 3. Cards & panels */}
        <section className="space-y-4">
          <h2 className="text-h2 font-semibold text-text-primary">
            Cards & panels
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-bg-elevated border border-border rounded-card p-6">
              <p className="text-caption text-text-secondary font-medium">Current HR</p>
              <p className="text-display font-semibold text-accent tabular-nums mt-1">
                68
              </p>
              <p className="text-caption text-text-secondary mt-2">bpm · simulated</p>
            </div>
            <div className="bg-bg-elevated border border-border rounded-card p-6">
              <p className="text-caption text-text-secondary font-medium">Focus strain</p>
              <p className="text-h1 font-semibold text-accent-calm mt-1">
                Low
              </p>
              <p className="text-caption text-text-secondary mt-2">You’re in a good zone</p>
            </div>
          </div>
        </section>

        {/* 4. Status indicators */}
        <section className="space-y-4">
          <h2 className="text-h2 font-semibold text-text-primary">
            Status indicators
          </h2>
          <div className="bg-bg-elevated border border-border rounded-card p-6 flex flex-wrap gap-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-caption font-medium text-accent">
              <span className="size-2 rounded-full bg-accent" aria-hidden /> Focus
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-calm/15 px-3 py-1 text-caption font-medium text-accent-calm">
              <span className="size-2 rounded-full bg-accent-calm" aria-hidden /> Recovery
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-strain-caution/15 px-3 py-1 text-caption font-medium text-strain-caution">
              <span className="size-2 rounded-full bg-strain-caution" aria-hidden /> Time to pause
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-strain-high/15 px-3 py-1 text-caption font-medium text-strain-high">
              <span className="size-2 rounded-full bg-strain-high" aria-hidden /> High strain
            </span>
          </div>
        </section>

        {/* 5. Timer (Focus mode style) */}
        <section className="space-y-4">
          <h2 className="text-h2 font-semibold text-text-primary">
            Timer (Focus mode)
          </h2>
          <div className="bg-bg-elevated border border-border rounded-card p-8 flex flex-col items-center justify-center min-h-[200px]">
            <p className="text-caption text-text-secondary font-medium">Session time</p>
            <p className="text-display font-semibold text-accent tabular-nums mt-2">
              24:36
            </p>
            <button
              type="button"
              className="mt-6 text-text-secondary text-caption font-medium hover:text-text-primary transition-colors"
            >
              I need a break
            </button>
          </div>
        </section>

        {/* 6. Inputs */}
        <section className="space-y-4">
          <h2 className="text-h2 font-semibold text-text-primary">
            Inputs (Journal, forms)
          </h2>
          <div className="bg-bg-elevated border border-border rounded-card p-6 space-y-4 max-w-md">
            <div>
              <label htmlFor="journal-field" className="block text-caption font-medium text-text-secondary mb-2">
                Journal entry
              </label>
              <input
                id="journal-field"
                type="text"
                placeholder="What’s on your mind?"
                className="w-full rounded-button border border-border bg-bg-primary px-4 py-2.5 text-body text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="notes" className="block text-caption font-medium text-text-secondary mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Optional notes..."
                className="w-full rounded-button border border-border bg-bg-primary px-4 py-2.5 text-body text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-y"
              />
            </div>
          </div>
        </section>

        {/* 7. Mini mocks: Home + Intervention CTA */}
        <section className="space-y-4">
          <h2 className="text-h2 font-semibold text-text-primary">
            Screen mocks
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="bg-bg-elevated border border-border rounded-card p-6">
              <p className="text-caption text-text-secondary font-medium mb-4">Home (summary)</p>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-caption text-text-secondary">Current HR</p>
                  <p className="text-2xl font-semibold text-accent tabular-nums">72 bpm</p>
                </div>
                <span className="rounded-full bg-accent-calm/15 px-3 py-1 text-caption font-medium text-accent-calm">
                  Low strain
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-caption text-text-secondary mb-2">Session</p>
                <button
                  type="button"
                  className="w-full bg-accent text-white font-medium py-2.5 rounded-button"
                >
                  Start session
                </button>
              </div>
            </div>
            <div className="bg-bg-elevated border border-border rounded-card p-6">
              <p className="text-caption text-text-secondary font-medium mb-4">Intervention — one step</p>
              <p className="text-h2 font-semibold text-text-primary mb-4">
                Take a short break?
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full bg-accent text-white font-medium py-3 rounded-button"
                >
                  Breathing exercise
                </button>
                <button
                  type="button"
                  className="w-full border border-border font-medium py-3 rounded-button hover:bg-bg-primary"
                >
                  Short walk
                </button>
                <button
                  type="button"
                  className="w-full border border-border font-medium py-3 rounded-button hover:bg-bg-primary"
                >
                  Clarify next step
                </button>
              </div>
              <button type="button" className="mt-4 text-caption text-text-secondary hover:text-text-primary">
                Skip
              </button>
            </div>
          </div>
        </section>

        <footer className="pt-8 border-t border-border text-caption text-text-secondary">
          Design tokens and components from docs/design.md. Toggle system light/dark to see palette change.
        </footer>
      </div>
    </div>
  );
}

export default App;
