import { Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface SearchableDropdownProps {
  entries: string[];
  selected: Set<string>;
  onSelect: (key: string) => void;
  placeholder: string;
  renderOption: (key: string) => React.ReactNode;
}

export function SearchableDropdown({
  entries,
  selected,
  onSelect,
  placeholder,
  renderOption,
}: SearchableDropdownProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return entries.filter((k) => !selected.has(k) && k.toLowerCase().includes(q)).slice(0, 30);
  }, [entries, selected, query]);

  return (
    <div ref={ref} className="relative">
      <div
        className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 cursor-text"
        onClick={() => setOpen(true)}
      >
        <Search size={14} className="text-zinc-500 shrink-0" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 py-1 shadow-lg">
          {filtered.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onSelect(key);
                setQuery('');
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-zinc-200 hover:bg-zinc-800"
            >
              {renderOption(key)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
