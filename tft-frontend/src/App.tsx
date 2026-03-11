import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/shared/Layout';
import HomePage from './pages/HomePage';
import Explorer from './pages/Explorer';
import Leaderboard from './pages/Leaderboard';
import PlayerProfile from './pages/PlayerProfile';
import TeamPlannerPage from './pages/TeamPlannerPage';
import UnitStatsPage from './pages/UnitStatsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/team-planner" element={<TeamPlannerPage />} />
          <Route path="/unit-stats" element={<UnitStatsPage />} />
          <Route path="/ranking" element={<Leaderboard />} />
          <Route path="/player" element={<PlayerProfile />} />
          <Route path="/player/:region/:gameName/:tagline" element={<PlayerProfile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
