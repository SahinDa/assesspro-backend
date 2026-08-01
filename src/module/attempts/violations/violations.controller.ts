import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ViolationsService } from './violations.service';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { UserRole } from 'src/config/enum';
import { Organization } from 'src/decorators/organization.decorator';
import { IOrganization } from 'src/interfaces/organization.interfaces';
import { SaveViolationRulesDto } from './dto/save-violation-rules.dto';

@Controller('proctoring-rules')
@UseGuards(RoleGuard)
@Roles(UserRole.ORGANIZATION)
export class ViolationsController {
  constructor(private readonly violationsService: ViolationsService) {}

  @Post()
  async createRules(
    @Organization() organization: IOrganization,
    @Body() input: SaveViolationRulesDto,
  ) {
    return await this.violationsService.createRules(organization.org_id, input);
  }

  @Get()
  async getRules(@Organization() organization: IOrganization) {
    return await this.violationsService.getRules(organization.org_id);
  }
}
