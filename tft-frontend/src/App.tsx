import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Explorer from './pages/Explorer';
import CompStats from './pages/CompStats';
import Leaderboard from './pages/Leaderboard';
import PlayerProfile from './pages/PlayerProfile';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/stats" element={<CompStats />} />
          <Route path="/ranking" element={<Leaderboard />} />
          <Route path="/player" element={<PlayerProfile />} />
          <Route path="/player/:region/:gameName/:tagline" element={<PlayerProfile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
