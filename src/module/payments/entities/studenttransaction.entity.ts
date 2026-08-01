import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ValueTransformer,
} from 'typeorm';
import {
  StudentTransactionStatus,
  StudentPaymentMethod,
  StudentPaymentGateway,
  StudentTransactionFailureReason,
  StudentBillingCycle,
  OrganizationSubscriptionFeatureKey,
} from 'src/config/enum';

class ColumnNumericTransformer implements ValueTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string | null): number | null {
    return data === null ? null : parseFloat(data);
  }
}

@Entity('student_transactions')
@Index(['user_id'])
@Index(['gateway_order_id'])
@Index(['gateway_transaction_id'])
export class StudentTransaction {
  @PrimaryGeneratedColumn('uuid')
  transaction_id: string;

  @Column('uuid')
  user_id: string;

  @Column('uuid')
  organization_id: string;

  @Column({ type: 'varchar', length: 50 })
  plan_name: string;

  @Column('uuid')
  plan_id: string;

  @Column({ type: 'smallint' })
  billing_cycle: StudentBillingCycle;

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
  payment_method?: StudentPaymentMethod;

  @Column({ type: 'smallint' })
  payment_gateway: StudentPaymentGateway;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gateway_order_id?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gateway_transaction_id?: string;

  @Column({ type: 'smallint' })
  status: StudentTransactionStatus;

  // --- Dynamic Feature Limits Snapshot Stored as JSONB ---
  @Column({ type: 'jsonb', nullable: false, default: {} })
  features: Record<OrganizationSubscriptionFeatureKey, number | boolean>;

  @Column({ type: 'smallint', nullable: true })
  failure_reason?: StudentTransactionFailureReason;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
