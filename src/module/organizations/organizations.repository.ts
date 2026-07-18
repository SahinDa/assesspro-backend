import { BadRequestException, Injectable } from '@nestjs/common';
import { Organization } from './entities/organization.entity';
import { UserOrganization } from '../users/entities/userorganization.entity';
import {
  JoinRequestStatus,
  OrganizationRole,
  OrganizationStatus,
  UserRole,
} from 'src/config/enum';
import { User } from '../users/entities/user.entity';
import { DataSource } from 'typeorm';
import { UpdateOrgStatusDto } from './dto/Organization.dto';
import { JoinRequest } from './entities/join-request.entity';

@Injectable()
export class OrganizationsRepository {
  constructor(private readonly dataSource: DataSource) {}

  async checkExisting(userId: string, orgName: string): Promise<boolean> {
    const name = orgName.trim();
    const isTaken = await this.dataSource
      .getRepository(Organization)
      .createQueryBuilder('org')
      .where('LOWER(org.name) = LOWER(:name)', { name })
      .getExists();

    return isTaken;
  }
  async createOrganization(
    userId: string,
    orgName: string,
  ): Promise<Organization> {
    return await this.dataSource.transaction(async (manager) => {
      await manager.update(
        User,
        { user_id: userId },
        { role: UserRole.ORGANIZATION },
      );
      const newOrg = manager.create(Organization, {
        name: orgName,
        status: OrganizationStatus.ACTIVE,
      });
      const savedOrg = await manager.save(newOrg);

      //  Step Three: Create and save the link row connecting this user to the fresh organization
      const userOrgLink = manager.create(UserOrganization, {
        user_id: userId,
        org_id: savedOrg.id,
        role: OrganizationRole.ADMIN,
        joined_date: new Date(),
        is_deleted: false,
      });
      await manager.save(userOrgLink);

      return savedOrg;
    });
  }

  async updateOrganization(
    userId: string,
    newName: string,
  ): Promise<{ success: boolean; data?: Organization; error?: string }> {
    try {
      const result = await this.dataSource
        .getRepository(Organization)
        .createQueryBuilder('org')
        .update(Organization)
        .set({ name: newName.trim() })
        .where(
          `id = (
        SELECT userOrg.org_id 
        FROM user_organization userOrg 
        WHERE userOrg.user_id = :userId 
          AND userOrg.is_deleted = false
        LIMIT 1
      )`,
          { userId },
        )
        .returning('*')
        .execute();

      if (result.affected === 0) {
        return {
          success: false,
          error: 'No active organization found linked to your user profile.',
        };
      }

      return {
        success: true,
        data: result.raw[0] as Organization,
      };
    } catch (dbError: any) {
      throw dbError.message || 'A database error occurred.';
    }
  }
  async findOrganizationDetailsByUserId(userId: string) {
    try {
      // Queries the mapping table and joins the actual organization entity records
      const userOrgMapping = await this.dataSource
        .getRepository(UserOrganization)
        .createQueryBuilder('userOrg')
        .innerJoinAndSelect('userOrg.organization', 'org')
        .where('userOrg.user_id = :userId', { userId })
        .andWhere('userOrg.is_deleted = :isDeleted', { isDeleted: false })
        .getOne();

      // If no active row matches or the relationship doesn't exist, return null gracefully
      if (!userOrgMapping || !userOrgMapping.organization) {
        return null;
      }

      // Return just the embedded Organization details object out of the junction record
      return userOrgMapping.organization as Organization;
    } catch (dbError: any) {
      // Log the internal error safely for infrastructure tracking
      console.error(
        'Failed to resolve organization properties context:',
        dbError,
      );
      return null;
    }
  }

