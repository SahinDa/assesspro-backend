import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TestSetRepository } from '../repositories/testset.repository';
import { IOrganization } from 'src/interfaces/organization.interfaces';
import { CreateTestSetDto, UpdateTestSetDto } from '../dto/testset.dto';
import { OrganizationsService } from 'src/module/organizations/organizations.service';
import { TestRepository } from '../repositories/test.repository';
import { TestSetStatus, TestStatus, UserRole } from 'src/config/enum';

@Injectable()
export class TestSetService {
  constructor(
    private readonly testSetRepository: TestSetRepository,
    private readonly organizationsservice: OrganizationsService,
    private readonly testRepository: TestRepository,
  ) {}

  async createTestSet(
    organization: IOrganization,
    testId: string,
    input: CreateTestSetDto,
  ) {
    try {
      const isValidOrganization = await this.organizationsservice.isValid(
        organization.org_id,
      );
      if (!isValidOrganization) {
        throw new NotFoundException(
          'The provided organization ID is invalid or inactive.',
        );
      }

      const testDetails = await this.testRepository.getTest(
        testId,
        organization.org_id,
      );

      if (!testDetails) {
        throw new NotFoundException(
          `No test configuration matches ID: ${testId}`,
        );
      }

      if (testDetails.status !== TestStatus.ACTIVE) {
        throw new BadRequestException(
          'Test is currently unavailable. You cannot create a test set for this configuration.',
        );
      }

      if (input.total_questions !== input.questions.length) {
        throw new BadRequestException(
          'Number of question should be exactly same with total question',
        );
      }

      const result = await this.testSetRepository.createTestSet(
        organization.org_id,
        testId,
        input,
      );
      return result;
    } catch (err) {
      throw err;
    }
  }

  async updateTestSet(
    organization: IOrganization,
    testId: string,
    testSetId: string,
    input: UpdateTestSetDto,
  ) {
    try {
      const isValidOrganization = await this.organizationsservice.isValid(
        organization.org_id,
      );
      if (!isValidOrganization) {
        throw new NotFoundException(
          'The provided organization ID is invalid or inactive.',
        );
      }

      // 2. Validate tenant resource ownership of the target parent test record
      const testDetails = await this.testRepository.getTest(
        testId,
        organization.org_id,
      );
      if (!testDetails) {
        throw new NotFoundException(`Test not found matching ID: ${testId}`);
      }

      if (testDetails.status !== TestStatus.ACTIVE) {
        throw new BadRequestException(
          'Test is currently unavailable. You cannot create a test set for this configuration.',
        );
      }

      const existingSet = await this.testSetRepository.findTestSetByIdAndTestId(
        testSetId,
        testId,
      );
      if (!existingSet) {
        throw new NotFoundException(
          `Test Set not found matching ID: ${testSetId}`,
        );
      }

      if (existingSet.status !== TestSetStatus.ACTIVE) {
        throw new BadRequestException(
          'This test set cannot be modified because it is currently inactive or unavailable.',
        );
      }

      // 4. Validate question count parity checks if questions are bundled inside the request body
      if (
        input.questions &&
        input.questions.length !==
          (input.total_questions ?? existingSet.total_questions)
      ) {
        throw new BadRequestException(
          'Number of question should be exactly same with total question',
        );
      }

      // 5. Delegate atomic database modifications downstream to the repository handler

      return await this.testSetRepository.updateTestSet(
        testSetId,
        input,
        existingSet,
      );
    } catch (err) {
      throw err;
    }
  }

  async deleteTestSet(
    organization: IOrganization,
    testId: string,
    testSetId: string,
  ) {
    try {
      // 1. Core tenant check
      const isValidOrganization = await this.organizationsservice.isValid(
        organization.org_id,
      );
      if (!isValidOrganization) {
        throw new NotFoundException(
          'The provided organization ID is invalid or inactive.',
        );
      }

      // 2. Resource ownership check: Does this test belong to this organization?
      const testDetails = await this.testRepository.getTest(
        testId,
        organization.org_id,
      );
      if (!testDetails) {
        throw new NotFoundException(`Test not found matching ID: ${testId}`);
      }

      if (testDetails.status !== TestStatus.ACTIVE) {
        throw new BadRequestException(
          'Test is currently unavailable. You cannot create a test set for this configuration.',
        );
      }

      // 3. Structural alignment check: Does this test set belong to this specific test?
      const existingSet = await this.testSetRepository.findTestSetByIdAndTestId(
        testSetId,
        testId,
      );
      if (!existingSet) {
        throw new NotFoundException(
          `Test Set not found matching ID: ${testSetId}`,
        );
      }

      // 4. State validation: Is it already deleted?
      if (existingSet.status === TestSetStatus.DELETED) {
        throw new BadRequestException(
          'This test set has already been deleted.',
        );
      }

      // 5. Execute Soft Delete via state update
      await this.testSetRepository.deleteTestSet(testSetId);

      return { success: true, message: 'Test set successfully deleted.' };
    } catch (err) {
      throw err;
    }
  }

