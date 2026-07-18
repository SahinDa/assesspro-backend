import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserOrganization } from '../users/entities/userorganization.entity';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { Bookmark } from './entities/bookmark.entity';
import { Test } from '../tests/entities/test.entity';
import { TestStatus } from 'src/config/enum';
import { TestSet } from '../tests/entities/testset.entity';

@Injectable()
export class BookmarksRepository {
  constructor(private readonly dataSource: DataSource) {}
  async saveBookmark(input: CreateBookmarkDto, userId: string, orgId: string) {
    try {
      const repo = this.dataSource.getRepository(Bookmark);
      const bookmark = repo.create({
        user_id: userId,
        org_id: orgId,
        item_id: input.item_id,
        item_type: input.item_type,
      });

      return await repo.save(bookmark);
    } catch (err) {
      throw err;
    }
  }
  async isValidTest(testId: string, orgId: string) {
    try {
      return await this.dataSource
        .getRepository(Test)
        .createQueryBuilder('test')
        .where('test.test_id =:testId', { testId })
        .andWhere('test.owner_id =:orgId', { orgId })
        .andWhere('test.status =:status', { status: TestStatus.ACTIVE })
        .getExists();
    } catch (err) {
      throw err;
    }
  }
  async isValidTestSet(testsetId: string, orgId: string): Promise<boolean> {
    try {
      return await this.dataSource
        .getRepository(TestSet)
        .createQueryBuilder('ts')
        .innerJoin('ts.test', 'test')
        .where('ts.set_id = :testsetId', { testsetId })
        .andWhere('test.owner_id = :orgId', { orgId })
        .andWhere('test.status = :status', { status: TestStatus.ACTIVE })
        .getExists();
    } catch (err) {
      throw err;
    }
  }

  async findBookmark(userId: string, orgId: string, input: CreateBookmarkDto) {
    try {
      return await this.dataSource
        .getRepository(Bookmark)
        .createQueryBuilder('bm')
        .where('bm.user_id =:userId', { userId })
        .andWhere('bm.org_id =:orgId', { orgId })
        .andWhere('bm.item_id =:itemId', { itemId: input.item_id })
        .andWhere('bm.item_type =:itemType', { itemType: input.item_type })
        .getOne();
    } catch (err) {
      throw err;
    }
  }
  async deleteBookmark(bookmarkId: string) {
    try {
      const repo = this.dataSource.getRepository(Bookmark);
      return await repo.delete({
        bookmark_id: bookmarkId,
      });
    } catch (err) {
      throw err;
    }
  }
  async getAllBookmark(orgId: string, userId: string) {
    try {
      const [data, count] = await this.dataSource
        .getRepository(Bookmark)
        .createQueryBuilder('bm')
        .where('bm.org_id =:orgId', { orgId })
        .andWhere('bm.user_id =:userId', { userId })
        .orderBy('bm.created_at', 'DESC')
        .getManyAndCount();

      return { data, total: count };
    } catch (err) {
      throw err;
    }
  }
  async getAllOrgBookmark(orgId: string) {
    try {
      const [data, count] = await this.dataSource
        .getRepository(Bookmark)
        .createQueryBuilder('bm')
        .where('bm.org_id =:orgId', { orgId })
        .orderBy('bm.created_at', 'DESC')
        .getManyAndCount();

      return { data, total: count };
    } catch (err) {
      throw err;
    }
  }
}
