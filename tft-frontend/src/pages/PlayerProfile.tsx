import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { MatchHistorySection } from '../components/player-profile/MatchHistorySection';
import { PlayerProfileCard } from '../components/player-profile/PlayerProfileCard';
import { PlayerProfileSearchHeader } from '../components/player-profile/PlayerProfileSearchHeader';
import type { ApiResponse, RegionOption } from '../components/player-profile/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

const REGION_OPTIONS: RegionOption[] = [
  { label: 'EUNE', value: 'eun1' },
  { label: 'EUW', value: 'euw1' },
  { label: 'NA', value: 'na1' },
  { label: 'BR', value: 'br1' },
  { label: 'KR', value: 'kr' },
];


function regionLabel(value: string): string {
  const found = REGION_OPTIONS.find((o) => o.value === value);
  return found ? found.label : value.toUpperCase();
}

export default function PlayerProfile() {
  const { region: paramRegion, gameName: paramName, tagline: paramTag } = useParams();
  const [searchParams] = useSearchParams();

  const [formRegion, setFormRegion] = useState(paramRegion ?? searchParams.get('region') ?? 'euw1');
  const [formName, setFormName] = useState(paramName ?? searchParams.get('name') ?? '');
  const [formTag, setFormTag] = useState(paramTag ?? searchParams.get('tag') ?? '');

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookupPlayer(region: string, name: string, tag: string) {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(
        `${API_BASE}/player/${encodeURIComponent(region)}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? `HTTP ${response.status}`);
      }

      const json = (await response.json()) as ApiResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = formName.trim();
    const tag = formTag.trim();
    if (!name || !tag) return;
    lookupPlayer(formRegion, name, tag);
  }

  const profile = data?.profile;
  const matches = data?.matches ?? [];

  return (
    <section className="space-y-5">
      <PlayerProfileSearchHeader
        formRegion={formRegion}
        formName={formName}
        formTag={formTag}
        loading={loading}
        regionOptions={REGION_OPTIONS}
        setFormRegion={setFormRegion}
        setFormName={setFormName}
        setFormTag={setFormTag}
        handleSubmit={handleSubmit}
      />

      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-10 text-zinc-400">
          <Loader2 size={20} className="animate-spin text-indigo-400" />
          <span>Syncing live data from Riot...</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {profile && !loading && (
        <PlayerProfileCard profile={profile} regionLabel={regionLabel} />
      )}

      {profile && !loading && (
        <MatchHistorySection matches={matches} searchedPuuid={profile.puuid} />
      )}
    </section>
  );
}
