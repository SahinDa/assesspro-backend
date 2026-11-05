import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Test } from '../entities/test.entity';
import { IOrganization } from 'src/interfaces/organization.interfaces';
import { createTestDto, updateTestDto } from '../dto/test.dto';
import { TestStatus, BookmarkType } from 'src/config/enum';

@Injectable()
export class TestRepository {
  constructor(private readonly dataSource: DataSource) {}
  async isTestExist(orgId: string, name: string) {
    try {
      const testName = name.trim();
      const result = await this.dataSource
        .getRepository(Test)
        .createQueryBuilder('test')
        .where('Lower(test.name) = Lower(:testName)', { testName })
        .andWhere('test.owner_id = :orgId', { orgId })
        .getExists();

      return result;
    } catch (err) {
      throw err;
    }
  }
  async createTest(organization: IOrganization, input: createTestDto) {
    try {
      const description = input.description ? input.description.trim() : null;
      const testRepository = this.dataSource.getRepository(Test);
      const newTest = testRepository.create({
        name: input.name.trim(),
        owner_id: organization.org_id,
        owner_type: organization.role as any,
        total_set: 0,
        description,
      });

      const result = await testRepository.save(newTest);

      return result;
    } catch (err) {
      throw err;
    }
  }

  async isTestExistBasedOnTestID(orgId: string, testId: string) {
    try {
      const status = TestStatus.DELETED;
      const result = await this.dataSource
        .getRepository(Test)
        .createQueryBuilder('test')
        .where('test.test_id = :testId', { testId })
        .andWhere('test.owner_id =:orgId', { orgId })
        .andWhere('test.status !=:status', { status })
        .getExists();
      return result;
    } catch (err) {
      throw err;
    }
  }
  async updateTest(testId: string, input: updateTestDto) {
    try {
      const updatePayload: Record<string, any> = {};

      if (input.name !== undefined) {
        updatePayload.name = input.name.trim();
      }
      if (input.description !== undefined) {
        updatePayload.description = input.description
          ? input.description.trim()
          : null;
      }

      const result = await this.dataSource
        .getRepository(Test)
        .update({ test_id: testId }, updatePayload);

      return result;
    } catch (err) {
      throw err;
    }
  }
  async deleteTest(orgId: string, testId: string) {
    try {
      return await this.dataSource
        .getRepository(Test)
        .update(
          { test_id: testId, owner_id: orgId },
          { status: TestStatus.DELETED },
        );
    } catch (err) {
      throw err;
    }
  }
  async getAllTestList(orgId: string,userId : string, statusList: number[],offset:number,limit:number) {
    try {
      const result = await this.dataSource
        .getRepository(Test)
        .createQueryBuilder('test')
        .select([
          'test.test_id',
          'test.name',
          'test.description',
          'test.total_set',
          'test.status',
          'test.created_at',
          'test.updated_at',
        ])
        // 1. is_bookmarked: user_id is NOT NULL and matches this user
      .addSelect(
        `EXISTS (
          SELECT 1 FROM bookmarks b
          WHERE b.item_id = test.test_id
            AND b.item_type = :testType
            AND b.user_id IS NOT NULL
            AND b.user_id = :userId
        )`,
        'is_bookmarked',
      )
      // 2. is_student_bookmarked: user_id IS NULL (org level for students)
      .addSelect(
        `EXISTS (
          SELECT 1 FROM bookmarks b
          WHERE b.item_id = test.test_id
            AND b.item_type = :testType
            AND b.org_id = :orgId
            AND b.user_id IS NULL
        )`,
        'is_student_bookmarked',
       )
        .where('test.owner_id =:orgId', { orgId })
        .andWhere('test.status IN (:...statusList)', { statusList })
        .setParameters({
        testType: BookmarkType.TEST,
        userId,
        orgId,
       })
        .orderBy('test.created_at', 'DESC')
        .skip(offset)
        .take(limit)
        .getRawMany();

      return result.map((item) => ({
      test_id: item.test_id,
      name: item.name,
      description: item.description,
      total_set: Number(item.total_set) || 0,
      status: item.status,
      created_at: item.created_at,
      updated_at: item.updated_at,
      is_bookmarked: item.is_bookmarked === true || item.is_bookmarked === 't',
      is_student_bookmarked:
        item.is_student_bookmarked === true || item.is_student_bookmarked === 't',
    }));
    } catch (err) {
      throw err;
    }
  }
  async getAllTestCount(orgId: string, statusList: number[]) {
    try {
      const totalTests = await this.dataSource
        .getRepository(Test)
        .createQueryBuilder('test')
        .where('test.owner_id =:orgId', { orgId })
        .andWhere('test.status IN (:...statusList)', { statusList })
        .getCount();

      return { count: totalTests };
    } catch (err) {
      throw err;
    }
  }
  async getTest(testId: string, orgId: string) {
    try {
      const result = await this.dataSource
        .getRepository(Test)
        .createQueryBuilder('test')
        .select([
          'test.test_id',
          'test.name',
          'test.description',
          'test.total_set',
          'test.status',
          'test.created_at',
          'test.updated_at',
        ])
        .where('test_id =:testId', { testId })
        .andWhere('test.owner_id = :orgId', { orgId })
        .getOne();
      
      return result;
      
    } catch (err) {
      throw err;
    }
  }
  async toggleTestStatus(orgId: string, testId: string, newStatus: number) {
    try {
      const result = await this.dataSource
        .getRepository(Test)
        .update({ test_id: testId, owner_id: orgId }, { status: newStatus });
      return result;
    } catch (err) {
      throw err;
    }
  }

  async getTestSetCountPerTest(targetOrgId: string) {
    try {
      return await this.dataSource
        .getRepository(Test)
        .createQueryBuilder('test')
        .leftJoin('test.sets', 'testset')
        .select('test.name', 'testName')
        .addSelect('COUNT(testset.set_id)', 'setCount')
        .where('test.owner_id = :targetOrgId', { targetOrgId })
        .groupBy('test.test_id, test.name')
        .getRawMany();
    } catch (err) {
      throw err;
    }
  }
}
