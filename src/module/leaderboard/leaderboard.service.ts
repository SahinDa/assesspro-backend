import { ForbiddenException, Injectable ,NotFoundException,InternalServerErrorException,HttpException  } from '@nestjs/common';
import { LeaderboardRepository } from './leaderboard.repository';
import {
  LeaderboardRow,
  UnifiedLeaderboardRow,
  LeaderboardResponse,
} from './dto/leaderboard-response.dto';
import { LeaderboardFilterDto, GetAssessmentOptionsQueryDto, GetLeaderboardSearchDto } from './dto/leaderboard.dto';
import { IOrganization } from 'src/interfaces/organization.interfaces';
import { OrganizationsService } from '../organizations/organizations.service';
import { UserRole } from 'src/config/enum';

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly leaderboardrepository: LeaderboardRepository,
    private readonly organizationsservice: OrganizationsService,
  ) {} 
  
  async getLeaderboard(
    organization: IOrganization,
    filter: LeaderboardFilterDto,
  ) {
    try {
      const limit = filter?.limit ?? 10;
      const offset = filter?.offset ?? 0;
      let orgId: string | null = null;

      if (organization.role === UserRole.ORGANIZATION) {
        orgId = organization?.org_id ?? null;
      } else if (organization.role === UserRole.STUDENT) {
        orgId = filter?.orgId ?? null;
        if (!orgId) {
          throw new NotFoundException('Organization id is required');
        }
          const partOfOrganization =
          await this.organizationsservice.isValidUserOrganization(
            organization.user_id,
            orgId
          );
        if (!partOfOrganization) {
          throw new ForbiddenException(
            'Access Denied: You are not an active member of this organization.',
          );
        }
      } else if (organization.role === UserRole.ADMIN) {
        orgId = filter?.orgId ?? null;
      }

      if (!orgId) {
        throw new NotFoundException('Organization id is required');
      }

      const { data, total, prevPageLastItem } =
        await this.leaderboardrepository.getLeaderboard(orgId, filter);

     let rankedData: LeaderboardRow[] = [];

   if (total > 0 && data && data.length > 0) {
     let currentRank = offset + 1;

   rankedData = data.map((item, index, array) => {
    let prev: UnifiedLeaderboardRow | null = null;

    if (index > 0) {
      prev = array[index - 1];
    } else if (index === 0 && prevPageLastItem) {
      prev = prevPageLastItem;
    }

    if (prev) {
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
      attempt_id: item.attempt_id ?? '',
      user_id: item.user_id,
      score: filter?.testset_id
         ? Number(item.score ?? 0)
         : parseFloat(Number(item.score ?? 0).toFixed(2)),
      violation_score: Number(item.violation_score ?? 0 ),
      duration_seconds: Math.round(Number(item.duration_seconds ?? 0 )),
      test_id : item.test_id,
      test_name : item.test_name,
      testset_id : item.testset_id,
      testset_name : item.testset_name,
      firstname: item.firstname,
      lastname: item.lastname,
      email: item.email,
      profile_pic: item.profile_pic,
    };
  });
}

  return {
     data: rankedData,
     meta: {
        total_items: Number(total),
        limit,
        offset,
        has_more: Number(total) > offset + limit,
          },
     };
      
    } catch (err) {
      console.log('Failed to retrieve leaderboard::', err.message);
      throw err;
    }
  }

  async getLeaderboardOptions(
    organization: IOrganization,
    filter: GetAssessmentOptionsQueryDto,
  ){
    try{
      let orgId: string | null = null;
      let isTestset :boolean = filter?.isTestset ?? false;
      const testId: string | undefined = filter?.test_id;
      
        if (organization.role === UserRole.ORGANIZATION) {
        orgId = organization?.org_id ?? null;
      } else if (organization.role === UserRole.STUDENT) {
        orgId = filter?.orgId ?? null;
        if (!orgId) {
          throw new NotFoundException('Organization id is required');
        }
          const partOfOrganization =
          await this.organizationsservice.isValidUserOrganization(
            organization.user_id,
            orgId
          );
        if (!partOfOrganization) {
          throw new ForbiddenException(
            'Access Denied: You are not an active member of this organization.',
          );
        }
      } else if (organization.role === UserRole.ADMIN) {
        orgId = filter?.orgId ?? null;
      }

      if (!orgId) {
        throw new NotFoundException('Organization id is required');
      }
       if(isTestset && !testId){
          throw new NotFoundException('Test id is required');
       }
      return  await this.leaderboardrepository.getLeaderboardOptions(orgId,isTestset,testId);
      
    }catch(err){
      console.log(`Failed to retrieve Leaderboard options:: ${err.message}`);
     if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to retrieve leaderboard options');
    }
  }

 async searchLeaderboard(
    organization: IOrganization,
    filter: GetLeaderboardSearchDto
  ){
    try{
       filter.limit = filter.limit ?? 10;
       filter.offset = filter.offset ?? 0;
      
        if (organization.role === UserRole.ORGANIZATION) {
         filter.orgId= organization?.org_id;
      } else if (organization.role === UserRole.STUDENT) {
        let orgId = filter?.orgId;
        if (!orgId) {
          throw new NotFoundException('Organization id is required');
        }
          const partOfOrganization =
          await this.organizationsservice.isValidUserOrganization(
            organization.user_id,
            orgId
          );
        if (!partOfOrganization) {
          throw new ForbiddenException(
            'Access Denied: You are not an active member of this organization.',
          );
        }
      }

      if (!filter.orgId) {
        throw new NotFoundException('Organization id is required');
      }

     const { data: rows, total } =
        await this.leaderboardrepository.searchLeaderboard(filter);

      const limit = filter.limit ?? 10;
      const offset = filter.offset ?? 0;

      const data: LeaderboardRow[] = rows.map((row) => ({
        rank: Number(row.rank),
        attempt_id: row.attempt_id,
        test_id: row.test_id,
        test_name: row.test_name,
        testset_id: row.testset_id,
        testset_name: row.testset_name,
        user_id: row.user_id,
        firstname: row.firstname ?? '',
        lastname: row.lastname ?? null,
        email: row.email,
        profile_pic: row.profile_pic ?? null,
        score: Number(row.score ?? 0),
        violation_score: Number(row.violation_score ?? 0),
        duration_seconds: Number(row.duration_seconds ?? 0),
      }));

      return {
        data,
        meta: {
          total_items: total,
          limit,
          offset,
          has_next: offset + data.length < total,
        },
      };
      
    }catch(err){
      console.log(`Failed to retrieve Leaderboard Search:: ${err.message}`);
     if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to retrieve leaderboard Search');
    }
  }
  // async getLeaderboardByTestSet(
  //   organizaiton: IOrganization,)
  //   setId: string,
  //   limit: number,
  //   offset: number,
  // ) {
  //   try {
  //     if (
  //       organizaiton.role === UserRole.ORGANIZATION ||
  //       organizaiton.role === UserRole.STUDENT
  //     ) {
  //       const testId = await this.leaderboardrepository.getTestIdBySet(setId);
  //       if (!testId) {
  //         throw new ForbiddenException(
  //           'You do not have access to this test set.',
  //         );
  //       }
  //       const isValid = await this.leaderboardrepository.isValidOwner(
  //         organizaiton.user_id,
  //         testId,
  //       );
  //       if (!isValid) {
  //         throw new ForbiddenException(
  //           'You do not have permission to access this test set.',
  //         );
  //       }
  //     }

  //     const [list, count] =
  //       await this.leaderboardrepository.getLeaderboardByTestSet(
  //         setId,
  //         limit,
  //         offset,
  //       );
  //     if (count === 0) {
  //       return { count: 0, list: [], hasNext: false };
  //     }

  //     let currentRank = offset + 1;

  //     const rankedList = list.map((item, index, array) => {
  //       if (index > 0) {
  //         const prev = array[index - 1];

  //         const scoreMatches = Number(item.score) === Number(prev.score);
  //         const violationsMatch =
  //           Number(item.violation_score) === Number(prev.violation_score);
  //         const durationMatches =
  //           Number(item.duration_seconds) === Number(prev.duration_seconds);

  //         if (!(scoreMatches && violationsMatch && durationMatches)) {
  //           currentRank = offset + index + 1;
  //         }
  //       }

  //       return {
  //         rank: currentRank,
  //         attempt_id: item.attempt_id,
  //         user_id: item.user_id,
  //         score: Number(item.score),
  //         violation_score: Number(item.violation_score),
  //         duration_seconds: Math.round(Number(item.duration_seconds)),
  //         user: {
  //           firstname: item.firstname,
  //           lastname: item.lastname,
  //           email: item.email,
  //           profile_pic: item.profile_pic,
  //         },
  //       };
  //     });

  //     return {
  //       count,
  //       list: rankedList,
  //       hasNext: Number(offset + limit) < Number(count),
  //     };
  //   } catch (err) {
  //     throw err;
  //   }
  // }

  // async getLeaderboardByTest(
  //   organizaiton: IOrganization,
  //   testId: string,
  //   limit: number,
  //   offset: number,
  // ) {
  //   try {
  //     if (
  //       organizaiton.role === UserRole.ORGANIZATION ||
  //       organizaiton.role === UserRole.STUDENT
  //     ) {
  //       const isValid = await this.leaderboardrepository.isValidOwner(
  //         organizaiton.user_id,
  //         testId,
  //       );
  //       if (!isValid) {
  //         throw new ForbiddenException(
  //           'You do not have permission to access this test.',
  //         );
  //       }
  //     }
  //     // 1. Fetch current page slice
  //     const [list, count] =
  //       await this.leaderboardrepository.getLeaderboardByTest(
  //         testId,
  //         limit,
  //         offset,
  //       );

  //     if (count === 0 || !list || list.length === 0) {
  //       return { count: 0, list: [], hasNext: false };
  //     }

  //     // 2. Look-behind: Fetch the very last person of the previous page to handle boundary ties
  //     let prevPageLastItem: LeaderboardResultRow | null = null;
  //     if (offset > 0) {
  //       const [prevList] =
  //         await this.leaderboardrepository.getLeaderboardByTest(
  //           testId,
  //           1,
  //           offset - 1,
  //         );
  //       if (prevList && prevList.length > 0) {
  //         prevPageLastItem = prevList[0];
  //       }
  //     }

  //     // 3. Map and Rank
  //     // We start rank based on offset.
  //     // If the first person on this page ties with the last person of the previous page,
  //     // the logic below will correctly prevent the rank from incrementing.
  //     let currentRank = offset + 1;

  //     const rankedList = list.map((item, index, array) => {
  //       let prev: LeaderboardResultRow | null = null;

  //       if (index > 0) {
  //         // Previous item is on the same page
  //         prev = array[index - 1];
  //       } else if (index === 0 && prevPageLastItem) {
  //         // Previous item is the last one from the previous page
  //         prev = prevPageLastItem;
  //       }

  //       if (prev) {
  //         const scoreMatches =
  //           Number(item.avg_score) === Number(prev?.avg_score);
  //         const violationsMatch =
  //           Number(item.total_violations) === Number(prev?.total_violations);
  //         const durationMatches =
  //           Number(item.total_duration) === Number(prev?.total_duration);

  //         // If they are NOT a tie, jump to the correct global rank position
  //         if (!(scoreMatches && violationsMatch && durationMatches)) {
  //           currentRank = offset + index + 1;
  //         }
  //       } else {
  //         // This is the true rank 1 (Global start)
  //         currentRank = offset + 1;
  //       }

  //       return {
  //         rank: currentRank,
  //         attempt_id: 'AGGREGATED',
  //         user_id: item.user_id,
  //         score: parseFloat(Number(item.avg_score).toFixed(2)),
  //         violation_score: Number(item.total_violations),
  //         duration_seconds: Math.round(Number(item.total_duration)),
  //         firstname: item.firstname,
  //         lastname: item.lastname,
  //         email: item.email,
  //         profile_pic: item.profile_pic,
  //       };
  //     });

  //     return {
  //       count: Number(count),
  //       list: rankedList,
  //       hasNext: Number(offset + limit) < Number(count),
  //     };
  //   } catch (err) {
  //     throw err;
  //   }
  // }
}
