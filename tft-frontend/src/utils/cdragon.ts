const CDRAGON_BASE_URL = 'https://raw.communitydragon.org/latest';

export const PLACEHOLDER_URL = `${CDRAGON_BASE_URL}/game/assets/maps/tft/icons/tft_item_unknown.png`;

export type TftTextReplacementValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean | null | undefined>;

export type TftTextReplacements = Record<string, TftTextReplacementValue>;

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

function formatTftNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

function formatReplacementValue(value: TftTextReplacementValue, multiplier = 1): string {
  if (Array.isArray(value)) {
    const parts = value
      .filter((entry): entry is string | number | boolean => entry !== null && entry !== undefined)
      .map((entry) => formatReplacementValue(entry, multiplier))
      .filter(Boolean);

    return [...new Set(parts)].join('/');
  }

  if (typeof value === 'number') {
    return formatTftNumber(value * multiplier);
  }

  if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return '';
}

function resolvePlaceholder(token: string, replacements: TftTextReplacements): string {
  const trimmedToken = token.trim();
  const match = trimmedToken.match(/^([^*]+?)(?:\*([0-9.]+))?$/);

  if (!match) return '';

  const [, key, multiplierRaw] = match;
  const multiplier = multiplierRaw ? Number(multiplierRaw) : 1;
  const replacement = replacements[key];

  if (replacement === undefined || replacement === null) {
    return '';
  }

  return formatReplacementValue(replacement, Number.isFinite(multiplier) ? multiplier : 1);
}

export function cleanTftDescription(rawDesc: string | null | undefined, replacements: TftTextReplacements = {}): string {
  if (!rawDesc) return '';

  const withLineBreaks = rawDesc
    .replace(/\r\n?/g, '\n')
    .replace(/(?:<br\s*\/?>\s*){2,}/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&');

  const withResolvedPlaceholders = withLineBreaks.replace(/@([^@]+?)@/g, (_, token: string) => {
    return resolvePlaceholder(token, replacements);
  });

  const stripped = withResolvedPlaceholders
    .replace(/%i:[^%]+%/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\(\s*\)/g, '')
    .replace(/\(\s*[,/%.-]?\s*\)/g, '')
    .replace(/\s+([,.;:%)])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')');

  const lines = stripped
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line === '' || /[A-Za-z0-9]/.test(line));

  const compacted: string[] = [];
  for (const line of lines) {
    if (line === '') {
      if (compacted[compacted.length - 1] !== '') {
        compacted.push('');
      }
      continue;
    }

    compacted.push(line);
  }

  return compacted.join('\n').trim();
}
