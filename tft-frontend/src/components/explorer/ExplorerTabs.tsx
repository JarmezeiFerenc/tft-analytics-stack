import type { TabId } from './types';

interface ExplorerTabsProps {
  tabs: Array<{ id: TabId; label: string }>;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export function ExplorerTabs({ tabs, activeTab, setActiveTab }: ExplorerTabsProps) {
  return (
    <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/70 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setActiveTab(t.id)}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
            activeTab === t.id
              ? 'bg-indigo-500 text-white shadow'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
