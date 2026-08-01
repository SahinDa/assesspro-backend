import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { RoleGuard } from 'src/guards/role.guard';
import {
  CreatePlatformPlanDto,
  UpdatePlatformPlanDto,
} from './dto/platformplans.dto';
import { Roles } from 'src/decorators/role.decorator';
import { UserRole } from 'src/config/enum';
import { Organization } from 'src/decorators/organization.decorator';
import { IOrganization } from 'src/interfaces/organization.interfaces';
import {
  CreateOrganizationPlanDto,
  UpdateOrganizationPlanDto,
} from './dto/organizationplans.dto';

@Controller('subscription')
@UseGuards(RoleGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionservice: SubscriptionService) {}

  // --- Platform Plans ---
  @Post('platform')
  @Roles(UserRole.ADMIN)
  async createPlatformPlan(
    @Organization() organization: IOrganization,
    @Body() input: CreatePlatformPlanDto,
  ) {
    return await this.subscriptionservice.createPlatformPlan(
      organization,
      input,
    );
  }

  @Get('platform/all')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZATION)
  async getAllPlatformPlans(@Organization() organization: IOrganization) {
    return await this.subscriptionservice.getAllPlatformPlans(organization);
  }

  @Get('platform/organization/:organizationId')
  async getAllPlanBasedOnOrganization() {}

  @Get('platform/:planId')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZATION)
  async getPlatformPlan(
    @Organization() organization: IOrganization,
    @Param('planId', ParseUUIDPipe) planId: string,
  ) {
    return await this.subscriptionservice.getPlatformPlan(organization, planId);
  }

  @Patch('platform/:planId')
  @Roles(UserRole.ADMIN)
  async updatePlatformPlan(
    @Organization() organization: IOrganization,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() input: UpdatePlatformPlanDto,
  ) {
    return await this.subscriptionservice.updatePlatformPlan(
      organization,
      planId,
      input,
    );
  }

  @Delete('platform/:planId')
  @Roles(UserRole.ADMIN)
  async removePlatformPlan(
    @Organization() organization: IOrganization,
    @Param('planId', ParseUUIDPipe) planId: string,
  ) {
    return await this.subscriptionservice.removePlatformPlan(
      organization,
      planId,
    );
  }
  // --- Organization Plans ---
  @Post('organization')
  @Roles(UserRole.ORGANIZATION)
  async createOrganizationPlan(
    @Organization() organization: IOrganization,
    @Body() input: CreateOrganizationPlanDto,
  ) {
    return await this.subscriptionservice.createOrganizationPlan(
      organization,
      input,
    );
  }

  @Get('organization/all')
  @Roles(UserRole.ORGANIZATION, UserRole.STUDENT)
  async getAllOrganizationPlan(@Organization() organization: IOrganization) {
    return await this.subscriptionservice.getAllOrganizationPlan(organization);
  }

  @Get('organization/:planId')
  @Roles(UserRole.ORGANIZATION, UserRole.STUDENT)
  async getOrganizationPlan(
    @Organization() organization: IOrganization,
    @Param('planId', ParseUUIDPipe) planId: string,
  ) {
    return await this.subscriptionservice.getOrganizationPlanById(
      organization,
      planId,
    );
  }

  @Patch('organization/:planId')
  @Roles(UserRole.ORGANIZATION)
  async updateOrganizationPlan(
    @Organization() organization: IOrganization,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() input: UpdateOrganizationPlanDto,
  ) {
    return await this.subscriptionservice.updateOrganizationPlan(
      organization,
      planId,
      input,
    );
  }

  @Delete('organization/:planId')
  @Roles(UserRole.ORGANIZATION)
  async removedOrganizationPlan(
    @Organization() organization: IOrganization,
    @Param('planId', ParseUUIDPipe) planId: string,
  ) {
    return await this.subscriptionservice.removedOrganizationPlan(
      organization,
      planId,
    );
  }

  // 1. Get Organization Subscription Details
  @Get('/organization')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZATION)
  async getOrganizationSubscription(
    @Organization() organization: IOrganization,
    @Query('orgId') orgId?: string,
  ) {
    return await this.subscriptionservice.getOrganizationSubscription(
      organization,
      orgId,
    );
  }

  // 2. Get User (Student) Subscription Details
  @Get('/user')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZATION, UserRole.STUDENT)
  async getUserSubscription(
    @Query('userId') userId: string,
    @Query('orgId') orgId: string,
    @Organization() organization: IOrganization,
  ) {
    return await this.subscriptionservice.getUserSubscription(
      userId,
      orgId,
      organization,
    );
  }

  // 3. Get Combined Dashboard Usage Summary (Plan Info, Limits + Live Counts)
  @Get('/usage')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZATION, UserRole.STUDENT)
  async getOrganizationUsage(
    @Organization() organization: IOrganization,
    @Query('targetId') targetId?: string, // if you are a student then it's organization id and
    //for organization it either organization or userId
    @Query('isOrg') isOrg?: boolean, //is admin want to see for organization then true else false
  ) {
    return await this.subscriptionservice.getOrganizationUsage(
      organization,
      targetId,
      isOrg,
    );
  }
}
