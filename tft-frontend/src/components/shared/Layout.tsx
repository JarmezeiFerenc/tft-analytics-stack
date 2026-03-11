import { BarChart3, Home, LayoutGrid, Search, Trophy, User } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const navigation = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/explorer', label: 'Explorer', icon: Search },
  { to: '/team-planner', label: 'Team Planner', icon: LayoutGrid },
  { to: '/unit-stats', label: 'Unit Stats', icon: BarChart3 },
  { to: '/ranking', label: 'Leaderboard', icon: Trophy },
  { to: '/player', label: 'Player Profile', icon: User },
];

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Home }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
          isActive
            ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40'
            : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100'
        }`
      }
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Layout() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur-md lg:block">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">TFT Analytics</p>
          <h1 className="mt-2 text-xl font-semibold">Command Center</h1>
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => (
            <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} />
          ))}
        </nav>
      </aside>

      <main className="pb-24 lg:ml-64 lg:pb-8">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-800 bg-zinc-900/75 px-2 py-2 backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-6 gap-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center rounded-xl py-2 text-[11px] transition ${
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40'
                      : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100'
                  }`
                }
              >
                <Icon size={17} />
                <span className="mt-1">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
