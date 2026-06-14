import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index
} from "typeorm";
import { NotificationType, NotificationChannel, ReferenceType } from "src/config/enum";

@Entity("notifications")
@Index(["user_id"]) // fast queries per user
export class Notification {

  @PrimaryGeneratedColumn("uuid")
  notification_id: string;  // primary key

  @Column("uuid")
  user_id: string;  // recipient of the notification

  @Column("uuid", { nullable: true })
  sender_user_id: string;  // who triggered it (admin/system)

  @Column("uuid", { nullable: true })
  organization_id: string; 

  @Column({ type: "smallint" })
  type: NotificationType; 

  @Column({ type: "smallint" })
  channel: NotificationChannel;  

  @Column({ type: "text" })
  message: string;  

  @Column({ type: "boolean", default: false })
  is_read: boolean;  

  @Column({ type: "smallint", nullable: true })
  reference_type: ReferenceType;  // which table/object this relates to

  @Column("uuid", { nullable: true })
  reference_id: string;  // ID of the object the notification is about

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;  
}