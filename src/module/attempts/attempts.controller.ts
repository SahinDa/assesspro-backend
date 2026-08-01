import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { SubmissionType, UserRole, ViolationType } from 'src/config/enum';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { User } from 'src/decorators/user.decorator';
import { IAuthenticatedUser } from 'src/interfaces/user.interfaces';
import {
  FinalSubmitDto,
  ReportViolationDto,
  SaveProgressBulkDto,
  StartAttemptDto,
  SubmitTestDto,
} from './dto/attempt.dto';
import { InjectRedis } from '@nestjs-modules/ioredis'; // 1. Add this import
import Redis from 'ioredis';
import { Public } from 'src/decorators/public.decorator';
import { Organization } from 'src/decorators/organization.decorator';
import { IOrganization } from 'src/interfaces/organization.interfaces';

@Controller('attempts')
@UseGuards(RoleGuard)
export class AttemptsController {
  constructor(
    private readonly attemptsservices: AttemptsService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // STEP 1: Run this when the user clicks "Start Test"
  // This creates the attempt_id row and sets the locked end_time
  @Post('start')
  @Roles(UserRole.STUDENT)
  async startTest(
    @Organization() organization: IOrganization,
    @Body() input: StartAttemptDto,
  ) {
    return await this.attemptsservices.initializeAttempt(organization, input);
  }

  @Post(':attemptId/save-progress')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.STUDENT)
  async saveProgress(
    @Param('attemptId') attemptId: string,
    @Body() input: SaveProgressBulkDto,
    @User() user: IAuthenticatedUser,
  ) {
    return await this.attemptsservices.saveProgressToCache(
      user.user_id,
      attemptId,
      input,
    );
  }

  @Post(':attemptId/submit')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.STUDENT)
  async submitExam(
    @Param('attemptId') attemptId: string,
    @Body() input: FinalSubmitDto,
    @User() user: IAuthenticatedUser,
  ) {
    input.submitted_via = SubmissionType.Manual;
    return await this.attemptsservices.submitAndFinalizeExam(
      user.user_id,
      attemptId,
      input,
    );
  }

  @Post(':attemptId/disconnect')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.STUDENT)
  async tabCloseSubmit(
    @Param('attemptId') attemptId: string,
    @Body() input: FinalSubmitDto,
    @User() user: IAuthenticatedUser,
  ) {
    input.submitted_via = SubmissionType.DISCONNECTED;
    return await this.attemptsservices.submitAndFinalizeExam(
      user.user_id,
      attemptId,
      input,
    );
  }

  @Post(':attemptId/violation')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.STUDENT)
  async checkViolation(
    @Param('attemptId') attemptId: string,
    @Body() input: ReportViolationDto,
    @User() user: IAuthenticatedUser,
  ) {
    return await this.attemptsservices.checkViolation(
      user.user_id,
      attemptId,
      input,
    );
  }

  //details about one perticular attemps
  //return test id ,name , set id ,name , each question and option and you answer
  @Get('/details')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.ORGANIZATION)
  async getDetailsAboutAttempt(
    @User() user: IAuthenticatedUser,
    @Query('attemptId') attemptId: string,
  ) {
    return await this.attemptsservices.getSingleAttemptDetails(
      user.user_id,
      attemptId,
    );
  }
  //return attempts history of one user
  // return test id and name , set id and name and attempt number
  @Get('/history')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.STUDENT)
  async getAttemptHistory(
    @User() user: IAuthenticatedUser,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
  ) {
    return await this.attemptsservices.getUserAttemptHistory(
      user.user_id,
      limit,
      offset,
    );
  }

  // Return all student attempts belonging to a specific test set layout
  @Get('/set/:setId/attempts')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ORGANIZATION, UserRole.ADMIN)
  async getAllAttemptsInTestSet(
    @Param('setId') setId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
  ) {
    return await this.attemptsservices.getTestSetAttemptsList(
      setId,
      limit,
      offset,
    );
  }

  // Get total number of times one particular user has attempted a specific test set
  // Get a user's full attempt details along with the total count for a specific test set
  @Get('/set/:setId/my-attempts')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.ORGANIZATION)
  async getMyAttemptsWithDetails(
    @User() user: IAuthenticatedUser,
    @Param('setId') setId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
  ) {
    return await this.attemptsservices.getUserAttemptsWithDetails(
      user.user_id,
      setId,
      limit,
      offset,
    );
  }
}
