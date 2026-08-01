import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionRepository } from './subscription.repository';
import {
  CreatePlatformPlanDto,
  UpdatePlatformPlanDto,
} from './dto/platformplans.dto';
import {
  OrgBillingCycle,
  OrgSubscriptionStatus,
  StudentBillingCycle,
  TestStatus,
  UserRole,
  UserSubscriptionStatus,
} from 'src/config/enum';
import { IOrganization } from 'src/interfaces/organization.interfaces';
import {
  CreateOrganizationPlanDto,
  UpdateOrganizationPlanDto,
} from './dto/organizationplans.dto';
import { IOrgTransactionResponsePayload } from './interface/orgsubscription.interface';
import { PaymentsService } from '../payments/payments.service';
import { IUserTransactionResponsePayload } from './interface/usersubscription.interface';
import { OrganizationsService } from '../organizations/organizations.service';
import { TestService } from '../tests/services/test.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly subscriptionrepository: SubscriptionRepository,
    private readonly paymentsservice: PaymentsService,
    @Inject(forwardRef(() => OrganizationsService))
    private readonly organizationsservice: OrganizationsService,
    @Inject(forwardRef(() => TestService))
    private readonly testService: TestService,
    private readonly userService: UsersService,
  ) {}
  async createPlatformPlan(
    organization: IOrganization,
    input: CreatePlatformPlanDto,
  ) {
    try {
      if (organization.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Access denied');
      }

      return await this.subscriptionrepository.createPlatformPlan(input);
    } catch (err) {
      throw err;
    }
  }

  async getAllPlatformPlans(organization: IOrganization) {
    try {
      if (
        organization.role !== UserRole.ADMIN &&
        organization.role !== UserRole.ORGANIZATION
      ) {
        throw new ForbiddenException('Access denied');
      }

      return await this.subscriptionrepository.getAllPlatformPlans();
    } catch (err) {
      throw err;
    }
  }

  async getPlatformPlan(organization: IOrganization, planId: string) {
    try {
      if (
        organization.role !== UserRole.ADMIN &&
        organization.role !== UserRole.ORGANIZATION
      ) {
        throw new ForbiddenException('Access denied');
      }
      return await this.subscriptionrepository.getPlatformPlanById(planId);
    } catch (err) {
      throw err;
    }
  }

  async updatePlatformPlan(
    organization: IOrganization,
    planId: string,
    input: UpdatePlatformPlanDto,
  ) {
    try {
      if (organization.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Access denied');
      }

      return await this.subscriptionrepository.updatePlatformPlan(
        planId,
        input,
      );
    } catch (err) {
      throw err;
    }
  }

  async removePlatformPlan(organization: IOrganization, planId: string) {
    try {
      if (organization.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Access denied');
      }

      return await this.subscriptionrepository.removePlatformPlan(planId);
    } catch (err) {
      throw err;
    }
  }

  async createOrganizationPlan(
    organization: IOrganization,
    input: CreateOrganizationPlanDto,
  ) {
    try {
      if (organization.role !== UserRole.ORGANIZATION) {
        throw new ForbiddenException('Access denied');
      }
      input.organization_id = organization.org_id;
      return await this.subscriptionrepository.createOrganizationPlan(
        organization,
        input,
      );
    } catch (err) {
      throw err;
    }
  }
  async getAllOrganizationPlan(organization: IOrganization) {
    try {
      if (
        organization.role !== UserRole.ORGANIZATION &&
        organization.role !== UserRole.STUDENT
      ) {
        throw new ForbiddenException('Access denied');
      }
      return await this.subscriptionrepository.getAllOrganizationPlan(
        organization.org_id,
      );
    } catch (err) {
      throw err;
    }
  }

  async getOrganizationPlanById(organization: IOrganization, planId: string) {
    try {
      if (
        organization.role !== UserRole.ORGANIZATION &&
        organization.role !== UserRole.STUDENT
      ) {
        throw new ForbiddenException('Access denied');
      }

      const plan = await this.subscriptionrepository.getOrganizationPlanById(
        organization.org_id,
        planId,
      );

      if (!plan) {
        throw new NotFoundException('Organization plan not found');
      }

      return plan;
    } catch (err) {
      throw err;
    }
  }

  async updateOrganizationPlan(
    organization: IOrganization,
    planId: string,
    input: UpdateOrganizationPlanDto,
  ) {
    try {
      if (organization.role !== UserRole.ORGANIZATION) {
        throw new ForbiddenException('Access denied');
      }

      const plan = await this.subscriptionrepository.getOrganizationPlanById(
        organization.org_id,
        planId,
      );

      if (!plan) {
        throw new NotFoundException('Organization plan not found');
      }

      return await this.subscriptionrepository.updateOrganizationPlan(
        planId,
        input,
      );
    } catch (err) {
      throw err;
    }
  }
  async removedOrganizationPlan(organization: IOrganization, planId: string) {
    try {
      if (organization.role !== UserRole.ORGANIZATION) {
        throw new ForbiddenException('Access denied');
      }

      const plan = await this.subscriptionrepository.getOrganizationPlanById(
        organization.org_id,
        planId,
      );

      if (!plan) {
        throw new NotFoundException('Organization plan not found');
      }
      return await this.subscriptionrepository.removedOrganizationPlan(
        organization.org_id,
        planId,
      );
    } catch (err) {
      throw err;
    }
  }

  async createOrUpdateOrgSubscription(
    transactionRecord: IOrgTransactionResponsePayload,
  ) {
    try {
      const now = new Date();

      // 1. Check if an active subscription row already exists
      const currentSubscription =
        await this.subscriptionrepository.getCurrentOrganizationSubscription(
          transactionRecord.organization_id,
        );

      let startDate = now;
      let endDate = this.calculateEndDate(transactionRecord.billing_cycle, now); // e.g., +30 days for new plan
      // 2. MID-CYCLE UPGRADE & REMAINING TIME COMPENSATION LOGIC
      if (currentSubscription && currentSubscription.end_date > now) {
        // 1. Fetch the previous transaction to get the amount paid
        const previousTransaction =
          await this.paymentsservice.getOrganizationTransaction(
            currentSubscription.transaction_id,
          );

        if (previousTransaction && previousTransaction.amount) {
          // 2. Take start and end date directly from currentSubscription
          const subStartDate = new Date(currentSubscription.start_date);
          const subEndDate = new Date(currentSubscription.end_date);

          // 3. Calculate total days of the subscription simply by (end date - start date)
          const totalDaysMs = subEndDate.getTime() - subStartDate.getTime();
          const totalDays = totalDaysMs / (1000 * 60 * 60 * 24);

          // 4. Divide amount with this total days to get per-day amount
          const dailyRate =
            totalDays > 0 ? previousTransaction.amount / totalDays : 0;

          // 5. Calculate remaining days (end date - now)
          const remainingDaysMs = subEndDate.getTime() - now.getTime();
          const remainingDays = remainingDaysMs / (1000 * 60 * 60 * 24);

          // 6. Multiply remaining days with daily amount value to get remaining monetary balance
          const remainingValue =
            remainingDays > 0 ? remainingDays * dailyRate : 0;

          // 7. Convert this remaining value into extra compensated days on the new plan
          // (Using the new transaction's daily rate, or fallback safely to ensure it always gives more/fair value)
          const newPlanDurationMs = endDate.getTime() - now.getTime();
          const newPlanTotalDays = newPlanDurationMs / (1000 * 60 * 60 * 24);
          const newPlanDailyRate =
            newPlanTotalDays > 0
              ? transactionRecord.amount / newPlanTotalDays
              : dailyRate;

          const compensatedDays =
            newPlanDailyRate > 0
              ? remainingValue / newPlanDailyRate
              : remainingDays;
          const compensatedTimeMs = compensatedDays * (1000 * 60 * 60 * 24);

          // 8. Add the composite extra days to the new plan's end date
          endDate = new Date(endDate.getTime() + compensatedTimeMs);
        }
      }

      // 3. Define feature limits based on the plan
      //   const limits = this.getPlanLimits(transactionRecord.plan_name);

      if (currentSubscription) {
        // --- UPDATE EXISTING SUBSCRIPTION (UPGRADE / RENEWAL) ---
        currentSubscription.transaction_id = transactionRecord.transaction_id;
        currentSubscription.plan_name = transactionRecord.plan_name;
        currentSubscription.billing_cycle = transactionRecord.billing_cycle;
        currentSubscription.start_date = startDate;
        currentSubscription.end_date = endDate; // Includes price-compensated days!
        currentSubscription.status = OrgSubscriptionStatus.Active;

        currentSubscription.features = transactionRecord.features;

        if (transactionRecord.gateway_transaction_id) {
          currentSubscription.gateway_subscription_id =
            transactionRecord.gateway_transaction_id;
        }

        return await this.subscriptionrepository.upsertOrganizationSubscription(
          currentSubscription,
        );
      } else {
        // --- FIRST-TIME BUYER ---
        const newSubscription =
          this.subscriptionrepository.upsertOrganizationSubscription({
            organization_id: transactionRecord.organization_id,
            transaction_id: transactionRecord.transaction_id,
            plan_name: transactionRecord.plan_name,
            billing_cycle: transactionRecord.billing_cycle,
            start_date: startDate,
            end_date: endDate,
            status: OrgSubscriptionStatus.Active,
            features: transactionRecord.features,
            gateway_subscription_id:
              transactionRecord.gateway_transaction_id || null,
          });
      }
    } catch (err) {
      throw err;
    }
  }

  // Helper: Calculate end date based on billing cycle enum
  private calculateEndDate(
    billingCycle: OrgBillingCycle | StudentBillingCycle,
    fromDate: Date,
  ): Date {
    const date = new Date(fromDate);

    switch (billingCycle) {
      case OrgBillingCycle.Quarterly:
        date.setMonth(date.getMonth() + 3); // Adds 3 months
        break;
      case OrgBillingCycle.Yearly:
        date.setFullYear(date.getFullYear() + 1); // Adds 1 year
        break;
      case OrgBillingCycle.Monthly:
      default:
        date.setMonth(date.getMonth() + 1); // Adds 1 month
        break;
    }

    return date;
  }

  async createOrUpdateUserSubscription(
    transactionRecord: IUserTransactionResponsePayload,
  ) {
    try {
      const now = new Date();

      // 1. Check if an active subscription row already exists
      const currentSubscription =
        await this.subscriptionrepository.getCurrentUserSubscription(
          transactionRecord.user_id,
        );

      let startDate = now;
      let endDate = this.calculateEndDate(transactionRecord.billing_cycle, now); // e.g., +30 days for new plan
      // 2. MID-CYCLE UPGRADE & REMAINING TIME COMPENSATION LOGIC
      if (currentSubscription && currentSubscription.end_date > now) {
        // 1. Fetch the previous transaction to get the amount paid
        const previousTransaction =
          await this.paymentsservice.getUserTransaction(
            currentSubscription.transaction_id,
          );

        if (previousTransaction && previousTransaction.amount) {
          // 2. Take start and end date directly from currentSubscription
          const subStartDate = new Date(currentSubscription.start_date);
          const subEndDate = new Date(currentSubscription.end_date);

          // 3. Calculate total days of the subscription simply by (end date - start date)
          const totalDaysMs = subEndDate.getTime() - subStartDate.getTime();
          const totalDays = totalDaysMs / (1000 * 60 * 60 * 24);

          // 4. Divide amount with this total days to get per-day amount
          const dailyRate =
            totalDays > 0 ? previousTransaction.amount / totalDays : 0;

          // 5. Calculate remaining days (end date - now)
          const remainingDaysMs = subEndDate.getTime() - now.getTime();
          const remainingDays = remainingDaysMs / (1000 * 60 * 60 * 24);

          // 6. Multiply remaining days with daily amount value to get remaining monetary balance
          const remainingValue =
            remainingDays > 0 ? remainingDays * dailyRate : 0;

          // 7. Convert this remaining value into extra compensated days on the new plan
          // (Using the new transaction's daily rate, or fallback safely to ensure it always gives more/fair value)
          const newPlanDurationMs = endDate.getTime() - now.getTime();
          const newPlanTotalDays = newPlanDurationMs / (1000 * 60 * 60 * 24);
          const newPlanDailyRate =
            newPlanTotalDays > 0
              ? transactionRecord.amount / newPlanTotalDays
              : dailyRate;

          const compensatedDays =
            newPlanDailyRate > 0
              ? remainingValue / newPlanDailyRate
              : remainingDays;
          const compensatedTimeMs = compensatedDays * (1000 * 60 * 60 * 24);

          // 8. Add the composite extra days to the new plan's end date
          endDate = new Date(endDate.getTime() + compensatedTimeMs);
        }
      }

      // 3. Define feature limits based on the plan
      //   const limits = this.getPlanLimits(transactionRecord.plan_name);

      if (currentSubscription) {
        // --- UPDATE EXISTING SUBSCRIPTION (UPGRADE / RENEWAL) ---
        currentSubscription.transaction_id = transactionRecord.transaction_id;
        currentSubscription.plan_name = transactionRecord.plan_name;
        currentSubscription.billing_cycle = transactionRecord.billing_cycle;
        currentSubscription.start_date = startDate;
        currentSubscription.end_date = endDate; // Includes price-compensated days!
        currentSubscription.status = UserSubscriptionStatus.Active;

        currentSubscription.features = transactionRecord.features;

        if (transactionRecord.gateway_transaction_id) {
          currentSubscription.gateway_subscription_id =
            transactionRecord.gateway_transaction_id;
        }

        return await this.subscriptionrepository.upsertUserSubscription(
          currentSubscription,
        );
      } else {
        // --- FIRST-TIME BUYER ---
        return await this.subscriptionrepository.upsertUserSubscription({
          user_id: transactionRecord.user_id,
          organization_id: transactionRecord.organization_id,
          transaction_id: transactionRecord.transaction_id,
          plan_name: transactionRecord.plan_name,
          billing_cycle: transactionRecord.billing_cycle,
          start_date: startDate,
          end_date: endDate,
          status: UserSubscriptionStatus.Active,
          features: transactionRecord.features,
          gateway_subscription_id:
            transactionRecord.gateway_transaction_id || null,
        });
      }
    } catch (err) {
      throw err;
    }
  }

  async getOrganizationSubscription(
    organization: IOrganization,
    orgId?: string,
  ) {
    try {
      let targetOrgId: string;

      if (organization.role === UserRole.ORGANIZATION) {
        targetOrgId = organization.org_id;
      } else if (organization.role === UserRole.ADMIN) {
        if (!orgId) {
          throw new BadRequestException(
            'Query parameter "orgId" is required for admin requests.',
          );
        }
        targetOrgId = orgId;
      } else {
        throw new ForbiddenException('Unauthorized access.');
      }

      const subscription =
        await this.subscriptionrepository.findOrgSubscriptionByOrgId(
          targetOrgId,
        );

      if (!subscription) {
        throw new NotFoundException('Organization subscription not found.');
      }

      return subscription;
    } catch (err) {
      if (
        err instanceof ForbiddenException ||
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }
      throw new InternalServerErrorException(
        'Failed to fetch organization subscription',
      );
    }
  }

  // --- User (Student) Subscription Logic ---
  async getUserSubscription(
    userId: string,
    orgId: string,
    organization: IOrganization,
  ) {
    try {
      let targetOrgId: string;
      let targetUserId: string;

      if (organization.role === UserRole.ORGANIZATION) {
        targetOrgId = organization.org_id;
        if (!userId) {
          throw new BadRequestException(
            'Query parameter "userId" is required.',
          );
        }
        targetUserId = userId;
      } else if (organization.role === UserRole.STUDENT) {
        targetUserId = organization.user_id;
        if (!orgId) {
          throw new BadRequestException('Query parameter "orgId" is required.');
        }
        if (
          !(await this.organizationsservice.isValidUserOrganizationRelation(
            targetUserId,
            orgId,
          ))
        ) {
          throw new NotFoundException('Organization subscription not found.');
        }

        targetOrgId = orgId;
      } else if (organization.role === UserRole.ADMIN) {
        if (!orgId || !userId) {
          throw new BadRequestException(
            'Both "orgId" and "userId" query parameters are required.',
          );
        }
        targetOrgId = orgId;
        targetUserId = userId;
      } else {
        throw new ForbiddenException('Unauthorized access.');
      }

      const subscription =
        await this.subscriptionrepository.findUserSubscription(
          targetOrgId,
          targetUserId,
        );

      if (!subscription) {
        throw new NotFoundException('User subscription not found.');
      }

      return subscription;
    } catch (err) {
      if (
        err instanceof ForbiddenException ||
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }
      throw new InternalServerErrorException(
        'Failed to fetch user subscription',
      );
    }
  }

  async getOrganizationUsage(
    organization: IOrganization,
    targetId?: string,
    isOrg?: boolean,
  ) {
    try {
      let targetOrgId: string | undefined;
      let targetUserId: string | undefined;

      // 1. Role-based target resolution
      if (organization.role === UserRole.STUDENT) {
        // Students can only view their own usage/subscription
        targetUserId = organization.user_id;
        if (!targetId) {
          throw new BadRequestException(
            'organization Id (target Id) is required for this request',
          );
        }
        if (
          !(await this.organizationsservice.isValidUserOrganizationRelation(
            targetUserId,
            targetId,
          ))
        ) {
          throw new NotFoundException('Organization subscription not found.');
        }
        targetOrgId = targetId;
      } else if (organization.role === UserRole.ORGANIZATION) {
        // Organizations view their own organization usage
        targetOrgId = organization.org_id;
      } else if (organization.role === UserRole.ADMIN) {
        // Admin can look up either an organization or a user based on `isOrg` flag
        if (!targetId) {
          throw new BadRequestException(
            'Query parameter "targetId" is required for admin requests.',
          );
        }

        if (isOrg === true) {
          targetOrgId = targetId;
        } else {
          targetUserId = targetId;
        }
      } else {
        throw new ForbiddenException('Unauthorized access.');
      }

      // 2. Fetch subscription & calculate usage depending on whether it's an Org or User
      if (targetOrgId && !targetUserId) {
        // --- ORGANIZATION USAGE ---
        const subscription =
          await this.subscriptionrepository.findOrgSubscriptionByOrgId(
            targetOrgId,
          );
        if (!subscription) {
          throw new NotFoundException('Organization subscription not found.');
        }

        // const currentUserCount :number = await

        // Fetch active test count with an alias
        let { count: activeTestCount } = await this.testService.getAllTestCount(
          organization,
          targetOrgId,
          TestStatus.ACTIVE,
        );

        // Fetch on-hold test count with an alias
        let { count: onHoldTestCount } = await this.testService.getAllTestCount(
          organization,
          targetOrgId,
          TestStatus.ON_HOLD,
        );

        // Total tests used
        const currentTestCount = activeTestCount + onHoldTestCount;
        const currentUserCount =
          await this.userService.getAllOrgUsersCount(organization);
        const currentTestSetPerTest =
          await this.testService.getTestSetCountPerTest(organization);

        return {
          subscriptionId: subscription.subscription_id,
          planName: subscription.plan_name,
          status: subscription.status,
          startDate: subscription.start_date,
          endDate: subscription.end_date,
          limits: subscription.features,
          usage: {
            currentTestCount,
            currentUserCount,
            currentTestSetPerTest,
          },
        };
      } else {
        // --- USER (STUDENT) USAGE ---

        // For demonstration using userId lookup:
        if (!targetOrgId || !targetUserId) {
          throw new NotFoundException('User subscription not found.');
        }
        const subscription =
          await this.subscriptionrepository.findUserSubscription(
            targetOrgId,
            targetUserId,
          );
        if (!subscription) {
          throw new NotFoundException('User subscription not found.');
        }

        return {
          subscriptionId: subscription.subscription_id,
          planName: subscription.plan_name,
          status: subscription.status,
          startDate: subscription.start_date,
          endDate: subscription.end_date,
          limits: subscription.features,
          usage: {
            // TODO: Determine whether usage metrics (like test sets and reattempts)
            // should reset every billing cycle or accumulate across renewals.
            // Currently, usage is calculated based on active records within the active subscription window.
          },
        };
      }
    } catch (err) {
      if (
        err instanceof ForbiddenException ||
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }
      throw new InternalServerErrorException(
        'Failed to fetch subscription usage summary',
      );
    }
  }
}
