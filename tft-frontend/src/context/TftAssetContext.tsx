import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { cdragonAssetPathToPngUrl } from '../utils/cdragon';

interface TftAssets {
    itemMap: Map<string, string>;
    unitMap: Map<string, string>;
    traitMap: Map<string, string>;
    ready: boolean;
}

const TftAssetContext = createContext<TftAssets>({
    itemMap: new Map(),
    unitMap: new Map(),
    traitMap: new Map(),
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

export function TftAssetProvider({ children }: { children: ReactNode }) {
    const [assets, setAssets] = useState<TftAssets>({
        itemMap: new Map(),
        unitMap: new Map(),
        traitMap: new Map(),
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

                if (Array.isArray(data.items)) {
                    for (const item of data.items) {
                        const key = (item.apiName ?? item.id ?? '').toLowerCase();
                        const icon = item.icon;
                        if (key && icon) {
                            itemMap.set(key, cdragonAssetPathToPngUrl(icon));
                        }
                    }
                }

                if (data.sets && typeof data.sets === 'object') {
                    const setKeys = Object.keys(data.sets);
                    const latestSetKey = setKeys.sort((a, b) => Number(b) - Number(a))[0];
                    const latestSet = data.sets[latestSetKey];

                    if (latestSet) {
                        if (Array.isArray(latestSet.champions)) {
                            for (const champ of latestSet.champions) {
                                const key = (champ.apiName ?? '').toLowerCase();
                                const icon = champ.tileIcon ?? champ.icon;
                                if (key && icon) {
                                    unitMap.set(key, cdragonAssetPathToPngUrl(icon));
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

                setAssets({ itemMap, unitMap, traitMap, ready: true });
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