  async getAllOrganizations(
    status?: string,
    isdeleted?: boolean,
  ): Promise<Organization[]> {
    try {
      // 1 Step One: Run the query and use .getMany() to return an array of mappings
      const filterDeleted = isdeleted !== undefined ? isdeleted : false;

      const query = this.dataSource
        .getRepository(UserOrganization)
        .createQueryBuilder('userOrg')
        .innerJoin('userOrg.organization', 'org')
        .innerJoin(User, 'user', 'user.user_id = userOrg.user_id')
        .select([
          'org.id AS id',
          'org.name AS name',
          'org.status AS status',
          'org.created_at AS created_at',
          'org.updated_at AS updated_at',
          'user.user_id AS user_id',
          'user.email AS email',
          'user.firstname AS firstname',
          'user.lastname AS lastname',
          'user.profile_pic AS profile_pic',
        ])
        .where('userOrg.is_deleted = :filterDeleted', { filterDeleted });

      //  Handle Comma-Separated Status Strings
      if (status !== undefined && status !== null && status.trim() !== '') {
        // Step A: Split "0,1" into an array of strings: ["0", "1"]
        const stringArray = status.split(',');

        // Step B: Convert each string to a Base-10 integer and filter out any invalid entries
        const parsedStatuses = stringArray
          .map((str) => parseInt(str.trim(), 10))
          .filter((num) => !isNaN(num) && num in OrganizationStatus);

        // Step C: If we have valid numbers left, use SQL 'IN' operator
        if (parsedStatuses.length > 0) {
          query.andWhere('org.status IN (:...parsedStatuses)', {
            parsedStatuses,
          });
        }
      }

      const organizations = await query.getRawMany();

      // 2️  Step Two: Guard against an empty database table
      if (!organizations || organizations.length === 0) {
        return [];
      }

      return organizations;
    } catch (dbError: any) {
      console.error(
        'Failed to resolve all administrative organization records:',
        dbError,
      );
      return [];
    }
  }

  async getOrganizationDetails(id: string) {
    try {
      const res = await this.dataSource
        .getRepository(UserOrganization)
        .createQueryBuilder('userorg')
        .innerJoin('userorg.organization', 'org')
        .innerJoin(User, 'user', 'user.user_id = userorg.user_id')
        .select([
          'org.id AS id',
          'org.name AS name',
          'org.status AS status',
          'org.created_at AS created_at',
          'org.updated_at AS updated_at',
          'user.user_id AS user_id',
          'user.email AS email',
          'user.firstname AS firstname',
          'user.lastname AS lastname',
          'user.profile_pic AS profile_pic',
        ])
        .where('userorg.org_id = :id', { id })
        .andWhere('userorg.is_deleted = :isDeleted', { isDeleted: false })
        .getRawOne();

      return res;
    } catch (err) {
      console.error('Error fetching organization details:', err);
      throw err;
    }
  }
  async updateOrganizationStatus(input: UpdateOrgStatusDto): Promise<boolean> {
    try {
      const result = await this.dataSource
        .getRepository(Organization)
        .update({ id: input.orgId }, { status: input.status });
      return (result?.affected ?? 0) > 0;
    } catch (err) {
      console.error(
        'Database failure during organization status transition:',
        err,
      );
      return false;
    }
  }
  async newJoinOrganizationList(userId: string) {
    try {
      const orgstatus = OrganizationStatus.ACTIVE;
      const organizations = await this.dataSource
        .getRepository(UserOrganization)
        .createQueryBuilder('userOrg')
        .innerJoin('userOrg.organization', 'org')
        .innerJoin(User, 'user', 'user.user_id = userOrg.user_id')
        .select([
          'org.id AS id',
          'org.name AS name',
          'user.profile_pic AS profile_pic',
        ])
        .where('userOrg.is_deleted = false')
        .andWhere('org.status = :orgstatus', { orgstatus })
        .andWhere(
          `NOT EXISTS (
        SELECT 1 
        FROM join_requests jr 
        WHERE jr.organization_id = org.id 
        AND jr.user_id = :userId 
      )`,
          {
            userId,
          },
        )
        .getRawMany();

      return organizations;
    } catch (err) {
      console.error(
        'CRITICAL: Database failure during new-join organization lookup:',
        err,
      );
      throw err;
    }
  }

