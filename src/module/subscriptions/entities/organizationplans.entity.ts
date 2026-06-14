import { OrganizationBillingCycle } from "src/config/enum";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("organization_plan")
export class OrganizationPlan {

  @PrimaryGeneratedColumn("uuid")
  plan_id: string;

  @Column("uuid")
  organization_id: string; 

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number; 

  @Column({ type: "smallint" })
  billing_cycle: OrganizationBillingCycle;

  @Column({ type: "boolean", default: true })
  is_active: boolean; 

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}