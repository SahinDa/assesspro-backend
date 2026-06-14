import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LeaderboardController } from "./leaderboard.controller";
import { LeaderboardService } from "./leaderboard.service";
import { LeaderboardRepository } from "./leaderboard.repository";

@Module({
 imports:[TypeOrmModule.forFeature([])],
 controllers:[LeaderboardController],
 providers:[LeaderboardService,LeaderboardRepository],
 exports:[LeaderboardService,LeaderboardRepository]
})

export class LeaderboardModule {}