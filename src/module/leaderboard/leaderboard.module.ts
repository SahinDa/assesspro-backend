import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardRepository } from './leaderboard.repository';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
            TypeOrmModule.forFeature([]),
             OrganizationsModule,
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService, LeaderboardRepository],
  exports: [LeaderboardService, LeaderboardRepository],
})
export class LeaderboardModule {}
