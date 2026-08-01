import {
  StudentTransactionStatus,
  StudentPaymentMethod,
  StudentPaymentGateway,
  StudentTransactionFailureReason,
  StudentBillingCycle,
  UserSubscriptionStatus,
  OrganizationSubscriptionFeatureKey,
} from 'src/config/enum';

export interface IUserTransactionResponsePayload {
  transaction_id: string;
  user_id: string;
  organization_id: string;
  plan_id: string;
  plan_name: string;
  billing_cycle: StudentBillingCycle;
  amount: number;
  currency: string;
  payment_method?: StudentPaymentMethod;
  payment_gateway: StudentPaymentGateway;
  gateway_order_id?: string;
  gateway_transaction_id?: string;
  status: StudentTransactionStatus;
  features: Record<OrganizationSubscriptionFeatureKey, number | boolean>;
  failure_reason?: StudentTransactionFailureReason;
  created_at: Date;
}

export interface IUserSubscriptionPayload {
  user_id: string;
  organization_id: string;
  transaction_id: string;
  plan_name: string;
  billing_cycle: StudentBillingCycle;
  start_date: Date;
  end_date: Date;
  status: UserSubscriptionStatus;
  gateway_subscription_id?: string | null;
  features: Record<OrganizationSubscriptionFeatureKey, number | boolean>;
}
