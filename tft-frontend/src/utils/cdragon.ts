const CDRAGON_BASE_URL = 'https://raw.communitydragon.org/latest';
const TFT_METADATA_URL = `${CDRAGON_BASE_URL}/cdragon/tft/en_us.json`;

let itemIconMapPromise: Promise<Map<string, string>> | null = null;

function unique(values: Array<string | undefined | null>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim().length > 0)))];
}

export function normalizeAssetId(assetId: string): string {
  return assetId.trim().toLowerCase();
}

export function cdragonAssetPathToPngUrl(assetPath: string): string {
  const normalized = assetPath.trim().toLowerCase().replace(/\\/g, '/');

  const gamePath = normalized.startsWith('assets/')
    ? `game/${normalized}`
    : normalized.startsWith('/assets/')
      ? `game${normalized}`
      : normalized;

  const pngPath = gamePath.replace(/\.(tex|dds)$/i, '.png').replace(/^\//, '');
  return `${CDRAGON_BASE_URL}/${pngPath}`;
}

export function getUnitImageUrls(unitId: string): string[] {
  const normalized = normalizeAssetId(unitId);
  const noSetPrefix = normalized.replace(/^tft\d+_/, '');

  return unique([
    `${CDRAGON_BASE_URL}/game/assets/characters/${normalized}/hud/${normalized}_square.tft.png`,
    `${CDRAGON_BASE_URL}/game/assets/characters/${normalized}/hud/${normalized}_square.png`,
    `${CDRAGON_BASE_URL}/game/assets/characters/${normalized}/${normalized}.png`,
    `${CDRAGON_BASE_URL}/game/assets/characters/${noSetPrefix}/hud/${noSetPrefix}_square.tft.png`,
    `${CDRAGON_BASE_URL}/game/assets/characters/${noSetPrefix}/hud/${noSetPrefix}_square.png`,
    `${CDRAGON_BASE_URL}/game/assets/characters/${noSetPrefix}/${noSetPrefix}.png`,
  ]);
}

export function getItemImageUrls(itemId: string): string[] {
  const normalized = normalizeAssetId(itemId);
  const noSetAndItemPrefix = normalized.replace(/^tft\d+_item_/, '');
  const noSetPrefix = normalized.replace(/^tft\d+_/, '');

  return unique([
    `${CDRAGON_BASE_URL}/game/assets/maps/particles/tft/item_icons/${normalized}.png`,
    `${CDRAGON_BASE_URL}/game/assets/maps/particles/tft/item_icons/${normalized}.tex`,
    `${CDRAGON_BASE_URL}/game/assets/maps/particles/tft/item_icons/${noSetAndItemPrefix}.png`,
    `${CDRAGON_BASE_URL}/game/assets/maps/particles/tft/item_icons/${noSetAndItemPrefix}.tex`,
    `${CDRAGON_BASE_URL}/game/assets/maps/particles/tft/item_icons/${noSetPrefix}.png`,
    `${CDRAGON_BASE_URL}/game/assets/maps/particles/tft/item_icons/${noSetPrefix}.tex`,
  ]);
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function buildItemIconMapFromMetadata(metadata: unknown): Map<string, string> {
  const iconMap = new Map<string, string>();
  const queue: unknown[] = [metadata];

  while (queue.length > 0) {
    const current = queue.pop();

    if (Array.isArray(current)) {
      for (const entry of current) {
        queue.push(entry);
      }
      continue;
    }

    if (!isRecord(current)) {
      continue;
    }

    const apiName = current['apiName'];
    const icon = current['icon'];
    if (typeof apiName === 'string' && typeof icon === 'string') {
      iconMap.set(normalizeAssetId(apiName), cdragonAssetPathToPngUrl(icon));
    }

    for (const value of Object.values(current)) {
      queue.push(value);
    }
  }

  return iconMap;
}

export async function getItemIconMap(): Promise<Map<string, string>> {
  if (!itemIconMapPromise) {
    itemIconMapPromise = fetch(TFT_METADATA_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch TFT metadata: HTTP ${response.status}`);
        }
        return response.json() as Promise<unknown>;
      })
      .then((data) => buildItemIconMapFromMetadata(data))
      .catch((error) => {
        itemIconMapPromise = null;
        throw error;
      });
  }

  return itemIconMapPromise;
}

export async function resolveItemImageUrls(itemId: string): Promise<string[]> {
  const normalized = normalizeAssetId(itemId);
  const withoutSetPrefix = normalized.replace(/^tft\d+_/, '');
  const noSetAndItemPrefix = normalized.replace(/^tft\d+_item_/, '');

  const iconMap = await getItemIconMap();

  return unique([
    iconMap.get(normalized),
    iconMap.get(withoutSetPrefix),
    iconMap.get(noSetAndItemPrefix),
    ...getItemImageUrls(itemId),
  ]);
}
