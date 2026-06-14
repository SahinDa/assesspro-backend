import { Controller, Get } from "@nestjs/common";
import { LeaderboardService } from "./leaderboard.service";

@Controller('leaderboard')
export class LeaderboardController {
    constructor(private readonly leaderboardservice : LeaderboardService){}

    //use limit and offset
    @Get('/:testid')
    async getLeaderboard(){}
}