import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('notifications')
// Optimized Index: Include is_global to make filtering by "all" vs "personal" lightning fast
@Index(['org_id', 'is_global', 'is_pinned', 'created_at'])
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  notification_id: string;

  @Column({ type: 'uuid', nullable: true })
  @Index() // Index for fast lookup of a specific user's messages
  user_id?: string | null;

  @Column({ type: 'uuid' })
  org_id: string;

  @Column({ type: 'boolean', default: false })
  is_global: boolean; // Flag to easily identify broadcasts

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  url?: string | null;

  @Column({ type: 'boolean', default: false })
  is_pinned: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
