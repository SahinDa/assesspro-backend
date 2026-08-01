import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { RoleGuard } from 'src/guards/role.guard';
import { UserRole } from 'src/config/enum';
import { Roles } from 'src/decorators/role.decorator';
import { Organization } from 'src/decorators/organization.decorator';
import { IOrganization } from 'src/interfaces/organization.interfaces';

@Controller('transactions')
@UseGuards(RoleGuard)
export class TransactionsController {
  constructor(private readonly paymentsservice: PaymentsService) {}

  // =====================================================================
  // CATEGORY 1: Organization Paid to Platform
  // =====================================================================

  // 1. Get all transactions across ALL organizations
  @Get('/platform/all')
  @Roles(UserRole.ADMIN)
  async getAllOrganizationsTransactions() {
    return await this.paymentsservice.getAllPlatformTransactions();
  }

  // 2. Get all transactions for ONE specific organization
  @Get('/platform/organization/:orgId/all')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZATION)
  async getOneOrganizationAllTransactions(
    @Param('orgId') orgId: string,
    @Organization() organization: IOrganization,
  ) {
    return await this.paymentsservice.getPlatformTransactionsByOrgId(
      orgId,
      organization,
    );
  }

  // 3. Get ONE specific transaction detail for ONE organization
  @Get('/platform/organization/:orgId/single/:transactionId')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZATION)
  async getOneOrganizationSingleTransaction(
    @Param('orgId') orgId: string,
    @Param('transactionId') transactionId: string,
    @Organization() organization: IOrganization,
  ) {
    return await this.paymentsservice.getSinglePlatformTransaction(
      orgId,
      transactionId,
      organization,
    );
  }

  // =====================================================================
  // CATEGORY 2: Student Transactions (Organization & Student Scoped)
  // =====================================================================

  // 1. All student transactions of a particular organization
  @Get('/organization/students/transactions/all')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZATION)
  async getOrganizationStudentsTransactions(
    @Query('orgId') orgId: string,
    @Organization() organization: IOrganization,
  ) {
    return await this.paymentsservice.getOrganizationStudentsTransactions(
      orgId,
      organization,
    );
  }

  // 2. One particular transaction of one student (under an organization)
  @Get('/organization/student/transactions/single/:transactionId')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZATION, UserRole.STUDENT)
  async getStudentSingleTransaction(
    @Param('transactionId') transactionId: string,
    @Query('userId') userId: string,
    @Query('orgId') orgId: string,
    @Organization() organization: IOrganization,
  ) {
    return await this.paymentsservice.getStudentSingleTransaction(
      transactionId,
      userId,
      orgId,
      organization,
    );
  }

  // 3. One student's all transactions (under an organization)
  @Get('/organization/student/transactions/all')
  @Roles(UserRole.STUDENT, UserRole.ORGANIZATION, UserRole.ADMIN)
  async getOneStudentAllTransactions(
    @Query('userId') userId: string,
    @Query('orgId') orgId: string,
    @Organization() organization: IOrganization,
  ) {
    return await this.paymentsservice.getOneStudentAllTransactions(
      userId,
      orgId,
      organization,
    );
  }
}
