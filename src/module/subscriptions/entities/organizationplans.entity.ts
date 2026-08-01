import {
  OrganizationBillingCycle,
  OrganizationSubscriptionFeatureKey,
} from 'src/config/enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('organization_plan')
export class OrganizationPlan {
  @PrimaryGeneratedColumn('uuid')
  plan_id: string;

  @Column('uuid')
  organization_id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  // --- Pricing per cycle (Dynamic mapping using JSONB) ---
  // Example: { "1": 20.00, "3": 200.00 }
  @Column({ type: 'jsonb', nullable: false })
  pricing: Record<OrganizationBillingCycle, number>;

  @Column({ type: 'varchar', length: 3, default: 'INR' })
  currency: string;

  // --- Dynamic Feature Limits & Access Controls Stored as JSONB ---
  // Example: { "max_test_sets": 10, "max_reattempts": 3 }
  @Column({ type: 'jsonb', nullable: false, default: {} })
  features: Record<OrganizationSubscriptionFeatureKey, number | boolean>;

  // --- Status & Timestamps ---
  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
