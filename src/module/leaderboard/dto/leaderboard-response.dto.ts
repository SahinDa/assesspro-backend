export interface LeaderboardRow {
    rank: number;
    attempt_id: string;
    user_id: string;
    score: number;
    violation_score: number;
    duration_seconds: number;
    firstname: string;
    lastname: string;
    email: string;
    profile_pic: string | null;
}

export interface TestSetLeaderboardResponse {
    count: number;
    list: LeaderboardRow[];
    hasNext?: boolean;
}

export interface LeaderboardResultRow {
    user_id: string;
    firstname: string;
    lastname: string;
    email: string;
    profile_pic: string | null;
    avg_score: number | string;
    total_violations: number | string;
    total_duration: number | string;
}