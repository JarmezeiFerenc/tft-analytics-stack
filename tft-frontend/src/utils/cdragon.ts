const CDRAGON_BASE_URL = 'https://raw.communitydragon.org/latest';

export const PLACEHOLDER_URL = `${CDRAGON_BASE_URL}/game/assets/maps/tft/icons/tft_item_unknown.png`;

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
