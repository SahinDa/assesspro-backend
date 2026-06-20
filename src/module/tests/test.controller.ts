import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { TestService } from './services/test.service';
import { createTestDto, updateTestDto } from './dto/test.dto';
import { TestSetService } from './services/testset.service';
import { QuestionService } from './services/question.service';
import { Roles } from 'src/decorators/role.decorator';
import { RoleGuard } from 'src/guards/role.guard';
import { UserRole } from 'src/config/enum';
import { Organization } from 'src/decorators/organization.decorator';
import { IOrganization } from 'src/interfaces/organization.interfaces';

@Controller('tests')
@UseGuards(RoleGuard)
@Roles(UserRole.ORGANIZATION, UserRole.ADMIN)
export class TestController {
  constructor(
    private readonly testService: TestService,
    private readonly testSetService: TestSetService,
    private readonly questionService: QuestionService,
  ) {}

  //Test
  @Post()
  @Roles(UserRole.ORGANIZATION, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new test' })
  @ApiResponse({
    status: 201,
    description: 'The test has been successfully created.',
  })
  @ApiBody({ type: createTestDto })
  async create(
    @Organization() organization: IOrganization,
    @Body() body: createTestDto,
  ) {
    return await this.testService.createTest(organization, body);
  }

  @Get('/count')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZATION, UserRole.STUDENT)
  async getAllTestCount(
    @Organization() organization: IOrganization,
    @Query('id', new ParseUUIDPipe({ version: '4', optional: true }))
    id?: string,
    @Query('status', new ParseIntPipe({ optional: true })) status?: number,
  ) {
    return await this.testService.getAllTestCount(organization, id, status);
  }

  @Get('/list')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZATION, UserRole.STUDENT)
  async getAllTestList(
    @Organization() organization: IOrganization,
    @Query('id', new ParseUUIDPipe({ version: '4', optional: true }))
    id?: string,
    @Query('status', new ParseIntPipe({ optional: true })) status?: number,
  ) {
    return await this.testService.getAllTestList(organization, id, status);
  }

  @Get(':testId')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZATION, UserRole.STUDENT)
  async getTest(
    @Organization() organization: IOrganization,
    @Param('testId') testId: string,
    @Query('id', new ParseUUIDPipe({ version: '4', optional: true }))
    id?: string,
  ) {
    return await this.testService.getTest(organization, testId, id);
  }

  @Patch(':testId')
  @Roles(UserRole.ORGANIZATION)
  async updateTest(
    @Organization() organization: IOrganization,
    @Body() input: updateTestDto,
    @Param('testId') testId: string,
  ) {
    return await this.testService.updateTest(organization, input, testId);
  }

  @Patch(':testId/toggle-status')
  @Roles(UserRole.ORGANIZATION)
  async toggleTestStatus(
    @Organization() organization: IOrganization,
    @Param('testId', ParseUUIDPipe) testId: string,
  ) {
    return await this.testService.toggleTestStatus(organization.org_id, testId);
  }

  @Delete(':testId')
  @Roles(UserRole.ORGANIZATION)
  async deleteTest(
    @Organization() organization: IOrganization,
    @Param('testId') testId: string,
  ) {
    return await this.testService.deleteTest(organization.org_id, testId);
  }

  //Testset
  @Post('/testset')
  async createTestSet() {}
  @Get('/testset/count')
  async getAllTestSetCount() {}

  @Get('/testset/list')
  async getAllTestSetList() {}
  @Get('/testset/:testSetId')
  async getTestSet() {}
  @Patch('/testset/:testSetId')
  async updateTestSet() {}
  @Delete('/testset/:testSetId')
  async deleteTestSet() {}

  // Question
  @Post('/question')
  async createQuestion() {}

  @Put('/question')
  async updateQuestion() {}

  @Delete('/question')
  async deleteQuestion() {} //restrict now

  @Get('/question')
  async fetchQuestion() {} // not need as question will be fetch based on testset
}
