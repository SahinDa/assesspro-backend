import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";
import {
  StudentTransactionStatus,
  StudentPaymentMethod,
  StudentPaymentGateway,
  StudentBillingCycle,
  StudentTransactionFailureReason,
} from "src/config/enum";

@Entity("student_transactions")
@Index(["user_id"])
export class StudentTransaction {

  @PrimaryGeneratedColumn("uuid")
  transaction_id: string;

  @Column("uuid")
  user_id: string;

  // Optional: if student has plans, else nullable
  @Column("uuid", { nullable: true })
  plan_id: string;

  @Column({ type: "smallint", nullable: true })
  billing_cycle: StudentBillingCycle;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column({ type: "smallint" })
  payment_method: StudentPaymentMethod;

  @Column({ type: "smallint" })
  payment_gateway: StudentPaymentGateway;

  @Column({ type: "varchar", length: 255, nullable: true })
  gateway_transaction_id: string;

  @Column({ type: "smallint" })
  status: StudentTransactionStatus;

  @Column({ type: "smallint", nullable: true })
  failure_reason: StudentTransactionFailureReason;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}