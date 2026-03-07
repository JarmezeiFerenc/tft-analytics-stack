export default function Dashboard() {
  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="mt-2 text-sm text-zinc-400">Quick overview of your TFT data pipeline and analytics modules.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Crawler Status', value: 'Online' },
          { label: 'Miner Status', value: 'Online' },
          { label: 'Queue Health', value: 'Stable' },
          { label: 'Regions Active', value: '5 / 5' },
        ].map((card) => (
          <article key={card.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">{card.label}</p>
            <p className="mt-2 text-lg font-semibold text-zinc-100">{card.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
