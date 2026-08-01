import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  CreatePlatformPlanDto,
  UpdatePlatformPlanDto,
} from './dto/platformplans.dto';
import { PlatformPlan } from './entities/platformplan.entity';
import {
  CreateOrganizationPlanDto,
  UpdateOrganizationPlanDto,
} from './dto/organizationplans.dto';
import { IOrganization } from 'src/interfaces/organization.interfaces';
import { OrganizationPlan } from './entities/organizationplans.entity';
import { OrgSubscription } from './entities/subscriptionsorganization.entity';
import { OrgSubscriptionStatus, UserSubscriptionStatus } from 'src/config/enum';
import { IOrgSubscriptionPayload } from './interface/orgsubscription.interface';
import { UserSubscription } from './entities/subscriptionsuser.entity';
import { IUserSubscriptionPayload } from './interface/usersubscription.interface';

@Injectable()
export class SubscriptionRepository {
  constructor(private readonly datasource: DataSource) {}
  async createPlatformPlan(input: CreatePlatformPlanDto) {
    try {
      const planRepository = this.datasource.getRepository(PlatformPlan);
      const plan = planRepository.create({
        name: input.name,
        description: input.description,
        features: input.features,
        pricing: input.pricing,
        currency: input.currency,
      });
      return await planRepository.save(plan);
    } catch (err) {
      throw err;
    }
  }

  async getAllPlatformPlans() {
    try {
      return await this.datasource
        .getRepository(PlatformPlan)
        .createQueryBuilder('pp')
        .orderBy('pp.created_at', 'DESC')
        .getMany();
    } catch (err) {
      throw err;
    }
  }

  async getPlatformPlanById(planId: string) {
    try {
      const plan = await this.datasource
        .getRepository(PlatformPlan)
        .createQueryBuilder('pp')
        .where('pp.plan_id = :planId', { planId })
        .getOne();

      if (!plan) {
        throw new NotFoundException('Platform plan not found');
      }

      return plan;
    } catch (err) {
      throw err;
    }
  }

  async updatePlatformPlan(planId: string, input: UpdatePlatformPlanDto) {
    try {
      const planRepository = this.datasource.getRepository(PlatformPlan);

      const plan = await this.getPlatformPlanById(planId);

      Object.assign(plan, input);
      return await planRepository.save(plan);
    } catch (err) {
      throw err;
    }
  }

  async removePlatformPlan(planId: string) {
    try {
      const planRepository = this.datasource.getRepository(PlatformPlan);

      const plan = await this.getPlatformPlanById(planId);
      plan.is_active = false;
      await planRepository.save(plan);

      return { message: 'Platform plan deactivated successfully' };
    } catch (err) {
      throw err;
    }
  }
  async createOrganizationPlan(
    organization: IOrganization,
    input: CreateOrganizationPlanDto,
  ) {
    try {
      const planRepository = this.datasource.getRepository(OrganizationPlan);
      const plan = planRepository.create(input);
      return await planRepository.save(plan);
    } catch (err) {
      throw err;
    }
  }
  async getAllOrganizationPlan(orgId: string) {
    try {
      return await this.datasource
        .getRepository(OrganizationPlan)
        .createQueryBuilder('op')
        .where('op.organization_id = :orgId', { orgId })
        .orderBy('op.created_at', 'DESC')
        .getMany();
    } catch (err) {
      throw err;
    }
  }

  async getOrganizationPlanById(orgId: string, planId: string) {
    try {
      return await this.datasource
        .getRepository(OrganizationPlan)
        .createQueryBuilder('op')
        .where('op.plan_id = :planId', { planId })
        .andWhere('op.organization_id = :orgId', { orgId })
        .getOne();
    } catch (err) {
      throw err;
    }
  }

  async updateOrganizationPlan(
    planId: string,
    input: UpdateOrganizationPlanDto,
  ) {
    try {
      const planRepository = this.datasource.getRepository(OrganizationPlan);
      const plan = await planRepository.findOne({ where: { plan_id: planId } });

      if (!plan) {
        throw new NotFoundException('Organization plan not found');
      }

      Object.assign(plan, input);
      return await planRepository.save(plan);
    } catch (err) {
      throw err;
    }
  }

  async removedOrganizationPlan(orgId: string, planId: string) {
    try {
      const result = await this.datasource
        .getRepository(OrganizationPlan)
        .createQueryBuilder('op')
        .update(OrganizationPlan)
        .set({ is_active: false })
        .where('op.plan_id = :planId', { planId })
        .andWhere('op.organization_id = :orgId', { orgId })
        .execute();

      if (result.affected === 0) {
        throw new NotFoundException('Organization plan not found');
      }

      return { message: 'Organization plan removed successfully' };
    } catch (err) {
      throw err;
    }
  }

  async getCurrentOrganizationSubscription(orgId: string) {
    try {
      return await this.datasource
        .getRepository(OrgSubscription)
        .createQueryBuilder('os')
        .where('os.organization_id = :orgId', { orgId })
        .andWhere('os.status = :status', {
          status: OrgSubscriptionStatus.Active,
        })
        .getOne();
    } catch (err) {
      throw err;
    }
  }

  async upsertOrganizationSubscription(input: IOrgSubscriptionPayload) {
    try {
      const repo = this.datasource.getRepository(OrgSubscription);
      await repo.upsert(
        {
          organization_id: input.organization_id,
          transaction_id: input.transaction_id,
          plan_name: input.plan_name,
          billing_cycle: input.billing_cycle,
          start_date: input.start_date,
          end_date: input.end_date,
          status: input.status,
          gateway_subscription_id: input.gateway_subscription_id || null,
          features: input.features,
        },
        ['organization_id'], // Triggers an update if organization_id already exists
      );

      return await repo.findOne({
        where: { organization_id: input.organization_id },
      });
    } catch (err) {
      throw err;
    }
  }

  async getCurrentUserSubscription(userId: string) {
    try {
      return await this.datasource
        .getRepository(UserSubscription)
        .createQueryBuilder('us')
        .where('us.user_id = :userId', { userId })
        .andWhere('us.status = :status', {
          status: UserSubscriptionStatus.Active,
        })
        .getOne();
    } catch (err) {
      throw err;
    }
  }

  async upsertUserSubscription(input: IUserSubscriptionPayload) {
    try {
      const repo = this.datasource.getRepository(UserSubscription);

      await repo.upsert(
        {
          user_id: input.user_id,
          organization_id: input.organization_id,
          transaction_id: input.transaction_id,
          plan_name: input.plan_name,
          billing_cycle: input.billing_cycle,
          start_date: input.start_date,
          end_date: input.end_date,
          status: input.status,
          gateway_subscription_id: input.gateway_subscription_id || null,
          features: input.features,
        },
        ['user_id'], // Triggers an update if user_id already exists
      );

      return await repo.findOne({
        where: { user_id: input.user_id },
      });
    } catch (err) {
      throw err;
    }
  }

  async findOrgSubscriptionByOrgId(
    orgId: string,
  ): Promise<OrgSubscription | null> {
    return await this.datasource
      .getRepository(OrgSubscription)
      .createQueryBuilder('os')
      .where('os.organization_id = :orgId', { orgId })
      .getOne();
  }

  async findUserSubscription(
    orgId: string,
    userId: string,
  ): Promise<UserSubscription | null> {
    return await this.datasource
      .getRepository(UserSubscription)
      .createQueryBuilder('us')
      .where('us.organization_id = :orgId', { orgId })
      .andWhere('us.user_id = :userId', { userId })
      .getOne();
  }
}
