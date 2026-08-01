import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createTestDto, updateTestDto } from '../dto/test.dto';
import { TestRepository } from '../repositories/test.repository';
import { IOrganization } from 'src/interfaces/organization.interfaces';
import {
  PlatformSubscriptionFeatureKey,
  TestStatus,
  UserRole,
} from 'src/config/enum';
import { OrganizationsService } from 'src/module/organizations/organizations.service';
import { SubscriptionService } from 'src/module/subscriptions/subscription.service';

@Injectable()
export class TestService {
  constructor(
    private readonly testRepository: TestRepository,
    @Inject(forwardRef(() => OrganizationsService))
    private readonly organizationsservice: OrganizationsService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionservice: SubscriptionService,
  ) {}

  async createTest(organization: IOrganization, input: createTestDto) {
    try {
      const subscriptionData =
        await this.subscriptionservice.getOrganizationUsage(organization);

      const limits = subscriptionData.limits as Record<
        string,
        number | boolean
      >;
      const maxAllowedTests =
        Number(limits[PlatformSubscriptionFeatureKey.MAX_TESTS]) || 0;
      const currentTestCount = subscriptionData.usage.currentTestCount || 0;

      // 2. BLOCK if limit is reached or exceeded
      if (currentTestCount >= maxAllowedTests) {
        throw new ForbiddenException(
          `Plan limit reached. Your current plan allows a maximum of ${maxAllowedTests} tests.`,
        );
      }

      const isTestExist = await this.testRepository.isTestExist(
        organization.org_id,
        input.name,
      );
      if (isTestExist) {
        throw new ConflictException(
          'Test name already exists. Please choose a unique name.',
        );
      }
      const result = await this.testRepository.createTest(organization, input);
      return result;
    } catch (err) {
      throw err;
    }
  }

