import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttemptsRepository } from './attempts.repository';
import {
  FinalSubmitDto,
  ReportViolationDto,
  SaveProgressBulkDto,
  StartAttemptDto,
  SubmitTestDto,
} from './dto/attempt.dto';
import { TestSetService } from '../tests/services/testset.service';
import {
  AnswerEvaluation,
  AnswerOption,
  OrganizationSubscriptionFeatureKey,
  SubmissionType,
  ViolationType,
} from 'src/config/enum';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { ViolationsService } from './violations/violations.service';
import { SubscriptionService } from '../subscriptions/subscription.service';
import { IOrganization } from 'src/interfaces/organization.interfaces';
import { OrganizationsService } from '../organizations/organizations.service';

@Injectable()
export class AttemptsService {
  constructor(
    private readonly attemptsrepository: AttemptsRepository,
    private readonly testsetservices: TestSetService,
    private readonly violationsService: ViolationsService,
    @InjectRedis() private readonly redis: Redis,
    private readonly subscriptionservice: SubscriptionService,
    private readonly organizationsservice: OrganizationsService,
  ) {}
  async initializeAttempt(organization: IOrganization, input: StartAttemptDto) {
    try {
      const userId = organization.user_id;
      // 1. Structural Check: Verify the configuration exists and is valid
      const testSet = await this.testsetservices.isValidTestSet(
        input.testset_id,
      );
      if (!testSet) {
        throw new NotFoundException(
          'The requested test configuration was not found.',
        );
      }

      const isValidRelation =
        await this.organizationsservice.isValidUserOrganizationRelation(
          userId,
          input.orgId,
        );
      if (!isValidRelation) {
        throw new ForbiddenException(
          'You are not authorized to take tests under this organization.',
        );
      }

      const isValidTestSet = await this.testsetservices.isTestSetBelongsToOrg(
        input.testset_id,
        input.orgId,
      );
      if (!isValidTestSet) {
        throw new ForbiddenException(
          'The requested test set does not belong to this organization.',
        );
      }

      const isActive = await this.attemptsrepository.isActiveSessionRunning(
        userId,
        input,
      );
      if (isActive) {
        throw new ConflictException(
          'The same test set cannot be attempted concurrently while a session is running.',
        );
      }

      // 3. Data Preparation Layer (Handled entirely in service)
      const startTime = new Date();
      const endTime = new Date(
        startTime.getTime() + testSet.timer_minutes * 60 * 1000,
      );

      // 4. Sequence Calculations via light Repository queries
      // const previousAttemptsCount = await this.attemptsrepository.getAttemptCount(userId, input.testset_id);

      const subscriptionData =
        await this.subscriptionservice.getOrganizationUsage(organization);

      const limits = subscriptionData.limits as Record<
        string,
        number | boolean
      >;
      const maxAllowedTestSets =
        Number(limits[OrganizationSubscriptionFeatureKey.MAX_TEST_SETS]) || 0;
      const maxAllowedReattempts =
        Number(limits[OrganizationSubscriptionFeatureKey.MAX_REATTEMPTS]) || 0;

      // Check A: Total unique test sets attempted by this user in this organization
      const totalUniqueTestSetsAttempted =
        await this.attemptsrepository.getTotalUniqueTestSetsCountByUser(
          userId,
          input.orgId,
        );
      if (totalUniqueTestSetsAttempted >= maxAllowedTestSets) {
        throw new ForbiddenException(
          `Plan limit exceeded. Your organization's plan allows a maximum of ${maxAllowedTestSets} unique test sets to be attempted.`,
        );
      }

      // Check B: Reattempts for this specific test set
      const previousAttemptsCount =
        await this.attemptsrepository.getAttemptCount(userId, input.testset_id);
      if (previousAttemptsCount >= maxAllowedReattempts) {
        throw new ForbiddenException(
          `Attempt limit reached. Your organization's plan allows a maximum of ${maxAllowedReattempts} attempt(s) for this test set.`,
        );
      }
      // 5. Database execution via clean repository delegation
      const savedAttempt = await this.attemptsrepository.createNewAttempt({
        user_id: userId,
        test_id: input.test_id,
        set_id: input.testset_id,
        start_time: startTime,
        end_time: endTime,
        attempt_number: previousAttemptsCount + 1,
        score: 0.0, // Clean numeric default base
      });

      // 6. Return response layout
      return {
        attempt_id: savedAttempt.attempt_id,
        start_time: savedAttempt.start_time,
        end_time: savedAttempt.end_time,
        timer_minutes: testSet.timer_minutes,
        message: 'Test attempt initialized successfully.',
      };
    } catch (err) {
      throw err;
    }
  }

