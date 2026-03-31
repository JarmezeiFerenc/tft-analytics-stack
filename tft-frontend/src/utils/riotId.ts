export interface ParsedRiotId {
  gameName: string;
  tagline: string;
}

export function parseRiotId(input: string): ParsedRiotId | null {
  const [name, tag] = input.split('#');
  const gameName = name?.trim();
  const tagline = tag?.trim();

  if (!gameName || !tagline) {
    return null;
  }

  return { gameName, tagline };
}