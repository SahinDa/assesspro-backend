import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttemptAnswer } from './entities/attemptanswer.entity';
import { TestAttempt } from './entities/testattempt.entity';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';
import { AttemptsRepository } from './attempts.repository';
import { TestModule } from '../tests/test.module';
import { ExamViolationRule } from './entities/examviolationrules.entity';
import { ViolationsModule } from './violations/violations.module';
import { AttemptsCronService } from './attempts.cron.service';
import { SubscriptionModule } from '../subscriptions/subscription.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AttemptAnswer, TestAttempt, ExamViolationRule]),
    TestModule,
    ViolationsModule,
    SubscriptionModule,
    OrganizationsModule,
  ],
  controllers: [AttemptsController],
  providers: [AttemptsService, AttemptsRepository, AttemptsCronService],
  exports: [AttemptsService, AttemptsRepository, AttemptsCronService],
})
export class AttemptsModule {}