  async saveProgressToCache(
    userId: string,
    attemptId: string,
    input: SaveProgressBulkDto,
  ) {
    try {
      const isValidAttempt = await this.attemptsrepository.isValidAttempt(
        attemptId,
        userId,
      );
      if (!isValidAttempt) {
        throw new ForbiddenException(
          'Invalid attempt, exam has ended, or you are not eligible',
        );
      }

      const answersMap: Record<string, string> = {};
      for (const item of input.answers) {
        answersMap[item.question_id] = String(item.selected_option);
      }

      const mainKey = `exam:attempt:${attemptId}`;

      //  Safely batch write / overwrite these keys into your global Redis Hash map
      await this.redis.hset(mainKey, answersMap);

      const examEndTimeMs = new Date(isValidAttempt.end_time).getTime();
      const gracePeriodMs = 60 * 60 * 1000;
      const totalExpiryMs = examEndTimeMs + gracePeriodMs - Date.now();
      const ttlSeconds = Math.max(3600, Math.ceil(totalExpiryMs / 1000));

      await this.redis.expire(mainKey, ttlSeconds);

      return {
        message: ' Student assessment state synchronized successfully.',
      };
    } catch (err) {
      throw err;
    }
  }
  // async processFinalSubmission(userId: string, attemptId: string, submitDto: SubmitTestDto) {
  //     try {
  //         // 1. Fetch official immutable test details from the database
  //         const attemptMetadata = await this.attemptsrepository.getAttemptWithScoringRules(attemptId, userId);
  //         if (!attemptMetadata) {
  //             throw new NotFoundException("Active exam attempt profile was not found.");
  //         }

  //         //  Guard: Prevent double-submission exploits
  //         if (attemptMetadata.submitted_via !== null) {
  //             throw new BadRequestException("This test session has already been finalized.");
  //         }

  //         const serverTime = new Date();
  //         const deadline = new Date(attemptMetadata.end_time);

  //         //  Time Guard Buffer: Allow a 2-minute network lag grace period for automatic timer submissions
  //         const networkLagBuffer = 2 * 60 * 1000;
  //         const absoluteCutoff = new Date(deadline.getTime() + networkLagBuffer);

  //         let submissionMethod = SubmissionType.Manual;

  //         if (serverTime > absoluteCutoff) {
  //             //  Rejection: Request arrived way too late past the deadline grace window.
  //             throw new BadRequestException("Submission rejected. The absolute deadline has passed.");
  //         } else if (serverTime > deadline) {
  //             //  Scenario: The frontend countdown hit 00:00, and the request landed within the lag window
  //             submissionMethod = SubmissionType.TIMEOUT ;
  //         } else {
  //             // Scenario: Student clicked the manual "Submit Test" button early
  //             submissionMethod = SubmissionType.Manual;
  //         }

  //         // 2. Collect authentic keys to grade against
  //         const answerKeys = await this.attemptsrepository.getTestSetQuestionKeys(attemptMetadata.set_id);

  //         let calculatedFinalScore = 0;
  //         const answerRowsToInsert: any[] = [];

  //         const positiveValue = Number(attemptMetadata.positive_value);
  //         const negativeValue = attemptMetadata.is_negative_marking ? Number(attemptMetadata.negative_value) : 0;

