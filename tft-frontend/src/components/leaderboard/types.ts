export interface LeaderboardRow {
  gameName: string;
  tagline: string;
  region: string;
  tier: string;
  leaguePoints: number;
  totalGames: number;
  winRate: number;
}

export interface RegionOption {
  label: string;
  value: string;
}