  async updateTest(
    organization: IOrganization,
    input: updateTestDto,
    testId: string,
  ) {
    try {
      if (
        !input ||
        (input.name === undefined && input.description === undefined)
      ) {
        throw new BadRequestException(
          'Test update failed: At least one field (name Or description) must be provided.',
        );
      }
      const isTestExistBasedOnTestID =
        await this.testRepository.isTestExistBasedOnTestID(
          organization.org_id,
          testId,
        );
      if (!isTestExistBasedOnTestID) {
        throw new NotFoundException(`No test found matching ID`);
      }
      if (input.name) {
        const isTestExist = await this.testRepository.isTestExist(
          organization.org_id,
          input.name,
        );
        if (isTestExist) {
          throw new ConflictException(
            'Test name already exists. Please choose a unique name.',
          );
        }
      }
      const result = await this.testRepository.updateTest(testId, input);
      return {
        message: 'Test configuration has been successfully updated.',
      };
    } catch (err) {
      throw err;
    }
  }
  async deleteTest(orgId: string, testId: string) {
    try {
      const isTestExistBasedOnTestID =
        await this.testRepository.isTestExistBasedOnTestID(orgId, testId);
      if (!isTestExistBasedOnTestID) {
        throw new NotFoundException(`No test found matching ID`);
      }
      await this.testRepository.deleteTest(orgId, testId);

      return {
        message: 'Test has been successfully deleted.',
      };
    } catch (err) {
      throw err;
    }
  }
  async getAllTestList(
    organization: IOrganization,
    id?: string,
    status?: number,
  ) {
    try {
      let orgId = id;
      if (organization.role === UserRole.ORGANIZATION) {
        orgId = organization.org_id;
      }
      if (!orgId) {
        throw new BadRequestException('Organization ID is required.');
      }

      const isValidOrganization =
        await this.organizationsservice.isValid(orgId);
      if (!isValidOrganization) {
        throw new NotFoundException(
          'The provided organization ID is invalid or inactive.',
        );
      }

      if (organization.role === UserRole.STUDENT) {
        const partOfOrganization =
          await this.organizationsservice.checkExistingRequest(
            organization.user_id,
            orgId,
          );
        if (!partOfOrganization) {
          throw new ForbiddenException(
            'Access Denied: You are not an active member of this organization and cannot view its tests.',
          );
        }
      }

      status = status !== undefined ? status : TestStatus.ACTIVE;

      if (
        status !== TestStatus.ON_HOLD &&
        status !== TestStatus.ACTIVE &&
        status !== TestStatus.DELETED
      ) {
        throw new BadRequestException('You entered an invalid status value.');
      }

      if (organization.role === UserRole.ADMIN) {
        return await this.testRepository.getAllTestList(orgId, status);
      } else if (organization.role === UserRole.ORGANIZATION) {
        if (status === TestStatus.DELETED) {
          throw new ForbiddenException(
            'Organizations are not authorized to view deleted records.',
          );
        }
        return await this.testRepository.getAllTestList(orgId, status);
      } else if (organization.role === UserRole.STUDENT) {
        return await this.testRepository.getAllTestList(
          orgId,
          TestStatus.ACTIVE,
        );
      }
      throw new ForbiddenException(
        'Your account tier does not have permission to view these lists.',
      );
    } catch (err) {
      throw err;
    }
  }
  async getAllTestCount(
    organization: IOrganization,
    id?: string,
    status?: number,
  ) {
    try {
      let orgId = id;
      if (organization.role === UserRole.ORGANIZATION) {
        orgId = organization.org_id;
      }
      if (!orgId) {
        throw new BadRequestException('Organization ID is required.');
      }

      const isValidOrganization =
        await this.organizationsservice.isValid(orgId);
      if (!isValidOrganization) {
        throw new NotFoundException(
          'The provided organization ID is invalid or inactive.',
        );
      }

      if (organization.role === UserRole.STUDENT) {
        const partOfOrganization =
          await this.organizationsservice.checkExistingRequest(
            organization.user_id,
            orgId,
          );
        if (!partOfOrganization) {
          throw new ForbiddenException(
            'Access Denied: You are not an active member of this organization and cannot view its tests.',
          );
        }
      }

      status = status !== undefined ? status : TestStatus.ACTIVE;

      if (
        status !== TestStatus.ON_HOLD &&
        status !== TestStatus.ACTIVE &&
        status !== TestStatus.DELETED
      ) {
        throw new BadRequestException('You entered an invalid status value.');
      }

      if (organization.role === UserRole.ADMIN) {
        return await this.testRepository.getAllTestCount(orgId, status);
      } else if (organization.role === UserRole.ORGANIZATION) {
        if (status === TestStatus.DELETED) {
          throw new ForbiddenException(
            'Organizations are not authorized to view deleted records count.',
          );
        }
        return await this.testRepository.getAllTestCount(orgId, status);
      } else if (organization.role === UserRole.STUDENT) {
        return await this.testRepository.getAllTestCount(
          orgId,
          TestStatus.ACTIVE,
        );
      }
      throw new ForbiddenException(
        'Your account tier does not have permission to viewtest count.',
      );
    } catch (err) {
      throw err;
    }
  }
  async getTest(organization: IOrganization, testId: string, id?: string) {
    try {
      let orgId = id;
      if (organization.role === UserRole.ORGANIZATION) {
        orgId = organization.org_id;
      }
      if (!orgId) {
        throw new BadRequestException('Organization ID is required.');
      }

      const isValidOrganization =
        await this.organizationsservice.isValid(orgId);
      if (!isValidOrganization) {
        throw new NotFoundException(
          'The provided organization ID is invalid or inactive.',
        );
      }

      if (organization.role === UserRole.STUDENT) {
        const partOfOrganization =
          await this.organizationsservice.checkExistingRequest(
            organization.user_id,
            orgId,
          );
        if (!partOfOrganization) {
          throw new ForbiddenException(
            'Access Denied: You are not an active member of this organization and cannot view its tests.',
          );
        }
      }

      const testDetails = await this.testRepository.getTest(testId, orgId);

      if (!testDetails) {
        throw new NotFoundException(
          `No test configuration matches ID: ${testId}`,
        );
      }

      if (organization.role === UserRole.ORGANIZATION) {
        if (testDetails?.status === TestStatus.DELETED) {
          throw new NotFoundException(
            'The requested test has been archived or deleted.',
          );
        }
      } else if (organization.role === UserRole.STUDENT) {
        if (testDetails?.status !== TestStatus.ACTIVE) {
          throw new NotFoundException(
            'The requested test is currently unavailable or inactive.',
          );
        }
      }
      return testDetails;
    } catch (err) {
      throw err;
    }
  }

  async toggleTestStatus(orgId: string, testId: string) {
    try {
      if (!orgId) {
        throw new BadRequestException('Organization ID is required.');
      }

      const test = await this.testRepository.getTest(testId, orgId);

      if (!test) {
        throw new NotFoundException(
          `No test profile configuration matches ID: ${testId}`,
        );
      }

      if (test.status === TestStatus.DELETED) {
        throw new BadRequestException(
          'Archived tests cannot be modified. This test has been permanently soft-deleted.',
        );
      }

      const newStatus =
        test.status === TestStatus.ACTIVE
          ? TestStatus.ON_HOLD
          : TestStatus.ACTIVE;

      await this.testRepository.toggleTestStatus(orgId, testId, newStatus);
      return {
        message: `Test status successfully updated to ${TestStatus[newStatus]}.`,
      };
    } catch (err) {
      throw err;
    }
  }

  async getTestSetCountPerTest(organization: IOrganization, orgId?: string) {
    try {
      let targetOrgId: string | undefined;
      if (organization.role === UserRole.ORGANIZATION) {
        targetOrgId = organization.org_id;
      } else if (organization.role === UserRole.ADMIN) {
        targetOrgId = orgId;
      } else {
        throw new UnauthorizedException('Access Denied');
      }

      if (!targetOrgId) {
        throw new BadRequestException('Invalid organization ');
      }
      // Transform array of raw results into an object record: { "Math Test": 3, "Physics Test": 9 }
      const results =
        await this.testRepository.getTestSetCountPerTest(targetOrgId);
      const testSetMap: Record<string, number> = {};
      results.forEach((row) => {
        testSetMap[row.testName] = parseInt(row.setCount, 10);
      });

      return testSetMap;
    } catch (err) {
      throw err;
    }
  }
}