  //         // 3. Compute fractional metrics question by question
  //         for (const questionKey of answerKeys) {
  //             const studentSelection = submitDto.answers.find(a => a.question_id === questionKey.question_id);

  //             let chosenOption = 0; // Default: 0 = Omitted/Skipped
  //             let isCorrectStatus = AnswerEvaluation.SKIPPED;
  //             let marksAwarded = 0.00;

  //             if (studentSelection && studentSelection.selected_option !== AnswerOption.SKIPPED) {
  //                 chosenOption = studentSelection.selected_option;

  //                 if (chosenOption === questionKey.correct_answer) {
  //                     isCorrectStatus = AnswerEvaluation.CORRECT;
  //                     marksAwarded = positiveValue;
  //                 } else {
  //                     isCorrectStatus = AnswerEvaluation.WRONG;
  //                     const penaltyCost = positiveValue * negativeValue;
  //                     marksAwarded = attemptMetadata.is_negative_marking ? -penaltyCost : 0.00;
  //                 }
  //             }

  //             calculatedFinalScore += marksAwarded;

  //             answerRowsToInsert.push({
  //                 attempt_id: attemptId,
  //                 question_id: questionKey.question_id,
  //                 selected_option: chosenOption,
  //                 is_correct_status: isCorrectStatus,
  //                 marks_awarded: marksAwarded
  //             });
  //         }

  //         // 4. Commit results safely using an atomic query runner transaction
  //         await this.attemptsrepository.saveFinalGradingTransaction(
  //             attemptId,
  //             calculatedFinalScore,
  //             answerRowsToInsert,
  //             submissionMethod
  //         );

  //         return {
  //             success: true,
  //             score: calculatedFinalScore,
  //             submitted_via: SubmissionType[submissionMethod],
  //             message: "Test completed and graded successfully."
  //         };

