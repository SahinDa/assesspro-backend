import {
  OrganizationSubscriptionFeatureKey,
  StudentBillingCycle,
  UserSubscriptionPlan,
  UserSubscriptionStatus,
} from 'src/config/enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('subscriptions_user')
@Index(['user_id']) // fast lookup per user
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  subscription_id: string;

  @Column('uuid')
  user_id: string;

  @Column('uuid')
  organization_id: string;

  @Column('uuid')
  transaction_id: string; // Points to the latest transaction/invoice ledger record

  @Column({ type: 'varchar', length: 100, nullable: true })
  gateway_subscription_id?: string | null; // e.g., Razorpay subscription ID (sub_xxxxxxxxxx) for auto-renewals

  @Column({ type: 'varchar', length: 50 })
  plan_name: string; // Snapshotted name (e.g., "Pro Plan") safe from future edits/deletions

  @Column({ type: 'smallint' })
  billing_cycle: StudentBillingCycle;

  @Column({ type: 'timestamptz' })
  start_date: Date;

  @Column({ type: 'timestamptz' })
  end_date: Date;

  @Column({ type: 'smallint', default: UserSubscriptionStatus.Active })
  status: UserSubscriptionStatus;

  // --- Dynamic Feature Limits Snapshot Stored as JSONB ---
  @Column({ type: 'jsonb', nullable: false, default: {} })
  features: Record<OrganizationSubscriptionFeatureKey, number | boolean>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
