import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from "typeorm";
import {
    OrgTransactionStatus,
    OrgPaymentMethod,
    OrgPaymentGateway,
    OrgBillingCycle,
    OrgTransactionFailureReason,
} from "src/config/enum";

@Entity("organization_transactions")
@Index(["organization_id"])
export class OrganizationTransaction {

    @PrimaryGeneratedColumn("uuid")
    transaction_id: string;

    @Column("uuid")
    organization_id: string;

    @Column("uuid")
    plan_id: string;

    @Column({ type: "smallint" })
    billing_cycle: OrgBillingCycle;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount: number;

    @Column({ type: "smallint" })
    payment_method: OrgPaymentMethod;

    @Column({ type: "smallint" })
    payment_gateway: OrgPaymentGateway;

    @Column({ type: "varchar", length: 255, nullable: true })
    gateway_transaction_id: string;

    @Column({ type: "smallint" })
    status: OrgTransactionStatus;

    // Failure reason (nullable because successful transactions won't have it)
    @Column({ type: "smallint", nullable: true })
    failure_reason: OrgTransactionFailureReason;

    @CreateDateColumn({ type: "timestamptz" })
    created_at: Date;
}