import { Injectable } from '@nestjs/common';
import { StartAttemptDto } from './dto/attempt.dto';
import { DataSource } from 'typeorm';
import { TestAttempt } from './entities/testattempt.entity';
import { TestSet } from '../tests/entities/testset.entity';
import { Question } from '../tests/entities/question.entity';
import { AttemptAnswer } from './entities/attemptanswer.entity';

@Injectable()
export class AttemptsRepository {
  constructor(private readonly dataSource: DataSource) {}
  async isActiveSessionRunning(userId: string, input: StartAttemptDto) {
    try {
      const testId = input.test_id;
      const testSetId = input.testset_id;
      const activeAttempt = await this.dataSource
        .getRepository(TestAttempt)
        .createQueryBuilder('ta')
        .where('ta.user_id = :userId', { userId })
        .andWhere('ta.test_id = :testId', { testId })
        .andWhere('ta.set_id = :testSetId', { testSetId })
        .andWhere('ta.end_time > :now', { now: new Date() })
        .select(['ta.attempt_id'])
        .getOne();

      // Returns true if an active session row is found, false otherwise
      return !!activeAttempt;
    } catch (err) {
      throw err;
    }
  }

  async getAttemptCount(userId: string, testSetId: string): Promise<number> {
    return await this.dataSource
      .getRepository(TestAttempt)
      .createQueryBuilder('ta')
      .where('ta.user_id = :userId', { userId })
      .andWhere('ta.set_id = :testSetId', { testSetId })
      .getCount();
  }

  async createNewAttempt(
    attemptData: Partial<TestAttempt>,
  ): Promise<TestAttempt> {
    const repo = this.dataSource.getRepository(TestAttempt);
    const newAttempt = repo.create(attemptData);
    return await repo.save(newAttempt);
  }

  async getAttemptWithScoringRules(
    attemptId: string,
    userId: string,
  ): Promise<any> {
    return await this.dataSource
      .getRepository(TestAttempt)
      .createQueryBuilder('ta')
      .innerJoin(TestSet, 'ts', 'ts.set_id = ta.set_id')
      .select([
        'ta.attempt_id AS attempt_id',
        'ta.user_id AS user_id',
        'ta.set_id AS set_id',
        'ta.end_time AS end_time',
        'ta.submitted_via AS submitted_via',
        'ts.positive_marking_value AS positive_value',
        'ts.is_negative_marking AS is_negative_marking',
        'ts.negative_score_value AS negative_value',
      ])
      .where('ta.attempt_id = :attemptId', { attemptId })
      .andWhere('ta.user_id = :userId', { userId })
      .getRawOne();
  }

  async getTestSetQuestionKeys(setId: string): Promise<Question[]> {
    return await this.dataSource
      .getRepository(Question)
      .createQueryBuilder('q')
      .select(['q.question_id', 'q.correct_answer'])
      .where('q.set_id = :setId', { setId })
      .getMany();
  }

