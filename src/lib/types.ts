export type Category = "historical" | "current";

export type SocialKind =
  | "instagram"
  | "x"
  | "tiktok"
  | "youtube"
  | "threads"
  | "facebook"
  | "website";

export type Figure = {
  id: string;
  name: string;
  wiki_slug: string;
  image_url: string | null;
  birth_year: number | null;
  death_year: number | null;
  short_blurb: string | null;
  category: Category;
  elo: number;
  matches: number;
  wins: number;
  created_at: string;
  social_url: string | null;
  social_kind: SocialKind | "none" | null;
  fame_rank: number | null;
  controversy_rank: number | null;
  money_rank: number | null;
  net_worth_usd: number | null;
};

export type MatchRecord = {
  id: string;
  winner_id: string;
  loser_id: string;
  created_at: string;
};

export type MatchupResponse = {
  a: Figure;
  b: Figure;
  token: string;
  ts: number;
};

export type VoteResponse = {
  winnerNewElo: number;
  loserNewElo: number;
  personalWinnerNewElo: number | null;
  personalLoserNewElo: number | null;
};

export type RecentMatch = {
  id: string;
  created_at: string;
  outcome: "win" | "loss";
  opponent: {
    id: string;
    name: string;
    wiki_slug: string;
    image_url: string | null;
  };
};

export type FigureDetailResponse = {
  figure: Figure;
  rank: number;
  recent: RecentMatch[];
};
