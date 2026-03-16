import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { cdragonAssetPathToPngUrl } from '../utils/cdragon';

interface TftAssets {
    itemMap: Map<string, string>;
    unitMap: Map<string, string>;
    traitMap: Map<string, string>;
    unitCostMap: Map<string, number>;
    championNameMap: Map<string, string>;
    itemNameMap: Map<string, string>;
    traitNameMap: Map<string, string>;
    getChampionName: (apiName: string) => string;
    getItemName: (apiName: string) => string;
    getTraitName: (apiName: string) => string;
    latestSetKey: string | null;
    ready: boolean;
}

const TftAssetContext = createContext<TftAssets>({
    itemMap: new Map(),
    unitMap: new Map(),
    traitMap: new Map(),
    unitCostMap: new Map(),
    championNameMap: new Map(),
    itemNameMap: new Map(),
    traitNameMap: new Map(),
    getChampionName: (apiName: string) => formatApiNameFallback(apiName),
    getItemName: (apiName: string) => formatApiNameFallback(apiName),
    getTraitName: (apiName: string) => formatApiNameFallback(apiName),
    latestSetKey: null,
    ready: false,
});

export function useTftAssets() {
    return useContext(TftAssetContext);
}

export function useTftMetadata() {
    return useContext(TftAssetContext);
}

const METADATA_URL = 'https://raw.communitydragon.org/latest/cdragon/tft/en_us.json';

interface RawItem {
    apiName?: string;
    id?: string;
    icon?: string;
    name?: string;
}

interface RawChampion {
    apiName?: string;
    tileIcon?: string;
    icon?: string;
    cost?: number;
    name?: string;
}

interface RawTrait {
    apiName?: string;
    icon?: string;
    name?: string;
}

interface RawSet {
    champions?: RawChampion[];
    traits?: RawTrait[];
}

interface RawMetadata {
    items?: RawItem[];
    sets?: Record<string, RawSet>;
}

function normalizeApiName(apiName: string): string {
    return apiName.trim().toLowerCase();
}

function formatApiNameFallback(apiName: string): string {
    const trimmed = apiName.trim();
    if (!trimmed) return 'Unknown';

    const withoutTftPrefix = trimmed
        .replace(/^TFT\d+_/i, '')
        .replace(/^TFT_/i, '')
        .replace(/^Item_/i, '');

    const spaced = withoutTftPrefix
        .replace(/_/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();

    return spaced || trimmed;
}

function getLatestSetKey(sets: Record<string, RawSet> | undefined): string | null {
    if (!sets || typeof sets !== 'object') return null;

    const latest = Object.keys(sets)
        .map((key) => ({ key, value: Number(key) }))
        .filter(({ value }) => Number.isFinite(value))
        .sort((a, b) => b.value - a.value)[0];

    return latest?.key ?? null;
}

export function TftMetadataProvider({ children }: { children: ReactNode }) {
    const [assets, setAssets] = useState<TftAssets>({
        itemMap: new Map(),
        unitMap: new Map(),
        traitMap: new Map(),
        unitCostMap: new Map(),
        championNameMap: new Map(),
        itemNameMap: new Map(),
        traitNameMap: new Map(),
        getChampionName: (apiName: string) => formatApiNameFallback(apiName),
        getItemName: (apiName: string) => formatApiNameFallback(apiName),
        getTraitName: (apiName: string) => formatApiNameFallback(apiName),
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
                const championNameMap = new Map<string, string>();
                const itemNameMap = new Map<string, string>();
                const traitNameMap = new Map<string, string>();
                const latestSetKey = getLatestSetKey(data.sets);

                if (Array.isArray(data.items)) {
                    for (const item of data.items) {
                        const key = normalizeApiName(item.apiName ?? item.id ?? '');
                        const icon = item.icon;
                        if (key && icon) {
                            itemMap.set(key, cdragonAssetPathToPngUrl(icon));
                        }
                        if (key && item.name) {
                            itemNameMap.set(key, item.name);
                        }
                    }
                }

                if (latestSetKey && data.sets) {
                    const latestSet = data.sets[latestSetKey];

                    if (latestSet) {
                        if (Array.isArray(latestSet.champions)) {
                            for (const champ of latestSet.champions) {
                                const key = normalizeApiName(champ.apiName ?? '');
                                const icon = champ.tileIcon ?? champ.icon;
                                if (key && icon) {
                                    unitMap.set(key, cdragonAssetPathToPngUrl(icon));
                                }
                                if (key && typeof champ.cost === 'number') {
                                    unitCostMap.set(key, champ.cost);
                                }
                                if (key && champ.name) {
                                    championNameMap.set(key, champ.name);
                                }
                            }
                        }
                        if (Array.isArray(latestSet.traits)) {
                            for (const trait of latestSet.traits) {
                                const key = normalizeApiName(trait.apiName ?? '');
                                if (key && trait.icon) {
                                    traitMap.set(key, cdragonAssetPathToPngUrl(trait.icon));
                                }
                                if (key && trait.name) {
                                    traitNameMap.set(key, trait.name);
                                }
                            }
                        }
                    }
                }

                const getChampionName = (apiName: string): string => {
                    const normalized = normalizeApiName(apiName);
                    return championNameMap.get(normalized) ?? formatApiNameFallback(apiName);
                };

                const getItemName = (apiName: string): string => {
                    const normalized = normalizeApiName(apiName);
                    return itemNameMap.get(normalized) ?? formatApiNameFallback(apiName);
                };

                const getTraitName = (apiName: string): string => {
                    const normalized = normalizeApiName(apiName);
                    return traitNameMap.get(normalized) ?? formatApiNameFallback(apiName);
                };

                setAssets({
                    itemMap,
                    unitMap,
                    traitMap,
                    unitCostMap,
                    championNameMap,
                    itemNameMap,
                    traitNameMap,
                    getChampionName,
                    getItemName,
                    getTraitName,
                    latestSetKey,
                    ready: true,
                });
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

export const TftAssetProvider = TftMetadataProvider;
