import { PlatformBillingCycle } from "src/config/enum";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("platform_plans")
export class PlatformPlan {

  @PrimaryGeneratedColumn("uuid")
  plan_id: string;

  @Column({ type: "varchar", length: 255 })
  name: string; 

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;  

  @Column({ type: "smallint" })
  billing_cycle: PlatformBillingCycle;

  @Column({ type: "boolean", default: true })
  is_active: boolean;  

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}