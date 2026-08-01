// src/attempt/violations/violations.service.ts
import { Injectable } from '@nestjs/common';
import { ViolationsRepository } from './violations.repository';
import { ViolationType } from 'src/config/enum';
import { SaveViolationRulesDto } from './dto/save-violation-rules.dto';

@Injectable()
export class ViolationsService {
  constructor(private readonly violationsRepository: ViolationsRepository) {}

  async createRules(orgId: string, dto: SaveViolationRulesDto) {
    let rules = await this.violationsRepository.findByOrgId(orgId);

    if (!rules) {
      rules = this.violationsRepository.createInstance(orgId);
    }

    rules.max_score_allowed =
      dto.max_score_allowed ?? rules.max_score_allowed ?? 30;
    rules.time_interval_seconds =
      dto.time_interval_seconds ?? rules.time_interval_seconds ?? 30;

    if (dto.violation_weights !== undefined) {
      const incomingWeights = dto.violation_weights ?? {};
      const existingWeights = rules.violation_weights ?? {};
      const normalizedWeights: Record<number, number> = {};

      // Auto-extract numbers from your application's dynamic enum configurations
      const activeViolationTypes = Object.values(ViolationType).filter(
        (val) => typeof val === 'number',
      ) as number[];

      for (const type of activeViolationTypes) {
        const submittedValue = incomingWeights[type];

        // Priority Chain: Validated New Value ?? Currently Saved DB Value ?? Zero Fallback Baseline
        normalizedWeights[type] =
          submittedValue !== undefined && submittedValue !== null
            ? Number(submittedValue)
            : (existingWeights[type] ?? 0);
      }

      rules.violation_weights = normalizedWeights;
    }

    const savedRecord = await this.violationsRepository.saveRules(rules);

    return {
      success: true,
      message: 'Proctoring configurations aligned dynamically.',
      settings: savedRecord,
    };
  }

  async getRules(orgId: string) {
    try {
      let rules = await this.violationsRepository.findByOrgId(orgId);
      if (!rules) {
        return {
          message: 'No proctoring configurations found for this organization.',
          settings: {
            id: null,
            organization_id: orgId,
            max_score_allowed: null,
            time_interval_seconds: null,
            violation_weights: null,
            created_at: null,
            updated_at: null,
          },
        };
      }
      return {
        message: 'Proctoring configurations retrieved successfully.',
        settings: rules,
      };
    } catch (err) {
      throw err;
    }
  }
}
