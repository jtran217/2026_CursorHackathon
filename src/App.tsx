import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { Home } from './screens/Home';
import { FocusMode } from './screens/FocusMode';
import { Intervention } from './screens/Intervention';
import { SessionSummary } from './screens/SessionSummary';
import { Journal } from './screens/Journal';

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Screens with sidebar */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/journal" element={<Journal />} />
        </Route>

        {/* Full-screen screens (no sidebar) */}
        <Route path="/focus" element={<FocusMode />} />
        <Route path="/intervention" element={<Intervention />} />
        <Route path="/summary" element={<SessionSummary />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
