import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserOrganization } from '../users/entities/userorganization.entity';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { Bookmark } from './entities/bookmark.entity';
import { Test } from '../tests/entities/test.entity';
import { TestStatus } from 'src/config/enum';
import { TestSet } from '../tests/entities/testset.entity';
import { BookmarkType,UserRole } from 'src/config/enum';

@Injectable()
export class BookmarksRepository {
  constructor(private readonly dataSource: DataSource) {}
  async saveBookmark(
    input: CreateBookmarkDto,
    userId: string | null,
    orgId: string
  ) {
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

  async findBookmark(
    userId: string | null,
    orgId: string,
    input: CreateBookmarkDto) {
    try {
      const qb = this.dataSource
        .getRepository(Bookmark)
        .createQueryBuilder('bm');
      if(!userId){
        qb.where('bm.user_id IS NULL');
      }else{
        qb.where('bm.user_id =:userId', { userId })
      }
      return await qb
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
  async getBookmarkCount(
    resolvedOrgId:string,
    userId:string,
    isStudent : boolean,
  ){
    try{
    const qr =  this.dataSource
      .getRepository(Bookmark)
      .createQueryBuilder('bm')
      .select([
        'COUNT(*)::int AS "allCount"',
        'COUNT(*) FILTER (WHERE bm.item_type = 1)::int AS "testCount"',
        'COUNT(*) FILTER (WHERE bm.item_type = 2)::int AS "testSetCount"',
        'COUNT(*) FILTER (WHERE bm.user_id IS NULL)::int AS "orgCount"',
      ])
      .where('bm.org_id = :orgId', { orgId: resolvedOrgId });
      
        if(isStudent){
          qr.andWhere('bm.user_id =:userId',{userId});
        }else{
          qr.andWhere('(bm.user_id = :userId OR bm.user_id IS NULL)', { userId })
        }
      
      const result = await qr.getRawOne();
    return {
      allCount: Number(result?.allCount || 0),
      testCount: Number(result?.testCount || 0),
      testSetCount: Number(result?.testSetCount || 0),
      orgCount: Number(result?.orgCount || 0),
    };
      
    }catch(err){
      throw err;
    } 
  }
  async getAllBookmark(
    orgId: string,
    userId: string,
    limit : number = 10,
    offset: number = 0,
    itemType?: BookmarkType,
  ) {
    try {
     const qb = this.dataSource
        .getRepository(Bookmark)
        .createQueryBuilder('bm')
        .leftJoin(
          'test',
          't',
          't.test_id = bm.item_id AND bm.item_type = :testType',
          { testType: BookmarkType.TEST },
        )
        .leftJoin(
          'test_set',
          'ts',
           'ts.set_id = bm.item_id AND bm.item_type = :testSetType',
          { testSetType: BookmarkType.TEST_SET },
        )
        .select([
          'bm.bookmark_id AS bookmark_id',
          'bm.user_id AS user_id',
          'bm.org_id AS org_id',
          'bm.item_id AS item_id',
          'bm.item_type AS item_type',
          'bm.created_at AS created_at',
          'COALESCE(t.name, ts.name) AS title',
          'COALESCE(t.description, ts.description) AS subtitle',
        ])
        .where('bm.org_id = :orgId', { orgId })
        .andWhere('bm.user_id = :userId', { userId });

      if (itemType) {
        qb.andWhere('bm.item_type = :itemType', { itemType });
      }

      const data = await qb
        .orderBy('bm.created_at', 'DESC')
        .limit(limit)
        .offset(offset)
        .getRawMany();

      return data;
    } catch (err) {
      throw err;
    }
  }
  async getAllOrgBookmark(
    orgId: string,
    userId:string | null = null,
    limit:number=10,
    offset:number=0,
    itemType?: BookmarkType,
  ) {
    try {
     const qb = this.dataSource
        .getRepository(Bookmark)
        .createQueryBuilder('bm')
        .leftJoin(
          'test',
          't',
          't.test_id = bm.item_id AND bm.item_type = :testType',
          { testType: BookmarkType.TEST },
        )
        .leftJoin(
          'test_set',
          'ts',
          'ts.set_id = bm.item_id AND bm.item_type = :testSetType',
          { testSetType: BookmarkType.TEST_SET },
        )
        .select([
          'bm.bookmark_id AS bookmark_id',
          'bm.user_id AS user_id',
          'bm.org_id AS org_id',
          'bm.item_id AS item_id',
          'bm.item_type AS item_type',
          'bm.created_at AS created_at',
          'COALESCE(t.name, ts.name) AS title',
          'COALESCE(t.description, ts.description) AS subtitle',
        ])
        .where('bm.org_id = :orgId', { orgId });

      if (userId) {
      // Matches official null pins OR pins created by this admin/user
      qb.andWhere('(bm.user_id IS NULL OR bm.user_id = :userId)', { userId });
     } else {
      // Matches official org-level pins
      qb.andWhere('bm.user_id IS NULL');
      }

      if (itemType) {
        qb.andWhere('bm.item_type = :itemType', { itemType });
      }
      
      const data = await qb
        .orderBy('bm.created_at', 'DESC')
        .limit(limit)
        .offset(offset)
        .getRawMany();

      return data ;
    } catch (err) {
      throw err;
    }
  }
}
