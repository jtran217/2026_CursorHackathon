const MASCOT_SRC: Record<MascotKey, string> = {
  astro: './astro.png',
  astro_side: './astro_side.png',
  worried_bri: './worried_bri.png',
};

export type MascotKey = 'astro' | 'astro_side' | 'worried_bri';

export interface MascotAction {
  label: string;
  variant: 'primary' | 'ghost';
  onClick: () => void;
}

interface MascotNotificationProps {
  mascot: MascotKey;
  title: string;
  message: string;
  actions: MascotAction[];
  onDismiss?: () => void;
}

export function MascotNotification({
  mascot,
  title,
  message,
  actions,
  onDismiss,
}: MascotNotificationProps) {
  return (
    <div
      className="absolute bottom-20 left-1/2 -translate-x-1/2 card"
      style={{
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg) var(--space-xl)',
        maxWidth: 380,
        width: '90%',
        animation: 'panel-slide-in 400ms var(--ease-emerge) both',
        display: 'flex',
        gap: 'var(--space-md)',
        alignItems: 'flex-start',
      }}
    >
      {/* Mascot image */}
      <img
        src={MASCOT_SRC[mascot]}
        alt=""
        aria-hidden="true"
        style={{
          width: 64,
          height: 64,
          objectFit: 'contain',
          flexShrink: 0,
          borderRadius: 'var(--radius-sm)',
        }}
      />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {onDismiss && (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={onDismiss}
            style={{
              position: 'absolute',
              top: 'var(--space-sm)',
              right: 'var(--space-sm)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-tertiary)',
              fontSize: 'var(--text-base)',
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        )}

        <p
          className="text-text-primary"
          style={{ fontSize: 'var(--text-base)', fontWeight: 500, marginBottom: 4 }}
        >
          {title}
        </p>
        <p
          className="text-text-secondary"
          style={{
            fontSize: 'var(--text-sm)',
            lineHeight: 'var(--leading-relaxed)',
            marginBottom: 'var(--space-md)',
          }}
        >
          {message}
        </p>

        <div className="flex gap-2 justify-end">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={action.variant === 'primary' ? 'btn-primary' : 'btn-ghost'}
              style={{ fontSize: 'var(--text-sm)', padding: '6px 14px' }}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
