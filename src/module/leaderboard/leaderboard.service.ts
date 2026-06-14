import { Injectable } from "@nestjs/common";
import { LeaderboardRepository } from "./leaderboard.repository";

@Injectable()
export class LeaderboardService {
    constructor(private readonly leaderboardrepository : LeaderboardRepository){}
}