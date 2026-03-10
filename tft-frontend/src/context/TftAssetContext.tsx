import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { cdragonAssetPathToPngUrl } from '../utils/cdragon';

interface TftAssets {
    itemMap: Map<string, string>;
    unitMap: Map<string, string>;
    traitMap: Map<string, string>;
    unitCostMap: Map<string, number>;
    latestSetKey: string | null;
    ready: boolean;
}

const TftAssetContext = createContext<TftAssets>({
    itemMap: new Map(),
    unitMap: new Map(),
    traitMap: new Map(),
    unitCostMap: new Map(),
    latestSetKey: null,
    ready: false,
});

export function useTftAssets() {
    return useContext(TftAssetContext);
}

const METADATA_URL = 'https://raw.communitydragon.org/latest/cdragon/tft/en_us.json';

interface RawItem {
    apiName?: string;
    id?: string;
    icon?: string;
}

interface RawChampion {
    apiName?: string;
    tileIcon?: string;
    icon?: string;
    cost?: number;
}

interface RawTrait {
    apiName?: string;
    icon?: string;
}

interface RawSet {
    champions?: RawChampion[];
    traits?: RawTrait[];
}

interface RawMetadata {
    items?: RawItem[];
    sets?: Record<string, RawSet>;
}

function getLatestSetKey(sets: Record<string, RawSet> | undefined): string | null {
    if (!sets || typeof sets !== 'object') return null;

    const latest = Object.keys(sets)
        .map((key) => ({ key, value: Number(key) }))
        .filter(({ value }) => Number.isFinite(value))
        .sort((a, b) => b.value - a.value)[0];

    return latest?.key ?? null;
}

export function TftAssetProvider({ children }: { children: ReactNode }) {
    const [assets, setAssets] = useState<TftAssets>({
        itemMap: new Map(),
        unitMap: new Map(),
        traitMap: new Map(),
        unitCostMap: new Map(),
        latestSetKey: null,
        ready: false,
    });

    useEffect(() => {
        let cancelled = false;

        fetch(METADATA_URL)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json() as Promise<RawMetadata>;
            })
            .then((data) => {
                if (cancelled) return;

                const itemMap = new Map<string, string>();
                const unitMap = new Map<string, string>();
                const traitMap = new Map<string, string>();
                const unitCostMap = new Map<string, number>();
                const latestSetKey = getLatestSetKey(data.sets);

                if (Array.isArray(data.items)) {
                    for (const item of data.items) {
                        const key = (item.apiName ?? item.id ?? '').toLowerCase();
                        const icon = item.icon;
                        if (key && icon) {
                            itemMap.set(key, cdragonAssetPathToPngUrl(icon));
                        }
                    }
                }

                if (latestSetKey && data.sets) {
                    const latestSet = data.sets[latestSetKey];

                    if (latestSet) {
                        if (Array.isArray(latestSet.champions)) {
                            for (const champ of latestSet.champions) {
                                const key = (champ.apiName ?? '').toLowerCase();
                                const icon = champ.tileIcon ?? champ.icon;
                                if (key && icon) {
                                    unitMap.set(key, cdragonAssetPathToPngUrl(icon));
                                }
                                if (key && typeof champ.cost === 'number') {
                                    unitCostMap.set(key, champ.cost);
                                }
                            }
                        }
                        if (Array.isArray(latestSet.traits)) {
                            for (const trait of latestSet.traits) {
                                const key = (trait.apiName ?? '').toLowerCase();
                                if (key && trait.icon) {
                                    traitMap.set(key, cdragonAssetPathToPngUrl(trait.icon));
                                }
                            }
                        }
                    }
                }

                setAssets({ itemMap, unitMap, traitMap, unitCostMap, latestSetKey, ready: true });
            })
            .catch((err) => {
                console.error('Failed to load TFT asset metadata:', err);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <TftAssetContext.Provider value={assets}>
            {children}
        </TftAssetContext.Provider>
    );
}
