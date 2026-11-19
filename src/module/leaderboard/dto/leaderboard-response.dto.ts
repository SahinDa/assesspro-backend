export interface LeaderboardRow {
  rank: number;
  attempt_id: string;
  user_id: string;
  score: number;
  violation_score: number;
  duration_seconds: number;
  firstname: string | null;
  lastname: string | null;
  email: string;
  profile_pic: string | null;
}

export interface UnifiedLeaderboardRow {
  attempt_id: string | null;
  user_id: string;
  score: number | string;
  violation_score: number | string;
  duration_seconds: number | string;
  firstname: string | null;
  lastname: string | null;
  email: string;
  profile_pic: string | null;
}

export interface LeaderboardResponse {
  data: LeaderboardRow[];
  meta: {
    total_items: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}
