import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TestAttempt } from '../attempts/entities/testattempt.entity';
import {
  LeaderboardResultRow,
  LeaderboardRow,
} from './dto/leaderboard-response.dto';
import { TestSet } from '../tests/entities/testset.entity';
import { OrganizationStatus, TestSetStatus, TestStatus } from 'src/config/enum';
import { Test } from '../tests/entities/test.entity';

@Injectable()
export class LeaderboardRepository {
  constructor(private readonly datasource: DataSource) {}
  async getLeaderboardByTestSet(
    setId: string,
    limit: number,
    offset: number,
  ): Promise<[LeaderboardRow[], number]> {
    try {
      const count = await this.datasource
        .getRepository(TestAttempt)
        .createQueryBuilder('ta')
        .where('ta.set_id =:setId', { setId })
        .andWhere('ta.attempt_number = 1')
        .getCount();
      if (count === 0) {
        return [[], 0];
      }

      const list = await this.datasource
        .getRepository(TestAttempt)
        .createQueryBuilder('ta')
        .innerJoin('users', 'u', 'ta.user_id = u.user_id')
        .select([
          'ta.attempt_id AS attempt_id',
          'ta.user_id AS user_id',
          'ta.score AS score',
          'ta.violation_score AS violation_score',
          'EXTRACT(EPOCH FROM (ta.end_time - ta.start_time)) AS duration_seconds',
          'u.firstname AS firstname',
          'u.lastname AS lastname',
          'u.email AS email',
          'u.profile_pic AS profile_pic',
        ])
        .where('ta.set_id =:setId', { setId })
        .andWhere('ta.attempt_number = 1')
        .orderBy('ta.score', 'DESC')
        .addOrderBy('ta.violation_score', 'ASC')
        .addOrderBy('(ta.end_time - ta.start_time)', 'ASC')
        .limit(limit)
        .offset(offset)
        .getRawMany();

      return [list, count];
    } catch (err) {
      throw err;
    }
  }

  async getLeaderboardByTest(
    testId: string,
    limit: number,
    offset: number,
  ): Promise<[LeaderboardResultRow[], number]> {
    const countResult = await this.datasource
      .getRepository(TestAttempt)
      .createQueryBuilder('ta')
      .select('COUNT(DISTINCT ta.user_id)')
      .where('ta.test_id = :testId', { testId })
      .getRawOne();

    const count = parseInt(countResult.count);

    // 2. Aggregate data per user
    const list = await this.datasource
      .getRepository(TestAttempt)
      .createQueryBuilder('ta')
      .innerJoin('users', 'u', 'ta.user_id = u.user_id')
      .select([
        'ta.user_id AS user_id',
        'u.firstname AS firstname',
        'u.lastname AS lastname',
        'u.email AS email',
        'u.profile_pic AS profile_pic',
        'AVG(CAST(ta.score AS FLOAT)) AS avg_score',
        'SUM(ta.violation_score) AS total_violations',
        'SUM(EXTRACT(EPOCH FROM (ta.end_time - ta.start_time))) AS total_duration',
      ])
      .where('ta.test_id = :testId', { testId })
      .andWhere('ta.attempt_number = 1')
      .groupBy('ta.user_id, u.firstname, u.lastname, u.email, u.profile_pic')
      .orderBy('avg_score', 'DESC')
      .addOrderBy('total_violations', 'ASC')
      .addOrderBy('total_duration', 'ASC')
      .limit(limit)
      .offset(offset)
      .getRawMany();

    return [list, count];
  }

  async getTestIdBySet(setId: string): Promise<string | null> {
    try {
      const isactive = TestSetStatus.ACTIVE;
      const result = await this.datasource
        .getRepository(TestSet)
        .createQueryBuilder('testset')
        .select(['testset.test_id As testId'])
        .where('testset.status =:isactive', { isactive })
        .andWhere('testset.set_id =:setId', { setId })
        .getOne();

      return result ? result.test_id : null;
    } catch (err) {
      console.error('Fail to fetch test Id', err);
      return null;
    }
  }
  async isValidOwner(userId: string, testId: string): Promise<boolean> {
    try {
      const isTestActive = TestStatus.ACTIVE;
      const isOrgActive = OrganizationStatus.ACTIVE;

      return await this.datasource
        .getRepository(Test)
        .createQueryBuilder('t')
        .innerJoin('user_organization', 'uo', 't.owner_id = uo.org_id')
        .innerJoin('organizations', 'o', 'o.id = t.owner_id')
        .where('t.test_id = :testId', { testId })
        .andWhere('uo.user_id = :userId', { userId })
        .andWhere('t.status = :isTestActive', { isTestActive })
        .andWhere('o.status = :isOrgActive', { isOrgActive })
        .andWhere('uo.is_deleted = false')
        .getExists();
    } catch (err) {
      console.error('Authorization check failed', err);
      return false;
    }
  }
}
