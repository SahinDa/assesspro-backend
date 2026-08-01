import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ValueTransformer,
} from 'typeorm';
import {
  OrgTransactionStatus,
  OrgPaymentMethod,
  OrgPaymentGateway,
  OrgTransactionFailureReason,
  OrgBillingCycle,
  PlatformSubscriptionFeatureKey,
} from 'src/config/enum';

class ColumnNumericTransformer implements ValueTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string | null): number | null {
    return data === null ? null : parseFloat(data);
  }
}

@Entity('organization_transactions')
@Index(['organization_id'])
@Index(['gateway_order_id'])
@Index(['gateway_transaction_id'])
export class OrganizationTransaction {
  @PrimaryGeneratedColumn('uuid')
  transaction_id: string;

  @Column('uuid')
  organization_id: string;

  @Column('uuid')
  plan_id: string;

  @Column({ type: 'varchar', length: 50 })
  plan_name: string;

  @Column({ type: 'smallint' })
  billing_cycle: OrgBillingCycle;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'INR' })
  currency: string;

  @Column({ type: 'smallint', nullable: true })
  payment_method?: OrgPaymentMethod;

  @Column({ type: 'smallint' })
  payment_gateway: OrgPaymentGateway;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gateway_order_id?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gateway_transaction_id?: string;

  @Column({ type: 'smallint' })
  status: OrgTransactionStatus;

  // --- Dynamic Feature Limits Snapshot Stored as JSONB ---
  @Column({ type: 'jsonb', nullable: false, default: {} })
  features: Record<PlatformSubscriptionFeatureKey, number | boolean>;

  @Column({ type: 'smallint', nullable: true })
  failure_reason?: OrgTransactionFailureReason;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
