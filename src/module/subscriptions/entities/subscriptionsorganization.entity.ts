import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from "typeorm";
import {OrgSubscriptionPlan, OrgSubscriptionStatus } from "src/config/enum";

@Entity("subscriptions_organization")
@Index(["organization_id"]) // fast lookup per org
export class OrgSubscription {

  @PrimaryGeneratedColumn("uuid")
  subscription_id: string;

  @Column("uuid")
  organization_id: string; 

  @Column({ type: "smallint" })
  plan: OrgSubscriptionPlan; 

  @Column({ type: "timestamptz" })
  start_date: Date;         

  @Column({ type: "timestamptz" })
  end_date: Date;         

  @Column({ type: "smallint", default: OrgSubscriptionStatus.Active })
  status: OrgSubscriptionStatus; 

  // Feature Limits based on plan
  @Column({ type: "int", default: 0 })
  max_users: number;        

  @Column({ type: "int", default: 0 })
  max_tests: number;        

  @Column({ type: "int", default: 0 })
  max_sets_per_test: number; 

  @Column({ type: "int", default: 0 })
  max_questions_per_set: number; 

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}