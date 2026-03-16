import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { cdragonAssetPathToPngUrl, cleanTftDescription, type TftTextReplacementValue, type TftTextReplacements } from '../utils/cdragon';

export interface TftChampionMetadata {
    apiName: string;
    name: string;
    cost: number | null;
    abilityName: string;
    abilityDesc: string;
}

export interface TftItemMetadata {
    apiName: string;
    name: string;
    desc: string;
}

export interface TftTraitMetadata {
    apiName: string;
    name: string;
    desc: string;
}

interface TftAssets {
    itemMap: Map<string, string>;
    unitMap: Map<string, string>;
    traitMap: Map<string, string>;
    unitCostMap: Map<string, number>;
    championNameMap: Map<string, string>;
    itemNameMap: Map<string, string>;
    traitNameMap: Map<string, string>;
    championDataMap: Map<string, TftChampionMetadata>;
    itemDataMap: Map<string, TftItemMetadata>;
    traitDataMap: Map<string, TftTraitMetadata>;
    getChampionName: (apiName: string) => string;
    getItemName: (apiName: string) => string;
    getTraitName: (apiName: string) => string;
    getChampionData: (apiName: string) => TftChampionMetadata;
    getItemData: (apiName: string) => TftItemMetadata;
    getTraitData: (apiName: string) => TftTraitMetadata;
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
    championDataMap: new Map(),
    itemDataMap: new Map(),
    traitDataMap: new Map(),
    getChampionName: (apiName: string) => formatApiNameFallback(apiName),
    getItemName: (apiName: string) => formatApiNameFallback(apiName),
    getTraitName: (apiName: string) => formatApiNameFallback(apiName),
    getChampionData: (apiName: string) => ({
        apiName,
        name: formatApiNameFallback(apiName),
        cost: null,
        abilityName: '',
        abilityDesc: '',
    }),
    getItemData: (apiName: string) => ({
        apiName,
        name: formatApiNameFallback(apiName),
        desc: '',
    }),
    getTraitData: (apiName: string) => ({
        apiName,
        name: formatApiNameFallback(apiName),
        desc: '',
    }),
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
    desc?: string;
    effects?: Record<string, TftTextReplacementValue> | null;
}

interface RawChampionAbilityVariable {
    name?: string;
    value?: TftTextReplacementValue;
}

interface RawChampionAbility {
    name?: string;
    desc?: string;
    variables?: RawChampionAbilityVariable[];
}

interface RawChampion {
    apiName?: string;
    tileIcon?: string;
    icon?: string;
    cost?: number;
    name?: string;
    ability?: RawChampionAbility;
}

interface RawTraitEffect {
    variables?: Record<string, TftTextReplacementValue>;
}

interface RawTrait {
    apiName?: string;
    icon?: string;
    name?: string;
    desc?: string;
    effects?: RawTraitEffect[];
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

function getFallbackChampionData(apiName: string): TftChampionMetadata {
    return {
        apiName,
        name: formatApiNameFallback(apiName),
        cost: null,
        abilityName: '',
        abilityDesc: '',
    };
}

function getFallbackItemData(apiName: string): TftItemMetadata {
    return {
        apiName,
        name: formatApiNameFallback(apiName),
        desc: '',
    };
}

function getFallbackTraitData(apiName: string): TftTraitMetadata {
    return {
        apiName,
        name: formatApiNameFallback(apiName),
        desc: '',
    };
}

function toReplacementRecord(source: Record<string, TftTextReplacementValue> | null | undefined): TftTextReplacements {
    if (!source) return {};

    return Object.fromEntries(
        Object.entries(source).filter(([, value]) => value !== undefined && value !== null),
    );
}

function getChampionAbilityReplacements(ability: RawChampionAbility | undefined): TftTextReplacements {
    const replacements: TftTextReplacements = {};

    for (const variable of ability?.variables ?? []) {
        if (!variable.name || variable.value === undefined || variable.value === null) continue;
        replacements[variable.name] = variable.value;
    }

    return replacements;
}

function getTraitReplacements(trait: RawTrait): TftTextReplacements {
    const effects = Array.isArray(trait.effects) ? trait.effects : [];
    if (effects.length !== 1) return {};

    return toReplacementRecord(effects[0]?.variables);
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
        championDataMap: new Map(),
        itemDataMap: new Map(),
        traitDataMap: new Map(),
        getChampionName: (apiName: string) => formatApiNameFallback(apiName),
        getItemName: (apiName: string) => formatApiNameFallback(apiName),
        getTraitName: (apiName: string) => formatApiNameFallback(apiName),
        getChampionData: getFallbackChampionData,
        getItemData: getFallbackItemData,
        getTraitData: getFallbackTraitData,
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
                const championDataMap = new Map<string, TftChampionMetadata>();
                const itemDataMap = new Map<string, TftItemMetadata>();
                const traitDataMap = new Map<string, TftTraitMetadata>();
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
                        if (key) {
                            itemDataMap.set(key, {
                                apiName: item.apiName ?? item.id ?? key,
                                name: item.name ?? formatApiNameFallback(item.apiName ?? item.id ?? key),
                                desc: cleanTftDescription(item.desc, toReplacementRecord(item.effects)),
                            });
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
                                if (key) {
                                    championDataMap.set(key, {
                                        apiName: champ.apiName ?? key,
                                        name: champ.name ?? formatApiNameFallback(champ.apiName ?? key),
                                        cost: typeof champ.cost === 'number' ? champ.cost : null,
                                        abilityName: champ.ability?.name?.trim() ?? '',
                                        abilityDesc: cleanTftDescription(
                                            champ.ability?.desc,
                                            getChampionAbilityReplacements(champ.ability),
                                        ),
                                    });
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
                                if (key) {
                                    traitDataMap.set(key, {
                                        apiName: trait.apiName ?? key,
                                        name: trait.name ?? formatApiNameFallback(trait.apiName ?? key),
                                        desc: cleanTftDescription(trait.desc, getTraitReplacements(trait)),
                                    });
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

                const getChampionData = (apiName: string): TftChampionMetadata => {
                    const normalized = normalizeApiName(apiName);
                    return championDataMap.get(normalized) ?? getFallbackChampionData(apiName);
                };

                const getItemData = (apiName: string): TftItemMetadata => {
                    const normalized = normalizeApiName(apiName);
                    return itemDataMap.get(normalized) ?? getFallbackItemData(apiName);
                };

                const getTraitData = (apiName: string): TftTraitMetadata => {
                    const normalized = normalizeApiName(apiName);
                    return traitDataMap.get(normalized) ?? getFallbackTraitData(apiName);
                };

                setAssets({
                    itemMap,
                    unitMap,
                    traitMap,
                    unitCostMap,
                    championNameMap,
                    itemNameMap,
                    traitNameMap,
                    championDataMap,
                    itemDataMap,
                    traitDataMap,
                    getChampionName,
                    getItemName,
                    getTraitName,
                    getChampionData,
                    getItemData,
                    getTraitData,
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