  async saveFinalGradingTransaction(
    attemptId: string,
    finalScore: number,
    answerRows: any[],
    submissionMethod: number,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Lock the parent attempt row with the score and submission type
      await queryRunner.manager.update(
        TestAttempt,
        { attempt_id: attemptId },
        {
          score: finalScore,
          submitted_via: submissionMethod, // 1 = Manual Click, 2 = Frontend Auto-Submit
        },
      );

      // 2. Clear out any previous partial saves and bulk-insert final graded answers
      await queryRunner.manager.delete(AttemptAnswer, {
        attempt_id: attemptId,
      });
      await queryRunner.manager.insert(AttemptAnswer, answerRows);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async isValidAttempt(attemptId: string, userId: string) {
    try {
      const bufferTime = new Date(Date.now() + 2 * 60 * 1000);
      return await this.dataSource
        .getRepository(TestAttempt)
        .createQueryBuilder('ta')
        .where('ta.user_id = :userId', { userId })
        .andWhere('ta.attempt_id = :attemptId', { attemptId })
        .andWhere('ta.submitted_via IS NULL')
        .andWhere('ta.end_time >= :bufferTime', { bufferTime })
        .select(['ta.end_time'])
        .getOne();
    } catch (err) {
      throw err;
    }
  }

  async updateLastAwayTime(attemptId: string) {
    try {
      const currentTime = new Date();
      return await this.dataSource
        .getRepository(TestAttempt)
        .update({ attempt_id: attemptId }, { last_away_at: currentTime });
    } catch (err) {
      throw err;
    }
  }
  async submitViolationScore(attemptId: string, penalty: number) {
    try {
      const result = await this.dataSource
        .getRepository(TestAttempt)
        .createQueryBuilder()
        .update(TestAttempt)
        .set({
          violation_score: () => `violation_score + ${penalty}`,
          last_away_at: null,
        })
        .where('attempt_id = :attemptId', { attemptId })
        .returning(['violation_score'])
        .execute();
      const updatedRow = result.raw[0];

      return Number(updatedRow.violation_score);
    } catch (err) {
      throw err;
    }
  }

  async getExpiredAndAbandonedAttempts(
    limit: number,
  ): Promise<{ attempt_id: string; user_id: string }[]> {
    const currentTime = new Date();
    const cutoffTime = new Date(currentTime.getTime() - 4 * 60 * 1000);

    return await this.dataSource
      .getRepository(TestAttempt)
      .createQueryBuilder('ta')
      .select(['ta.attempt_id AS attempt_id', 'ta.user_id AS user_id'])
      .where('ta.submitted_via IS NULL')
      .andWhere('ta.end_time <= :cutoffTime', { cutoffTime })
      .limit(limit)
      .getRawMany();
  }

  async getAttemptDetailedReview(
    userId: string,
    attemptId: string,
  ): Promise<any[]> {
    return await this.dataSource
      .getRepository(TestAttempt)
      .createQueryBuilder('ta')
      .innerJoin('tests', 't', 't.test_id = ta.test_id')
      .innerJoin('test_sets', 'ts', 'ts.set_id = ta.set_id')
      .innerJoin('questions', 'q', 'q.set_id = ta.set_id')
      .leftJoin(
        'student_answers',
        'sa',
        'sa.attempt_id = ta.attempt_id AND sa.question_id = q.question_id',
      )
      .select([
        'ta.test_id AS test_id',
        't.name AS test_name',
        'ta.set_id AS set_id',
        'ts.name AS set_name',
        'ta.final_score AS final_score',
        'ta.submitted_via AS submitted_via',
        'ta.created_at AS completed_at',

        // Question context fields
        'q.question_id AS question_id',
        'q.text AS question_text',
        'q.option_1 AS option_1',
        'q.option_2 AS option_2',
        'q.option_3 AS option_3',
        'q.option_4 AS option_4',
        'q.correct_answer AS correct_answer',

        // Student result properties (evaluates to null if skipped)
        'sa.selected_option AS selected_option',
        'sa.is_correct_status AS is_correct_status',
        'sa.marks_awarded AS marks_awarded',
      ])
      .where('ta.attempt_id = :attemptId AND ta.user_id = :userId', {
        attemptId,
        userId,
      })
      .orderBy('q.question_id', 'ASC')
      .getRawMany();
  }

  async findAttemptHistoryByUserId(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ data: any[]; total: number }> {
    const total = await this.dataSource
      .getRepository(TestAttempt)
      .count({ where: { user_id: userId } });

    if (total === 0) {
      return { data: [], total: 0 };
    }

    const data = await this.dataSource
      .getRepository(TestAttempt)
      .createQueryBuilder('ta')
      .innerJoin('tests', 't', 't.test_id = ta.test_id')
      .innerJoin('test_sets', 'ts', 'ts.set_id = ta.set_id')
      .select([
        'ta.attempt_id AS attempt_id',
        'ta.test_id AS test_id',
        't.name AS test_name',
        'ta.set_id AS set_id',
        'ts.name AS set_name',
        'ta.final_score AS final_score',
        'ta.submitted_via AS submitted_via',
        'ta.created_at AS created_at',
        'ROW_NUMBER() OVER (PARTITION BY ta.test_id ORDER BY ta.created_at ASC) AS attempt_number',
      ])
      .where('ta.user_id = :userId', { userId })
      .orderBy('ta.created_at', 'DESC')
      .offset(offset)
      .limit(limit)
      .getRawMany();

    return { data, total };
  }

  async findAllAttemptsBySetId(
    setId: string,
    limit: number,
    offset: number,
  ): Promise<{ data: any[]; total: number }> {
    // 1. Core total slice count tracking
    const total = await this.dataSource
      .getRepository(TestAttempt)
      .count({ where: { set_id: setId } });

    if (total === 0) {
      return { data: [], total: 0 };
    }

    const data = await this.dataSource
      .getRepository(TestAttempt)
      .createQueryBuilder('ta')
      .innerJoin('tests', 't', 't.test_id = ta.test_id')
      // Left join users table to display real student names on the history page
      .leftJoin('users', 'u', 'u.user_id = ta.user_id')
      .select([
        'ta.attempt_id AS attempt_id',
        'ta.user_id AS user_id',
        'u.name AS student_name',
        'ta.test_id AS test_id',
        't.name AS test_name',
        'ta.final_score AS final_score',
        'ta.submitted_via AS submitted_via',
        'ta.created_at AS created_at',
      ])
      .where('ta.set_id = :setId', { setId })
      .orderBy('ta.created_at', 'DESC')
      .offset(offset)
      .limit(limit)
      .getRawMany();

    return { data, total };
  }

  async findUserAttemptsBySetId(
    userId: string,
    setId: string,
    limit: number,
    offset: number,
  ): Promise<{ data: any[]; total: number }> {
    // 1. Run a fast, optimized COUNT command across the compound index
    const total = await this.dataSource.getRepository(TestAttempt).count({
      where: {
        user_id: userId,
        set_id: setId,
      },
    });

    if (total === 0) {
      return { data: [], total: 0 };
    }

    // 2. Query the individual session milestones, ordered from newest to oldest
    const data = await this.dataSource
      .getRepository(TestAttempt)
      .createQueryBuilder('ta')
      .innerJoin('tests', 't', 't.test_id = ta.test_id')
      .innerJoin('test_sets', 'ts', 'ts.set_id = ta.set_id')
      .select([
        'ta.attempt_id AS attempt_id',
        'ta.test_id AS test_id',
        't.name AS test_name',
        'ts.name AS set_name',
        'ta.final_score AS final_score',
        'ta.submitted_via AS submitted_via',
        'ta.created_at AS created_at',
      ])
      .where('ta.user_id = :userId AND ta.set_id = :setId', { userId, setId })
      .orderBy('ta.created_at', 'DESC') // Most recent take shows up first
      .offset(offset)
      .limit(limit)
      .getRawMany();

    return { data, total };
  }
}
