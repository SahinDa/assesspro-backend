import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { Organization } from 'src/decorators/organization.decorator';
import { IOrganization } from 'src/interfaces/organization.interfaces';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { UserRole } from 'src/config/enum';

@Controller('leaderboard')
@UseGuards(RoleGuard)
@Roles(UserRole.STUDENT, UserRole.ORGANIZATION, UserRole.ADMIN)
export class LeaderboardController {
  constructor(private readonly leaderboardservice: LeaderboardService) {}

  @Get('/set/:setId')
  @HttpCode(HttpStatus.OK)
  async getTestSetLeaderboard(
    @Organization() organization: IOrganization,
    @Param('setId') setId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
  ) {
    return await this.leaderboardservice.getLeaderboardByTestSet(
      organization,
      setId,
      limit,
      offset,
    );
  }

  @Get('/contest/:testId')
  @HttpCode(HttpStatus.OK)
  async getGlobalTestLeaderboard(
    @Organization() organization: IOrganization,
    @Param('testId') testId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
  ) {
    return await this.leaderboardservice.getLeaderboardByTest(
      organization,
      testId,
      limit,
      offset,
    );
  }
}