  async getPendingJoinRequests(orgId: string) {
    try {
      const organizationList = await this.dataSource
        .getRepository(JoinRequest)
        .createQueryBuilder('jr')
        .innerJoin(User, 'user', 'user.user_id = jr.user_id')
        .select([
          'jr.id AS "requestId"',
          'user.user_id AS "userId"',
          'user.firstname AS "firstName"',
          'user.lastname AS "lastName"',
          'user.profile_pic AS "profilePic"',
          'jr.created_at AS "requestedAt"',
        ])
        .where('jr.organization_id = :orgId', { orgId })
        .andWhere('jr.status = :status', { status: JoinRequestStatus.PENDING });

      return organizationList;
    } catch (err) {
      throw err;
    }
  }
  // 🎯 1. Enforce ownership validation
  async validateRequestOwnership(
    orgId: string,
    requestId: string,
  ): Promise<boolean> {
    try {
      const result = await this.dataSource
        .getRepository(JoinRequest)
        .createQueryBuilder('jr')
        .select(['jr.organization_id as "organizationId"'])
        // FIXED syntax: changed ':=' to '= :'
        .where('jr.id = :requestId', { requestId })
        .getRawOne<{ organizationId: string }>();

      if (!result || result.organizationId !== orgId) {
        return false;
      }
      return true;
    } catch (err) {
      throw err;
    }
  }
  async rejectJoinRequest(requestId: string): Promise<boolean> {
    try {
      const result = await this.dataSource
        .getRepository(JoinRequest)
        .update({ id: requestId }, { status: JoinRequestStatus.REJECTED });
      return (result?.affected ?? 0) > 0;
    } catch (err) {
      throw err;
    }
  }
  async approveJoinRequestAndCreateMembership(
    requestId: string,
  ): Promise<boolean> {
    return await this.dataSource.transaction(async (manager) => {
      const requestData = await manager.getRepository(JoinRequest).findOne({
        where: { id: requestId },
      });

      if (!requestData) {
        throw new BadRequestException(
          'Target join request records no longer exist.',
        );
      }

      requestData.status = JoinRequestStatus.APPROVED;
      await manager.getRepository(JoinRequest).save(requestData);

      const userOrgLink = manager.create(UserOrganization, {
        user_id: requestData.user_id,
        org_id: requestData.organization_id,
        role: OrganizationRole.MEMBER,
        joined_date: new Date(),
        is_deleted: false,
      });

      await manager.save(userOrgLink);
      return true;
    });
  }

  async isValid(organizationId: string): Promise<boolean> {
    const org = await this.dataSource.getRepository(Organization).findOne({
      where: {
        id: organizationId,
        status: OrganizationStatus.ACTIVE,
      },
    });
    return !!org;
  }

  async checkExistingRequest(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    const existing = await this.dataSource.getRepository(JoinRequest).findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
      },
    });
    return !!existing;
  }

  async enterJoinOrganizationRequest(
    userId: string,
    organizationId: string,
  ): Promise<JoinRequest> {
    const requestRepo = this.dataSource.getRepository(JoinRequest);

    const newRequest = requestRepo.create({
      user_id: userId,
      organization_id: organizationId,
      status: JoinRequestStatus.PENDING,
      created_at: new Date(),
    });

    return await requestRepo.save(newRequest);
  }

  async isValidUserOrganization(userId: string, OrgId: string) {
    try {
      return await this.dataSource
        .getRepository(UserOrganization)
        .createQueryBuilder('uo')
        .where('uo.user_id =:userId', { userId })
        .andWhere('uo.org_id =:OrgId', { OrgId })
        .andWhere('uo.is_deleted = :isDeleted', { isDeleted: false })
        .getExists();
    } catch (err) {
      throw err;
    }
  }
}
