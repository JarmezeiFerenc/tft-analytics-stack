import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { MatchHistorySection } from '../components/player-profile/MatchHistorySection';
import { PlayerProfileCard } from '../components/player-profile/PlayerProfileCard';
import { PlayerProfileSkeleton } from '../components/player-profile/PlayerProfileSkeleton';
import { PlayerProfileSearchHeader } from '../components/player-profile/PlayerProfileSearchHeader';
import type { ApiResponse, RegionOption } from '../components/player-profile/types';
import { parseRiotId } from '../utils/riotId';

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
  const [formRiotId, setFormRiotId] = useState(() => {
    const queryRiotId = searchParams.get('riotId');
    if (queryRiotId) return queryRiotId;

    const routeRiotId = paramName && paramTag ? `${paramName}#${paramTag}` : null;
    if (routeRiotId) return routeRiotId;

    const queryName = searchParams.get('name');
    const queryTag = searchParams.get('tag');
    if (queryName && queryTag) return `${queryName}#${queryTag}`;

    return '';
  });

  const parsedRiotId = useMemo(() => parseRiotId(formRiotId), [formRiotId]);
  const hasAutoSearchedRef = useRef(false);

  const hasPrefilledSearchTarget = useMemo(() => {
    if (paramRegion && paramName && paramTag) {
      return true;
    }

    const queryRegion = searchParams.get('region');
    const queryRiotId = searchParams.get('riotId');
    const queryName = searchParams.get('name');
    const queryTag = searchParams.get('tag');

    return Boolean(queryRegion && (queryRiotId || (queryName && queryTag)));
  }, [paramRegion, paramName, paramTag, searchParams]);

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupPlayer = useCallback(async (region: string, name: string, tag: string) => {
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
  }, []);

  useEffect(() => {
    if (hasAutoSearchedRef.current) {
      return;
    }

    if (!hasPrefilledSearchTarget || !parsedRiotId) {
      return;
    }

    hasAutoSearchedRef.current = true;
    void lookupPlayer(formRegion, parsedRiotId.gameName, parsedRiotId.tagline);
  }, [formRegion, hasPrefilledSearchTarget, lookupPlayer, parsedRiotId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parsedRiotId) return;
    void lookupPlayer(formRegion, parsedRiotId.gameName, parsedRiotId.tagline);
  }

  const profile = data?.profile;
  const matches = data?.matches ?? [];

  return (
    <section className="space-y-5">
      <PlayerProfileSearchHeader
        formRegion={formRegion}
        riotId={formRiotId}
        parsed={parsedRiotId}
        loading={loading}
        regionOptions={REGION_OPTIONS}
        setFormRegion={setFormRegion}
        setRiotId={setFormRiotId}
        handleSubmit={handleSubmit}
      />

      {loading && <PlayerProfileSkeleton />}

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
