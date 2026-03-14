import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <main
        className="min-h-screen"
        style={{
          marginLeft: 'var(--sidebar-width)',
          padding: 'var(--space-2xl)',
        }}
      >
        <div style={{ maxWidth: 'var(--content-max-width)' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
