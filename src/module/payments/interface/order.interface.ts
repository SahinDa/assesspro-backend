import { OrganizationSubscriptionFeatureKey, OrgBillingCycle, OrgPaymentGateway, OrgTransactionStatus,PlatformSubscriptionFeatureKey,StudentBillingCycle, StudentPaymentGateway, StudentTransactionStatus } from "src/config/enum";


export interface CreateOrgOrder {
    orgId: string;
    planName:string,
    planId: string;
    amount: number;
    currency: string;
    billingCycle:OrgBillingCycle;
    paymentGateway: OrgPaymentGateway;
    gatewayOrderId: string;
    status: OrgTransactionStatus;
    features: Record<PlatformSubscriptionFeatureKey, number | boolean>;
}

export interface CreateStudentOrder {
    userId: string;
    organizationId:string
    planName:string,
    planId: string;
    amount: number;
    currency: string;
    billingCycle: StudentBillingCycle;
    paymentGateway: StudentPaymentGateway;
    gatewayOrderId: string;
    status: StudentTransactionStatus;
    features: Record<OrganizationSubscriptionFeatureKey, number | boolean>;
}