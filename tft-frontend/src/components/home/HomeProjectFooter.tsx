export function HomeProjectFooter() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">
      <p className="text-sm text-zinc-400">Open source project focused on TFT data integrity and deep-dive analytics.</p>
      <a
        href="https://github.com/JarmezeiFerenc/tft-analytics-stack"
        target="_blank"
        className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 hover:text-white"
      >
        GitHub
        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300">OSS</span>
      </a>
    </div>
  );
}