  async getAllTestSetCount(
    organization: IOrganization,
    testId: string,
    org_Id?: string,
    status?: number,
  ) {
    try {
      let orgId = org_Id;
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

      const testDetails = await this.testRepository.getTest(testId, orgId);
      if (!testDetails) {
        throw new NotFoundException(`Test not found matching ID: ${testId}`);
      }

      if (
        testDetails.status !== TestStatus.ACTIVE &&
        organization.role !== UserRole.ADMIN
      ) {
        throw new ForbiddenException(
          'Access Denied: This test configuration is currently inactive or suspended.',
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
            'Access Denied: You are not an active member of this organization and cannot view its tests set count.',
          );
        }
        return await this.testSetRepository.getAllTestSetCount(
          testId,
          TestSetStatus.ACTIVE,
        );
      }

      status = status !== undefined ? status : TestSetStatus.ACTIVE;

      if (
        status !== TestSetStatus.ON_HOLD &&
        status !== TestSetStatus.ACTIVE &&
        status !== TestSetStatus.DELETED
      ) {
        throw new BadRequestException('You entered an invalid status value.');
      }

      if (organization.role === UserRole.ADMIN) {
        return await this.testSetRepository.getAllTestSetCount(testId, status);
      } else if (organization.role === UserRole.ORGANIZATION) {
        if (status === TestSetStatus.DELETED) {
          throw new ForbiddenException(
            'Organizations are not authorized to view deleted test set records count.',
          );
        }
        return await this.testSetRepository.getAllTestSetCount(testId, status);
      }

      throw new ForbiddenException(
        'Your account tier does not have permission to view test set count.',
      );
    } catch (err) {
      throw err;
    }
  }

  async getAllTestSetList(
    organization: IOrganization,
    testId: string,
    org_Id?: string,
    status?: number,
  ) {
    try {
      let orgId = org_Id;
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

      const testDetails = await this.testRepository.getTest(testId, orgId);
      if (!testDetails) {
        throw new NotFoundException(`Test not found matching ID: ${testId}`);
      }

      if (
        testDetails.status !== TestStatus.ACTIVE &&
        organization.role !== UserRole.ADMIN
      ) {
        throw new ForbiddenException(
          'Access Denied: This test configuration is currently inactive or suspended.',
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
            'Access Denied: You are not an active member of this organization and cannot view its test sets.',
          );
        }
        return await this.testSetRepository.getAllTestSetList(
          testId,
          TestSetStatus.ACTIVE,
        );
      }

      status = status !== undefined ? status : TestSetStatus.ACTIVE;

      if (
        status !== TestSetStatus.ON_HOLD &&
        status !== TestSetStatus.ACTIVE &&
        status !== TestSetStatus.DELETED
      ) {
        throw new BadRequestException('You entered an invalid status value.');
      }

      if (organization.role === UserRole.ADMIN) {
        return await this.testSetRepository.getAllTestSetList(testId, status);
      } else if (organization.role === UserRole.ORGANIZATION) {
        if (status === TestSetStatus.DELETED) {
          throw new ForbiddenException(
            'Organizations are not authorized to view deleted test sets records .',
          );
        }
        return await this.testSetRepository.getAllTestSetList(testId, status);
      }

      throw new ForbiddenException(
        'Your account tier does not have permission to view test sets.',
      );
    } catch (err) {
      throw err;
    }
  }

  async getTestSet(
    testId: string,
    testSetId: string,
    organization: IOrganization,
    org_Id?: string,
  ) {
    try {
      let orgId = org_Id;
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
            'Access Denied: You are not an active member of this organization and cannot view its tests set.',
          );
        }
      }

      const testDetails = await this.testRepository.getTest(testId, orgId);
      if (!testDetails) {
        throw new NotFoundException(`Test not found matching ID: ${testId}`);
      }

      if (
        testDetails.status !== TestStatus.ACTIVE &&
        organization.role !== UserRole.ADMIN
      ) {
        throw new ForbiddenException(
          'Access Denied: This test configuration is currently inactive or suspended.',
        );
      }

      const testSetDetails =
        await this.testSetRepository.getTestSetDetails(testSetId);

      if (!testSetDetails) {
        throw new NotFoundException(
          `Test Set not found matching ID: ${testSetId}`,
        );
      }

      if (testSetDetails.test_id !== testId) {
        throw new BadRequestException(
          'The requested test set does not belong to the specified test configuration.',
        );
      }

      if (
        organization.role === UserRole.ORGANIZATION &&
        testSetDetails.status === TestSetStatus.DELETED
      ) {
        throw new ForbiddenException(
          'Organizations are not authorized to view deleted test set records.',
        );
      }

      if (
        organization.role === UserRole.STUDENT &&
        testSetDetails.status !== TestSetStatus.ACTIVE
      ) {
        throw new ForbiddenException(
          'Students are not authorized to view inactive or deleted test set records.',
        );
      }

      return testSetDetails;
    } catch (err) {
      throw err;
    }
  }

  async toggleTestSetStatus(orgId: string, testId: string, testSetId: string) {
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
      const testset = await this.testSetRepository.getTestSetDetails(testSetId);

      if (!testset) {
        throw new NotFoundException(
          `Test Set not found matching ID: ${testSetId}`,
        );
      }

      if (testset.test_id !== testId) {
        throw new BadRequestException(
          'The requested test set does not belong to the specified test configuration.',
        );
      }

      if (testset.status === TestSetStatus.DELETED) {
        throw new BadRequestException(
          'Archived test set cannot be modified. This test has been permanently soft-deleted.',
        );
      }

      const newStatus =
        testset.status === TestSetStatus.ACTIVE
          ? TestSetStatus.ON_HOLD
          : TestSetStatus.ACTIVE;

      await this.testSetRepository.toggleTestSetStatus(testSetId, newStatus);

      return {
        message: `Test set status successfully updated to ${TestSetStatus[newStatus]}.`,
      };
    } catch (err) {
      throw err;
    }
  }

  async isValidTestSet(testSetId: string) {
    try {
      return await this.testSetRepository.getTestSetDetails(testSetId);
    } catch (err) {
      throw null;
    }
  }
}
