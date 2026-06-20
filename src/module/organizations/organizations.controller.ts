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
import { OrganizationsService } from './organizations.service';
import { RoleGuard } from 'src/guards/role.guard';
import { UserRole } from 'src/config/enum';
import { Roles } from 'src/decorators/role.decorator';
import {
  HandleJoinRequestDto,
  OrganizationInputDTO,
  UpdateOrgStatusDto,
} from './dto/Organization.dto';
import { User } from 'src/decorators/user.decorator';
import { IAuthenticatedUser } from 'src/interfaces/user.interfaces';
import { Organization } from 'src/decorators/organization.decorator';
import { IOrganization } from 'src/interfaces/organization.interfaces';

@Controller('organizations')
@UseGuards(RoleGuard)
export class OrganizationsController {
  constructor(private readonly organizationsservice: OrganizationsService) {}

  @Post()
  @Roles(UserRole.OTHER)
  async createOrganizations(
    @User() user: IAuthenticatedUser,
    @Body() input: OrganizationInputDTO,
  ) {
    return this.organizationsservice.createOrganizations(user, input);
  }

  @Patch()
  @Roles(UserRole.ORGANIZATION)
  async updateOrganizations(
    @Organization() organization: IOrganization,
    @Body() input: OrganizationInputDTO,
  ) {
    return this.organizationsservice.updateOrganizations(organization, input);
  }

  @Get('/admin/list')
  @Roles(UserRole.ADMIN)
  async getAllOrganizations(
    @Query('status') status?: string,
    @Query('isdeleted') isdeleted?: boolean,
  ) {
    return this.organizationsservice.getAllOrganizations(status, isdeleted);
  }

  @Get('')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZATION)
  async getOranizations(
    @Organization() organization: IOrganization,
    @Query('id', ParseUUIDPipe) id?: string,
  ) {
    return this.organizationsservice.getOrganizations(organization, id);
  }

  @Patch('/admin/status')
  @Roles(UserRole.ADMIN)
  async updateOrganizationStatus(@Body() input: UpdateOrgStatusDto) {
    return this.organizationsservice.updateOrganizationStatus(input);
  }

  @Delete(':id')
  @Roles(UserRole.ORGANIZATION)
  async deleteOrganizations(@Organization() organization: IOrganization) {
    return this.organizationsservice.deleteOrganization(organization);
  }

  @Get('new-join-list')
  @Roles(UserRole.STUDENT)
  async newJoinOrganizationList(@User() user: IAuthenticatedUser) {
    return this.organizationsservice.newJoinOrganizationList(user.user_id);
  }

  // 1. Fetch all applications waiting for review
  @Get('join-requests/pending')
  @Roles(UserRole.ORGANIZATION)
  async getPendingJoinRequests(@Organization() organization: IOrganization) {
    return this.organizationsservice.getPendingJoinRequests(
      organization.org_id,
    );
  }

  // 2. Process a single application (Approve/Reject)
  @Patch('join-requests/:requestId/status')
  @Roles(UserRole.ORGANIZATION)
  async handleJoinRequestStatus(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() input: HandleJoinRequestDto,
    @Organization() organization: IOrganization,
  ) {
    return this.organizationsservice.handleJoinRequestStatus(
      organization.org_id,
      requestId,
      input,
    );
  }
}
