import { UserSubscriptionPlan, UserSubscriptionStatus } from "src/config/enum";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from "typeorm";


@Entity("subscriptions_user")
@Index(["user_id"]) // fast lookup per user
export class UserSubscription {

  @PrimaryGeneratedColumn("uuid")
  subscription_id: string;

  @Column("uuid")
  user_id: string; 

   @Column("uuid")
  organization_id: string; 

  @Column({ type: "smallint" })
  plan: UserSubscriptionPlan;   

  @Column({ type: "timestamptz" })
  start_date: Date;          

  @Column({ type: "timestamptz" })
  end_date: Date;               

  @Column({ type: "smallint", default: UserSubscriptionStatus.Active })
  status: UserSubscriptionStatus; 

  // Only the limit that actually matters for student
  @Column({ type: "int", default: 0 })
  max_sets: number;             

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}