  //     } catch (err) {
  //         throw err;
  //     }
  // }
  async submitAndFinalizeExam(
    userId: string,
    attemptId: string,
    input: FinalSubmitDto,
  ) {
    try {
      const attemptMetadata =
        await this.attemptsrepository.getAttemptWithScoringRules(
          attemptId,
          userId,
        );
      if (!attemptMetadata) {
        throw new NotFoundException(
          'Exam attempt is invalid or already submitted.',
        );
      }
      const mainKey = `exam:attempt:${attemptId}`;

      if (attemptMetadata.submitted_via !== null) {
        await this.redis.del(mainKey);
        throw new BadRequestException(
          'This test session has already been finalized.',
        );
      }

      // Process late-arriving answers (the last 59 seconds of data) if passed
      const incomingAnswersMap: Record<string, string> = {};
      if (input.answers && input.answers.length > 0) {
        for (const item of input.answers) {
          incomingAnswersMap[item.question_id] = String(item.selected_option);
        }
        // Pipeline save them to Redis instantly so your cache represents 100% complete data
        await this.redis.hset(mainKey, incomingAnswersMap);
      }
      const allCachedAnswers: Record<string, string> =
        await this.redis.hgetall(mainKey);

      const answerKeys = await this.attemptsrepository.getTestSetQuestionKeys(
        attemptMetadata.set_id,
      );

      const serverTime = new Date();
      const deadline = new Date(attemptMetadata.end_time);

      //  Time Guard Buffer: Allow a 2-minute network lag grace period for automatic timer submissions
      const networkLagBuffer = 2 * 60 * 1000;
      const absoluteCutoff = new Date(deadline.getTime() + networkLagBuffer);

      let submissionMethod = input.submitted_via ?? SubmissionType.Manual;

      if (serverTime > absoluteCutoff) {
        //  Rejection: Request arrived way too late past the deadline grace window.
        await this.redis.del(mainKey);
        throw new BadRequestException(
          'Submission rejected. The absolute deadline has passed.',
        );
      } else if (serverTime > deadline) {
        //  Scenario: The frontend countdown hit 00:00, and the request landed within the lag window
        submissionMethod = SubmissionType.TIMEOUT;
      }

      let calculatedFinalScore = 0;
      const answerRowsToInsert: any[] = [];

      const positiveValue = Number(attemptMetadata.positive_value);
      const negativeValue = attemptMetadata.is_negative_marking
        ? Number(attemptMetadata.negative_value)
        : 0;

      // 3. Compute fractional metrics question by question
      for (const questionKey of answerKeys) {
        const studentSelection = allCachedAnswers[questionKey.question_id];

        let chosenOption = 0; // Default: 0 = Omitted/Skipped
        let isCorrectStatus = AnswerEvaluation.SKIPPED;
        let marksAwarded = 0.0;

        if (studentSelection) {
          chosenOption = Number(studentSelection);

          if (chosenOption === questionKey.correct_answer) {
            isCorrectStatus = AnswerEvaluation.CORRECT;
            marksAwarded = positiveValue;
          } else {
            isCorrectStatus = AnswerEvaluation.WRONG;
            const penaltyCost = positiveValue * negativeValue;
            marksAwarded = attemptMetadata.is_negative_marking
              ? -penaltyCost
              : 0.0;
          }

          calculatedFinalScore += marksAwarded;

          answerRowsToInsert.push({
            attempt_id: attemptId,
            question_id: questionKey.question_id,
            selected_option: chosenOption,
            is_correct_status: isCorrectStatus,
            marks_awarded: marksAwarded,
          });
        }
      }

      // 4. Commit results safely using an atomic query runner transaction
      await this.attemptsrepository.saveFinalGradingTransaction(
        attemptId,
        calculatedFinalScore,
        answerRowsToInsert,
        submissionMethod,
      );

      await this.redis.del(mainKey);

      return {
        success: true,
        score: calculatedFinalScore,
        submitted_via: SubmissionType[submissionMethod],
        message: 'Test completed and graded successfully.',
      };
    } catch (err) {
      throw err;
    }
  }
  async checkViolation(
    userId: string,
    attemptId: string,
    data: ReportViolationDto,
  ) {
    try {
      const attemptMetadata =
        await this.attemptsrepository.getAttemptWithScoringRules(
          attemptId,
          userId,
        );
      if (!attemptMetadata) {
        throw new NotFoundException(
          'Exam attempt is invalid or already submitted.',
        );
      }
      const rules = await this.violationsService.getRules(data.orgId);

      const violationWeights = rules.settings.violation_weights;
      const violationScore = violationWeights
        ? (violationWeights[data.violation_type] ?? 0)
        : 0;
      const maxScoreAllowed = rules.settings.max_score_allowed;

      if (!maxScoreAllowed || !violationWeights || violationScore === 0) {
        return {
          status: 'WARNING',
          message: 'Violation recorded as a warning. No point penalty applied.',
          terminated: false,
        };
      }

      let penalty = violationScore;

      if (data.violation_type === ViolationType.TAB_SWITCH) {
        if (!attemptMetadata.last_away_at) {
          await this.attemptsrepository.updateLastAwayTime(attemptId);

          return {
            status: 'WARNING',
            message:
              'Navigation recorded. Return to the exam screen immediately.',
            terminated: false,
          };
        }

        const currentTime = new Date();
        const totalAwayTimeSeconds = Math.floor(
          (currentTime.getTime() -
            new Date(attemptMetadata.last_away_at).getTime()) /
            1000,
        );

        if (totalAwayTimeSeconds <= 5) {
          await this.attemptsrepository.submitViolationScore(attemptId, 0);
          return {
            status: 'WARNING',
            message:
              'Welcome back. Returned within the grace period. No point penalty applied.',
            terminated: false,
          };
        }

        if (
          rules.settings?.time_interval_seconds &&
          rules.settings.time_interval_seconds <= totalAwayTimeSeconds
        ) {
          const multiplier =
            Math.floor(
              totalAwayTimeSeconds / rules.settings.time_interval_seconds,
            ) + 1;
          penalty = violationScore * multiplier;
        }
      }

      const submitViolationScore =
        await this.attemptsrepository.submitViolationScore(attemptId, penalty);

      if (submitViolationScore < maxScoreAllowed) {
        return {
          status: 'PENALTY_WARNING',
          message:
            penalty > 0
              ? `Violation penalty calculated. Added ${penalty} points to your record.`
              : 'Welcome back. Your return has been logged.',
          current_score: submitViolationScore,
          terminated: false,
        };
      }

      const input: FinalSubmitDto = {};
      input.submitted_via = SubmissionType.SYSTEM_TERMINATED;
      input.answers = [];
      await this.submitAndFinalizeExam(userId, attemptId, input);

      return {
        status: 'TERMINATED',
        message:
          'Exam auto-terminated due to crossing maximum proctoring violation limits.',
        current_score: submitViolationScore,
        max_allowed: maxScoreAllowed,
        terminated: true,
      };
    } catch (err) {
      throw err;
    }
  }

