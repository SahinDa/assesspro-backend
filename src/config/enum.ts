export enum UserRole {
    ADMIN = 0,
    ORGANIZATION = 1,
    STUDENT = 2,
    OTHER = 3,
}

export enum AuthProvider {
  NO_AUTH_PROVIDER = 0, // direct email/password
  GOOGLE = 1,
  GITHUB = 2,
  FACEBOOK = 3
}

export enum OrganizationRole {
    MEMBER = 1,
    ADMIN = 0,
}

export enum UserStatus {
    ON_HOLD = 0,
    ACTIVE = 1,
    DELETED = 2,
}

export enum OrganizationStatus {
    ON_HOLD = 0,
    ACTIVE = 1,
    DELETED = 2,
}

export enum OwnerType{
    ADMIN = 1,
    ORGANIZATION = 2
}

export enum TestStatus{
    ON_HOLD = 0,
    ACTIVE = 1,
    DELETED = 2,
}

export enum QuestionSource {
    MANUAL = 'Manual',
    PDF = 'PDF',
}

export enum CorrectAnswer {
  A = 1,
  B = 2,
  C = 3,
  D = 4
}

export enum SubmissionType {
  Manual = 1,
  AutoSubmit = 2,
}

export enum AnswerOption {
  A = 1,
  B = 2,
  C = 3,
  D = 4,
}

export enum NotificationType {
  Invite = 1,             // User invited to organization
  TestAssigned = 2,       // New test assigned
  TestResult = 3,         // Test result is available
  LeaderboardUpdate = 4,  // Leaderboard updated
  SubscriptionUpdate = 5, // Subscription change/renewal
  Announcement = 6,       // General platform announcement
  NewFeature = 7          // Platform released a new feature
}

export enum ReferenceType {
  Organization = 1,  // Points to organizations table
  Test = 2,          // Points to tests table
  Attempt = 3,       // Points to test_attempts table
  Subscription = 4   // Points to subscriptions table
}

export enum NotificationChannel {
  InApp = 1,   // Shown inside the platform
  Email = 2,   // Sent via email
  Both = 3,    // sent via InApp and Email
  Push = 4,    // Sent via push notification (mobile/web)
}


export enum OrgSubscriptionPlan {
  Free = 1,
  Pro = 2,
  Premium = 3,
  Enterprise = 4  // can add more plans in future
}

export enum OrgSubscriptionStatus {
  Active = 1,
  Expired = 2,
  Cancelled = 3,
  OnHold = 4
}

export enum UserSubscriptionPlan {
  Free = 1,
  Pro = 2,
  Premium = 3,
  Elite = 4 
}


export enum UserSubscriptionStatus {
  Active = 1,
  Expired = 2,
  Cancelled = 3,
  OnHold = 4
}


export enum OrgBillingCycle {
  Monthly = 1,
  Quarterly = 2,
  Yearly = 3,
}

export enum OrgPaymentMethod {
  UPI = 1,
  Card = 2,
  NetBanking = 3,
  Wallet = 4,
}

export enum OrgPaymentGateway {
  Razorpay = 1,
  Stripe = 2,
  PayPal = 3,
  CashFree = 4,
  Other = 99,
}

export enum OrgTransactionStatus {
  Pending = 1,
  Success = 2,
  Failed = 3,
  Refunded = 4,
}

export enum OrgTransactionFailureReason {
  InsufficientFunds = 1,        // User does not have enough balance
  CardDeclined = 2,              // Card rejected by bank
  NetworkError = 3,              // Payment network issues
  InvalidAccount = 4,            // Bank account or card details incorrect
  PaymentTimeout = 5,            // Transaction timed out
  ExceedsLimit = 6,              // Transaction exceeds bank/card limit
  CurrencyMismatch = 7,          // Payment currency not accepted
  DuplicateTransaction = 8,      // Same payment attempted twice
  WalletBalanceLow = 9,          // Wallet has insufficient balance
  FraudDetected = 10,            // Transaction flagged as suspicious/fraud
  GatewayUnavailable = 11,       // Payment gateway down/unavailable
  UserCancelled = 12,            // User cancelled the payment
  Other = 99,                     // Any other unspecified failure
}


export enum StudentTransactionStatus {
  Pending = 1,
  Success = 2,
  Failed = 3,
  Cancelled = 4,
}

export enum StudentPaymentMethod {
  UPI = 1,
  Card = 2,
  NetBanking = 3,
  Wallet = 4,
  Other = 99,
}

export enum StudentPaymentGateway {
  Razorpay = 1,
  Stripe = 2,
  PayPal = 3,
  CashFree = 4,
  Other = 99,
}

export enum StudentBillingCycle {
  Monthly = 1,
  Quarterly = 2,
  Yearly = 3,
}

export enum StudentTransactionFailureReason {
  InsufficientFunds = 1,
  CardDeclined = 2,
  NetworkError = 3,
  InvalidAccount = 4,
  PaymentTimeout = 5,
  ExceedsLimit = 6,
  CurrencyMismatch = 7,
  DuplicateTransaction = 8,
  WalletBalanceLow = 9,
  FraudDetected = 10,
  GatewayUnavailable = 11,
  UserCancelled = 12,
  Other = 99,
}

export enum PlatformBillingCycle {
  Monthly = 1,
  Quarterly = 2,
  Yearly = 3,
}

export enum OrganizationBillingCycle {
  Monthly = 1,
  Quarterly = 2,
  Yearly = 3,
}

export enum NegativeMarkingOption {
  NONE = 0.00,
  QUARTER = 0.25,
  HALF = 0.50,
  ONE = 1.00
}

export enum JoinRequestStatus {
  PENDING = 0,
  REJECTED = 1,
  APPROVED = 2,
}