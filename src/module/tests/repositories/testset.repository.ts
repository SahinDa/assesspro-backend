import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateTestSetDto, UpdateTestSetDto } from '../dto/testset.dto';
import { DataSource } from 'typeorm';
import { TestSet } from '../entities/testset.entity';
import { Question } from '../entities/question.entity';
import { TestSetStatus } from 'src/config/enum';
import { Test } from '../entities/test.entity';

@Injectable()
export class TestSetRepository {
  constructor(private readonly dataSource: DataSource) {}
  async createTestSet(
    orgId: string,
    testId: string,
    input: CreateTestSetDto,
  ): Promise<TestSet> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        // 1. Calculate the next sequential set number for this test
        const existingSetsCount = await manager.count(TestSet, {
          where: { test_id: testId },
        });
        const nextSetNumber = existingSetsCount + 1;

        // 2. Create and persist the parent TestSet configuration block
        const testSetInstance = manager.create(TestSet, {
          test_id: testId,
          name: input.name,
          description: input.description,
          set_number: nextSetNumber,
          total_questions: input.total_questions,
          timer_minutes: input.timer_minutes,
          positive_marking_value: input.positive_marking_value,
          is_negative_marking: input.is_negative_marking,
          negative_score_value: input.negative_score_value,
        });

        const savedTestSet = await manager.save(testSetInstance);

        // 3. Map, build and bulk-save the child nested questions list
        const questionInstances = input.questions.map((q) => {
          return manager.create(Question, {
            ...q,
            set_id: savedTestSet.set_id,
          });
        });

        await manager.save(Question, questionInstances);

        // Attach question instances to output layer for UI response visibility
        savedTestSet.questions = questionInstances;
        return savedTestSet;
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to safely execute transactional creation of test set layout.',
        error.message,
      );
    }
  }

  async findTestSetByIdAndTestId(
    setId: string,
    testId: string,
  ): Promise<TestSet | null> {
    return await this.dataSource.getRepository(TestSet).findOne({
      where: { set_id: setId, test_id: testId },
    });
  }

  async updateTestSet(
    testSetId: string,
    input: UpdateTestSetDto,
    existingSet: TestSet,
  ): Promise<TestSet> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        await manager.update(
          TestSet,
          { set_id: testSetId },
          {
            name: input.name ?? existingSet.name,
            description: input.description ?? existingSet.description,
            total_questions:
              input.total_questions ?? existingSet.total_questions,
            timer_minutes: input.timer_minutes ?? existingSet.timer_minutes,
            positive_marking_value:
              input.positive_marking_value ??
              existingSet.positive_marking_value,
            is_negative_marking:
              input.is_negative_marking ?? existingSet.is_negative_marking,
            negative_score_value:
              input.negative_score_value ?? existingSet.negative_score_value,
          },
        );

        // 2. Overwrite questions if provided by the frontend
        let updatedQuestions: Question[] = [];
        if (input.questions && input.questions.length > 0) {
          await manager.delete(Question, { set_id: testSetId });

          const questionInstances = input.questions.map((q) => {
            return manager.create(Question, {
              ...q,
              set_id: testSetId,
            });
          });

          updatedQuestions = await manager.save(Question, questionInstances);
        } else {
          // If questions weren't updated, fetch the existing ones to include in the final response
          updatedQuestions = await manager.find(Question, {
            where: { set_id: testSetId },
          });
        }

        // 3. Fetch the fresh parent state from the database
        const updatedTestSet = await manager.findOneOrFail(TestSet, {
          where: { set_id: testSetId },
        });

        // Attach the questions to the final payload structure
        updatedTestSet.questions = updatedQuestions;

        return updatedTestSet;
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to safely execute transactional update of test set layout.',
        error.message,
      );
    }
  }

  async deleteTestSet(testSetId: string) {
    try {
      return await this.dataSource
        .getRepository(TestSet)
        .update({ set_id: testSetId }, { status: TestSetStatus.DELETED });
    } catch (error) {
      console.error(
        `Database failure while soft-deleting testSetId: ${testSetId}`,
        error,
      );
      throw new InternalServerErrorException(
        'Database operation failed during test set deletion.',
      );
    }
  }

  async getAllTestSetCount(testId: string, status: number) {
    try {
      const totalTests = await this.dataSource
        .getRepository(TestSet)
        .createQueryBuilder('testset')
        .where('testset.test_id =:testId', { testId })
        .andWhere('testset.status =:status', { status })
        .getCount();

      return { count: totalTests };
    } catch (err) {
      throw err;
    }
  }

  async getAllTestSetList(testId: string, status: number) {
    try {
      const result = await this.dataSource
        .getRepository(TestSet)
        .createQueryBuilder('testset')
        .select([
          'testset.set_id',
          'testset.test_id',
          'testset.name',
          'testset.description',
          'testset.set_number',
          'testset.total_questions',
          'testset.timer_minutes',
          'testset.positive_marking_value',
          'testset.is_negative_marking',
          'testset.negative_score_value',
          'testset.status',
          'testset.created_at',
          'testset.updated_at',
        ])
        .where('testset.test_id =:testId', { testId })
        .andWhere('testset.status =:status', { status })
        .getMany();

      return result;
    } catch (err) {
      throw err;
    }
  }

  async getTestSetDetails(testSetId: string) {
    try {
      const result = await this.dataSource
        .getRepository(TestSet)
        .createQueryBuilder('testset')
        .select([
          'testset.set_id',
          'testset.test_id',
          'testset.name',
          'testset.description',
          'testset.set_number',
          'testset.total_questions',
          'testset.timer_minutes',
          'testset.positive_marking_value',
          'testset.is_negative_marking',
          'testset.negative_score_value',
          'testset.status',
          'testset.created_at',
          'testset.updated_at',
        ])
        .leftJoin('testset.questions', 'question')
        .addSelect([
          'question.question_id',
          'question.set_id',
          'question.question_text',
          'question.option_a',
          'question.option_b',
          'question.option_c',
          'question.option_d',
          'question.source',
          'question.created_at',
          'question.updated_at',
        ])
        .where('testset.set_id = :testSetId', { testSetId })
        .getOne();

      return result;
    } catch (err) {
      throw err;
    }
  }
  async toggleTestSetStatus(testSetId: string, newStatus: number) {
    try {
      return await this.dataSource
        .getRepository(TestSet)
        .update({ set_id: testSetId }, { status: newStatus });
    } catch (err) {
      throw err;
    }
  }

  async isTestSetBelongsToOrg(
    testSetId: string,
    orgId: string,
  ): Promise<boolean> {
    try {
      const count = await this.dataSource
        .getRepository(TestSet)
        .createQueryBuilder('testset')
        .innerJoin(Test, 'test', 'test.test_id = testset.test_id')
        .where('testset.set_id = :testSetId', { testSetId })
        .andWhere('test.owner_id = :orgId', { orgId })
        .getCount();

      return count > 0;
    } catch (err) {
      throw err;
    }
  }
}
