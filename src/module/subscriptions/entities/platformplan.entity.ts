import {
  PlatformBillingCycle,
  PlatformSubscriptionFeatureKey,
} from 'src/config/enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('platform_plans')
export class PlatformPlan {
  @PrimaryGeneratedColumn('uuid')
  plan_id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  // --- Dynamic Feature Limits Stored as JSON ---
  // Example: { "max_users": 50, "max_tests": 100, "max_sets_per_test": 5, "max_questions_per_set": 50 }
  @Column({ type: 'jsonb', nullable: false, default: {} })
  features: Record<PlatformSubscriptionFeatureKey, number | boolean>;

  // --- Pricing per cycle (The "How much") ---
  // Example: { "1": 20.00, "3": 200.00 }
  @Column({ type: 'jsonb', nullable: false })
  pricing: Record<PlatformBillingCycle, number>;

  @Column({ type: 'varchar', length: 3, default: 'INR' })
  currency: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
