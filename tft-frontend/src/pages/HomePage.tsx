import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeHeroSearch } from '../components/home/HomeHeroSearch';
import { HomeProjectFooter } from '../components/home/HomeProjectFooter';
import { HomeUnderTheHood } from '../components/home/HomeUnderTheHood';

const REGION_OPTIONS = [
  { label: 'EUW', value: 'euw1' },
  { label: 'EUNE', value: 'eun1' },
  { label: 'NA', value: 'na1' },
  { label: 'KR', value: 'kr' },
  { label: 'BR', value: 'br1' },
];

function parseRiotId(input: string): { gameName: string; tagline: string } | null {
  const [name, tag] = input.split('#');
  const gameName = name?.trim();
  const tagline = tag?.trim();
  if (!gameName || !tagline) return null;
  return { gameName, tagline };
}

export default function HomePage() {
  const navigate = useNavigate();
  const [region, setRegion] = useState('euw1');
  const [riotId, setRiotId] = useState('');

  const parsed = useMemo(() => parseRiotId(riotId), [riotId]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed) return;
    navigate(`/player/${region}/${encodeURIComponent(parsed.gameName)}/${encodeURIComponent(parsed.tagline)}`);
  }

  return (
    <section className="space-y-8">
      <HomeHeroSearch
        regionOptions={REGION_OPTIONS}
        region={region}
        riotId={riotId}
        parsed={parsed}
        setRegion={setRegion}
        setRiotId={setRiotId}
        handleSearch={handleSearch}
      />

      <HomeUnderTheHood />

      <HomeProjectFooter />
    </section>
  );
}
