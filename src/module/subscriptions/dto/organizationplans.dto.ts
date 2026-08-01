import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsObject, IsUUID, MaxLength, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { OrganizationBillingCycle, OrganizationSubscriptionFeatureKey, SupportedCurrency } from 'src/config/enum';

export class CreateOrganizationPlanDto {
  @IsUUID()
  @IsNotEmpty()
  @IsOptional()
  organization_id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsObject()
  @IsNotEmpty()
  pricing: Record<OrganizationBillingCycle, number>;

@Transform(({ value }) => (!value || value === '' ? SupportedCurrency.INR : value))
  @IsEnum(SupportedCurrency, { 
      message: `Currency must be one of the supported options: ${Object.values(SupportedCurrency).join(', ')}` 
  })
  currency: string = SupportedCurrency.INR;


// --- Dynamic Feature Limits Stored as JSONB ---
  @IsObject()
  @IsNotEmpty()
  features: Record<OrganizationSubscriptionFeatureKey, number | boolean>;
}

export class UpdateOrganizationPlanDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsObject()
  @IsOptional()
  pricing?: Record<OrganizationBillingCycle, number>;

  @Transform(({ value }) => (value !== undefined && value !== null && value !== '' ? value : undefined))
  @IsEnum(SupportedCurrency, { 
      message: `Currency must be one of the supported options: ${Object.values(SupportedCurrency).join(', ')}` 
  })
  @IsOptional()
  currency?: string;
  
 // --- Dynamic Feature Limits Stored as JSONB ---
  @IsObject()
  @IsOptional()
  features?: Record<OrganizationSubscriptionFeatureKey, number | boolean>;
}