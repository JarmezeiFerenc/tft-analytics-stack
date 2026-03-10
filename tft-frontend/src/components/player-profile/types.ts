export interface ProfileData {
  puuid: string;
  gameName: string;
  tagline: string;
  region: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
}

export interface TraitData {
  name: string;
  numUnits: number;
  style: number;
  tierCurrent: number;
}

export interface UnitData {
  characterId: string;
  tier: number;
  rarity: number;
  items: string[];
}

export interface ParticipantData {
  puuid: string;
  gameName: string | null;
  tagline: string | null;
  placement: number;
  level: number;
  lastRound: number;
  goldLeft: number;
  traits: TraitData[];
  units: UnitData[];
}

export interface MatchData {
  matchId: string;
  gameLength: number;
  gameDatetime: number;
  gameVersion: string;
  queueType: string;
  myPlacement: number | null;
  myTraits: TraitData[];
  myUnits: UnitData[];
  participants: ParticipantData[];
}

export interface ApiResponse {
  profile: ProfileData;
  matches: MatchData[];
}

export interface RegionOption {
  label: string;
  value: string;
}
