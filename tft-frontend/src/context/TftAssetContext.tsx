import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  cdragonAssetPathToPngUrl,
  cleanTftDescription,
  type TftTextReplacementValue,
  type TftTextReplacements,
} from '../utils/cdragon';

export interface TftUnitData {
  apiName: string;
  name: string;
  icon: string;
  cost: number | null;
  desc: string;
  abilityName: string;
  abilityDesc: string;
}

export interface TftItemData {
  apiName: string;
  name: string;
  icon: string;
  desc: string;
}

export interface TftTraitData {
  apiName: string;
  name: string;
  icon: string;
  desc: string;
}

interface TftAssets {
  unitMap: Map<string, TftUnitData>;
  itemMap: Map<string, TftItemData>;
  traitMap: Map<string, TftTraitData>;
  getChampionData: (apiName: string) => TftUnitData;
  getItemData: (apiName: string) => TftItemData;
  getTraitData: (apiName: string) => TftTraitData;
  latestSetKey: string | null;
  ready: boolean;
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

function getFallbackChampionData(apiName: string): TftUnitData {
  return {
    apiName,
    name: formatApiNameFallback(apiName),
    icon: '',
    cost: null,
    desc: '',
    abilityName: '',
    abilityDesc: '',
  };
}

function getFallbackItemData(apiName: string): TftItemData {
  return {
    apiName,
    name: formatApiNameFallback(apiName),
    icon: '',
    desc: '',
  };
}

function getFallbackTraitData(apiName: string): TftTraitData {
  return {
    apiName,
    name: formatApiNameFallback(apiName),
    icon: '',
    desc: '',
  };
}

const TftAssetContext = createContext<TftAssets>({
  unitMap: new Map(),
  itemMap: new Map(),
  traitMap: new Map(),
  getChampionData: getFallbackChampionData,
  getItemData: getFallbackItemData,
  getTraitData: getFallbackTraitData,
  latestSetKey: null,
  ready: false,
});

export function useTftAssets() {
  return useContext(TftAssetContext);
}

export function TftMetadataProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<TftAssets>({
    unitMap: new Map(),
    itemMap: new Map(),
    traitMap: new Map(),
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

        const itemMap = new Map<string, TftItemData>();
        const unitMap = new Map<string, TftUnitData>();
        const traitMap = new Map<string, TftTraitData>();
        const latestSetKey = getLatestSetKey(data.sets);

        if (Array.isArray(data.items)) {
          for (const item of data.items) {
            const key = normalizeApiName(item.apiName ?? item.id ?? '');
            if (!key) continue;

            itemMap.set(key, {
              apiName: item.apiName ?? item.id ?? key,
              name: item.name ?? formatApiNameFallback(item.apiName ?? item.id ?? key),
              icon: item.icon ? cdragonAssetPathToPngUrl(item.icon) : '',
              desc: cleanTftDescription(item.desc, toReplacementRecord(item.effects)),
            });
          }
        }

        if (latestSetKey && data.sets) {
          const latestSet = data.sets[latestSetKey];

          if (latestSet) {
            if (Array.isArray(latestSet.champions)) {
              for (const champ of latestSet.champions) {
                const key = normalizeApiName(champ.apiName ?? '');
                if (!key) continue;

                const abilityDesc = cleanTftDescription(
                  champ.ability?.desc,
                  getChampionAbilityReplacements(champ.ability),
                );

                unitMap.set(key, {
                  apiName: champ.apiName ?? key,
                  name: champ.name ?? formatApiNameFallback(champ.apiName ?? key),
                  icon: champ.tileIcon ?? champ.icon ? cdragonAssetPathToPngUrl(champ.tileIcon ?? champ.icon ?? '') : '',
                  cost: typeof champ.cost === 'number' ? champ.cost : null,
                  desc: abilityDesc,
                  abilityName: champ.ability?.name?.trim() ?? '',
                  abilityDesc,
                });
              }
            }

            if (Array.isArray(latestSet.traits)) {
              for (const trait of latestSet.traits) {
                const key = normalizeApiName(trait.apiName ?? '');
                if (!key) continue;

                traitMap.set(key, {
                  apiName: trait.apiName ?? key,
                  name: trait.name ?? formatApiNameFallback(trait.apiName ?? key),
                  icon: trait.icon ? cdragonAssetPathToPngUrl(trait.icon) : '',
                  desc: cleanTftDescription(trait.desc, getTraitReplacements(trait)),
                });
              }
            }
          }
        }

        const getChampionData = (apiName: string): TftUnitData => {
          const normalized = normalizeApiName(apiName);
          return unitMap.get(normalized) ?? getFallbackChampionData(apiName);
        };

        const getItemData = (apiName: string): TftItemData => {
          const normalized = normalizeApiName(apiName);
          return itemMap.get(normalized) ?? getFallbackItemData(apiName);
        };

        const getTraitData = (apiName: string): TftTraitData => {
          const normalized = normalizeApiName(apiName);
          return traitMap.get(normalized) ?? getFallbackTraitData(apiName);
        };

        setAssets({
          unitMap,
          itemMap,
          traitMap,
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

export { TftMetadataProvider as TftAssetProvider };