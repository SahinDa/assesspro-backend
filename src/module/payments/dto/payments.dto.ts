import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  OrganizationBillingCycle,
  OrgBillingCycle,
  PlatformBillingCycle,
  StudentBillingCycle,
} from 'src/config/enum';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsUUID()
  planId: string;

  @IsNotEmpty()
  @IsNumber()
  @IsEnum({ ...OrgBillingCycle, ...StudentBillingCycle })
  billingCycle: OrgBillingCycle | StudentBillingCycle;
}

export class VerifyPaymentDto {
  @IsString()
  razorpay_order_id: string;

  @IsString()
  razorpay_payment_id: string;

  @IsString()
  razorpay_signature: string;
}

export class MarkPaymentFailedDto {
  @IsString()
  @IsNotEmpty()
  gateway_order_id: string;

  @IsString()
  @IsOptional()
  error_code?: string;

  @IsString()
  @IsOptional()
  error_description?: string;

  @IsString()
  @IsOptional()
  error_reason?: string;
}
