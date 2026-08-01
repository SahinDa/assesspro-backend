import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsInt,
  IsObject,
  IsOptional,
  Min,
  IsNotEmpty,
  MaxLength,
  IsEnum,
} from 'class-validator';
import {
  PlatformBillingCycle,
  PlatformSubscriptionFeatureKey,
  SupportedCurrency,
} from 'src/config/enum';

export class CreatePlatformPlanDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsObject()
  @IsNotEmpty()
  features: Record<PlatformSubscriptionFeatureKey, number | boolean>;

  // Allows { "1": 20.00, "3": 200.00 }
  @IsObject()
  @IsNotEmpty()
  pricing: Record<PlatformBillingCycle, number>;

  @Transform(({ value }) =>
    !value || value === '' ? SupportedCurrency.INR : value,
  )
  @IsEnum(SupportedCurrency, {
    message: `Currency must be one of the supported options: ${Object.values(SupportedCurrency).join(', ')}`,
  })
  currency: string = SupportedCurrency.INR;
}

export class UpdatePlatformPlanDto extends PartialType(CreatePlatformPlanDto) {
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== null && value !== '' ? value : undefined,
  )
  @IsEnum(SupportedCurrency, {
    message: `Currency must be one of the supported options: ${Object.values(SupportedCurrency).join(', ')}`,
  })
  currency?: string;
}
