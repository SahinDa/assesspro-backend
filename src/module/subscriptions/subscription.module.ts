import { forwardRef, Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { SubscriptionRepository } from './subscription.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationPlan } from './entities/organizationplans.entity';
import { PlatformPlan } from './entities/platformplan.entity';
import { OrgSubscription } from './entities/subscriptionsorganization.entity';
import { UserSubscription } from './entities/subscriptionsuser.entity';
import { PaymentsModule } from '../payments/payments.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { TestModule } from '../tests/test.module';
import { UserModule } from '../users/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrganizationPlan,
      PlatformPlan,
      OrgSubscription,
      UserSubscription,
    ]),
    forwardRef(() => PaymentsModule),
    forwardRef(() => OrganizationsModule),
    forwardRef(() => TestModule),
    UserModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionRepository],
  exports: [SubscriptionService, SubscriptionRepository],
})
export class SubscriptionModule {}
