import { NavLink } from 'react-router-dom';
import { Home, BookOpen } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/journal', label: 'Journal', icon: BookOpen },
];

export function Sidebar() {
  return (
    <aside
      className="fixed top-0 left-0 h-screen bg-bg-secondary flex flex-col"
      style={{
        width: 'var(--sidebar-width)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      <div className="px-5 pt-6 pb-8">
        <span
          className="text-text-primary font-medium"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
          }}
        >
          Flow
        </span>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition-colors relative ${
                isActive
                  ? 'text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`
            }
            style={{ fontSize: 'var(--text-sm)' }}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r"
                    style={{
                      width: 2,
                      height: 16,
                      backgroundColor: 'var(--color-primary)',
                    }}
                  />
                )}
                <Icon size={16} strokeWidth={1.5} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
