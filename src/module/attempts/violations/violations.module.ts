import { Module } from '@nestjs/common';
import { ViolationsController } from './violations.controller';
import { ViolationsService } from './violations.service';
import { ViolationsRepository } from './violations.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamViolationRule } from '../entities/examviolationrules.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExamViolationRule])],
  controllers: [ViolationsController],
  providers: [ViolationsService, ViolationsRepository],
  exports: [ViolationsService, ViolationsRepository],
})
export class ViolationsModule {}
