import { Injectable } from '@nestjs/common';
import { ExamViolationRule } from '../entities/examviolationrules.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class ViolationsRepository {
  constructor(private readonly dataSource: DataSource) {}
  /**
   * 🔍 Look up rule setting row by Organization UUID context
   */
  async findByOrgId(orgId: string): Promise<ExamViolationRule | null> {
    try {
      return await this.dataSource
        .getRepository(ExamViolationRule)
        .createQueryBuilder('examVR')
        .where('examVR.org_id = :orgId', { orgId })
        .getOne();
    } catch (err) {
      throw err;
    }
  }

  /**
   * Instantiate an empty in-memory row shell with the target orgId
   */
  createInstance(orgId: string): ExamViolationRule {
    return this.dataSource
      .getRepository(ExamViolationRule)
      .create({ org_id: orgId });
  }

  /**
   * Commit/Save the populated entity properties into PostgreSQL
   */
  async saveRules(rules: ExamViolationRule): Promise<ExamViolationRule> {
    try {
      return await this.dataSource.getRepository(ExamViolationRule).save(rules);
    } catch (err) {
      throw err;
    }
  }
}
