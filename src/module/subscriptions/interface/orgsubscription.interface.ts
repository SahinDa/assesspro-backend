import {
  OrgBillingCycle,
  OrgPaymentGateway,
  OrgPaymentMethod,
  OrgTransactionStatus,
  OrgSubscriptionStatus,
  PlatformSubscriptionFeatureKey,
} from 'src/config/enum';

export interface IOrgSubscriptionPayload {
  organization_id: string;
  transaction_id: string;
  plan_name: string;
  billing_cycle: OrgBillingCycle;
  start_date: Date;
  end_date: Date;
  status: OrgSubscriptionStatus;
  gateway_subscription_id?: string | null;
  features: Record<PlatformSubscriptionFeatureKey, number | boolean>;
}

export interface IOrgTransactionResponsePayload {
  transaction_id: string;
  organization_id: string;
  plan_id: string;
  plan_name: string;
  billing_cycle: OrgBillingCycle;
  amount: number;
  currency: string;
  payment_method?: OrgPaymentMethod;
  payment_gateway: OrgPaymentGateway;
  gateway_order_id?: string;
  gateway_transaction_id?: string;
  gateway_subscription_id?: string | null;
  status: OrgTransactionStatus;
  start_date?: Date;
  end_date?: Date;
  features: Record<PlatformSubscriptionFeatureKey, number | boolean>;
}
