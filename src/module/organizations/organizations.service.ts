import { BadRequestException, ConflictException, forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { OrganizationsRepository } from "./organizations.repository";
import { HandleJoinRequestDto, OrganizationInputDTO, UpdateOrgStatusDto } from "./dto/Organization.dto";
import { IAuthenticatedUser } from "src/interfaces/user.interfaces";
import { IOrganization } from "src/interfaces/organization.interfaces";
import { UsersService } from "../users/users.service";
import { JoinRequestStatus } from "src/config/enum";

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizationsrepository: OrganizationsRepository,
    @Inject(forwardRef(() => UsersService))
    private readonly usersservice: UsersService,
  ) { }
  async createOrganizations(user: IAuthenticatedUser, input: OrganizationInputDTO) {
    try {
      const isTaken = await this.organizationsrepository.checkExisting(user.user_id, input.name);

      if (isTaken) {
        throw new ConflictException(`The name ${input.name} is already taken by another organization.`);
      }

      const organization = await this.organizationsrepository.createOrganization(user.user_id, input.name);
      return organization;
    } catch (err) {
      throw err;
    }
  }

  async updateOrganizations(organization: IOrganization, input: OrganizationInputDTO) {
    try {
      const isTaken = await this.organizationsrepository.checkExisting(organization.user_id, input.name);

      if (isTaken) {
        throw new ConflictException(`The name ${input.name} is already taken by another organization.`);
      }

      const response = await this.organizationsrepository.updateOrganization(organization.user_id, input.name);
      if (!response.success) {
        throw new BadRequestException(response.error);
      }

      return response.data;

    } catch (err) {
      throw err;
    }
  }
  async findOrganizationDetailsByUserId(userId: string) {
    try {
      return await this.organizationsrepository.findOrganizationDetailsByUserId(userId);
    } catch (err) {
      return null;
    }
  }
  async getAllOrganizations(status?: string, isdeleted?: boolean) {
    try {
      return this.organizationsrepository.getAllOrganizations(status, isdeleted);
    } catch (err) {
      throw err;
    }
  }
  async getOrganizations(organization: IOrganization, id?: string) {
    try {

      const orgId = id ?? organization.org_id;

      if (!orgId) {
        throw new BadRequestException('Unable to fetch organization details');
      }

      const organizationDetails = await this.organizationsrepository.getOrganizationDetails(orgId);

      if (!organizationDetails) {
        throw new NotFoundException('Organization not found');
      }

      return organizationDetails;

    } catch (err) {
      throw err;
    }
  }
  async updateOrganizationStatus(input: UpdateOrgStatusDto) {
    try {
      const isUpdated = await this.organizationsrepository.updateOrganizationStatus(input);
      if (!isUpdated) {
        throw new BadRequestException('Failed to update organization status. Please verify the ID.');
      }
      return {
        message: 'Organization status updated successfully'
      };
    } catch (err) {
      throw err;
    }
  }
  async deleteOrganization(organization: IOrganization) {
    try {
      await this.usersservice.deletedAccount(organization.user_id);

      return {
        message: 'Organization deleted successfully'
      }
    } catch (err) {
      throw new BadRequestException('Failed to terminate organization account.');
    }
  }
  async newJoinOrganizationList(userId: string) {
    try {
      return await this.organizationsrepository.newJoinOrganizationList(userId);
    } catch (err) {
      throw err;
    }
  }
  async getPendingJoinRequests(orgId: string) {
    try {
      return await this.organizationsrepository.getPendingJoinRequests(orgId);
    } catch (err) {
      throw err;
    }
  }
  async handleJoinRequestStatus(
    orgId: string,
    requestId: string,
    input: HandleJoinRequestDto,
  ) {
    try {
      const isValid = await this.organizationsrepository.validateRequestOwnership(orgId, requestId);

      if (!isValid) {
        throw new UnauthorizedException('You are not authorized to modify this resource.');
      }

      if (input.action === JoinRequestStatus.REJECTED) {
        await this.organizationsrepository.rejectJoinRequest(requestId);
      } else if (input.action === JoinRequestStatus.APPROVED) {
        await this.organizationsrepository.approveJoinRequestAndCreateMembership(requestId);
      }

      return {
        success: true,
        message: "Status update processed successfully."
      };
    } catch (err) {
      throw err;
    }
  }

  async isValid(organizationId: string) {
    try {
      return this.organizationsrepository.isValid(organizationId);
    } catch (err) {
      throw err;
    }
  }


  async checkExistingRequest(userId: string, organizationId: string) {
    try {
      return this.organizationsrepository.checkExistingRequest(userId, organizationId)
    } catch (err) {
      throw err;
    }
  }


  async enterJoinOrganizationRequest(userId: string, organizationId: string) {
    try {
      return this.organizationsrepository.enterJoinOrganizationRequest(userId, organizationId);
    } catch (err) {
      throw err;
    }
  }
}