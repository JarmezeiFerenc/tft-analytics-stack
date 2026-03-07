import { useState } from 'react';
import type { FormEvent } from 'react';
import { TftItemIcon } from './components/TftItemIcon';
import { TftUnitImage } from './components/TftUnitImage';

type UnitStatsRow = {
  item_1: string | null;
  item_2: string | null;
  item_3: string | null;
  games_played: number | string;
  avg_placement: number | string;
};

function App() {
  const [characterId, setCharacterId] = useState('TFT16_Aatrox');
  const [tier, setTier] = useState('any');
  const [minGames, setMinGames] = useState('1');
  const [sortBy, setSortBy] = useState<'performance' | 'popularity'>('performance');
  const [rows, setRows] = useState<UnitStatsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      if (tier.trim().length > 0) {
        searchParams.set('tier', tier.trim());
      }
      if (minGames.trim().length > 0) {
        searchParams.set('min_games', minGames.trim());
      }
      searchParams.set('sort_by', sortBy);

      const query = searchParams.toString();
      const response = await fetch(
        `http://127.0.0.1:8000/api/unit-stats/${encodeURIComponent(characterId)}${query ? `?${query}` : ''}`
      );

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      const data = (await response.json()) as unknown;
      if (!Array.isArray(data)) {
        throw new Error('Invalid API response format.');
      }

      setRows(data as UnitStatsRow[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Request failed: ${message}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px', fontFamily: 'sans-serif' }}>
      <h1>Unit Stats API Test Page</h1>
      <p>
        Test endpoint: <code>/api/unit-stats/{'{character_id}'}?tier=any|number&amp;min_games=1&amp;sort_by=performance|popularity</code>
      </p>

      <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <TftUnitImage unitId={characterId} size={88} />
        <div>
          <div style={{ fontSize: '14px', color: '#555' }}>Selected unit preview</div>
          <strong>{characterId}</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'end', flexWrap: 'wrap', marginBottom: '20px' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          Character ID
          <input
            value={characterId}
            onChange={(e) => setCharacterId(e.target.value)}
            placeholder="TFT13_Akali"
            required
            style={{ padding: '8px', minWidth: '220px' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          Tier (any or number)
          <input
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            placeholder="any"
            style={{ padding: '8px', minWidth: '140px' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          Minimum Games Played
          <input
            value={minGames}
            onChange={(e) => setMinGames(e.target.value)}
            placeholder="1"
            inputMode="numeric"
            pattern="[0-9]*"
            style={{ padding: '8px', minWidth: '180px' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          Sort Mode
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'performance' | 'popularity')}
            style={{ padding: '8px', minWidth: '180px' }}
          >
            <option value="performance">Performance (avg placement asc)</option>
            <option value="popularity">Popularity (games played desc)</option>
          </select>
        </label>

        <button type="submit" disabled={loading || characterId.trim().length === 0} style={{ padding: '10px 16px' }}>
          {loading ? 'Loading...' : 'Fetch Stats'}
        </button>
      </form>

      {error && <p style={{ color: '#b00020' }}>{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p>No results yet. Submit a unit to test the API.</p>
      )}

      {rows.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Items</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Games Played</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Avg Placement</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.item_1 ?? 'none'}-${row.item_2 ?? 'none'}-${row.item_3 ?? 'none'}-${index}`}>
                <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>
                  {([row.item_1, row.item_2, row.item_3].filter(Boolean) as string[]).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {([row.item_1, row.item_2, row.item_3].filter(Boolean) as string[]).map((itemId) => (
                          <TftItemIcon key={`${itemId}-${index}`} itemId={itemId} size={32} />
                        ))}
                      </div>
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {[row.item_1, row.item_2, row.item_3].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  ) : (
                    'No items'
                  )}
                </td>
                <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{row.games_played}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{row.avg_placement}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;