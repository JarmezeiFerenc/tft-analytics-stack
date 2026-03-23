import { useMemo } from 'react';
import type { TftTraitData, TftTraitEffect, TftUnitData } from '../../context/TftAssetContext';
import type { BoardSlot } from './types';

export interface TraitStatus {
  traitApiName: string;
  name: string;
  desc: string;
  icon: string;
  count: number;
  activeStyle: number;
  effects: TftTraitEffect[];
}

function resolveActiveStyle(count: number, effects: TftTraitEffect[]): number {
  let style = 0;
  for (const effect of effects) {
    if (count >= effect.minUnits) {
      style = effect.style;
    }
  }
  return style;
}

export function useTraitTracker(
  boardSlots: BoardSlot[],
  unitMap: Map<string, TftUnitData>,
  traitMap: Map<string, TftTraitData>,
): TraitStatus[] {
  return useMemo(() => {
    const uniqueIds = new Set<string>();
    for (const slot of boardSlots) {
      if (slot) {
        uniqueIds.add(slot.id.trim().toLowerCase());
      }
    }

    if (uniqueIds.size === 0) return [];

    const traitNameToKey = new Map<string, string>();
    for (const [key, trait] of traitMap) {
      traitNameToKey.set(trait.name.toLowerCase(), key);
    }

    const traitCounts = new Map<string, number>();
    for (const champId of uniqueIds) {
      const champ = unitMap.get(champId);
      if (!champ) continue;

      for (const traitName of champ.traits) {
        const traitKey = traitNameToKey.get(traitName.toLowerCase());
        if (!traitKey) continue;
        traitCounts.set(traitKey, (traitCounts.get(traitKey) ?? 0) + 1);
      }
    }

    const result: TraitStatus[] = [];
    for (const [traitKey, count] of traitCounts) {
      const trait = traitMap.get(traitKey);
      if (!trait || trait.effects.length === 0) continue;

      const activeStyle = resolveActiveStyle(count, trait.effects);
      result.push({
        traitApiName: trait.apiName,
        name: trait.name,
        desc: trait.desc,
        icon: trait.icon,
        count,
        activeStyle,
        effects: trait.effects,
      });
    }

    result.sort((a, b) => {
      const aActive = a.activeStyle > 0 ? 1 : 0;
      const bActive = b.activeStyle > 0 ? 1 : 0;

      if (aActive !== bActive) return bActive - aActive;

      if (aActive && bActive) {
        if (a.activeStyle !== b.activeStyle) return b.activeStyle - a.activeStyle;
        return b.count - a.count;
      }

      return b.count - a.count;
    });

    return result;
  }, [boardSlots, unitMap, traitMap]);
}
