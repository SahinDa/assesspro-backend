// src/attempt/violations/dto/save-violation-rules.dto.ts
import { IsNumber, IsOptional, IsObject, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class SaveViolationRulesDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  max_score_allowed?: number;

  @IsNumber()
  @IsOptional()
  @Min(20)
  @Max(60)
  time_interval_seconds?: number;

  @IsObject()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    const sanitizedMap: Record<number, number> = {};
    if (typeof value === 'object') {
      Object.keys(value).forEach((key) => {
        const numKey = Number(key);
        let scoreVal = Number(value[key]) || 0;

        if (scoreVal < 0) scoreVal = 0;
        if (scoreVal > 10) scoreVal = 10;

        sanitizedMap[numKey] = scoreVal;
      });
    }
    return sanitizedMap;
  })
  violation_weights?: Record<number, number>;
}
