import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  OrgSubscriptionStatus,
  OrgBillingCycle,
  PlatformSubscriptionFeatureKey,
} from 'src/config/enum';

@Entity('subscriptions_organization')
@Index(['organization_id'], { unique: true }) // Enforces strictly ONE active state row per organization
@Index(['status']) // Fast filtering for active/expired states
@Index(['gateway_subscription_id']) // Fast lookup when webhook triggers arrive from payment gateway
export class OrgSubscription {
  @PrimaryGeneratedColumn('uuid')
  subscription_id: string;

  @Column('uuid', { unique: true })
  organization_id: string;

  @Column('uuid')
  transaction_id: string; // Points to the latest transaction/invoice ledger record

  @Column({ type: 'varchar', length: 100, nullable: true })
  gateway_subscription_id?: string | null; // e.g., Razorpay subscription ID (sub_xxxxxxxxxx) for auto-renewals

  @Column({ type: 'varchar', length: 50 })
  plan_name: string; // Snapshotted name (e.g., "Pro Plan") safe from future edits/deletions

  @Column({ type: 'smallint' })
  billing_cycle: OrgBillingCycle;

  @Column({ type: 'timestamptz' })
  start_date: Date;

  @Column({ type: 'timestamptz' })
  end_date: Date; // Automatically pushed forward during early renewals, proration, or auto-renewals

  @Column({ type: 'smallint', default: OrgSubscriptionStatus.Active })
  status: OrgSubscriptionStatus;

  // --- Dynamic Platform Feature Limits Snapshot Stored as JSONB ---
  @Column({ type: 'jsonb', nullable: false, default: {} })
  features: Record<PlatformSubscriptionFeatureKey, number | boolean>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