  async autoFinalizeExpiredAttempt(
    userId: string,
    attemptId: string,
  ): Promise<void> {
    try {
      // 1. Fetch metadata required for positive/negative scoring parameters
      const attemptMetadata =
        await this.attemptsrepository.getAttemptWithScoringRules(
          attemptId,
          userId,
        );

      if (!attemptMetadata || attemptMetadata.submitted_via !== null) {
        return;
      }

      const mainKey = `exam:attempt:${attemptId}`;

      const allCachedAnswers: Record<string, string> =
        await this.redis.hgetall(mainKey);

      const answerKeys = await this.attemptsrepository.getTestSetQuestionKeys(
        attemptMetadata.set_id,
      );

      let calculatedFinalScore = 0;
      const answerRowsToInsert: any[] = [];

      const positiveValue = Number(attemptMetadata.positive_value);
      const negativeValue = attemptMetadata.is_negative_marking
        ? Number(attemptMetadata.negative_value)
        : 0;

      for (const questionKey of answerKeys) {
        const studentSelection = allCachedAnswers[questionKey.question_id];

        let chosenOption = 0;
        let isCorrectStatus = AnswerEvaluation.SKIPPED;
        let marksAwarded = 0.0;

        if (studentSelection) {
          chosenOption = Number(studentSelection);

          if (chosenOption === questionKey.correct_answer) {
            isCorrectStatus = AnswerEvaluation.CORRECT;
            marksAwarded = positiveValue;
          } else {
            isCorrectStatus = AnswerEvaluation.WRONG;
            // Calculate negative penalty: e.g., positive_value * fraction (like 0.25)
            const penaltyCost = positiveValue * negativeValue;
            marksAwarded = attemptMetadata.is_negative_marking
              ? -penaltyCost
              : 0.0;
          }

          calculatedFinalScore += marksAwarded;

          answerRowsToInsert.push({
            attempt_id: attemptId,
            question_id: questionKey.question_id,
            selected_option: chosenOption,
            is_correct_status: isCorrectStatus,
            marks_awarded: marksAwarded,
          });
        }
      }

      await this.attemptsrepository.saveFinalGradingTransaction(
        attemptId,
        calculatedFinalScore,
        answerRowsToInsert,
        SubmissionType.CRON_FORCE_SUBMIT,
      );

      await this.redis.del(mainKey);
    } catch (err) {
      console.log(
        `[CRON ERROR] Failed processing auto-finalization on attempt ID: ${attemptId}. Error: ${err.message}`,
      );
      throw err;
    }
  }

