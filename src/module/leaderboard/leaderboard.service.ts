import { ForbiddenException, Injectable } from '@nestjs/common';
import { LeaderboardRepository } from './leaderboard.repository';
import { LeaderboardResultRow } from './dto/leaderboard-response.dto';
import { IOrganization } from 'src/interfaces/organization.interfaces';
import { UserRole } from 'src/config/enum';

@Injectable()
export class LeaderboardService {
  constructor(private readonly leaderboardrepository: LeaderboardRepository) {}
  async getLeaderboardByTestSet(
    organizaiton: IOrganization,
    setId: string,
    limit: number,
    offset: number,
  ) {
    try {
      if (
        organizaiton.role === UserRole.ORGANIZATION ||
        organizaiton.role === UserRole.STUDENT
      ) {
        const testId = await this.leaderboardrepository.getTestIdBySet(setId);
        if (!testId) {
          throw new ForbiddenException(
            'You do not have access to this test set.',
          );
        }
        const isValid = await this.leaderboardrepository.isValidOwner(
          organizaiton.user_id,
          testId,
        );
        if (!isValid) {
          throw new ForbiddenException(
            'You do not have permission to access this test set.',
          );
        }
      }

      const [list, count] =
        await this.leaderboardrepository.getLeaderboardByTestSet(
          setId,
          limit,
          offset,
        );
      if (count === 0) {
        return { count: 0, list: [], hasNext: false };
      }

      let currentRank = offset + 1;

      const rankedList = list.map((item, index, array) => {
        if (index > 0) {
          const prev = array[index - 1];

          const scoreMatches = Number(item.score) === Number(prev.score);
          const violationsMatch =
            Number(item.violation_score) === Number(prev.violation_score);
          const durationMatches =
            Number(item.duration_seconds) === Number(prev.duration_seconds);

          if (!(scoreMatches && violationsMatch && durationMatches)) {
            currentRank = offset + index + 1;
          }
        }

        return {
          rank: currentRank,
          attempt_id: item.attempt_id,
          user_id: item.user_id,
          score: Number(item.score),
          violation_score: Number(item.violation_score),
          duration_seconds: Math.round(Number(item.duration_seconds)),
          user: {
            firstname: item.firstname,
            lastname: item.lastname,
            email: item.email,
            profile_pic: item.profile_pic,
          },
        };
      });

      return {
        count,
        list: rankedList,
        hasNext: Number(offset + limit) < Number(count),
      };
    } catch (err) {
      throw err;
    }
  }

  async getLeaderboardByTest(
    organizaiton: IOrganization,
    testId: string,
    limit: number,
    offset: number,
  ) {
    try {
      if (
        organizaiton.role === UserRole.ORGANIZATION ||
        organizaiton.role === UserRole.STUDENT
      ) {
        const isValid = await this.leaderboardrepository.isValidOwner(
          organizaiton.user_id,
          testId,
        );
        if (!isValid) {
          throw new ForbiddenException(
            'You do not have permission to access this test.',
          );
        }
      }
      // 1. Fetch current page slice
      const [list, count] =
        await this.leaderboardrepository.getLeaderboardByTest(
          testId,
          limit,
          offset,
        );

      if (count === 0 || !list || list.length === 0) {
        return { count: 0, list: [], hasNext: false };
      }

      // 2. Look-behind: Fetch the very last person of the previous page to handle boundary ties
      let prevPageLastItem: LeaderboardResultRow | null = null;
      if (offset > 0) {
        const [prevList] =
          await this.leaderboardrepository.getLeaderboardByTest(
            testId,
            1,
            offset - 1,
          );
        if (prevList && prevList.length > 0) {
          prevPageLastItem = prevList[0];
        }
      }

      // 3. Map and Rank
      // We start rank based on offset.
      // If the first person on this page ties with the last person of the previous page,
      // the logic below will correctly prevent the rank from incrementing.
      let currentRank = offset + 1;

      const rankedList = list.map((item, index, array) => {
        let prev: LeaderboardResultRow | null = null;

        if (index > 0) {
          // Previous item is on the same page
          prev = array[index - 1];
        } else if (index === 0 && prevPageLastItem) {
          // Previous item is the last one from the previous page
          prev = prevPageLastItem;
        }

        if (prev) {
          const scoreMatches =
            Number(item.avg_score) === Number(prev?.avg_score);
          const violationsMatch =
            Number(item.total_violations) === Number(prev?.total_violations);
          const durationMatches =
            Number(item.total_duration) === Number(prev?.total_duration);

          // If they are NOT a tie, jump to the correct global rank position
          if (!(scoreMatches && violationsMatch && durationMatches)) {
            currentRank = offset + index + 1;
          }
        } else {
          // This is the true rank 1 (Global start)
          currentRank = offset + 1;
        }

        return {
          rank: currentRank,
          attempt_id: 'AGGREGATED',
          user_id: item.user_id,
          score: parseFloat(Number(item.avg_score).toFixed(2)),
          violation_score: Number(item.total_violations),
          duration_seconds: Math.round(Number(item.total_duration)),
          firstname: item.firstname,
          lastname: item.lastname,
          email: item.email,
          profile_pic: item.profile_pic,
        };
      });

      return {
        count: Number(count),
        list: rankedList,
        hasNext: Number(offset + limit) < Number(count),
      };
    } catch (err) {
      throw err;
    }
  }
}