  async getSingleAttemptDetails(userId: string, attemptId: string) {
    try {
      const rawRows = await this.attemptsrepository.getAttemptDetailedReview(
        userId,
        attemptId,
      );

      if (!rawRows || rawRows.length === 0) {
        throw new NotFoundException('Exam attempt not found or access denied.');
      }

      const initialRow = rawRows[0];

      const questionsReview = rawRows.map((row) => ({
        question_id: row.question_id,
        question_text: row.question_text,
        options: {
          option_1: row.option_1,
          option_2: row.option_2,
          option_3: row.option_3,
          option_4: row.option_4,
        },
        correct_answer: Number(row.correct_answer),
        selected_option:
          row.selected_option !== null ? Number(row.selected_option) : null,
        is_correct_status: row.is_correct_status || AnswerEvaluation.SKIPPED,
        marks_awarded:
          row.marks_awarded !== null ? Number(row.marks_awarded) : 0.0,
      }));

      return {
        attempt_id: attemptId,
        test_id: initialRow.test_id,
        test_name: initialRow.test_name,
        set_id: initialRow.set_id,
        set_name: initialRow.set_name,
        final_score: Number(initialRow.final_score),
        submitted_via: initialRow.submitted_via,
        completed_at: initialRow.completed_at,
        questions: questionsReview,
      };
    } catch (err) {
      console.log(
        `Failed to fetch detailed review for attempt ${attemptId}:`,
        err.message,
      );
      throw err;
    }
  }

  async getUserAttemptHistory(userId: string, limit: number, offset: number) {
    try {
      const { data, total } =
        await this.attemptsrepository.findAttemptHistoryByUserId(
          userId,
          limit,
          offset,
        );

      const mappedData = data.map((item) => ({
        attempt_id: item.attempt_id,
        test_id: item.test_id,
        test_name: item.test_name,
        set_id: item.set_id,
        set_name: item.set_name,
        attempt_number: Number(item.attempt_number),
        final_score: item.final_score,
        submitted_via: item.submitted_via,
        created_at: item.created_at,
      }));

      return {
        data: mappedData,
        meta: {
          total_items: total,
          limit: limit,
          offset: offset,
          has_more: total > offset + limit,
        },
      };
    } catch (err) {
      console.log(
        `Failed to retrieve attempt history for user ${userId}:`,
        err.message,
      );
      throw err;
    }
  }

  async getTestSetAttemptsList(setId: string, limit: number, offset: number) {
    try {
      const { data, total } =
        await this.attemptsrepository.findAllAttemptsBySetId(
          setId,
          limit,
          offset,
        );

      const mappedData = data.map((item) => ({
        attempt_id: item.attempt_id,
        user_id: item.user_id,
        student_name: item.student_name || 'Unknown Student',
        test_id: item.test_id,
        test_name: item.test_name,
        final_score: Number(item.final_score),
        submitted_via: item.submitted_via,
        created_at: item.created_at,
      }));

      return {
        data: mappedData,
        meta: {
          total_records: total,
          limit: limit,
          offset: offset,
          has_more: total > offset + limit,
        },
      };
    } catch (err) {
      console.log(
        `Failed to retrieve all attempts for test set ${setId}:`,
        err.message,
      );
      throw err;
    }
  }

  async getUserAttemptsWithDetails(
    userId: string,
    setId: string,
    limit: number,
    offset: number,
  ) {
    try {
      const { data, total } =
        await this.attemptsrepository.findUserAttemptsBySetId(
          userId,
          setId,
          limit,
          offset,
        );

      if (total === 0) {
        return {
          total_attempts: 0,
          test_id: null,
          test_name: null,
          set_id: setId,
          set_name: null,
          attempts: [],
        };
      }

      // Extract master structural names from the first history record row
      const initialRow = data[0];

      const mappedAttempts = data.map((item, index) => ({
        attempt_id: item.attempt_id,
        // Calculate a chronological attempt number based on the total count and offset
        attempt_number: total - (offset + index),
        final_score: Number(item.final_score),
        submitted_via: item.submitted_via,
        created_at: item.created_at,
      }));

      return {
        total_attempts: total, // 👈 Here is your total count!
        test_id: initialRow.test_id,
        test_name: initialRow.test_name,
        set_id: setId,
        set_name: initialRow.set_name,
        attempts: mappedAttempts, // 👈 Here are your matching details!
      };
    } catch (err) {
      console.log(
        `Failed to retrieve attempts with details for user ${userId} on set ${setId}:`,
        err.message,
      );
      throw err;
    }
  }
}
